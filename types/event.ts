export type EventStatus = "active" | "completed";

export interface ClubEvent {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  location?: string;
  category?: string;
  domain?: string; // Associated domain for Domain Head scoping
  status: EventStatus;
  createdAt: string;
  createdBy?: string;
  registeredCount?: number;
  attendeeUids?: string[];
  // Legacy aliases
  rsvpCount?: number;
  rsvpUids?: string[];
  bannerUrl?: string;
}
