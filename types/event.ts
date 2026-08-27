export type EventStatus = "active" | "completed";

export interface ClubEvent {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  location?: string;
  category?: string;
  status: EventStatus;
  createdAt: string;
  createdBy?: string;
  rsvpCount?: number;
  rsvpUids?: string[];
  bannerUrl?: string;
}
