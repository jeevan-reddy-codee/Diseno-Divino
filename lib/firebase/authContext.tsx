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
import { getMemberByUid, getMemberByEmail, createMember } from "@/lib/services/memberService";
import {
  hasPermission as checkPermission,
  isPresident as checkIsPresident,
  isDomainHead as checkIsDomainHead,
  canManageDomain as checkCanManageDomain,
} from "@/lib/auth/permissions";

interface AuthContextType {
  user: User | null;
  memberProfile: Member | null;
  loading: boolean;
  isAdmin: boolean;
  isPresident: boolean;
  isDomainHead: (domain?: string) => boolean;
  canManageDomain: (domain: string) => boolean;
  hasPermission: (permission: keyof MemberPermissions) => boolean;
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
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
  isPresident: false,
  isDomainHead: () => false,
  canManageDomain: () => false,
  hasPermission: () => false,
  signInWithEmail: async () => ({ success: false }),
  signUpWithEmail: async () => ({ success: false }),
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
          let profile = await fetchProfileForUser(firebaseUser);
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
            // Auto-provision default member profile if missing
            const newMember: Omit<Member, "joinedAt"> & { joinedAt?: string } = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split("@")[0] : "Club Member"),
              email: firebaseUser.email || "",
              loginEmail: firebaseUser.email || "",
              usn: "1DD" + Math.floor(100000 + Math.random() * 900000),
              semester: "1st Semester",
              branch: "Creative Technology",
              role: "member",
              domain: "UI/UX",
              status: "active",
              permissions: {
                reviewRequests: false,
                manageRequests: false,
                assignTodos: false,
                manageMembers: false,
                createEvents: false,
              },
              avatarUrl: firebaseUser.photoURL || "",
            };

            try {
              profile = await createMember(newMember, firebaseUser.uid, newMember.name);
            } catch (createErr) {
              console.warn("Auto-provisioning profile fallback:", createErr);
              profile = { ...newMember, joinedAt: new Date().toISOString() };
            }

            setUser(firebaseUser);
            setMemberProfile(profile);
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

      let profile = await fetchProfileForUser(credUser);

      if (!profile) {
        // Auto-provision member record if missing
        const newMember = {
          uid: credUser.uid,
          name: credUser.displayName || trimmedEmail.split("@")[0],
          email: trimmedEmail,
          loginEmail: trimmedEmail,
          usn: "1DD" + Math.floor(100000 + Math.random() * 900000),
          semester: "1st Semester",
          branch: "Creative Technology",
          role: "member" as const,
          domain: "UI/UX",
          status: "active" as const,
          permissions: {
            reviewRequests: false,
            manageRequests: false,
            assignTodos: false,
            manageMembers: false,
            createEvents: false,
          },
          avatarUrl: credUser.photoURL || "",
        };

        try {
          profile = await createMember(newMember, credUser.uid, newMember.name);
        } catch (e) {
          profile = { ...newMember, joinedAt: new Date().toISOString() };
        }
      }

      if (profile.status === "disabled") {
        await signOut(auth);
        setLoading(false);
        return {
          success: false,
          error: "Your membership access has been disabled by the club president. Access denied.",
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
          "Firebase Authentication is not enabled yet in your project console. Please visit Firebase Console -> Authentication -> Enable Email/Password.";
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

  const signUpWithEmail = async (
    name: string,
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    try {
      if (!trimmedEmail || !pass || !trimmedName) {
        setLoading(false);
        return { success: false, error: "Please enter your name, email, and password." };
      }

      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
      const newUser = cred.user;

      let profile = await fetchProfileForUser(newUser);
      if (!profile) {
        const newMember = {
          uid: newUser.uid,
          name: trimmedName,
          email: trimmedEmail,
          loginEmail: trimmedEmail,
          usn: "1DD" + Math.floor(100000 + Math.random() * 900000),
          semester: "1st Semester",
          branch: "Creative Technology",
          role: "member" as const,
          domain: "UI/UX",
          status: "active" as const,
          permissions: {
            reviewRequests: false,
            manageRequests: false,
            assignTodos: false,
            manageMembers: false,
            createEvents: false,
          },
          avatarUrl: "",
        };

        try {
          profile = await createMember(newMember, newUser.uid, trimmedName);
        } catch (mErr) {
          console.warn("Could not save member profile in Firestore on signup:", mErr);
          profile = { ...newMember, joinedAt: new Date().toISOString() };
        }
      }

      setUser(newUser);
      setMemberProfile(profile);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      let errorMsg = err.message || "Failed to create account. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        errorMsg = "An account with this email already exists. Please log in instead.";
      } else if (err.code === "auth/weak-password") {
        errorMsg = "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        errorMsg = "Please enter a valid email address.";
      }
      return { success: false, error: errorMsg };
    }
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;
      let profile = await fetchProfileForUser(googleUser);

      // Requirement 3: A new Google user can create an account with default role member
      if (!profile) {
        const newMember = {
          uid: googleUser.uid,
          name: googleUser.displayName || (googleUser.email ? googleUser.email.split("@")[0] : "Google Member"),
          email: googleUser.email || "",
          loginEmail: googleUser.email || "",
          usn: "1DD" + Math.floor(100000 + Math.random() * 900000),
          semester: "1st Semester",
          branch: "Creative Technology",
          role: "member" as const,
          domain: "UI/UX",
          status: "active" as const,
          permissions: {
            reviewRequests: false,
            manageRequests: false,
            assignTodos: false,
            manageMembers: false,
            createEvents: false,
          },
          avatarUrl: googleUser.photoURL || "",
        };

        try {
          profile = await createMember(newMember, googleUser.uid, newMember.name);
        } catch (mErr) {
          console.warn("Could not save Google user profile in Firestore:", mErr);
          profile = { ...newMember, joinedAt: new Date().toISOString() };
        }
      }

      if (profile.status === "disabled") {
        await signOut(auth);
        setLoading(false);
        return {
          success: false,
          error: "Your membership access is currently disabled by the club president. Access denied.",
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
            "Google Provider is not enabled yet in your Firebase Console. Go to Firebase Console -> Authentication -> Sign-in method -> Add Google.",
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
        errorMsg = "No user found with this email address.";
      } else if (err.code === "auth/invalid-email") {
        errorMsg = "Please enter a valid email address.";
      }
      return { success: false, error: errorMsg };
    }
  };

  const isPres = checkIsPresident(memberProfile);
  const isLead = (domain?: string) => checkIsDomainHead(memberProfile, domain);
  const canManageDom = (domain: string) => checkCanManageDomain(memberProfile, domain);
  const hasPerm = (perm: keyof MemberPermissions) => checkPermission(memberProfile, perm);

  return (
    <AuthContext.Provider
      value={{
        user,
        memberProfile,
        loading,
        isAdmin: isPres,
        isPresident: isPres,
        isDomainHead: isLead,
        canManageDomain: canManageDom,
        hasPermission: hasPerm,
        signInWithEmail,
        signUpWithEmail,
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
