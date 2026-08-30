import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { JoinRequest, DomainType, RequestStatus } from "@/types/joinRequest";
import { Member } from "@/types/member";
import { logActivity } from "./activityService";
import { sendNotificationToRole, createNotification } from "./notificationService";

/**
 * Submit a join or event registration request to Firestore
 */
export async function submitJoinRequest(
  data: Omit<JoinRequest, "id" | "status" | "submittedAt" | "statusHistory">
): Promise<JoinRequest> {
  // Backend validation for club membership applications (Requirement: Problem 3)
  if (!data.type || data.type === "club_membership") {
    const membersRef = collection(db, "members");

    if (data.userId) {
      try {
        const memSnap = await getDoc(doc(db, "members", data.userId));
        if (memSnap.exists()) {
          const mem = memSnap.data() as Member;
          if (mem.status === "active" || mem.role === "president" || mem.role === "admin" || mem.role === "lead" || mem.role === "member") {
            throw new Error("You are already an active club member or president. Duplicate membership applications are not allowed.");
          }
        }
      } catch (e: any) {
        if (e.message?.includes("already an active club member")) throw e;
      }
    }

    if (data.email) {
      const qEmail = query(membersRef, where("email", "==", data.email.trim()));
      const snapEmail = await getDocs(qEmail);
      if (!snapEmail.empty && snapEmail.docs.some((d) => d.data().status === "active")) {
        throw new Error("You are already an active club member. Duplicate membership applications are not allowed.");
      }

      const qLoginEmail = query(membersRef, where("loginEmail", "==", data.email.trim()));
      const snapLoginEmail = await getDocs(qLoginEmail);
      if (!snapLoginEmail.empty && snapLoginEmail.docs.some((d) => d.data().status === "active")) {
        throw new Error("You are already an active club member. Duplicate membership applications are not allowed.");
      }
    }

    if (data.usn) {
      const qUsn = query(membersRef, where("usn", "==", data.usn.trim().toUpperCase()));
      const snapUsn = await getDocs(qUsn);
      if (!snapUsn.empty && snapUsn.docs.some((d) => d.data().status === "active")) {
        throw new Error("You are already an active club member with this USN. Duplicate membership applications are not allowed.");
      }
    }

    // Prevent duplicate pending applications
    const requestsRef = collection(db, "joinRequests");
    const qPending = query(
      requestsRef,
      where("email", "==", data.email.trim()),
      where("status", "==", "pending")
    );
    const snapPending = await getDocs(qPending);
    if (
      !snapPending.empty &&
      snapPending.docs.some((d) => !d.data().type || d.data().type === "club_membership")
    ) {
      throw new Error("An application for this email is already pending review.");
    }
  }

  const id = "req_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  const newRequest: JoinRequest = {
    ...data,
    id,
    status: "pending",
    submittedAt: new Date().toISOString(),
    statusHistory: [
      {
        status: "pending",
        changedBy: data.userId || "Applicant",
        changedByName: data.name,
        changedAt: new Date().toISOString(),
        notes: "Application submitted",
      },
    ],
  };

  try {
    const docRef = doc(db, "joinRequests", id);
    const cleanedRequest = Object.fromEntries(
      Object.entries(newRequest).filter(([_, v]) => v !== undefined)
    );
    await setDoc(docRef, cleanedRequest);

    try {
      await logActivity({
        action: data.type === "event_registration" ? "Event registration submitted" : "Application submitted",
        performedBy: data.userId || newRequest.name,
        performedByName: newRequest.name,
        target: data.eventName || `${newRequest.domain} Domain`,
        details: `${newRequest.name} (${newRequest.usn}) applied for ${data.eventName || newRequest.domain}`,
      });
    } catch (e) {
      console.warn("Could not log activity for join request:", e);
    }

    try {
      await sendNotificationToRole("president" as any, {
        title: data.type === "event_registration" ? "New Event Registration" : "New Candidate Application",
        message: `${newRequest.name} applied for ${data.eventName || newRequest.domain}`,
        type: "request",
        link: "/dashboard/requests",
      });
    } catch (e) {
      console.warn("Could not send notification for request:", e);
    }

    return newRequest;
  } catch (err: any) {
    console.error("Firestore submitJoinRequest error:", err);
    throw new Error(err.message || "Unable to submit application to Firestore. Please try again.");
  }
}

/**
 * Fetch all requests or filtered by domain from Firestore
 */
export async function getJoinRequests(domain?: DomainType | "All"): Promise<JoinRequest[]> {
  try {
    const colRef = collection(db, "joinRequests");
    const q = domain && domain !== "All" ? query(colRef, where("domain", "==", domain)) : colRef;
    const snapshot = await getDocs(q);
    const list: JoinRequest[] = [];
    snapshot.forEach((d) => {
      list.push({ ...(d.data() as JoinRequest), id: d.id });
    });
    return list.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  } catch (err: any) {
    console.error("Firestore getJoinRequests error:", err);
    throw new Error(err.message || "Failed to load requests from Firestore.");
  }
}

/**
 * Securely fetch only the applications belonging to a specific user/email
 */
export async function getUserApplications(
  email: string,
  userId?: string
): Promise<JoinRequest[]> {
  try {
    const colRef = collection(db, "joinRequests");
    const q = query(colRef, where("email", "==", email.trim()));
    const snapshot = await getDocs(q);
    const list: JoinRequest[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as JoinRequest;
      list.push({ ...data, id: d.id });
    });

    if (userId) {
      const qUid = query(colRef, where("userId", "==", userId));
      const snapUid = await getDocs(qUid);
      snapUid.forEach((d) => {
        if (!list.some((existing) => existing.id === d.id)) {
          list.push({ ...(d.data() as JoinRequest), id: d.id });
        }
      });
    }

    return list.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  } catch (err) {
    console.warn("getUserApplications error:", err);
    return [];
  }
}

/**
 * Real-time listener for join requests (with domain filter support)
 */
export function subscribeToJoinRequests(
  domain?: DomainType | "All",
  callback?: (requests: JoinRequest[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, "joinRequests");
  const q = domain && domain !== "All" ? query(colRef, where("domain", "==", domain)) : colRef;

  return onSnapshot(
    q,
    (snapshot) => {
      const list: JoinRequest[] = [];
      snapshot.forEach((d) => {
        list.push({ ...(d.data() as JoinRequest), id: d.id });
      });
      list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      if (callback) callback(list);
    },
    (err) => {
      console.error("subscribeToJoinRequests onSnapshot error:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Get request by ID
 */
export async function getJoinRequestById(id: string): Promise<JoinRequest | null> {
  try {
    const docRef = doc(db, "joinRequests", id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...(snap.data() as JoinRequest), id: snap.id };
    }
    return null;
  } catch (err: any) {
    console.error("Firestore getJoinRequestById error:", err);
    return null;
  }
}

/**
 * Update request status (accept / reject / waitlist)
 */
export async function updateRequestStatus(
  id: string,
  status: RequestStatus,
  reviewerUid: string,
  reviewerName: string,
  notes?: string
): Promise<JoinRequest | null> {
  try {
    const docRef = doc(db, "joinRequests", id);
    const existingSnap = await getDoc(docRef);
    if (!existingSnap.exists()) return null;

    const existingReq = existingSnap.data() as JoinRequest;
    const history = existingReq.statusHistory || [];

    const newHistoryEntry = {
      status,
      changedBy: reviewerUid,
      changedByName: reviewerName,
      changedAt: new Date().toISOString(),
      notes: notes || `Status changed to ${status}`,
    };

    const updates: Partial<JoinRequest> = {
      status,
      reviewedBy: reviewerUid,
      reviewedByName: reviewerName,
      reviewedAt: new Date().toISOString(),
      ...(notes ? { notes } : {}),
      statusHistory: [...history, newHistoryEntry],
    };

    await updateDoc(docRef, updates);

    // Problem 2 Fix: When accepted, create or update the member record in the 'members' collection
    if (status === "accepted" && (!existingReq.type || existingReq.type === "club_membership")) {
      const memberUid = existingReq.userId || `mem_${existingReq.id}`;
      const membersRef = collection(db, "members");

      let targetDocRef = doc(db, "members", memberUid);
      let existingMemberDoc: Member | null = null;

      if (existingReq.userId) {
        const snap = await getDoc(doc(db, "members", existingReq.userId));
        if (snap.exists()) {
          targetDocRef = doc(db, "members", existingReq.userId);
          existingMemberDoc = { ...(snap.data() as Member), uid: snap.id };
        }
      }

      if (!existingMemberDoc && existingReq.email) {
        const qEmail = query(membersRef, where("email", "==", existingReq.email.trim()));
        const snapEmail = await getDocs(qEmail);
        if (!snapEmail.empty) {
          const d = snapEmail.docs[0];
          targetDocRef = doc(db, "members", d.id);
          existingMemberDoc = { ...(d.data() as Member), uid: d.id };
        }
      }

      if (!existingMemberDoc && existingReq.usn) {
        const qUsn = query(membersRef, where("usn", "==", existingReq.usn.trim().toUpperCase()));
        const snapUsn = await getDocs(qUsn);
        if (!snapUsn.empty) {
          const d = snapUsn.docs[0];
          targetDocRef = doc(db, "members", d.id);
          existingMemberDoc = { ...(d.data() as Member), uid: d.id };
        }
      }

      if (existingMemberDoc) {
        await updateDoc(targetDocRef, {
          status: "active",
          name: existingReq.name || existingMemberDoc.name,
          email: existingReq.email || existingMemberDoc.email,
          loginEmail: existingReq.email || existingMemberDoc.loginEmail || existingMemberDoc.email,
          usn: existingReq.usn || existingMemberDoc.usn,
          domain: existingReq.domain || existingMemberDoc.domain,
          semester: existingReq.semester || existingMemberDoc.semester,
          branch: existingReq.branch || existingMemberDoc.branch,
          portfolio: existingReq.workLink || existingMemberDoc.portfolio || "",
        });
      } else {
        const newMemberDoc: Member = {
          uid: memberUid,
          name: existingReq.name,
          email: existingReq.email,
          loginEmail: existingReq.email,
          usn: existingReq.usn || "",
          semester: existingReq.semester || "1st Semester",
          branch: existingReq.branch || "Computer Science",
          domain: existingReq.domain || "UI/UX",
          role: "member",
          status: "active",
          joinedAt: new Date().toISOString(),
          portfolio: existingReq.workLink || "",
          permissions: {
            reviewRequests: false,
            manageRequests: false,
            assignTodos: false,
            manageMembers: false,
            createEvents: false,
          },
        };
        await setDoc(targetDocRef, newMemberDoc, { merge: true });
      }

      try {
        await logActivity({
          action: "Member created",
          performedBy: reviewerUid,
          performedByName: reviewerName,
          target: existingReq.name,
          details: `Accepted candidate ${existingReq.name} into ${existingReq.domain} domain as active member`,
        });
      } catch (actErr) {
        console.warn("Could not log member creation activity on request approval:", actErr);
      }
    }

    const updatedSnap = await getDoc(docRef);
    if (!updatedSnap.exists()) return null;

    const updatedReq = { ...(updatedSnap.data() as JoinRequest), id: updatedSnap.id };

    // Log corresponding activity
    let actionStr: any = "Application status updated";
    if (status === "accepted") actionStr = "Application accepted";
    else if (status === "rejected") actionStr = "Application rejected";
    else if (status === "waitlisted") actionStr = "Application waitlisted";

    try {
      await logActivity({
        action: actionStr,
        performedBy: reviewerUid,
        performedByName: reviewerName,
        target: updatedReq.name,
        details: `${reviewerName} changed status of ${updatedReq.name} (${updatedReq.domain}) to ${status.toUpperCase()}`,
      });
    } catch (e) {
      console.warn("Could not log activity for request update:", e);
    }

    // Application Status Email Notifications / in-app alert
    try {
      if (updatedReq.userId) {
        await createNotification({
          recipientUid: updatedReq.userId,
          title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your application for ${updatedReq.eventName || updatedReq.domain} is now marked as ${status.toUpperCase()}.${notes ? ` Note: ${notes}` : ""}`,
          type: "request",
          link: "/dashboard",
        });
      }
      console.log(`[Email Notification Dispatched] To: ${updatedReq.email} | Subject: Your Application Status Update | Status: ${status}`);
    } catch (e) {
      console.warn("Notification dispatch notice:", e);
    }

    return updatedReq;
  } catch (err: any) {
    console.error("Firestore updateRequestStatus error:", err);
    throw new Error(err.message || "Failed to update request status in Firestore.");
  }
}

/**
 * Get request statistics aggregated per domain
 */
export async function getDomainRequestCounts(
  domains: DomainType[] = [
    "UI/UX",
    "Tech",
    "Web Development",
    "AI/ML",
    "App Development",
    "Graphics",
    "Social Media",
    "PR / Marketing & Sponsorship",
    "Operations",
  ]
): Promise<
  Record<string, { total: number; pending: number; accepted: number; rejected: number; waitlisted: number }>
> {
  const counts: Record<string, { total: number; pending: number; accepted: number; rejected: number; waitlisted: number }> = {};
  domains.forEach((d) => {
    counts[d] = { total: 0, pending: 0, accepted: 0, rejected: 0, waitlisted: 0 };
  });

  try {
    const requests = await getJoinRequests();
    requests.forEach((r) => {
      if (!counts[r.domain]) {
        counts[r.domain] = { total: 0, pending: 0, accepted: 0, rejected: 0, waitlisted: 0 };
      }
      counts[r.domain].total += 1;
      if (r.status === "pending") counts[r.domain].pending += 1;
      if (r.status === "accepted") counts[r.domain].accepted += 1;
      if (r.status === "rejected") counts[r.domain].rejected += 1;
      if (r.status === "waitlisted") counts[r.domain].waitlisted += 1;
    });
  } catch (err) {
    console.warn("Could not calculate domain request counts:", err);
  }

  return counts;
}
