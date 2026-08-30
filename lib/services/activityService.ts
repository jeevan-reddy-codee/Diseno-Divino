import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { ActivityLog, ActivityAction } from "@/types/activity";

/**
 * Log an activity to Firestore
 */
export async function logActivity(data: {
  action: ActivityAction;
  performedBy: string;
  performedByName?: string;
  target?: string;
  details?: string;
}): Promise<ActivityLog> {
  const id = "act_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
  const newLog: ActivityLog = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, "activity", id);
    await setDoc(docRef, newLog);
    return newLog;
  } catch (err: any) {
    console.error("Firestore logActivity error:", err);
    return newLog;
  }
}

/**
 * Fetch recent activity history from Firestore
 */
export async function getRecentActivity(limit = 20): Promise<ActivityLog[]> {
  try {
    const colRef = collection(db, "activity");
    const snapshot = await getDocs(colRef);
    const list: ActivityLog[] = [];
    snapshot.forEach((d) => {
      list.push({ ...(d.data() as ActivityLog), id: d.id });
    });
    return list
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch (err: any) {
    console.error("Firestore getRecentActivity error:", err);
    return [];
  }
}

/**
 * Real-time listener for activity feed
 */
export function subscribeToRecentActivity(
  limit = 20,
  callback?: (activity: ActivityLog[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, "activity");

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: ActivityLog[] = [];
      snapshot.forEach((d) => {
        list.push({ ...(d.data() as ActivityLog), id: d.id });
      });
      const sorted = list
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
      if (callback) callback(sorted);
    },
    (err) => {
      console.error("subscribeToRecentActivity onSnapshot error:", err);
      if (onError) onError(err);
    }
  );
}
