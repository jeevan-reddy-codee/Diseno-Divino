import { Member } from "@/types/member";
import { canAccessAdmin, hasPermission } from "./permissions";

export function isRouteAllowed(
  pathname: string,
  member: Member | null | undefined
): { allowed: boolean; redirectUrl?: string } {
  // Public routes
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/forgot-password"
  ) {
    return { allowed: true };
  }

  // Not logged in or no member profile
  if (!member) {
    return { allowed: false, redirectUrl: "/login" };
  }

  // Disabled member
  if (member.status === "disabled") {
    return { allowed: false, redirectUrl: "/login?error=disabled" };
  }

  // Admin route check
  if (pathname.startsWith("/admin")) {
    if (!canAccessAdmin(member)) {
      return { allowed: false, redirectUrl: "/dashboard" };
    }
  }

  return { allowed: true };
}
