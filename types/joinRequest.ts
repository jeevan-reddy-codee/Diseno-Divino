export type DomainType =
  | "UI/UX"
  | "Tech"
  | "Web Development"
  | "AI/ML"
  | "App Development"
  | "Graphics"
  | "Social Media"
  | "PR / Marketing & Sponsorship"
  | "Operations"
  | "General"
  | string;

export type RequestStatus = "pending" | "accepted" | "rejected" | "waitlisted";

export interface StatusHistoryEntry {
  status: RequestStatus;
  changedBy: string;
  changedByName?: string;
  changedAt: string;
  notes?: string;
}

export interface JoinRequest {
  id: string;
  name: string;
  email: string;
  semester: string;
  branch: string;
  usn: string;
  domain: DomainType;
  workLink: string;
  phone?: string;
  status: RequestStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  notes?: string;
  userId?: string;
  eventId?: string;
  eventName?: string;
  type?: "club_membership" | "event_registration";
  requirements?: string;
  statusHistory?: StatusHistoryEntry[];
}
