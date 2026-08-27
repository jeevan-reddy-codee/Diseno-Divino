export type NotificationType =
  | "todo"
  | "event"
  | "event_completed"
  | "request"
  | "system"
  | "member";

export interface AppNotification {
  id: string;
  recipientUid: string; // Firebase UID
  title?: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  readAt?: string;
  link?: string;
}
