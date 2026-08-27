import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { ClubEvent, EventStatus } from "@/types/event";
import { logActivity } from "./activityService";
import { sendNotificationToAllMembers } from "./notificationService";

/**
 * Fetch all events from Firestore
 */
export async function getEvents(): Promise<ClubEvent[]> {
  try {
    const colRef = collection(db, "events");
    const snapshot = await getDocs(colRef);
    const list: ClubEvent[] = [];
    snapshot.forEach((d) => {
      list.push({ ...(d.data() as ClubEvent), id: d.id });
    });
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err: any) {
    console.error("Firestore getEvents error:", err);
    throw new Error(err.message || "Failed to load events from Firestore.");
  }
}

/**
 * Real-time listener for events
 */
export function subscribeToEvents(
  callback?: (events: ClubEvent[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, "events");

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: ClubEvent[] = [];
      snapshot.forEach((d) => {
        list.push({ ...(d.data() as ClubEvent), id: d.id });
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (callback) callback(list);
    },
    (err) => {
      console.error("subscribeToEvents onSnapshot error:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Fetch active events
 */
export async function getActiveEvents(): Promise<ClubEvent[]> {
  const all = await getEvents();
  return all.filter((e) => e.status === "active");
}

/**
 * Create a new event in Firestore
 */
export async function createEvent(
  data: Omit<ClubEvent, "id" | "status" | "createdAt" | "rsvpCount" | "rsvpUids">,
  adminUid: string,
  adminName: string
): Promise<ClubEvent> {
  const id = "event_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
  const newEvent: ClubEvent = {
    ...data,
    id,
    status: "active",
    createdAt: new Date().toISOString(),
    createdBy: adminUid,
    rsvpCount: 0,
    rsvpUids: [],
  };

  try {
    const docRef = doc(db, "events", id);
    await setDoc(docRef, newEvent);

    try {
      await logActivity({
        action: "Event created",
        performedBy: adminUid,
        performedByName: adminName,
        target: newEvent.name,
        details: `Created new event: "${newEvent.name}" on ${newEvent.date}`,
      });
    } catch (e) {
      console.warn("Could not log activity for event creation:", e);
    }

    // Requirement 22: When Admin creates an event, create notifications for members
    try {
      await sendNotificationToAllMembers({
        title: "New Event Initialized",
        message: `New Event: ${newEvent.name} has been initialized.`,
        type: "event",
        link: "/dashboard/events",
      });
    } catch (e) {
      console.warn("Could not send notifications for new event:", e);
    }

    return newEvent;
  } catch (err: any) {
    console.error("Firestore createEvent error:", err);
    throw new Error(err.message || "Failed to create event in Firestore.");
  }
}

/**
 * Update event status (active / completed) in Firestore
 */
export async function setEventStatus(
  id: string,
  status: EventStatus,
  adminUid: string,
  adminName: string
): Promise<ClubEvent | null> {
  try {
    const docRef = doc(db, "events", id);
    await updateDoc(docRef, { status });

    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const updatedEvent = { ...(snap.data() as ClubEvent), id: snap.id };

    try {
      await logActivity({
        action: status === "completed" ? "Event completed" : "Event created",
        performedBy: adminUid,
        performedByName: adminName,
        target: updatedEvent.name,
        details: `Marked event as ${status}`,
      });
    } catch (e) {
      console.warn("Could not log activity for event status:", e);
    }

    // Requirement 22: When Admin marks an event completed, create notifications
    if (status === "completed") {
      try {
        await sendNotificationToAllMembers({
          title: "Event Completed",
          message: `Event Completed: ${updatedEvent.name} has been completed.`,
          type: "event_completed",
          link: "/dashboard/events",
        });
      } catch (e) {
        console.warn("Could not send event completed notifications:", e);
      }
    }

    return updatedEvent;
  } catch (err: any) {
    console.error("Firestore setEventStatus error:", err);
    throw new Error(err.message || "Failed to update event status in Firestore.");
  }
}

/**
 * Toggle RSVP for an event in Firestore
 */
export async function toggleEventRsvp(
  eventId: string,
  userUid: string
): Promise<{ rsvpd: boolean; count: number }> {
  try {
    const docRef = doc(db, "events", eventId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return { rsvpd: false, count: 0 };

    const event = snap.data() as ClubEvent;
    const currentUids = event.rsvpUids || [];
    const hasRsvpd = currentUids.includes(userUid);
    const updatedUids = hasRsvpd
      ? currentUids.filter((uid) => uid !== userUid)
      : [...currentUids, userUid];

    const count = Math.max(0, (event.rsvpCount || 0) + (hasRsvpd ? -1 : 1));
    await updateDoc(docRef, { rsvpUids: updatedUids, rsvpCount: count });

    return { rsvpd: !hasRsvpd, count };
  } catch (err: any) {
    console.error("Firestore toggleEventRsvp error:", err);
    throw new Error(err.message || "Failed to update RSVP in Firestore.");
  }
}
