import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  writeBatch,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { AppNotification, NotificationType } from "@/types/notification";

/**
 * Fetch notifications for a specific user from Firestore
 * (Complies with Firestore Security Rules requirement #27: recipientUid == currentUser.uid)
 */
export async function getNotifications(userUid: string): Promise<AppNotification[]> {
  try {
    const colRef = collection(db, "notifications");
    const q = query(colRef, where("recipientUid", "==", userUid));
    const snapshot = await getDocs(q);
    const list: AppNotification[] = [];
    snapshot.forEach((d) => {
      list.push({ ...(d.data() as AppNotification), id: d.id });
    });
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err: any) {
    console.error("Firestore getNotifications error:", err);
    return [];
  }
}

/**
 * Real-time listener for user's notifications
 */
export function subscribeToNotifications(
  userUid: string,
  callback?: (notifications: AppNotification[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, "notifications");
  const q = query(colRef, where("recipientUid", "==", userUid));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach((d) => {
        list.push({ ...(d.data() as AppNotification), id: d.id });
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (callback) callback(list);
    },
    (err) => {
      console.error("subscribeToNotifications onSnapshot error:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Send a notification to a specific member
 */
export async function sendNotification(data: {
  recipientUid: string;
  title?: string;
  message: string;
  type: NotificationType;
  link?: string;
}): Promise<AppNotification> {
  const id = "notif_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
  const newNotif: AppNotification = {
    ...data,
    id,
    read: false,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, "notifications", id);
    await setDoc(docRef, newNotif);
    return newNotif;
  } catch (err: any) {
    console.error("Firestore sendNotification error:", err);
    throw new Error(err.message || "Failed to send notification to Firestore.");
  }
}

/**
 * Send a notification to all active members in Firestore
 */
export async function sendNotificationToAllMembers(data: {
  title?: string;
  message: string;
  type: NotificationType;
  link?: string;
}): Promise<void> {
  try {
    const memCol = collection(db, "members");
    const q = query(memCol, where("status", "==", "active"));
    const snap = await getDocs(q);

    const batch = writeBatch(db);
    let count = 0;

    snap.forEach((d) => {
      const recipientUid = d.id;
      const notifId = "notif_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6) + "_" + count;
      const docRef = doc(db, "notifications", notifId);
      batch.set(docRef, {
        ...data,
        id: notifId,
        recipientUid,
        read: false,
        createdAt: new Date().toISOString(),
      });
      count++;
    });

    if (count > 0) {
      await batch.commit();
    }
  } catch (err: any) {
    console.warn("Could not broadcast notification to all members:", err);
  }
}

/**
 * Send notification to members by role
 */
export async function sendNotificationToRole(
  role: "admin" | "member",
  data: {
    title?: string;
    message: string;
    type: NotificationType;
    link?: string;
  }
): Promise<void> {
  try {
    const memCol = collection(db, "members");
    const q = query(memCol, where("role", "==", role), where("status", "==", "active"));
    const snap = await getDocs(q);

    const batch = writeBatch(db);
    let count = 0;

    snap.forEach((d) => {
      const recipientUid = d.id;
      const notifId = "notif_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6) + "_" + count;
      const docRef = doc(db, "notifications", notifId);
      batch.set(docRef, {
        ...data,
        id: notifId,
        recipientUid,
        read: false,
        createdAt: new Date().toISOString(),
      });
      count++;
    });

    if (count > 0) {
      await batch.commit();
    }
  } catch (err: any) {
    console.warn(`Could not send notification to role ${role}:`, err);
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, "notifications", id);
    await updateDoc(docRef, { read: true, readAt: new Date().toISOString() });
    return true;
  } catch (err: any) {
    console.error("Firestore markNotificationAsRead error:", err);
    throw new Error(err.message || "Failed to mark notification as read.");
  }
}

/**
 * Mark all notifications for a user as read
 */
export async function markAllNotificationsAsRead(userUid: string): Promise<boolean> {
  try {
    const colRef = collection(db, "notifications");
    const q = query(colRef, where("recipientUid", "==", userUid), where("read", "==", false));
    const snap = await getDocs(q);

    if (snap.empty) return true;

    const batch = writeBatch(db);
    snap.forEach((d) => {
      batch.update(d.ref, { read: true, readAt: new Date().toISOString() });
    });

    await batch.commit();
    return true;
  } catch (err: any) {
    console.error("Firestore markAllNotificationsAsRead error:", err);
    throw new Error(err.message || "Failed to mark all notifications as read.");
  }
}
