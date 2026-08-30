export type MemberRole = "president" | "lead" | "member" | "admin";
export type MemberStatus = "active" | "disabled";

export interface MemberPermissions {
  reviewRequests: boolean;
  manageRequests: boolean;
  assignTodos: boolean;
  manageMembers: boolean;
  createEvents: boolean;
}

export interface Member {
  uid: string;
  name: string;
  email: string;
  loginEmail?: string;
  usn: string;
  semester: string;
  branch: string;
  domain: string;
  leadDomains?: string[]; // Domains this team lead / domain head manages
  designation?: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string;
  permissions: MemberPermissions;
  avatarUrl?: string;
  bio?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
}
