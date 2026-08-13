import type { EventRecord } from "./types";

export type MonitoredFilm = {
  id: string;
  title: string;
  releaseAt: string;
  releaseScope: string;
  description: string;
  whyRelevant: string;
  monitoringReason: string;
  monitoringSignals: string[];
  tags: string[];
  accent: string;
  verifiedAt: string;
  officialSources: { id: string; name: string; url: string }[];
  checks?: { id: string; title: string; occursAt: string }[];
};

// Add future films here. Their event card, source links, action checks and
// Film Intelligence monitoring summary are derived automatically.
export const monitoredFilms: MonitoredFilm[] = [
  {
    id: "dune-part-three-2026",
    title: "Dune: Part Three",
    releaseAt: "2026-12-18T00:00:00+01:00",
    releaseScope: "Original worldwide release; Dutch programme TBA",
    description: "Denis Villeneuve's conclusion to the Dune trilogy, based on Frank Herbert's Dune Messiah, is being monitored for Dutch release changes, premium-format screenings and ticket sales.",
    whyRelevant: "A major blockbuster and the conclusion of Denis Villeneuve's Dune trilogy.",
    monitoringReason: "Legendary and IMAX confirm an original release on 18 December 2026. Dutch showtimes and ticket-sale dates may differ and remain under active monitoring.",
    monitoringSignals: ["Dutch release changes", "Ticket sales", "IMAX and premium formats"],
    tags: ["film", "blockbuster", "dune", "imax", "ticketed", "monitored"],
    accent: "ochre",
    verifiedAt: "2026-08-13",
    officialSources: [
      { id: "legendary-dune-3", name: "Legendary — official Dune: Part Three page", url: "https://www.legendary.com/film/dune-part-three/" },
      { id: "imax-dune-3", name: "IMAX — official Dune: Part Three page", url: "https://www.imax.com/movie/dune-part-three" },
    ],
    checks: [
      { id: "dune-3-nl-ticket-watch", title: "Check Dutch ticket sales and premium-format screenings", occursAt: "2026-09-01T09:00:00+02:00" },
    ],
  },
];

export const monitoredFilmEvents: EventRecord[] = monitoredFilms.map((film) => ({
  id: film.id,
  title: film.title,
  shortDescription: film.description,
  startAt: film.releaseAt,
  venueName: "Dutch cinemas — programme TBA",
  city: "Netherlands",
  region: "Nationwide",
  country: "Netherlands",
  distanceKm: 0,
  primaryCategory: "Film",
  tags: film.tags,
  priceLabel: "Tickets TBA",
  isFree: false,
  relevance: 98,
  rarity: 72,
  preparation: 75,
  urgency: 64,
  whyRelevant: film.whyRelevant,
  whyNow: film.monitoringReason,
  recommendedAction: film.checks?.[0]?.title ?? "Watch official sources for release and ticket updates",
  state: "saved",
  discoveredAt: film.verifiedAt,
  accent: film.accent,
  sources: film.officialSources.map((source) => ({ ...source, firstSeenAt: film.verifiedAt })),
  milestones: (film.checks ?? []).map((check) => ({ ...check, type: "monitor" })),
  changes: [],
  dateStatus: "verified",
  dateVerifiedAt: film.verifiedAt,
}));
