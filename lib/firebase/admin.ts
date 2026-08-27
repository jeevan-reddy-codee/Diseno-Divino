import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// This module is SERVER-SIDE ONLY. Never import into client components.

let cachedApp: App | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

export function getAdminApp(): App | null {
  if (cachedApp) return cachedApp;
  if (getApps().length > 0) {
    cachedApp = getApps()[0];
    return cachedApp;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      cachedApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
      return cachedApp;
    } catch (err: any) {
      console.error("Firebase Admin SDK initializeApp error:", err);
      return null;
    }
  }

  return null;
}

export function getAdminAuth(): Auth | null {
  if (cachedAuth) return cachedAuth;
  const app = getAdminApp();
  if (app) {
    cachedAuth = getAuth(app);
  }
  return cachedAuth;
}

export function getAdminDb(): Firestore | null {
  if (cachedDb) return cachedDb;
  const app = getAdminApp();
  if (app) {
    cachedDb = getFirestore(app);
  }
  return cachedDb;
}

export const adminApp = {
  get instance() {
    return getAdminApp();
  },
};

export const adminAuth = {
  get instance() {
    return getAdminAuth();
  },
};

export const adminDb = {
  get instance() {
    return getAdminDb();
  },
};
