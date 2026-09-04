import type { EventRecord } from "./types";

export const filmSnapshotMeta = {
  scrapedAt: "2026-08-30T07:10:00+02:00",
  sources: {
    hartlooper: { status: "Healthy" },
    springhaver: { status: "Healthy" },
    slachtstraat: { status: "Healthy" },
    "kinepolis-utrecht": { status: "Warning" },
    "nvpi-premieres": { status: "Healthy" },
  },
} as const;

const source = (id: string, name: string, url: string, firstSeenAt = "2026-08-12") => ({ id, name, url, firstSeenAt });

export const scrapedFilmEvents: EventRecord[] = [
  {
    id: "bioscoop-10-daagse-2026", title: "Bioscoop 10-Daagse 2026", shortDescription: "A nationwide ten-day cinema campaign spanning blockbusters, Dutch premieres, documentaries and arthouse films at more than 150 venues.",
    startAt: "2026-09-18T00:00:00+02:00", endAt: "2026-09-27T23:59:00+02:00", venueName: "Participating cinemas and film theatres", city: "Netherlands", region: "Nationwide", country: "Netherlands", distanceKm: 0,
    primaryCategory: "Film", tags: ["film", "nationwide", "premieres", "popular", "temporary"], priceLabel: "Programme dependent", isFree: false, relevance: 76, rarity: 70, preparation: 35, urgency: 42,
    whyRelevant: "A concentrated national window for major releases, Dutch premieres and special cinema programming.", whyNow: "The campaign press release confirms the theme \u201cFilm beleef je samen\u201d and a national \u201cNeem iemand mee\u201d action from 21 to 24 September: buy one ticket and the second one is free, at more than 150 participating cinemas and film theatres.", recommendedAction: "Plan a visit inside the 21\u201324 September window and bring someone along on the free second ticket", state: "unseen", discoveredAt: "2026-08-12", accent: "blue",
    sources: [source("nvpi-premieres", "NVPI — official Bioscoop 10-Daagse announcement", "https://www.nvpi.nl/film//nieuws/7321/nederland-beleeft-film-samen-tijdens-de-bioscoop-10-daagse-2026"), source("nvpi-premieres", "Bioscoop 10-Daagse 2026 — sector press release (full text)", "https://disneyinfo.nl/persberichtendetail.php?id=12031", "2026-08-30")], milestones: [], changes: [{ id: "b10d-neem-iemand-mee-2026-08-30", label: "“Neem iemand mee” — free second ticket, 21–24 September", detail: "The sector press release for the 2026 edition sets the theme as “Film beleef je samen” and adds a national action window from 21 to 24 September in which every visitor gets a second cinema ticket free. The catalogue previously only carried the campaign dates and venue count.", detectedAt: "2026-08-30", importance: "medium" }], dateStatus: "verified", dateVerifiedAt: "2026-08-30"
  },
  {
    id: "louis-hartlooper-prijs-2026", title: "Uitreiking Louis Hartlooper Prijs 2026", shortDescription: "The annual award for the best Dutch film publication is handed out in LHC during the Nederlands Film Festival \u2014 free to attend, but only with a reserved ticket.",
    startAt: "2026-09-26T00:00:00+02:00", venueName: "Louis Hartlooper Complex", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 1.4,
    primaryCategory: "Film", tags: ["film", "award", "one-night", "free", "rare", "writing"], priceLabel: "Free (reservation required)", isFree: true, relevance: 81, rarity: 90, preparation: 35, urgency: 70,
    whyRelevant: "A one-evening ceremony about writing on film rather than film itself \u2014 six shortlisted publications, an independent jury drawn from the Dutch film guilds, and a lecture by last year's winner. Free, but ticketed.", whyNow: "The official LHC page confirms Saturday 26 September, inside the Nederlands Film Festival week; free tickets have to be reserved in advance and the room is small.", recommendedAction: "Reserve a free ticket before the ceremony fills up", state: "unseen", discoveredAt: "2026-08-21", accent: "plum",
    sources: [source("hartlooper", "Louis Hartlooper Complex \u2014 official Louis Hartlooper Prijs page", "https://hartlooper.nl/over-lhc/louis-hartlooper-prijs/", "2026-08-21")], milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-21"
  },
  {
    id: "de-manager-nagesprek-2026", title: "De Manager + Nagesprek", shortDescription: "Maartje Bakers' documentary on evaluation talks and modern management, introduced and discussed afterwards by NRC columnist Japke-d. Bouma.",
    startAt: "2026-09-04T19:00:00+02:00", venueName: "Louis Hartlooper Complex", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 1.4,
    primaryCategory: "Film", tags: ["film", "documentary", "nagesprek", "one-night", "rare", "work"], priceLabel: "See programme", isFree: false, relevance: 76, rarity: 87, preparation: 38, urgency: 84,
    whyRelevant: "A 71-minute Dutch documentary that films the conversations behind closed doors \u2014 performance reviews, feedback, the gap between authority and empathy \u2014 paired for one evening with the journalist who has made office language her subject.", whyNow: "The official LHC page lists a single screening: Friday 4 September, 19:00 in LHC 1, with Japke-d. Bouma introducing the film and taking questions from the room afterwards. There is no second date.", recommendedAction: "Book the 19:00 screening before the single evening sells out", state: "unseen", discoveredAt: "2026-08-30", accent: "forest",
    sources: [source("hartlooper", "Louis Hartlooper Complex \u2014 official De Manager page", "https://hartlooper.nl/films/de-manager/", "2026-08-30")], milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-30"
  },
];
