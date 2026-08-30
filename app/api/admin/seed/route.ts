import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { SEED_MEMBERS, SEED_JOIN_REQUESTS, SEED_EVENTS, SEED_TODOS } from "@/lib/services/seedData";

export async function POST(req: NextRequest) {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    // 1. Seed Auth users if Admin SDK is configured
    const authResults = {
      adminCreated: false,
      praveenCreated: false,
      notes: "",
    };

    if (adminAuth) {
      try {
        // Create or update Jeevan (Admin)
        try {
          await adminAuth.createUser({
            uid: "admin_uid_jeevan",
            email: "jeevan@gmail.com",
            password: "jeevan@123",
            displayName: "Jeevan (Admin)",
          });
          authResults.adminCreated = true;
        } catch (e: any) {
          if (e.code === "auth/uid-already-exists" || e.code === "auth/email-already-exists") {
            try {
              const existing = await adminAuth.getUserByEmail("jeevan@gmail.com");
              await adminAuth.updateUser(existing.uid, {
                password: "jeevan@123",
                displayName: "Jeevan (Admin)",
              });
              authResults.adminCreated = true;
            } catch (updateErr) {
              console.warn("Could not update existing admin:", updateErr);
            }
          }
        }

        // Create or update Praveen (Member)
        try {
          await adminAuth.createUser({
            uid: "mem_tech_praveen",
            email: "praveen@gmail.com",
            password: "praveen@123",
            displayName: "Praveen",
          });
          authResults.praveenCreated = true;
        } catch (e: any) {
          if (e.code === "auth/uid-already-exists" || e.code === "auth/email-already-exists") {
            try {
              const existing = await adminAuth.getUserByEmail("praveen@gmail.com");
              await adminAuth.updateUser(existing.uid, {
                password: "praveen@123",
                displayName: "Praveen",
              });
              authResults.praveenCreated = true;
            } catch (updateErr) {
              console.warn("Could not update existing praveen:", updateErr);
            }
          }
        }
      } catch (authErr: any) {
        console.warn("Admin Auth seed notice:", authErr);
      }
    } else {
      authResults.notes = "Admin SDK credentials not set in server environment. Firestore documents seeded.";
    }

    // 2. Seed Firestore if Admin DB is available
    if (adminDb) {
      const batch = adminDb.batch();

      for (const m of SEED_MEMBERS) {
        const ref = adminDb.collection("members").doc(m.uid);
        batch.set(ref, m, { merge: true });
      }

      for (const r of SEED_JOIN_REQUESTS) {
        const ref = adminDb.collection("joinRequests").doc(r.id);
        batch.set(ref, r, { merge: true });
      }

      for (const e of SEED_EVENTS) {
        const ref = adminDb.collection("events").doc(e.id);
        batch.set(ref, e, { merge: true });
      }

      for (const t of SEED_TODOS) {
        const ref = adminDb.collection("todos").doc(t.id);
        batch.set(ref, t, { merge: true });
      }

      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: "Database successfully seeded.",
      authResults,
      membersCount: SEED_MEMBERS.length,
      eventsCount: SEED_EVENTS.length,
      todosCount: SEED_TODOS.length,
      requestsCount: SEED_JOIN_REQUESTS.length,
    });
  } catch (error: any) {
    console.error("Seed API route error:", error);
    return NextResponse.json({ error: error.message || "Failed to seed database" }, { status: 500 });
  }
}
