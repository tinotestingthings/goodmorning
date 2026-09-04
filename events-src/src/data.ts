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
  {
    id: "lustrumfestival-uu-2026", title: "Lustrumfestival UU & UMC Utrecht", shortDescription: "A two-day cultural festival in and around the city-centre University Library, marking the university's lustrum during Open Monumentendag weekend.",
    startAt: "2026-09-12T11:00:00+02:00", endAt: "2026-09-13T15:15:00+02:00", venueName: "Universiteitsbibliotheek Binnenstad, Drift 27", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 1,
    primaryCategory: "Culture", tags: ["culture", "festival", "lustrum", "heritage", "free"], priceLabel: "Free", isFree: true, relevance: 86, rarity: 88, preparation: 30, urgency: 82,
    whyRelevant: "The university's lustrum only comes round every five years, and this edition opens the historic library building and its courtyard for a cultural programme.", whyNow: "Free, and only from Saturday 11:00 to Sunday 15:15 - the same weekend as Open Monumentendag.", recommendedAction: "Check the programme and plan it with Open Monumentendag", state: "unseen", discoveredAt: "2026-09-04", accent: "ochre",
    sources: [src("uu", "Universiteit Utrecht - Lustrumfestival", "2026-09-04", "https://www.uu.nl/agenda/lustrumfestival"), src("uit", "UITagenda Utrecht - Lustrumfestival", "2026-09-04", "https://www.uitagendautrecht.nl/evenement/143233/lustrumfestival/")],
    milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-09-04"
  },
  {
    id: "buitenbioscoop-botanische-tuinen-2026", title: "Buitenbioscoop Botanische Tuinen", shortDescription: "Open-air cinema between the plants of the Utrecht Botanic Gardens on four late-summer evenings, part of the university's lustrum.",
    startAt: "2026-09-09T00:00:00+02:00", endAt: "2026-09-17T23:59:00+02:00", venueName: "Botanische Tuinen Utrecht", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 6,
    primaryCategory: "Film", tags: ["film", "outdoors", "lustrum", "ticketed"], priceLabel: "Ticketed", isFree: false, relevance: 82, rarity: 74, preparation: 35, urgency: 78,
    whyRelevant: "Watching a film on a blanket in the Botanic Gardens is a very different night out from a cinema seat.", whyNow: "Four evenings only: 9, 10, 16 and 17 September.", recommendedAction: "Pick an evening and book before it sells out", state: "unseen", discoveredAt: "2026-09-04", accent: "forest",
    sources: [src("uit", "UITagenda Utrecht - Buitenbioscoop Botanische Tuinen", "2026-09-04", "https://www.uitagendautrecht.nl/evenement/142778/buitenbioscoop-botanische-tuinen/")],
    milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-09-04"
  },
  {
    id: "annex-mathias-poledna-2026", title: "Annex: Mathias Poledna - last weeks", shortDescription: "The Centraal Museum's Annex presentation of work by Austrian artist Mathias Poledna closes on 13 September.",
    startAt: "2026-04-25T11:00:00+02:00", endAt: "2026-09-13T17:00:00+02:00", venueName: "Centraal Museum", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 2,
    primaryCategory: "Culture", tags: ["culture", "museum", "art", "exhibition", "last-chance"], priceLabel: "Museum admission", isFree: false, relevance: 78, rarity: 72, preparation: 20, urgency: 88,
    whyRelevant: "A short film-and-installation presentation in the museum's Annex space, on show for only a few more days.", whyNow: "Closes Sunday 13 September - the same day as the Honthorst retrospective.", recommendedAction: "Combine it with the Honthorst retrospective in one visit", state: "unseen", discoveredAt: "2026-09-04", accent: "rose",
    sources: [src("museum", "Centraal Museum - Annex: Mathias Poledna", "2026-09-04", "https://www.centraalmuseum.nl/nl/nu-te-zien/tentoonstellingen/annex-mathias-poledna")],
    milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-09-04"
  },
  {
    id: "godenschemering-frans-franciscus-2026", title: "Godenschemering - Frans Franciscus", shortDescription: "Centraal Museum solo show of painter Frans Franciscus, whose lush mythological scenes mix European and Asian imagery.",
    startAt: "2026-07-10T11:00:00+02:00", endAt: "2026-11-22T17:00:00+01:00", venueName: "Centraal Museum", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 2,
    primaryCategory: "Culture", tags: ["culture", "museum", "art", "exhibition"], priceLabel: "Museum admission", isFree: false, relevance: 76, rarity: 68, preparation: 20, urgency: 45,
    whyRelevant: "A full solo presentation of a painter you rarely see at this scale, ten minutes from home.", whyNow: "Runs until 22 November, so any quiet weekend works.", recommendedAction: "Keep it as a rainy-Sunday option", state: "unseen", discoveredAt: "2026-09-04", accent: "plum",
    sources: [src("museum", "Centraal Museum - Godenschemering", "2026-09-04", "https://www.centraalmuseum.nl/nl/nu-te-zien/tentoonstellingen/godenschemering-frans-franciscus")],
    milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-09-04"
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

// Bumped by the weekly catalog-refresh task; the Sources page shows it as the real scan date.
export const catalogueRefreshedAt = "2026-09-04";

export const sources: SourceRecord[] = [
  { id: "hartlooper", name: "Louis Hartlooper Complex", url: sourceUrls.hartlooper, type: "Film programme", scope: "Utrecht film house", enabled: true, health: filmSnapshotMeta.sources.hartlooper.status },
  { id: "springhaver", name: "Springhaver", url: sourceUrls.springhaver, type: "Film programme", scope: "Utrecht film house", enabled: true, health: filmSnapshotMeta.sources.springhaver.status },
  { id: "slachtstraat", name: "Slachtstraat Filmtheater", url: sourceUrls.slachtstraat, type: "Film programme", scope: "Utrecht film house", enabled: true, health: filmSnapshotMeta.sources.slachtstraat.status },
  { id: "kinepolis-utrecht", name: "Kinepolis Utrecht — Expected", url: sourceUrls.kinepolisUtrecht, type: "Coming soon", scope: "Utrecht blockbusters", enabled: true, health: filmSnapshotMeta.sources["kinepolis-utrecht"].status },
  { id: "nvpi-premieres", name: "NVPI bioscooppremières", url: sourceUrls.nvpiPremieres, type: "Release list", scope: "Netherlands premieres", enabled: true, health: filmSnapshotMeta.sources["nvpi-premieres"].status },
  { id: "gemeente", name: "Gemeente Utrecht", url: sourceUrls.gemeente, type: "Calendar", scope: "Utrecht city", enabled: true, health: "Healthy" },
  { id: "uit", name: "UITagenda Utrecht", url: sourceUrls.uit, type: "API", scope: "Utrecht region", enabled: true, health: "Healthy" },
  { id: "ontdek", name: "Ontdek Utrecht", url: sourceUrls.ontdek, type: "RSS", scope: "Utrecht province", enabled: true, health: "Healthy" },
  { id: "tivoli", name: "TivoliVredenburg", url: sourceUrls.tivoli, type: "API", scope: "Venue", enabled: true, health: "Healthy" },
  { id: "staatsbos", name: "Staatsbosbeheer", url: sourceUrls.staatsbos, type: "RSS", scope: "Central Netherlands", enabled: true, health: "Warning" },
  { id: "eventbrite", name: "Eventbrite Utrecht", url: sourceUrls.eventbrite, type: "API", scope: "25 km radius", enabled: false, health: "Paused" },
  { id: "iamsterdam", name: "I amsterdam uitagenda", url: sourceUrls.iamsterdam, type: "Calendar", scope: "Amsterdam region", enabled: true, health: "Healthy" },
  { id: "festivalinfo", name: "Festivalinfo.nl", url: sourceUrls.festivalinfo, type: "Calendar", scope: "National festival calendar", enabled: true, health: "Healthy" },
  { id: "museum", name: "Centraal Museum", url: sourceUrls.museum, type: "Museum programme", scope: "Utrecht exhibitions", enabled: true, health: "Healthy" },
  { id: "uu", name: "Universiteit Utrecht agenda", url: "https://www.uu.nl/agenda", type: "Calendar", scope: "University events, open days, lustrum", enabled: true, health: "Healthy" },
  { id: "festivals", name: "Festival calendar (official sites)", url: sourceUrls.festivalinfo, type: "Year calendar", scope: "Recurring festivals from src/festivals.ts", enabled: true, health: "Healthy" },
];
