export type ActivityAction =
  | "Application submitted"
  | "Application accepted"
  | "Application rejected"
  | "Member created"
  | "Member edited"
  | "Member disabled"
  | "To-Do assigned"
  | "To-Do completed"
  | "Event created"
  | "Event completed"
  | "Permission changed"
  | "Password reset requested";

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  performedBy: string; // Firebase UID or 'System' / 'Applicant'
  performedByName?: string;
  target?: string;
  details?: string;
  createdAt: string;
}
