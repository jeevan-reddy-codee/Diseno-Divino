export type DomainType =
  | "UI/UX"
  | "Tech"
  | "Graphics"
  | "Social Media"
  | "PR / Marketing & Sponsorship"
  | "Operations";

export type RequestStatus = "pending" | "accepted" | "rejected";

export interface JoinRequest {
  id: string;
  name: string;
  email: string;
  semester: string;
  branch: string;
  usn: string;
  domain: DomainType;
  workLink: string;
  status: RequestStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}
