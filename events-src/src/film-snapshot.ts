import type { EventRecord } from "./types";

export const filmSnapshotMeta = {
  scrapedAt: "2026-08-12T18:35:00+02:00",
  sources: {
    hartlooper: { status: "Healthy", records: 3 },
    springhaver: { status: "Healthy", records: 2 },
    slachtstraat: { status: "Healthy", records: 2 },
    "kinepolis-utrecht": { status: "Warning", records: 0 },
    "nvpi-premieres": { status: "Healthy", records: 1 },
  },
} as const;

const source = (id: string, name: string, url: string) => ({ id, name, url, firstSeenAt: "2026-08-12" });

export const scrapedFilmEvents: EventRecord[] = [
  {
    id: "cabaret-open-air-2026", title: "Openluchtvertoning: Cabaret (1972)", shortDescription: "A free one-night open-air screening overlooking the Dom, presented by Utrecht's three independent film theatres.",
    startAt: "2026-08-14T21:00:00+02:00", venueName: "Stadhuisplein", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 0.6,
    primaryCategory: "Film", tags: ["film", "rare", "one-night", "open-air", "classic", "free"], priceLabel: "Free", isFree: true, relevance: 88, rarity: 92, preparation: 55, urgency: 86,
    whyRelevant: "A temporary outdoor cinema event from Louis Hartlooper Complex, Springhaver and Slachtstraat.", whyNow: "The official programme confirms one screening on 14 August at 21:00; capacity is limited.", recommendedAction: "Arrive early or bring your own seat", state: "unseen", discoveredAt: "2026-08-12", accent: "navy",
    sources: [source("hartlooper", "Louis Hartlooper Complex — official open-air programme", "https://hartlooper.nl/openluchtvertoning/")], milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-12"
  },
  {
    id: "nt-live-the-audience-2026", title: "NT Live 2026: The Audience", shortDescription: "Helen Mirren returns as Queen Elizabeth II in the filmed National Theatre production, shown for two days only.",
    startAt: "2026-08-15T00:00:00+02:00", endAt: "2026-08-16T23:59:00+02:00", venueName: "Springhaver", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 0.8,
    primaryCategory: "Film", tags: ["film", "rare", "two-day", "theatre", "special"], priceLabel: "See programme", isFree: false, relevance: 77, rarity: 89, preparation: 42, urgency: 78,
    whyRelevant: "A limited two-day cinema presentation rather than a regular theatrical run.", whyNow: "The official Springhaver page lists screenings on 15 and 16 August only.", recommendedAction: "Open the official page for screening times", state: "unseen", discoveredAt: "2026-08-12", accent: "plum",
    sources: [source("springhaver", "Springhaver — official NT Live page", "https://springhaver.nl/uitgelicht/nt-live-2026-the-audience/")], milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-12"
  },
  {
    id: "teenage-miasma-preview-2026", title: "Voorpremière: Teenage Sex And Death At Camp Miasma", shortDescription: "A one-off advance screening of Jane Schoenbrun's queer slasher before its wider Dutch release.",
    startAt: "2026-08-18T00:00:00+02:00", venueName: "Louis Hartlooper Complex", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 1.4,
    primaryCategory: "Film", tags: ["film", "preview", "horror", "rare", "one-night"], priceLabel: "See programme", isFree: false, relevance: 83, rarity: 91, preparation: 46, urgency: 81,
    whyRelevant: "An Utrecht pre-release screening of a film that opens nationally later.", whyNow: "The official LHC programme lists the preview on Tuesday 18 August.", recommendedAction: "Check the official screening time and tickets", state: "unseen", discoveredAt: "2026-08-12", accent: "red",
    sources: [source("hartlooper", "Louis Hartlooper Complex — official programme", "https://hartlooper.nl/")], milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-12"
  },
  {
    id: "mamaku-qa-2026", title: "Mama’ku – van Jakarta tot de Molukken + Q&A", shortDescription: "A special documentary screening with a filmmaker Q&A, accompanied by the short film Sudah.",
    startAt: "2026-08-18T00:00:00+02:00", venueName: "Slachtstraat Filmtheater", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 0.5,
    primaryCategory: "Film", tags: ["film", "documentary", "q-and-a", "one-night", "rare"], priceLabel: "See programme", isFree: false, relevance: 79, rarity: 90, preparation: 40, urgency: 79,
    whyRelevant: "A one-night documentary event with the filmmakers present.", whyNow: "Slachtstraat's official programme lists this special for Tuesday 18 August.", recommendedAction: "Check tickets and the confirmed start time", state: "unseen", discoveredAt: "2026-08-12", accent: "ochre",
    sources: [source("slachtstraat", "Slachtstraat — official programme", "https://slachtstraat.nl/")], milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-12"
  },
  {
    id: "bioscoop-10-daagse-2026", title: "Bioscoop 10-Daagse 2026", shortDescription: "A nationwide ten-day cinema campaign spanning blockbusters, Dutch premieres, documentaries and arthouse films at more than 150 venues.",
    startAt: "2026-09-18T00:00:00+02:00", endAt: "2026-09-27T23:59:00+02:00", venueName: "Participating cinemas and film theatres", city: "Netherlands", region: "Nationwide", country: "Netherlands", distanceKm: 0,
    primaryCategory: "Film", tags: ["film", "nationwide", "premieres", "popular", "temporary"], priceLabel: "Programme dependent", isFree: false, relevance: 76, rarity: 70, preparation: 35, urgency: 42,
    whyRelevant: "A concentrated national window for major releases, Dutch premieres and special cinema programming.", whyNow: "NVPI confirms the campaign dates and more than 150 participating venues.", recommendedAction: "Watch for the participating programme and ticket releases", state: "unseen", discoveredAt: "2026-08-12", accent: "blue",
    sources: [source("nvpi-premieres", "NVPI — official Bioscoop 10-Daagse announcement", "https://www.nvpi.nl/film//nieuws/7321/nederland-beleeft-film-samen-tijdens-de-bioscoop-10-daagse-2026")], milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-12"
  }
];
