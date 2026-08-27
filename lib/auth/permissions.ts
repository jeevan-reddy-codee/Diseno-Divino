import { Member, MemberPermissions } from "@/types/member";

export function hasPermission(
  member: Member | null | undefined,
  permission: keyof MemberPermissions
): boolean {
  if (!member) return false;
  if (member.status !== "active") return false;
  if (member.role === "admin") return true;
  return !!member.permissions?.[permission];
}

export function canAccessAdmin(member: Member | null | undefined): boolean {
  if (!member) return false;
  return member.role === "admin" && member.status === "active";
}

export function canManageRequests(member: Member | null | undefined): boolean {
  return hasPermission(member, "manageRequests") || hasPermission(member, "reviewRequests");
}

export function canAssignTodos(member: Member | null | undefined): boolean {
  return hasPermission(member, "assignTodos");
}

export function canManageMembers(member: Member | null | undefined): boolean {
  return hasPermission(member, "manageMembers");
}

export function canCreateEvents(member: Member | null | undefined): boolean {
  return hasPermission(member, "createEvents");
}
