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
import { ClubEvent, EventStatus } from "@/types/event";
import { logActivity } from "./activityService";
import { sendNotificationToAllMembers } from "./notificationService";
import { submitJoinRequest } from "./requestService";

/**
 * Fetch all events from Firestore
 */
export async function getEvents(): Promise<ClubEvent[]> {
  try {
    const colRef = collection(db, "events");
    const snapshot = await getDocs(colRef);
    const list: ClubEvent[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as ClubEvent;
      list.push({
        ...data,
        id: d.id,
        registeredCount: data.registeredCount || data.rsvpCount || 0,
        attendeeUids: data.attendeeUids || data.rsvpUids || [],
      });
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
        const data = d.data() as ClubEvent;
        list.push({
          ...data,
          id: d.id,
          registeredCount: data.registeredCount || data.rsvpCount || 0,
          attendeeUids: data.attendeeUids || data.rsvpUids || [],
        });
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
  data: Omit<ClubEvent, "id" | "status" | "createdAt" | "registeredCount" | "attendeeUids" | "rsvpCount" | "rsvpUids">,
  creatorUid: string,
  creatorName: string
): Promise<ClubEvent> {
  const id = "event_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
  const newEvent: ClubEvent = {
    ...data,
    id,
    status: "active",
    createdAt: new Date().toISOString(),
    createdBy: creatorUid,
    registeredCount: 0,
    attendeeUids: [],
    rsvpCount: 0,
    rsvpUids: [],
  };

  try {
    const docRef = doc(db, "events", id);
    await setDoc(docRef, newEvent);

    try {
      await logActivity({
        action: "Event created",
        performedBy: creatorUid,
        performedByName: creatorName,
        target: newEvent.name,
        details: `Created new event: "${newEvent.name}" on ${newEvent.date}`,
      });
    } catch (e) {
      console.warn("Could not log activity for event creation:", e);
    }

    try {
      await sendNotificationToAllMembers({
        title: "New Event Announced",
        message: `New Event: ${newEvent.name} has been published. Register now!`,
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

    if (status === "completed") {
      try {
        await sendNotificationToAllMembers({
          title: "Event Completed",
          message: `Event Completed: ${updatedEvent.name} has concluded.`,
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

export interface EventRegistrationData {
  eventId: string;
  eventName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  usn?: string;
  branch?: string;
  requirements?: string;
  userId?: string;
  domain?: string;
}

export interface EventRegistrationRecord extends EventRegistrationData {
  id: string;
  fullName: string;
  status: string;
  registeredAt: string;
}

/**
 * Register attendee details for an event in Firestore
 */
export async function registerEventAttendee(
  data: EventRegistrationData
): Promise<{ success: boolean; registrationId: string }> {
  try {
    const regCol = collection(db, "event_registrations");

    // Check for duplicate registration on this event (Requirement: Problem 4)
    if (data.email) {
      const qEmail = query(
        regCol,
        where("eventId", "==", data.eventId),
        where("email", "==", data.email.trim())
      );
      const snapEmail = await getDocs(qEmail);
      if (!snapEmail.empty) {
        throw new Error("You have already registered for this event with this email address.");
      }
    }

    if (data.usn) {
      const qUsn = query(
        regCol,
        where("eventId", "==", data.eventId),
        where("usn", "==", data.usn.trim().toUpperCase())
      );
      const snapUsn = await getDocs(qUsn);
      if (!snapUsn.empty) {
        throw new Error("You have already registered for this event with this USN.");
      }
    }

    const regId = "reg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const regDocRef = doc(db, "event_registrations", regId);

    const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim() || data.firstName || "Attendee";

    const record: EventRegistrationRecord = {
      ...data,
      id: regId,
      fullName,
      email: data.email.trim(),
      phone: (data.phone || "").trim(),
      usn: (data.usn || "").trim().toUpperCase(),
      branch: (data.branch || "").trim(),
      requirements: (data.requirements || "").trim(),
      status: "pending",
      registeredAt: new Date().toISOString(),
    };

    const cleanedRecord = Object.fromEntries(
      Object.entries(record).filter(([_, v]) => v !== undefined)
    );
    await setDoc(regDocRef, cleanedRecord);

    // Also persist as a JoinRequest record for full review & waitlist workflow in Domains & Requests
    try {
      await submitJoinRequest({
        name: fullName,
        email: data.email.trim(),
        phone: (data.phone || "").trim(),
        usn: (data.usn || "N/A").trim().toUpperCase(),
        branch: data.branch || "General",
        semester: "Current",
        domain: (data.domain || "Tech") as any,
        workLink: "Event Registration Application",
        eventId: data.eventId,
        eventName: data.eventName,
        type: "event_registration",
        userId: data.userId,
        requirements: (data.requirements || "").trim(),
      });
    } catch (reqErr) {
      console.warn("JoinRequest mirror note:", reqErr);
    }

    // Increment event registration count and track attendee ID
    try {
      const eventDocRef = doc(db, "events", data.eventId);
      const snap = await getDoc(eventDocRef);
      if (snap.exists()) {
        const ev = snap.data() as ClubEvent;
        const currentCount = ev.registeredCount || ev.rsvpCount || 0;
        const currentUids = ev.attendeeUids || ev.rsvpUids || [];
        await updateDoc(eventDocRef, {
          registeredCount: currentCount + 1,
          attendeeUids: [...currentUids, regId],
          rsvpCount: currentCount + 1,
          rsvpUids: [...currentUids, regId],
        });
      }
    } catch (countErr) {
      console.warn("Could not increment event registeredCount:", countErr);
    }

    return { success: true, registrationId: regId };
  } catch (err: any) {
    console.error("Firestore registerEventAttendee error:", err);
    throw new Error(err.message || "Failed to submit event registration. Please try again.");
  }
}

/**
 * Fetch all registrations for an event or all events
 */
export async function getEventRegistrations(eventId?: string): Promise<EventRegistrationRecord[]> {
  try {
    const colRef = collection(db, "event_registrations");
    const q = eventId ? query(colRef, where("eventId", "==", eventId)) : colRef;
    const snapshot = await getDocs(q);
    const list: EventRegistrationRecord[] = [];
    snapshot.forEach((d) => {
      list.push({ ...(d.data() as EventRegistrationRecord), id: d.id });
    });
    return list.sort(
      (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
    );
  } catch (err: any) {
    console.error("Firestore getEventRegistrations error:", err);
    return [];
  }
}

/**
 * Real-time listener for event registrations
 */
export function subscribeToEventRegistrations(
  eventId?: string,
  callback?: (registrations: EventRegistrationRecord[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, "event_registrations");
  const q = eventId ? query(colRef, where("eventId", "==", eventId)) : colRef;

  return onSnapshot(
    q,
    (snapshot) => {
      const list: EventRegistrationRecord[] = [];
      snapshot.forEach((d) => {
        list.push({ ...(d.data() as EventRegistrationRecord), id: d.id });
      });
      list.sort(
        (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
      );
      if (callback) callback(list);
    },
    (err) => {
      console.error("subscribeToEventRegistrations onSnapshot error:", err);
      if (onError) onError(err);
    }
  );
}
