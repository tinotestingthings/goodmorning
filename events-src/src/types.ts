export type EventState = "unseen" | "seen" | "saved" | "planned" | "booked" | "attended" | "dismissed";
export type View = "discover" | "inbox" | "festivals" | "saved" | "actions" | "timeline" | "sources" | "archive" | "settings";

export type Milestone = { id: string; type: string; title: string; occursAt: string; completed?: boolean };
export type EventChange = { id: string; label: string; detail: string; detectedAt: string; importance: "low" | "medium" | "high" };
export type SourceRef = { id: string; name: string; firstSeenAt: string; url?: string };
export type ScheduledAction = { id: string; title: string; detail: string; occursAt: string; recurrence?: string; category: string };

export type EventRecord = {
  id: string;
  title: string;
  shortDescription: string;
  startAt: string;
  endAt?: string;
  venueName: string;
  city: string;
  region: string;
  country: string;
  latitude?: number;
  longitude?: number;
  distanceKm: number;
  primaryCategory: string;
  tags: string[];
  priceLabel: string;
  isFree: boolean;
  relevance: number;
  rarity: number;
  preparation: number;
  urgency: number;
  whyRelevant: string;
  whyNow?: string;
  recommendedAction: string;
  state: EventState;
  discoveredAt: string;
  accent: string;
  sources: SourceRef[];
  milestones: Milestone[];
  changes: EventChange[];
  dateStatus: "verified" | "manual";
  dateVerifiedAt?: string;
  notes?: string;
};

export type SourceRecord = {
  id: string; name: string; url: string; type: string; scope: string; enabled: boolean; health: "Healthy" | "Warning" | "Paused";
  lastScan: string; events: number; newEvents: number; duplicates: number; saves: number; saveRate: number; leadTime: number; earliest: number;
};
