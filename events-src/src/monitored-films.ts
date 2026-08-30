import type { EventChange, EventRecord } from "./types";

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
  discoveredAt?: string;
  changes?: EventChange[];
  officialSources: { id: string; name: string; url: string }[];
  checks?: { id: string; title: string; occursAt: string }[];
};

// Add future films here. Their event card, source links, action checks and
// Film Intelligence monitoring summary are derived automatically.
export const monitoredFilms: MonitoredFilm[] = [
  {
    id: "dune-part-three-2026",
    title: "Dune: Part Three",
    releaseAt: "2026-12-16T00:00:00+01:00",
    releaseScope: "Dutch cinema release 16 December 2026; US/Canada 18 December",
    description: "Denis Villeneuve's conclusion to the Dune trilogy, based on Frank Herbert's Dune Messiah, is being monitored for Dutch release changes, premium-format screenings and ticket sales.",
    whyRelevant: "A major blockbuster and the conclusion of Denis Villeneuve's Dune trilogy.",
    monitoringReason: "The Netherlands release of 16 December 2026 still stands (two days ahead of the 18 December US/Canada date). In the US a third round of tickets went on sale on 18 August \u2014 opening-weekend IMAX 70mm, Dolby and other premium large-format screens, plus sneak-peek fan screenings \u2014 so the premium-format wave has begun; regular pre-sales follow closer to release. Dutch showtimes and ticket-sale dates are still not open and remain under active monitoring.",
    monitoringSignals: ["Dutch release changes", "Ticket sales", "IMAX and premium formats"],
    tags: ["film", "blockbuster", "dune", "imax", "ticketed", "monitored"],
    accent: "ochre",
    verifiedAt: "2026-08-30",
    discoveredAt: "2026-08-13",
    changes: [
      { id: "dune-3-premium-presale-2026-08-30", label: "US premium-format pre-sales opened \u2014 IMAX 70mm, Dolby, fan screenings", detail: "On 18 August Warner Bros. released a third round of opening-weekend tickets in the US: IMAX 70mm plus other premium large-format screens (Dolby) and sneak-peek fan screenings, with regular screenings to follow closer to release. Dutch pre-sales have not opened yet, but the premium-format wave usually reaches NL cinemas within weeks.", detectedAt: "2026-08-30", importance: "medium" },
      { id: "dune-3-nl-release-date-2026-08-23", label: "Dutch release date confirmed \u2014 16 December 2026", detail: "Dutch cinema listings (Filmladder, BiosAgenda) now state a Netherlands premiere of 16-12-2026, two days before the 18 December US/Canada release. The catalogue previously carried the 18 December date with the Dutch programme marked TBA.", detectedAt: "2026-08-23", importance: "high" },
    ],
    officialSources: [
      { id: "legendary-dune-3", name: "Legendary — official Dune: Part Three page", url: "https://www.legendary.com/film/dune-part-three/" },
      { id: "imax-dune-3", name: "IMAX — official Dune: Part Three page", url: "https://www.imax.com/movie/dune-part-three" },
      { id: "dune-insider", name: "Dune: Part Three — official ticket/insider page", url: "https://www.dunemovie.com/insider/" },
    ],
    checks: [
      { id: "dune-3-nl-ticket-watch", title: "Check Dutch ticket sales and premium-format screenings", occursAt: "2026-09-15T09:00:00+02:00" },
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
  discoveredAt: film.discoveredAt ?? film.verifiedAt,
  accent: film.accent,
  sources: film.officialSources.map((source) => ({ ...source, firstSeenAt: film.discoveredAt ?? film.verifiedAt })),
  milestones: (film.checks ?? []).map((check) => ({ ...check, type: "monitor" })),
  changes: film.changes ?? [],
  dateStatus: "verified",
  dateVerifiedAt: film.verifiedAt,
}));
