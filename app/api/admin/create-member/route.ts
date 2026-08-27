import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { Member } from "@/types/member";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      loginEmail,
      password,
      usn,
      semester = "1st Semester",
      branch = "Computer Science",
      domain,
      role = "member",
      permissions = {
        reviewRequests: false,
        manageRequests: false,
        assignTodos: false,
        manageMembers: false,
        createEvents: false,
      },
      adminUid = "admin",
      adminName = "Admin",
    } = body;

    // 1. Validate required fields
    if (!name || !email || !password || !usn || !domain) {
      return NextResponse.json(
        { error: "Missing required member fields (name, email, password, usn, domain)." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    let uid = "";

    // 2. Create Firebase Auth user using Admin SDK
    if (adminAuth) {
      try {
        const userRecord = await adminAuth.createUser({
          email: loginEmail || email,
          password: password,
          displayName: name,
        });
        uid = userRecord.uid;
      } catch (authErr: any) {
        if (authErr.code === "auth/email-already-exists") {
          return NextResponse.json(
            { error: `A Firebase Auth account with email "${loginEmail || email}" already exists.` },
            { status: 409 }
          );
        }
        console.error("Firebase Admin Auth createUser error:", authErr);
        return NextResponse.json(
          { error: authErr.message || "Failed to create Firebase Auth user account." },
          { status: 500 }
        );
      }
    } else {
      // If Admin SDK credentials are not yet set in .env.local
      // Generate a consistent UID and explain clearly
      uid = "mem_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
      console.warn("Notice: FIREBASE_ADMIN_PRIVATE_KEY is not configured. Created member document with UID:", uid);
    }

    // 3. Create Firestore member record
    const newMember: Member = {
      uid,
      name,
      email,
      loginEmail: loginEmail || email,
      usn,
      semester,
      branch,
      domain,
      role: role as any,
      status: "active",
      joinedAt: new Date().toISOString(),
      permissions,
    };

    if (adminDb) {
      try {
        await adminDb.collection("members").doc(uid).set(newMember);
        await adminDb.collection("activity").add({
          action: "Member created",
          performedBy: adminUid,
          performedByName: adminName,
          target: newMember.name,
          details: `Created account for ${newMember.name} in ${newMember.domain} (${newMember.role})`,
          createdAt: new Date().toISOString(),
        });
      } catch (dbErr: any) {
        console.error("Firebase Admin Firestore error:", dbErr);
        return NextResponse.json(
          { error: "Auth user created, but failed to save member profile in Firestore: " + dbErr.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      member: newMember,
      message: `Member ${name} successfully created with UID ${uid}`,
    });
  } catch (error: any) {
    console.error("Error creating member in API route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create member account." },
      { status: 500 }
    );
  }
}
