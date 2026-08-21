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
  },
  {
    id: "nederlands-film-festival-2026", title: "Nederlands Film Festival 2026 \u2014 46e editie", shortDescription: "Eight days in which Utrecht becomes the Dutch film capital: premieres, the Gouden Kalveren, Storyspace VR/installations in Bibliotheek Neude, Focus talks and free open-air screenings in the city districts (NFFx030).",
    startAt: "2026-09-25T00:00:00+02:00", endAt: "2026-10-02T23:59:00+02:00", venueName: "Stadsschouwburg Utrecht + venues across the city", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 1.6,
    primaryCategory: "Film", tags: ["film", "festival", "premieres", "utrecht", "annual", "digital-culture"], priceLabel: "Programme dependent", isFree: false, relevance: 88, rarity: 78, preparation: 60, urgency: 84,
    whyRelevant: "The one week a year Utrecht is the centre of Dutch film \u2014 national premieres, the Gouden Kalf awards, and NFFx030 with immersive installations and free open-air screenings out in the neighbourhoods.", whyNow: "The 46th edition runs Friday 25 September through Friday 2 October 2026 and the voorverkoop has already opened, starting with opening film Downtown by Michiel van Erp.", recommendedAction: "Browse the programme and book the premieres before they sell out", state: "unseen", discoveredAt: "2026-08-16", accent: "forest",
    sources: [src("nff", "Nederlands Film Festival \u2014 official programme page", "2026-08-16")],
    milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-16"
  },
  {
    id: "gaudeamus-2026", title: "Gaudeamus Muziekweek 2026", shortDescription: "Fifty-plus concerts of brand-new and experimental music by the next generation of composers, across TivoliVredenburg and venues city-wide.",
    startAt: "2026-09-09T00:00:00+02:00", endAt: "2026-09-13T23:59:00+02:00", venueName: "TivoliVredenburg + city venues", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 1.5,
    primaryCategory: "Music", tags: ["music", "festival", "contemporary", "ticketed"], priceLabel: "Programme dependent", isFree: false, relevance: 80, rarity: 74, preparation: 40, urgency: 82,
    whyRelevant: "Utrecht's festival for new music \u2014 the experimental counterpart to the early-music festival it directly follows.", whyNow: "The 2026 edition runs 9\u201313 September, right after Festival Oude Muziek; the programme is live.", recommendedAction: "Browse the programme for a concert or two", state: "unseen", discoveredAt: "2026-08-21", accent: "cyan",
    sources: [src("gaudeamus", "Gaudeamus \u2014 official", "2026-08-21")], milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-21"
  },
  {
    id: "bockbier-festival-utrecht-2026", title: "Bockbier Festival Utrecht 2026", shortDescription: "Three days of 25+ bock beers, live music, DJs and BBQ on Janskerkhof \u2014 the city's autumn beer festival.",
    startAt: "2026-10-16T16:00:00+02:00", endAt: "2026-10-18T20:00:00+02:00", venueName: "Janskerkhof", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 1.0,
    primaryCategory: "Food & Drink", tags: ["beer", "festival", "food", "autumn"], priceLabel: "Entry + tokens", isFree: false, relevance: 84, rarity: 70, preparation: 25, urgency: 60,
    whyRelevant: "The Utrecht bock-beer festival, in the open air on Janskerkhof. Not to be confused with the PINT Bockbierfestival, which moved to Amsterdam.", whyNow: "Confirmed for 16\u201318 October 2026: Friday 16:00\u201324:00, Saturday 13:00\u201324:00, Sunday 13:00\u201320:00.", recommendedAction: "Pick a day and invite someone", state: "unseen", discoveredAt: "2026-08-21", accent: "ochre",
    sources: [src("bockbierUtrecht", "Bockbier Festival Utrecht \u2014 official", "2026-08-21")], milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-21"
  },
  {
    id: "pint-bockbierfestival-2026", title: "PINT Bockbierfestival 2026 (Amsterdam)", shortDescription: "The 44th edition of the classic PINT bock-beer festival \u2014 40+ bock beers \u2014 now at De Hallen Studio's in Amsterdam after moving from Utrecht.",
    startAt: "2026-10-02T00:00:00+02:00", endAt: "2026-10-03T23:59:00+02:00", venueName: "De Hallen Studio's", city: "Amsterdam", region: "Amsterdam", country: "Netherlands", distanceKm: 38,
    primaryCategory: "Food & Drink", tags: ["beer", "festival", "autumn"], priceLabel: "Entry + tokens", isFree: false, relevance: 78, rarity: 72, preparation: 35, urgency: 66,
    whyRelevant: "The original Dutch bock-beer festival (PINT), which left Utrecht \u2014 the reason it no longer shows up in Utrecht listings.", whyNow: "Friday 2 and Saturday 3 October 2026, De Hallen Studio's, Hannie Dankbaarpassage 18.", recommendedAction: "Decide between this and the Utrecht edition two weeks later", state: "unseen", discoveredAt: "2026-08-21", accent: "ochre",
    sources: [src("pintBockbier", "PINT Bockbierfestival \u2014 official", "2026-08-21")], milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-21"
  },
  {
    id: "ade-2026", title: "Amsterdam Dance Event 2026", shortDescription: "The 30th ADE: 1000+ events and 2500 DJs across the whole city \u2014 the world's biggest electronic-music gathering.",
    startAt: "2026-10-21T00:00:00+02:00", endAt: "2026-10-25T23:59:00+02:00", venueName: "Venues across Amsterdam", city: "Amsterdam", region: "Amsterdam", country: "Netherlands", distanceKm: 38,
    primaryCategory: "Music", tags: ["music", "festival", "electronic", "ticketed"], priceLabel: "Per event", isFree: false, relevance: 75, rarity: 78, preparation: 65, urgency: 80,
    whyRelevant: "Five days in which Amsterdam is the centre of electronic music \u2014 day programme (talks, art) included.", whyNow: "The 30th edition runs 21\u201325 October 2026; popular club nights sell out well in advance.", recommendedAction: "Scan the programme early if anything appeals", state: "unseen", discoveredAt: "2026-08-21", accent: "violet",
    sources: [src("ade", "Amsterdam Dance Event \u2014 official", "2026-08-21")], milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-21"
  },
  {
    id: "museumnacht-amsterdam-2026", title: "Museumnacht Amsterdam 2026", shortDescription: "70+ Amsterdam museums open 19:00\u201302:00 with music, performance and after-hours programming.",
    startAt: "2026-11-07T19:00:00+01:00", endAt: "2026-11-08T02:00:00+01:00", venueName: "Museums across Amsterdam", city: "Amsterdam", region: "Amsterdam", country: "Netherlands", distanceKm: 38,
    primaryCategory: "Culture", tags: ["culture", "museum", "night", "ticketed"], priceLabel: "One ticket, all museums", isFree: false, relevance: 80, rarity: 76, preparation: 45, urgency: 72,
    whyRelevant: "One night a year the museums stay open late with special programming \u2014 a very different way to see them.", whyNow: "First Saturday of November (7 November 2026); tickets typically sell out.", recommendedAction: "Buy a ticket when sales open", state: "unseen", discoveredAt: "2026-08-21", accent: "rose",
    sources: [src("museumnacht", "Museumnacht Amsterdam \u2014 official", "2026-08-21")], milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-21"
  },
  {
    id: "idfa-2026", title: "IDFA 2026", shortDescription: "The world's largest documentary film festival: ten days of premieres, talks and immersive work across Amsterdam.",
    startAt: "2026-11-12T00:00:00+01:00", endAt: "2026-11-22T23:59:00+01:00", venueName: "Cinemas across Amsterdam", city: "Amsterdam", region: "Amsterdam", country: "Netherlands", distanceKm: 38,
    primaryCategory: "Film", tags: ["film", "festival", "documentary", "ticketed"], priceLabel: "Per screening", isFree: false, relevance: 82, rarity: 74, preparation: 50, urgency: 70,
    whyRelevant: "The definitive documentary festival, an easy train ride away \u2014 strong fit for the film-heavy side of this tracker.", whyNow: "The 2026 edition runs 12\u201322 November; the programme lands in late October.", recommendedAction: "Set aside an evening and pick screenings when the programme drops", state: "unseen", discoveredAt: "2026-08-21", accent: "forest",
    sources: [src("idfa", "IDFA \u2014 official", "2026-08-21")], milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-21"
  },
  {
    id: "amsterdam-light-festival-2026", title: "Amsterdam Light Festival 2026\u201327", shortDescription: "The 15th edition of the winter light-art route along the canals, walkable or by boat.",
    startAt: "2026-11-26T17:00:00+01:00", endAt: "2027-01-17T23:00:00+01:00", venueName: "Canal ring", city: "Amsterdam", region: "Amsterdam", country: "Netherlands", distanceKm: 38,
    primaryCategory: "Culture", tags: ["culture", "light-art", "winter", "free"], priceLabel: "Free on foot; cruises paid", isFree: true, relevance: 74, rarity: 68, preparation: 20, urgency: 40,
    whyRelevant: "Large-scale light art in public space \u2014 free to walk, and at its best on a cold clear evening.", whyNow: "Runs 26 November 2026 through 17 January 2027; no planning needed beyond picking an evening.", recommendedAction: "Combine with a winter evening in Amsterdam", state: "unseen", discoveredAt: "2026-08-21", accent: "violet",
    sources: [src("lightfestival", "Amsterdam Light Festival \u2014 official", "2026-08-21")], milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-21"
  },
  {
    id: "smartlappenfestival-2026", title: "Utrechts Smartlappenfestival 2026", shortDescription: "The 34th edition: free tearjerker sing-alongs in caf\u00e9s and on squares across the old city centre.",
    startAt: "2026-11-13T00:00:00+01:00", endAt: "2026-11-15T23:59:00+01:00", venueName: "Binnenstad caf\u00e9s + squares", city: "Utrecht", region: "Utrecht", country: "Netherlands", distanceKm: 1.0,
    primaryCategory: "Music", tags: ["music", "festival", "free", "tradition"], priceLabel: "Free", isFree: true, relevance: 68, rarity: 66, preparation: 10, urgency: 45,
    whyRelevant: "A Utrecht tradition: choirs singing smartlappen through the city-centre pubs \u2014 zero planning, just walk in.", whyNow: "The 34th edition is confirmed for 13\u201315 November 2026.", recommendedAction: "Wander through the binnenstad that weekend", state: "unseen", discoveredAt: "2026-08-21", accent: "coral",
    sources: [src("smartlappen", "Utrechts Smartlappenfestival \u2014 official", "2026-08-21")], milestones: [], changes: [], dateStatus: "verified", dateVerifiedAt: "2026-08-21"
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
  { id: "iamsterdam", name: "I amsterdam uitagenda", url: sourceUrls.iamsterdam, type: "Calendar", scope: "Amsterdam region", enabled: true, health: "Healthy", lastScan: "today", events: 8, newEvents: 8, duplicates: 0, saves: 0, saveRate: 0, leadTime: 62, earliest: 55 },
  { id: "festivalinfo", name: "Festivalinfo.nl", url: sourceUrls.festivalinfo, type: "Calendar", scope: "National festival calendar", enabled: true, health: "Healthy", lastScan: "today", events: 6, newEvents: 6, duplicates: 2, saves: 0, saveRate: 0, leadTime: 84, earliest: 70 },
];
