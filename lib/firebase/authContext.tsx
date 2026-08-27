"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider } from "./config";
import { Member, MemberPermissions } from "@/types/member";
import { getMemberByUid, getMemberByEmail } from "@/lib/services/memberService";
import { hasPermission as checkPermission, canAccessAdmin } from "@/lib/auth/permissions";

interface AuthContextType {
  user: User | null;
  memberProfile: Member | null;
  loading: boolean;
  isAdmin: boolean;
  hasPermission: (permission: keyof MemberPermissions) => boolean;
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  memberProfile: null,
  loading: true,
  isAdmin: false,
  hasPermission: () => false,
  signInWithEmail: async () => ({ success: false }),
  signInWithGoogle: async () => ({ success: false }),
  signOutUser: async () => {},
  resetPassword: async () => ({ success: false }),
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [memberProfile, setMemberProfile] = useState<Member | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfileForUser = async (firebaseUser: User): Promise<Member | null> => {
    let profile = await getMemberByUid(firebaseUser.uid);
    if (!profile && firebaseUser.email) {
      profile = await getMemberByEmail(firebaseUser.email);
    }
    return profile;
  };

  // Listen to real Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await fetchProfileForUser(firebaseUser);
          if (profile) {
            if (profile.status === "disabled") {
              await signOut(auth);
              setUser(null);
              setMemberProfile(null);
            } else {
              setUser(firebaseUser);
              setMemberProfile(profile);
            }
          } else {
            console.warn(`User ${firebaseUser.email} has no active Firestore member record.`);
            setUser(firebaseUser);
            setMemberProfile(null);
          }
        } catch (err) {
          console.error("Error loading member profile from Firestore:", err);
          setUser(firebaseUser);
          setMemberProfile(null);
        }
      } else {
        setUser(null);
        setMemberProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (auth.currentUser) {
      const profile = await fetchProfileForUser(auth.currentUser);
      if (profile && profile.status === "active") {
        setMemberProfile(profile);
      } else if (profile && profile.status === "disabled") {
        await signOutUser();
      }
    }
  };

  const signInWithEmail = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const trimmedEmail = email.trim();

    try {
      let credUser: User | null = null;

      try {
        const cred = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
        credUser = cred.user;
      } catch (fbErr: any) {
        // If user is not yet created in Auth, check if they are a registered Firestore member
        // and auto-provision their Firebase Auth account on first sign-in
        if (fbErr.code === "auth/invalid-credential" || fbErr.code === "auth/user-not-found") {
          const existingMember = await getMemberByEmail(trimmedEmail);
          if (existingMember && existingMember.status === "active") {
            try {
              const newCred = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
              credUser = newCred.user;
            } catch (createErr: any) {
              if (createErr.code === "auth/configuration-not-found") {
                throw createErr;
              }
              // If creation fails due to wrong password, re-throw initial credential error
              throw fbErr;
            }
          } else {
            throw fbErr;
          }
        } else {
          throw fbErr;
        }
      }

      if (!credUser) {
        setLoading(false);
        return { success: false, error: "Authentication failed. Could not obtain user session." };
      }

      const profile = await fetchProfileForUser(credUser);

      if (!profile) {
        await signOut(auth);
        setLoading(false);
        return {
          success: false,
          error: "No active Diseño Divino member record found in Firestore for this account. Please contact an admin.",
        };
      }

      if (profile.status === "disabled") {
        await signOut(auth);
        setLoading(false);
        return {
          success: false,
          error: "Your membership access has been disabled by an administrator. Access denied.",
        };
      }

      setUser(credUser);
      setMemberProfile(profile);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      let errorMsg = err.message || "Failed to sign in. Please verify your email and password.";

      if (err.code === "auth/configuration-not-found") {
        errorMsg =
          "Firebase Authentication is not enabled yet in your project console. Please visit: Firebase Console -> Authentication -> 'Get Started' -> Sign-in method -> Enable 'Email/Password'.";
      } else if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        errorMsg = "Invalid email or password. Please check your credentials or click Forgot Password.";
      } else if (err.code === "auth/too-many-requests") {
        errorMsg = "Too many failed login attempts. Please wait a moment or reset your password.";
      } else if (err.code === "auth/network-request-failed") {
        errorMsg = "Network error. Please check your internet connection.";
      }

      return { success: false, error: errorMsg };
    }
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;
      const profile = await fetchProfileForUser(googleUser);

      if (!profile) {
        await signOut(auth);
        setLoading(false);
        return {
          success: false,
          error: `Google account (${googleUser.email}) is authenticated, but no active club member record exists in Firestore for this email. Only registered club members can enter the portal.`,
        };
      }

      if (profile.status === "disabled") {
        await signOut(auth);
        setLoading(false);
        return {
          success: false,
          error: "Your membership access is currently disabled. Access denied.",
        };
      }

      setUser(googleUser);
      setMemberProfile(profile);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      if (err.code === "auth/popup-closed-by-user") {
        return { success: false, error: "Google sign-in popup was closed before completing." };
      }
      if (err.code === "auth/configuration-not-found") {
        return {
          success: false,
          error:
            "Google Provider is not enabled yet in your Firebase Console. Go to Firebase Console -> Authentication -> Sign-in method -> Add 'Google'.",
        };
      }
      return {
        success: false,
        error: err.message || "Google Authentication failed. Please try again.",
      };
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("SignOut error:", e);
    }
    setUser(null);
    setMemberProfile(null);
  };

  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        return { success: false, error: "Please enter your email address." };
      }
      await sendPasswordResetEmail(auth, trimmedEmail);
      return { success: true };
    } catch (err: any) {
      let errorMsg = err.message || "Failed to send password reset email.";
      if (err.code === "auth/configuration-not-found") {
        errorMsg = "Firebase Authentication is not enabled yet in the Firebase Console.";
      } else if (err.code === "auth/user-not-found") {
        errorMsg = "No Firebase user found with this email address.";
      } else if (err.code === "auth/invalid-email") {
        errorMsg = "Please enter a valid email address.";
      }
      return { success: false, error: errorMsg };
    }
  };

  const isAdmin = canAccessAdmin(memberProfile);
  const hasPerm = (perm: keyof MemberPermissions) => checkPermission(memberProfile, perm);

  return (
    <AuthContext.Provider
      value={{
        user,
        memberProfile,
        loading,
        isAdmin,
        hasPermission: hasPerm,
        signInWithEmail,
        signInWithGoogle,
        signOutUser,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
