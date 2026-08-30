import { Member } from "@/types/member";
import { isPresident, isDomainHead } from "./permissions";

export function isRouteAllowed(
  pathname: string,
  member: Member | null | undefined
): { allowed: boolean; redirectUrl?: string } {
  // Public routes accessible to everyone
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/rsvp"
  ) {
    return { allowed: true };
  }

  // If not logged in or no member profile
  if (!member) {
    return { allowed: false, redirectUrl: `/login?redirect=${encodeURIComponent(pathname)}` };
  }

  // Disabled member access blocked
  if (member.status === "disabled") {
    return { allowed: false, redirectUrl: "/login?error=disabled" };
  }

  // President Control Center route check
  if (pathname.startsWith("/admin")) {
    if (!isPresident(member)) {
      return { allowed: false, redirectUrl: "/dashboard" };
    }
  }

  // Applicant pipeline / request management route check
  if (pathname.startsWith("/dashboard/requests")) {
    if (!isPresident(member) && !isDomainHead(member)) {
      return { allowed: false, redirectUrl: "/dashboard" };
    }
  }

  return { allowed: true };
}
