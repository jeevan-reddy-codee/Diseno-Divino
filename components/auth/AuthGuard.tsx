"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase/authContext";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requiredPermission?: "reviewRequests" | "manageRequests" | "assignTodos" | "manageMembers" | "createEvents";
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAdmin = false,
  requiredPermission,
}) => {
  const { user, memberProfile, loading, isAdmin, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!memberProfile) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (memberProfile.status === "disabled") {
      router.push("/login?error=disabled");
      return;
    }

    if (requireAdmin && !isAdmin) {
      router.push("/dashboard");
      return;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      router.push("/dashboard");
      return;
    }
  }, [loading, memberProfile, isAdmin, requireAdmin, requiredPermission, router, pathname, hasPermission]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4"></div>
        <p className="font-headline-md text-xl text-[#dde4e2]">Authenticating with Diseño Divino...</p>
        <p className="font-body-md text-sm text-[#bbcac7] mt-1">Verifying membership status & permissions</p>
      </div>
    );
  }

  if (!memberProfile || memberProfile.status === "disabled") {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  return <>{children}</>;
};
