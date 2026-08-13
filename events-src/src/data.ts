import type { EventRecord, ScheduledAction, SourceRecord } from "./types";
import { filmSnapshotMeta, scrapedFilmEvents } from "./film-snapshot";
import { monitoredFilmEvents } from "./monitored-films";

const sourceUrls: Record<string, string> = {
  uit: "https://www.uitagendautrecht.nl/",
  gemeente: "https://www.utrecht.nl/wonen-en-leven/vrije-tijd/evenementen",
  ontdek: "https://www.ontdek-utrecht.nl/",
  astro: "https://science.nasa.gov/eclipses/future-eclipses/",
  manual: "https://science.nasa.gov/eclipses/future-eclipses/",
  tivoli: "https://www.tivolivredenburg.nl/",
  podium: "https://www.podiuminfo.nl/",
  staatsbos: "https://www.staatsbosbeheer.nl/uit-in-de-natuur",
  museum: "https://www.centraalmuseum.nl/",
  rietveld: "https://www.rietveldschroderhuis.nl/",
  jaarbeurs: "https://www.jaarbeurs.nl/agenda",
  eventbrite: "https://www.eventbrite.nl/d/netherlands--utrecht/events/",
  dehaar: "https://www.kasteeldehaar.nl/",
  natuur: "https://www.natuurmonumenten.nl/activiteiten",
  hartlooper: "https://www.hartlooper.nl/",
  springhaver: "https://www.springhaver.nl/",
  slachtstraat: "https://slachtstraat.nl/",
  kinepolisUtrecht: "https://kinepolis.nl/kinepolis_movie_filter_coming/UTRE/",
  nvpiPremieres: "https://www.nvpi.nl/film/bioscooppremieres",
  nachtvandenacht: "https://nachtvandenacht.nl/",
  oudemuziek: "https://oudemuziek.nl/en/fomu26/",
};
const src = (id: string, name: string, firstSeenAt: string, url = sourceUrls[id]) => ({ id, name, firstSeenAt, url });

const core: EventRecord[] = [
  {
    id: "eclipse-2026-utrecht", title: "Solar Eclipse over Utrecht — Today", shortDescription: "A major partial solar eclipse is visible from Utrecht this evening, while totality crosses Greenland, Iceland and parts of Spain.",
    startAt: "2026-08-12T19:17:00+02:00", endAt: "2026-08-12T21:03:00+02:00", venueName: "Western sky", city: "Utrecht", region: "Utrecht", country: "Netherlands", latitude: 52.0907, longitude: 5.1214, distanceKm: 0,
    primaryCategory: "Astronomy", tags: ["astronomy", "rare", "today", "free"], priceLabel: "Free", isFree: true, relevance: 100, rarity: 98, preparation: 72, urgency: 100,
    whyRelevant: "This is happening today and will be visible as a deep partial eclipse from the Netherlands.", whyNow: "The eclipse runs from about 19:17 to 21:03, peaking around 20:10. Use certified eclipse glasses; ordinary sunglasses are not safe.", recommendedAction: "Check the weather and prepare certified eclipse glasses", state: "unseen", discoveredAt: "2026-08-12", accent: "violet",
    sources: [src("dutch-eclipse-2026", "Hemel.waarnemen.com — Benelux times", "2026-08-12", "https://hemel.waarnemen.com/zon/eclipsen/zonsverduistering_20260812.html"), src("nasa-2026", "NASA — 12 August 2026 eclipse", "2026-08-12", "https://science.nasa.gov/eclipses/future-eclipses/total-solar-eclipse-on-august-12-2026/")],
    milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-12"
  },
  {
    id: "de-parade-2026", title: "De Parade Utrecht", shortDescription: "The travelling theatre festival closes its 2026 tour in Utrecht, with performances and KinderParade in Moreelsepark.",
    startAt: "2026-08-14T18:00:00+02:00", endAt: "2026-08-30T22:00:00+02:00", venueName: "Moreelsepark", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 1.2,
    primaryCategory: "Culture", tags: ["culture", "festival", "theatre", "family"], priceLabel: "Programme dependent", isFree: false, relevance: 90, rarity: 76, preparation: 48, urgency: 78,
    whyRelevant: "A major travelling theatre festival in central Utrecht.", whyNow: "The Utrecht edition runs from 14 through 30 August 2026.", recommendedAction: "Open the official programme", state: "unseen", discoveredAt: "2026-08-12", accent: "coral",
    sources: [src("deparade", "De Parade — official dates", "2026-08-12", "https://deparade.nl/informatie/data-tijden-en-prijzen/")], milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-12"
  },
  {
    id: "open-monumenten", title: "Open Monumentendag Utrecht", shortDescription: "One day of normally inaccessible monuments and activities across the city.",
    startAt: "2026-09-12T10:00:00+02:00", endAt: "2026-09-12T17:00:00+02:00", venueName: "Across Utrecht", city: "Utrecht", region: "Utrecht", country: "Netherlands", latitude: 52.0907, longitude: 5.1214, distanceKm: 2.4,
    primaryCategory: "Culture", tags: ["architecture", "unusual-access", "free"], priceLabel: "Free", isFree: true, relevance: 94, rarity: 91, preparation: 68, urgency: 88,
    whyRelevant: "Normally inaccessible buildings open throughout Utrecht on Saturday 12 September.", whyNow: "The official programme confirms 10:00–17:00.", recommendedAction: "Open the official programme", state: "unseen", discoveredAt: "2026-08-11", accent: "ochre",
    sources: [src("omd-utrecht", "Open Monumentendag Utrecht — official", "2026-08-12", "https://www.openmonumentendag.nl/utrecht/praktische-informatie/")],
    milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-12"
  },
  {
    id: "eclipse-2027", title: "Total Solar Eclipse 2027", shortDescription: "A long-duration total eclipse crossing southern Spain and North Africa.",
    startAt: "2027-08-02T11:40:00+02:00", venueName: "Andalusia viewing corridor", city: "Cádiz", region: "Andalusia", country: "Spain", latitude: 36.5297, longitude: -6.292, distanceKm: 1880,
    primaryCategory: "Astronomy", tags: ["astronomy", "rare", "worth-travelling", "one-off"], priceLabel: "Travel", isFree: false, relevance: 91, rarity: 100, preparation: 98, urgency: 86,
    whyRelevant: "One of the century’s longest total eclipses, reachable from the Netherlands.", whyNow: "Accommodation in the path of totality is already becoming scarce a year ahead.", recommendedAction: "Shortlist refundable accommodation", state: "unseen", discoveredAt: "2026-01-10", accent: "violet",
    sources: [src("astro", "NASA eclipse calendar", "2025-11-18"), src("manual", "NASA — 2 August 2027 path", "2026-01-10", "https://eclipse.gsfc.nasa.gov/SEgoogle/SEgoogle2001/SE2027Aug02Tgoogle.html")],
    milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-12"
  },
  {
    id: "le-guess-who", title: "Le Guess Who? 2026", shortDescription: "Boundary-pushing music across venues, churches and hidden spaces throughout Utrecht.",
    startAt: "2026-11-05T18:00:00+01:00", endAt: "2026-11-08T23:30:00+01:00", venueName: "TivoliVredenburg + city venues", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 1.8,
    primaryCategory: "Music", tags: ["music", "festival", "ticketed"], priceLabel: "From €79", isFree: false, relevance: 89, rarity: 82, preparation: 78, urgency: 93,
    whyRelevant: "A strong match for experimental music and unusual venues.", whyNow: "Day tickets go on sale tomorrow; the Friday programme sold out last year.", recommendedAction: "Review the first lineup before ticket sale", state: "unseen", discoveredAt: "2026-08-12", accent: "coral",
    sources: [src("lgw", "Le Guess Who? — official", "2026-08-12", "https://leguesswho.com/lgw")],
    milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-12"
  },
  {
    id: "festival-oude-muziek-2026", title: "Festival Oude Muziek Utrecht 2026 — Giving Voice", shortDescription: "The world's largest early-music festival returns for its 45th edition — 300 concerts across 47 Utrecht venues over ten days, themed around the human voice.",
    startAt: "2026-08-28T00:00:00+02:00", endAt: "2026-09-06T23:59:00+02:00", venueName: "TivoliVredenburg + venues across Utrecht", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 1.5,
    primaryCategory: "Music", tags: ["music", "festival", "classical", "early-music", "ticketed"], priceLabel: "Programme dependent", isFree: false, relevance: 87, rarity: 80, preparation: 55, urgency: 88,
    whyRelevant: "The world's largest festival dedicated to Medieval, Renaissance and Baroque music, staged across Utrecht's most beautiful venues — churches, TivoliVredenburg and hidden rooms alike.", whyNow: "The 45th edition, themed ‘Giving Voice’, runs 28 August through 6 September 2026; the official concert guide and tickets are already live.", recommendedAction: "Browse the concert guide before popular concerts sell out", state: "unseen", discoveredAt: "2026-08-13", accent: "cyan",
    sources: [src("oudemuziek", "Festival Oude Muziek Utrecht — official", "2026-08-13")],
    milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-13"
  },
  {
    id: "honthorst-retrospective-2026", title: "Gerard van Honthorst — In alles anders dan Rembrandt", shortDescription: "The first-ever major retrospective on Golden Age painter Gerard van Honthorst, in his home city, with loans from the Louvre, the Royal Collection and Galleria Borghese.",
    startAt: "2026-04-25T00:00:00+02:00", endAt: "2026-09-13T23:59:00+02:00", venueName: "Centraal Museum — De Stallen", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 1.5,
    primaryCategory: "Culture", tags: ["culture", "museum", "art", "exhibition", "last-chance"], priceLabel: "Museum admission", isFree: false, relevance: 82, rarity: 88, preparation: 20, urgency: 90,
    whyRelevant: "Centraal Museum presents the first major retrospective ever devoted to Gerard van Honthorst (1592–1656), who was born, married and died in Utrecht.", whyNow: "The exhibition closes 13 September 2026 — about a month away.", recommendedAction: "Book a museum ticket before it closes", state: "unseen", discoveredAt: "2026-08-13", accent: "rose",
    sources: [src("museum", "Centraal Museum — official exhibition page", "2026-08-13", "https://www.centraalmuseum.nl/en/now/exhibitions/gerard-van-honthorst-different-to-rembrandt")],
    milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-13"
  },
  {
    id: "nacht-van-de-nacht-2026", title: "Nacht van de Nacht 2026 — Utrecht", shortDescription: "National dark-sky evening with dozens of local walks, stargazing evenings and lights-out actions across Utrecht province — Amersfoort, Houten, Maarssen, Rhenen, Soest, Utrecht, Vinkeveen and Wijk bij Duurstede.",
    startAt: "2026-10-24T00:00:00+02:00", venueName: "Locations across Utrecht province", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 3,
    primaryCategory: "Nature", tags: ["nature", "astronomy", "dark-sky", "free", "annual"], priceLabel: "Free", isFree: true, relevance: 78, rarity: 84, preparation: 35, urgency: 55,
    whyRelevant: "A nationwide dark-sky campaign against light pollution, with dozens of Utrecht-province activities — night walks, stargazing and lights-out events.", whyNow: "The 22nd edition is confirmed for Saturday 24 October 2026; the official activities finder lists local Utrecht programming.", recommendedAction: "Browse the activities finder closer to the date for a nearby walk or stargazing event", state: "unseen", discoveredAt: "2026-08-13", accent: "stone",
    sources: [src("nachtvandenacht", "Nacht van de Nacht — official", "2026-08-13")],
    milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-13"
  }
];

export const seedEvents = [...core, ...scrapedFilmEvents, ...monitoredFilmEvents];

export const scheduledActions: ScheduledAction[] = [
  {
    id: "annual-most-anticipated-films",
    title: "Add the year's most anticipated films",
    detail: "Review authoritative upcoming-film lists, verify release dates, and add the strongest premieres to monitoring.",
    occursAt: "2027-01-05T09:00:00+01:00",
    recurrence: "Every year on 5 January",
    category: "Film intelligence",
  },
];

export const sources: SourceRecord[] = [
  { id: "hartlooper", name: "Louis Hartlooper Complex", url: sourceUrls.hartlooper, type: "Film programme", scope: "Utrecht film house", enabled: true, health: filmSnapshotMeta.sources.hartlooper.status, lastScan: "today, 18:35", events: filmSnapshotMeta.sources.hartlooper.records, newEvents: filmSnapshotMeta.sources.hartlooper.records, duplicates: 1, saves: 0, saveRate: 0, leadTime: 8, earliest: 67 },
  { id: "springhaver", name: "Springhaver", url: sourceUrls.springhaver, type: "Film programme", scope: "Utrecht film house", enabled: true, health: filmSnapshotMeta.sources.springhaver.status, lastScan: "today, 18:35", events: filmSnapshotMeta.sources.springhaver.records, newEvents: filmSnapshotMeta.sources.springhaver.records, duplicates: 1, saves: 0, saveRate: 0, leadTime: 4, earliest: 50 },
  { id: "slachtstraat", name: "Slachtstraat Filmtheater", url: sourceUrls.slachtstraat, type: "Film programme", scope: "Utrecht film house", enabled: true, health: filmSnapshotMeta.sources.slachtstraat.status, lastScan: "today, 18:35", events: filmSnapshotMeta.sources.slachtstraat.records, newEvents: filmSnapshotMeta.sources.slachtstraat.records, duplicates: 1, saves: 0, saveRate: 0, leadTime: 4, earliest: 50 },
  { id: "kinepolis-utrecht", name: "Kinepolis Utrecht — Expected", url: sourceUrls.kinepolisUtrecht, type: "Coming soon", scope: "Utrecht blockbusters", enabled: true, health: filmSnapshotMeta.sources["kinepolis-utrecht"].status, lastScan: "today, 18:35", events: 0, newEvents: 0, duplicates: 0, saves: 0, saveRate: 0, leadTime: 0, earliest: 0 },
  { id: "nvpi-premieres", name: "NVPI bioscooppremières", url: sourceUrls.nvpiPremieres, type: "Release list", scope: "Netherlands premieres", enabled: true, health: filmSnapshotMeta.sources["nvpi-premieres"].status, lastScan: "today, 18:35", events: filmSnapshotMeta.sources["nvpi-premieres"].records, newEvents: filmSnapshotMeta.sources["nvpi-premieres"].records, duplicates: 0, saves: 0, saveRate: 0, leadTime: 37, earliest: 100 },
  { id: "gemeente", name: "Gemeente Utrecht", url: sourceUrls.gemeente, type: "Calendar", scope: "Utrecht city", enabled: true, health: "Healthy", lastScan: "12 min ago", events: 42, newEvents: 4, duplicates: 11, saves: 18, saveRate: 43, leadTime: 121, earliest: 63 },
  { id: "uit", name: "UITagenda Utrecht", url: sourceUrls.uit, type: "API", scope: "Utrecht region", enabled: true, health: "Healthy", lastScan: "18 min ago", events: 186, newEvents: 12, duplicates: 48, saves: 36, saveRate: 19, leadTime: 46, earliest: 34 },
  { id: "ontdek", name: "Ontdek Utrecht", url: sourceUrls.ontdek, type: "RSS", scope: "Utrecht province", enabled: true, health: "Healthy", lastScan: "1 hr ago", events: 94, newEvents: 6, duplicates: 27, saves: 22, saveRate: 23, leadTime: 58, earliest: 41 },
  { id: "tivoli", name: "TivoliVredenburg", url: sourceUrls.tivoli, type: "API", scope: "Venue", enabled: true, health: "Healthy", lastScan: "32 min ago", events: 73, newEvents: 5, duplicates: 19, saves: 21, saveRate: 29, leadTime: 109, earliest: 71 },
  { id: "staatsbos", name: "Staatsbosbeheer", url: sourceUrls.staatsbos, type: "RSS", scope: "Central Netherlands", enabled: true, health: "Warning", lastScan: "6 hr ago", events: 28, newEvents: 1, duplicates: 3, saves: 12, saveRate: 43, leadTime: 38, earliest: 57 },
  { id: "eventbrite", name: "Eventbrite Utrecht", url: sourceUrls.eventbrite, type: "API", scope: "25 km radius", enabled: false, health: "Paused", lastScan: "3 days ago", events: 211, newEvents: 0, duplicates: 81, saves: 17, saveRate: 8, leadTime: 31, earliest: 18 },
];
