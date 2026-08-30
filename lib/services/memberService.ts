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
import { Member, MemberPermissions, MemberStatus, MemberRole } from "@/types/member";
import { logActivity } from "./activityService";

/**
 * Fetch all members from Firestore
 */
export async function getMembers(): Promise<Member[]> {
  try {
    const colRef = collection(db, "members");
    const snapshot = await getDocs(colRef);
    const list: Member[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...(docSnap.data() as Member), uid: docSnap.id });
    });
    return list;
  } catch (err: any) {
    console.error("Firestore getMembers error:", err);
    throw new Error(err.message || "Failed to load members from Firestore.");
  }
}

/**
 * Real-time listener for all members
 */
export function subscribeToMembers(
  callback: (members: Member[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, "members");
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Member[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...(docSnap.data() as Member), uid: docSnap.id });
      });
      callback(list);
    },
    (err) => {
      console.error("subscribeToMembers onSnapshot error:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Fetch active members
 */
export async function getActiveMembers(): Promise<Member[]> {
  try {
    const colRef = collection(db, "members");
    const q = query(colRef, where("status", "==", "active"));
    const snapshot = await getDocs(q);
    const list: Member[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...(docSnap.data() as Member), uid: docSnap.id });
    });
    return list;
  } catch (err: any) {
    console.error("Firestore getActiveMembers error:", err);
    throw new Error(err.message || "Failed to load active members.");
  }
}

/**
 * Fetch member by Firestore UID
 */
export async function getMemberByUid(uid: string): Promise<Member | null> {
  try {
    const docRef = doc(db, "members", uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...(snap.data() as Member), uid: snap.id };
    }
    return null;
  } catch (err: any) {
    console.error("Firestore getMemberByUid error:", err);
    return null;
  }
}

/**
 * Fetch member by email or loginEmail
 */
export async function getMemberByEmail(email: string): Promise<Member | null> {
  try {
    const colRef = collection(db, "members");
    const q1 = query(colRef, where("email", "==", email));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const d = snap1.docs[0];
      return { ...(d.data() as Member), uid: d.id };
    }

    const q2 = query(colRef, where("loginEmail", "==", email));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const d = snap2.docs[0];
      return { ...(d.data() as Member), uid: d.id };
    }

    return null;
  } catch (err: any) {
    console.error("Firestore getMemberByEmail error:", err);
    return null;
  }
}

/**
 * Create a new member document in Firestore
 */
export async function createMember(
  memberData: Omit<Member, "joinedAt"> & { joinedAt?: string },
  adminUid: string,
  adminName: string
): Promise<Member> {
  const newMember: Member = {
    ...memberData,
    joinedAt: memberData.joinedAt || new Date().toISOString(),
  };

  try {
    const docRef = doc(db, "members", newMember.uid);
    await setDoc(docRef, newMember);

    try {
      await logActivity({
        action: "Member created",
        performedBy: adminUid,
        performedByName: adminName,
        target: newMember.name,
        details: `Added ${newMember.name} to ${newMember.domain} (${newMember.role})`,
      });
    } catch (e) {
      console.warn("Could not log member creation activity:", e);
    }

    return newMember;
  } catch (err: any) {
    console.error("Firestore createMember error:", err);
    throw new Error(err.message || "Failed to create member in Firestore.");
  }
}

/**
 * Update member fields
 */
export async function updateMember(
  uid: string,
  updates: Partial<Member>,
  adminUid: string,
  adminName: string
): Promise<Member | null> {
  try {
    const docRef = doc(db, "members", uid);
    await updateDoc(docRef, updates);

    const updatedSnap = await getDoc(docRef);
    const updatedMember = updatedSnap.exists()
      ? ({ ...(updatedSnap.data() as Member), uid: updatedSnap.id })
      : null;

    if (updatedMember) {
      try {
        await logActivity({
          action: "Member edited",
          performedBy: adminUid,
          performedByName: adminName,
          target: updatedMember.name,
          details: `Updated profile details for ${updatedMember.name}`,
        });
      } catch (e) {
        console.warn("Could not log member edit activity:", e);
      }
    }

    return updatedMember;
  } catch (err: any) {
    console.error("Firestore updateMember error:", err);
    throw new Error(err.message || "Failed to update member in Firestore.");
  }
}

/**
 * Assign Domain Head / Team Lead role
 */
export async function assignDomainHead(
  uid: string,
  leadDomains: string[],
  designation: string,
  adminUid: string,
  adminName: string
): Promise<Member | null> {
  return updateMember(
    uid,
    {
      role: "lead",
      leadDomains,
      designation: designation || `${leadDomains.join(", ")} Lead`,
      permissions: {
        reviewRequests: true,
        manageRequests: true,
        assignTodos: true,
        manageMembers: true,
        createEvents: true,
      },
    },
    adminUid,
    adminName
  );
}

/**
 * Disable member access
 */
export async function disableMember(
  uid: string,
  adminUid: string,
  adminName: string
): Promise<boolean> {
  return setMemberStatus(uid, "disabled", adminUid, adminName);
}

/**
 * Enable member access
 */
export async function enableMember(
  uid: string,
  adminUid: string,
  adminName: string
): Promise<boolean> {
  return setMemberStatus(uid, "active", adminUid, adminName);
}

/**
 * Set member status (active / disabled)
 */
export async function setMemberStatus(
  uid: string,
  status: MemberStatus,
  adminUid: string,
  adminName: string
): Promise<boolean> {
  try {
    const docRef = doc(db, "members", uid);
    await updateDoc(docRef, { status });

    const snap = await getDoc(docRef);
    const name = snap.exists() ? (snap.data() as Member).name : uid;

    try {
      await logActivity({
        action: status === "disabled" ? "Member disabled" : "Member edited",
        performedBy: adminUid,
        performedByName: adminName,
        target: name,
        details: `Changed status to ${status}`,
      });
    } catch (e) {
      console.warn("Could not log member status activity:", e);
    }

    return true;
  } catch (err: any) {
    console.error("Firestore setMemberStatus error:", err);
    throw new Error(err.message || `Failed to change member status to ${status}.`);
  }
}

/**
 * Update member granular permissions
 */
export async function updatePermissions(
  uid: string,
  permissions: MemberPermissions,
  adminUid: string,
  adminName: string
): Promise<boolean> {
  try {
    const docRef = doc(db, "members", uid);
    await updateDoc(docRef, { permissions });

    const snap = await getDoc(docRef);
    const name = snap.exists() ? (snap.data() as Member).name : uid;

    try {
      await logActivity({
        action: "Permission changed",
        performedBy: adminUid,
        performedByName: adminName,
        target: name,
        details: `Updated permissions for ${name}`,
      });
    } catch (e) {
      console.warn("Could not log permission activity:", e);
    }

    return true;
  } catch (err: any) {
    console.error("Firestore updatePermissions error:", err);
    throw new Error(err.message || "Failed to update permissions.");
  }
}
