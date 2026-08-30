import { db } from "@/lib/firebase/config";
import { doc, getDocs, collection, writeBatch } from "firebase/firestore";
import { SEED_MEMBERS, SEED_JOIN_REQUESTS, SEED_EVENTS, SEED_TODOS } from "./seedData";

let isInitializing = false;
let hasInitialized = false;

export async function seedFirestoreDatabase(): Promise<{
  success: boolean;
  message: string;
  counts: { members: number; requests: number; events: number; todos: number };
}> {
  try {
    const batch = writeBatch(db);

    // 1. Seed 12 Sample Members (2 per domain across 6 domains)
    for (const member of SEED_MEMBERS) {
      const docRef = doc(db, "members", member.uid);
      batch.set(docRef, member, { merge: true });
    }

    // 2. Seed Join Requests
    for (const req of SEED_JOIN_REQUESTS) {
      const docRef = doc(db, "joinRequests", req.id);
      batch.set(docRef, req, { merge: true });
    }

    // 3. Seed Events
    for (const evt of SEED_EVENTS) {
      const docRef = doc(db, "events", evt.id);
      batch.set(docRef, evt, { merge: true });
    }

    // 4. Seed Todos
    for (const todo of SEED_TODOS) {
      const docRef = doc(db, "todos", todo.id);
      batch.set(docRef, todo, { merge: true });
    }

    // 5. Seed Initial Notifications
    const notifRef1 = doc(db, "notifications", "notif_seed_001");
    batch.set(
      notifRef1,
      {
        id: "notif_seed_001",
        recipientUid: "admin_uid_jeevan",
        title: "Welcome to President Control",
        message: "Your executive President account has been initialized with full club privileges.",
        type: "system",
        read: false,
        createdAt: new Date().toISOString(),
        link: "/admin",
      },
      { merge: true }
    );

    const notifRef2 = doc(db, "notifications", "notif_seed_002");
    batch.set(
      notifRef2,
      {
        id: "notif_seed_002",
        recipientUid: "mem_tech_praveen",
        title: "Welcome Praveen",
        message: "You are registered as Core Developer in the Tech domain.",
        type: "system",
        read: false,
        createdAt: new Date().toISOString(),
        link: "/dashboard/todos",
      },
      { merge: true }
    );

    // 6. Seed Activity Log
    const actRef = doc(db, "activity", "act_seed_001");
    batch.set(
      actRef,
      {
        id: "act_seed_001",
        action: "Member created",
        performedBy: "admin_uid_jeevan",
        performedByName: "Jeevan (President)",
        target: "Diseño Divino Database",
        details: "Initialized club member directory across 6 domains",
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );

    await batch.commit();
    hasInitialized = true;

    return {
      success: true,
      message: "Firestore database initialized with 12 sample members, events, todos, and requests.",
      counts: {
        members: SEED_MEMBERS.length,
        requests: SEED_JOIN_REQUESTS.length,
        events: SEED_EVENTS.length,
        todos: SEED_TODOS.length,
      },
    };
  } catch (err: any) {
    console.error("Error seeding Firestore database:", err);
    throw new Error(err.message || "Failed to seed Firestore database.");
  }
}

/**
 * Automatically ensures the database is populated when running the site
 */
export async function ensureDatabaseInitialized(): Promise<void> {
  if (hasInitialized || isInitializing) return;
  if (typeof window === "undefined") return;

  isInitializing = true;
  try {
    const memSnap = await getDocs(collection(db, "members"));
    if (memSnap.empty || memSnap.size < 6) {
      console.info("Initializing Firestore database with sample members and initial records...");
      await seedFirestoreDatabase();
    } else {
      hasInitialized = true;
    }
  } catch (e) {
    console.warn("Auto-initialization check note:", e);
  } finally {
    isInitializing = false;
  }
}
