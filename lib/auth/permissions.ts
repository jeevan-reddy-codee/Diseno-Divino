import { Member, MemberPermissions } from "@/types/member";

/**
 * Check if the member is the President (global administrator)
 */
export function isPresident(member: Member | null | undefined): boolean {
  if (!member) return false;
  if (member.status !== "active") return false;
  return member.role === "president" || member.role === "admin";
}

/**
 * Backwards compatibility alias for President check
 */
export function canAccessAdmin(member: Member | null | undefined): boolean {
  return isPresident(member);
}

export function canAccessPresident(member: Member | null | undefined): boolean {
  return isPresident(member);
}

/**
 * Check if the member is a Domain Head / Team Lead
 */
export function isDomainHead(
  member: Member | null | undefined,
  domain?: string
): boolean {
  if (!member) return false;
  if (member.status !== "active") return false;
  if (isPresident(member)) return true;
  if (member.role !== "lead") return false;
  if (!domain || domain === "All") return true;

  const leadDomains = member.leadDomains || [member.domain];
  return leadDomains.some(
    (d) => d.toLowerCase().trim() === domain.toLowerCase().trim()
  );
}

/**
 * Check if the member has permission to manage a specific domain
 */
export function canManageDomain(
  member: Member | null | undefined,
  domain: string
): boolean {
  if (!member) return false;
  if (member.status !== "active") return false;
  if (isPresident(member)) return true;
  return isDomainHead(member, domain);
}

/**
 * Check general permissions
 */
export function hasPermission(
  member: Member | null | undefined,
  permission: keyof MemberPermissions
): boolean {
  if (!member) return false;
  if (member.status !== "active") return false;
  if (isPresident(member)) return true;
  return !!member.permissions?.[permission];
}

/**
 * Check if member can manage applicant requests
 */
export function canManageRequests(
  member: Member | null | undefined,
  domain?: string
): boolean {
  if (!member) return false;
  if (isPresident(member)) return true;
  if (isDomainHead(member, domain)) return true;
  return hasPermission(member, "manageRequests") || hasPermission(member, "reviewRequests");
}

export function canAssignTodos(member: Member | null | undefined): boolean {
  if (isPresident(member)) return true;
  if (isDomainHead(member)) return true;
  return hasPermission(member, "assignTodos");
}

export function canManageMembers(
  member: Member | null | undefined,
  domain?: string
): boolean {
  if (isPresident(member)) return true;
  if (isDomainHead(member, domain)) return true;
  return hasPermission(member, "manageMembers");
}

export function canCreateEvents(
  member: Member | null | undefined,
  domain?: string
): boolean {
  if (isPresident(member)) return true;
  if (isDomainHead(member, domain)) return true;
  return hasPermission(member, "createEvents");
}
