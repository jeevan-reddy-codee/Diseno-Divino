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
import { logActivity } from "./activityService";
import { sendNotificationToRole } from "./notificationService";

/**
 * Submit a public join request to Firestore
 */
export async function submitJoinRequest(
  data: Omit<JoinRequest, "id" | "status" | "submittedAt">
): Promise<JoinRequest> {
  const id = "req_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  const newRequest: JoinRequest = {
    ...data,
    id,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, "joinRequests", id);
    await setDoc(docRef, newRequest);

    // Try logging activity and notifying admin, but do not block request submission if those fail
    try {
      await logActivity({
        action: "Application submitted",
        performedBy: newRequest.name,
        performedByName: newRequest.name,
        target: `${newRequest.domain} Domain`,
        details: `${newRequest.name} (${newRequest.usn}) applied for ${newRequest.domain}`,
      });
    } catch (e) {
      console.warn("Could not log activity for join request:", e);
    }

    try {
      await sendNotificationToRole("admin", {
        title: "New Join Request",
        message: `${newRequest.name} applied to join ${newRequest.domain}`,
        type: "request",
        link: "/dashboard/requests",
      });
    } catch (e) {
      console.warn("Could not send admin notification for join request:", e);
    }

    return newRequest;
  } catch (err: any) {
    console.error("Firestore submitJoinRequest error:", err);
    throw new Error(err.message || "Unable to submit application to Firestore. Please try again.");
  }
}

/**
 * Fetch all join requests or filtered by domain from Firestore
 */
export async function getJoinRequests(domain?: DomainType): Promise<JoinRequest[]> {
  try {
    const colRef = collection(db, "joinRequests");
    const q = domain ? query(colRef, where("domain", "==", domain)) : colRef;
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
    throw new Error(err.message || "Failed to load join requests from Firestore.");
  }
}

/**
 * Real-time listener for join requests
 */
export function subscribeToJoinRequests(
  domain?: DomainType,
  callback?: (requests: JoinRequest[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, "joinRequests");
  const q = domain ? query(colRef, where("domain", "==", domain)) : colRef;

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
 * Update request status (accept / reject)
 */
export async function updateRequestStatus(
  id: string,
  status: RequestStatus,
  reviewerUid: string,
  reviewerName: string,
  notes?: string
): Promise<JoinRequest | null> {
  const updates: Partial<JoinRequest> = {
    status,
    reviewedBy: reviewerUid,
    reviewedAt: new Date().toISOString(),
    ...(notes ? { notes } : {}),
  };

  try {
    const docRef = doc(db, "joinRequests", id);
    await updateDoc(docRef, updates);

    const updatedSnap = await getDoc(docRef);
    if (!updatedSnap.exists()) return null;

    const updatedReq = { ...(updatedSnap.data() as JoinRequest), id: updatedSnap.id };

    try {
      await logActivity({
        action: status === "accepted" ? "Application accepted" : "Application rejected",
        performedBy: reviewerUid,
        performedByName: reviewerName,
        target: updatedReq.name,
        details: `${status === "accepted" ? "Accepted" : "Rejected"} application for ${updatedReq.domain} domain`,
      });
    } catch (e) {
      console.warn("Could not log activity for request update:", e);
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
export async function getDomainRequestCounts(): Promise<
  Record<string, { total: number; pending: number; accepted: number; rejected: number }>
> {
  const domains: DomainType[] = [
    "UI/UX",
    "Tech",
    "Graphics",
    "Social Media",
    "PR / Marketing & Sponsorship",
    "Operations",
  ];

  const counts: Record<string, { total: number; pending: number; accepted: number; rejected: number }> = {};
  domains.forEach((d) => {
    counts[d] = { total: 0, pending: 0, accepted: 0, rejected: 0 };
  });

  try {
    const requests = await getJoinRequests();
    requests.forEach((r) => {
      if (!counts[r.domain]) {
        counts[r.domain] = { total: 0, pending: 0, accepted: 0, rejected: 0 };
      }
      counts[r.domain].total += 1;
      if (r.status === "pending") counts[r.domain].pending += 1;
      if (r.status === "accepted") counts[r.domain].accepted += 1;
      if (r.status === "rejected") counts[r.domain].rejected += 1;
    });
  } catch (err) {
    console.warn("Could not calculate domain request counts from Firestore:", err);
  }

  return counts;
}
