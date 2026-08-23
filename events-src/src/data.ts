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
  nff: "https://www.filmfestival.nl/festival",
  bockbierUtrecht: "https://bockbier-festival.nl/",
  pintBockbier: "https://www.pintbockbierfestival.nl/",
  gaudeamus: "https://gaudeamus.nl/",
  smartlappen: "https://smartlappenfestival.nl/",
  iamsterdam: "https://www.iamsterdam.com/uit/agenda",
  ade: "https://www.amsterdam-dance-event.nl/",
  idfa: "https://festival.idfa.nl/",
  museumnacht: "https://museumnacht.amsterdam/",
  lightfestival: "https://amsterdamlightfestival.com/",
  festivalinfo: "https://www.festivalinfo.nl/",
  hollandsewaterlinies: "https://www.hollandsewaterlinies.nl/nl/dit-kun-je-doen/activiteiten/fortenfestival",
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
    id: "honthorst-retrospective-2026", title: "Gerard van Honthorst — In alles anders dan Rembrandt", shortDescription: "The first-ever major retrospective on Golden Age painter Gerard van Honthorst, in his home city, with loans from the Louvre, the Royal Collection and Galleria Borghese.",
    startAt: "2026-04-25T00:00:00+02:00", endAt: "2026-09-13T23:59:00+02:00", venueName: "Centraal Museum — De Stallen", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 1.5,
    primaryCategory: "Culture", tags: ["culture", "museum", "art", "exhibition", "last-chance"], priceLabel: "Museum admission", isFree: false, relevance: 82, rarity: 88, preparation: 20, urgency: 90,
    whyRelevant: "Centraal Museum presents the first major retrospective ever devoted to Gerard van Honthorst (1592–1656), who was born, married and died in Utrecht.", whyNow: "The exhibition closes 13 September 2026 — about a month away.", recommendedAction: "Book a museum ticket before it closes", state: "unseen", discoveredAt: "2026-08-13", accent: "rose",
    sources: [src("museum", "Centraal Museum — official exhibition page", "2026-08-13", "https://www.centraalmuseum.nl/en/now/exhibitions/gerard-van-honthorst-different-to-rembrandt")],
    milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-13"
  },
  {
    id: "lunar-eclipse-2026-08-28", title: "Partial Lunar Eclipse at dawn \u2014 visible from Utrecht", shortDescription: "A deep partial lunar eclipse (magnitude 0.93) in the early morning of 28 August; from the Netherlands almost the whole run is visible low in the west before the Moon sets.",
    startAt: "2026-08-28T04:33:00+02:00", endAt: "2026-08-28T06:13:00+02:00", venueName: "Western horizon before sunrise", city: "Utrecht", region: "Utrecht", country: "Netherlands", latitude: 52.0907, longitude: 5.1214, distanceKm: 0,
    primaryCategory: "Astronomy", tags: ["astronomy", "eclipse", "rare", "free", "dawn"], priceLabel: "Free", isFree: true, relevance: 88, rarity: 84, preparation: 28, urgency: 95,
    whyRelevant: "The second eclipse visible from Utrecht in a fortnight \u2014 and unlike the solar one, a lunar eclipse needs no filters, just a clear view low to the west.", whyNow: "The umbral phase starts around 04:33 and greatest eclipse is at about 06:12 CEST, with 93% of the Moon in Earth's shadow; the Moon sets around that moment from the Netherlands, so the ending is cut off.", recommendedAction: "Check the local timings and find a spot with a clear western horizon", state: "unseen", discoveredAt: "2026-08-21", accent: "violet",
    sources: [src("timeanddate-lunar-2026", "Time and Date \u2014 28 August 2026 lunar eclipse in the Netherlands", "2026-08-21", "https://www.timeanddate.com/eclipse/in/netherlands?iso=20260828"), src("natgeo-nl-2026", "National Geographic NL \u2014 sky events of 2026", "2026-08-21", "https://www.nationalgeographic.nl/natuur-leefomgeving/a69698625/spectaculairste-hemelverschijnselen-2026")],
    milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-21"
  },
  {
    id: "graffiti-centraal-museum-2026", title: "Graffiti \u2014 Centraal Museum", shortDescription: "A 1,000 m\u00b2 survey of graffiti as an artistic force, with more than 120 works by Basquiat, Keith Haring, Rammellzee, Jenny Holzer and Klara Lid\u00e9n.",
    startAt: "2026-10-10T00:00:00+02:00", endAt: "2027-03-29T23:59:00+02:00", venueName: "Centraal Museum \u2014 De Stallen", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 1.5,
    primaryCategory: "Culture", tags: ["culture", "museum", "art", "exhibition", "graffiti"], priceLabel: "Museum admission", isFree: false, relevance: 84, rarity: 87, preparation: 24, urgency: 58,
    whyRelevant: "The successor to the Honthorst show in De Stallen, and a very different thing: seventy years of artistic development seen through the spray can, from New York writers to Basquiat, Haring and Lawrence Weiner. An initiative of Museion (Bolzano), co-produced with Centraal Museum, partly assembled with the Dutch Graffiti Library and Mick La Rock.", whyNow: "The official museum page confirms 10 October 2026 \u2013 29 March 2027 in De Stallen. It runs long, so there is no rush \u2014 but the museum's own Keith Haring canvas and the two Rammellzee diptychs from the Wildenberg Collection are rarely shown.", recommendedAction: "Note the opening and plan a visit once it has settled", state: "unseen", discoveredAt: "2026-08-23", accent: "coral",
    sources: [src("museum", "Centraal Museum \u2014 official Graffiti exhibition page", "2026-08-23", "https://www.centraalmuseum.nl/nl/nu-te-zien/tentoonstellingen/graffiti")],
    milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-23"
  },
  {
    id: "kerstsupermaan-2026", title: "Christmas Eve supermoon \u2014 closest full Moon of 2026", shortDescription: "The largest and closest supermoon of the year rises on Christmas Eve; the last time a full Moon fell on 24 December was 1996.",
    startAt: "2026-12-24T00:00:00+01:00", venueName: "Eastern sky after moonrise", city: "Utrecht", region: "Utrecht", country: "Netherlands", latitude: 52.0907, longitude: 5.1214, distanceKm: 0,
    primaryCategory: "Astronomy", tags: ["astronomy", "moon", "rare", "free", "winter"], priceLabel: "Free", isFree: true, relevance: 83, rarity: 86, preparation: 18, urgency: 46,
    whyRelevant: "The third eye-level sky event of the year after the August solar and lunar eclipses, and the only one that needs nothing at all \u2014 no filters, no travel, no ticket. A full Moon on 24 December is a once-in-a-generation coincidence: the previous one was thirty years ago.", whyNow: "The \u2018cold moon\u2019 rises early and looks outsized low on the horizon. Later that night Jupiter and Mars sit just below it in the east, with Saturn in the west after sunset \u2014 a busy sky for the last week of December.", recommendedAction: "Put it in the calendar and find a clear eastern horizon", state: "unseen", discoveredAt: "2026-08-23", accent: "cyan",
    sources: [src("natgeo-nl-2026", "National Geographic NL \u2014 sky events of 2026", "2026-08-23", "https://www.nationalgeographic.nl/natuur-leefomgeving/a69698625/spectaculairste-hemelverschijnselen-2026")],
    milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-23"
  },
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
  { id: "iamsterdam", name: "I amsterdam uitagenda", url: sourceUrls.iamsterdam, type: "Calendar", scope: "Amsterdam region", enabled: true, health: "Healthy", lastScan: "today", events: 8, newEvents: 8, duplicates: 0, saves: 0, saveRate: 0, leadTime: 62, earliest: 55 },
  { id: "festivalinfo", name: "Festivalinfo.nl", url: sourceUrls.festivalinfo, type: "Calendar", scope: "National festival calendar", enabled: true, health: "Healthy", lastScan: "today", events: 6, newEvents: 6, duplicates: 2, saves: 0, saveRate: 0, leadTime: 84, earliest: 70 },
];
