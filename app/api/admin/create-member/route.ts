import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { db } from "@/lib/firebase/config";
import { doc, setDoc, collection, addDoc } from "firebase/firestore";
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
      semester,
      branch,
      domain,
      role = "member",
      permissions = {
        reviewRequests: false,
        manageRequests: false,
        assignTodos: false,
        manageMembers: false,
        createEvents: false,
      },
      adminUid = "president",
      adminName = "President",
    } = body;

    // Validate required fields
    if (!name || !email || !password || !usn || !domain) {
      return NextResponse.json(
        { error: "Missing required member fields (name, email, password, usn, domain)." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    let uid = "";

    // 1. Create Auth User using Admin SDK
    if (adminAuth) {
      try {
        const userRecord = await adminAuth.createUser({
          email: loginEmail || email,
          password,
          displayName: name,
        });
        uid = userRecord.uid;
      } catch (authErr: any) {
        if (authErr.code === "auth/email-already-exists") {
          return NextResponse.json(
            { error: `An account with email ${loginEmail || email} already exists.` },
            { status: 409 }
          );
        }
        console.error("Admin Auth create error:", authErr);
        return NextResponse.json(
          { error: authErr.message || "Failed to create Auth user." },
          { status: 500 }
        );
      }
    } else {
      // Fallback: Generate consistent unique UID
      uid = "mem_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
      console.warn("FIREBASE_ADMIN_PRIVATE_KEY not set. Falling back to generated UID:", uid);
    }

    // 2. Create Firestore Member Record
    const newMember: Member = {
      uid,
      name,
      email,
      loginEmail: loginEmail || email,
      usn,
      semester: semester || "1st Semester",
      branch: branch || "Computer Science",
      domain,
      role,
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
        console.error("Admin Firestore save error:", dbErr);
        return NextResponse.json(
          { error: "Auth user created, but failed to save member profile in Firestore: " + dbErr.message },
          { status: 500 }
        );
      }
    } else {
      // Fallback to client Firestore instance
      try {
        await setDoc(doc(db, "members", uid), newMember);
        await addDoc(collection(db, "activity"), {
          action: "Member created",
          performedBy: adminUid,
          performedByName: adminName,
          target: newMember.name,
          details: `Created account for ${newMember.name} in ${newMember.domain} (${newMember.role})`,
          createdAt: new Date().toISOString(),
        });
      } catch (clientDbErr: any) {
        console.error("Client Firestore fallback save error:", clientDbErr);
        return NextResponse.json(
          { error: "Failed to save member profile in Firestore: " + clientDbErr.message },
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
    console.error("Error creating member:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create member." },
      { status: 500 }
    );
  }
}
