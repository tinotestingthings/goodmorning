// Recurring festivals — the year calendar, structured. Maintained by the weekly
// event-catalog-refresh task (rules: ../SOURCES.md § Festivals). Validated by
// ../check-festivals.mjs on every build. Festivals never enter the inbox by
// themselves: only the ones in the home regions (Utrecht + regions added in
// Settings), or ones you already have a state for, become events — via
// festivalEvents(). Spec: docs/festivals.md.
import type { EventRecord, EventState } from "./types";

export const PROVINCES = ["Utrecht", "Noord-Holland", "Zuid-Holland", "Gelderland", "Noord-Brabant", "Limburg", "Overijssel", "Flevoland", "Friesland", "Groningen", "Drenthe", "Zeeland"] as const;
export type Province = (typeof PROVINCES)[number];
export const SIZES = ["small", "medium", "large"] as const; // visitors per edition: < 5,000 · 5,000–30,000 · > 30,000 (indicative)
export type FestivalSize = (typeof SIZES)[number];
// label = filter chip; category = the inbox's Film/Nature/Culture/Music filter; accent = colour class in style.css
export const GENRES = {
  "pop-rock": { label: "Pop/rock", category: "Music", accent: "coral" },
  dance: { label: "Dance", category: "Music", accent: "violet" },
  "jazz-classical": { label: "Jazz/classical", category: "Music", accent: "cyan" },
  theatre: { label: "Theatre", category: "Culture", accent: "coral" },
  film: { label: "Film", category: "Film", accent: "forest" },
  "food-drink": { label: "Food & drink", category: "Food & Drink", accent: "ochre" },
  "art-light": { label: "Art & light", category: "Culture", accent: "violet" },
  "heritage-tradition": { label: "Heritage & tradition", category: "Culture", accent: "rose" },
  literature: { label: "Literature", category: "Culture", accent: "plum" },
  "nature-outdoors": { label: "Nature & outdoors", category: "Nature", accent: "stone" },
} as const;
export type Genre = keyof typeof GENRES;

export type Festival = {
  id: string;            // stable slug, e.g. "le-guess-who"
  name: string;
  city: string;
  province: Province;
  size: FestivalSize;
  genres: Genre[];       // 1–3
  month: number;         // usual start month 1–12 (sort/filter fallback when `next` is unknown)
  when: string;          // "early Nov", "Saturday around 11 Nov"
  next?: { start: string; end: string; verifiedAt?: string }; // next edition, ISO dates; verifiedAt = the day the dates were seen on the official site
  addedAt?: string;      // day this festival entered the catalogue; without it, re-verifying a date reads as "added"
  url: string;           // official site
  blurb: string;         // one sentence
  venue?: string;
  price?: string;
  free?: boolean;
};

export const festivals: Festival[] = [
  // ---- Utrecht (city + province) ----
  { id: "bevrijdingsfestival-utrecht", name: "Bevrijdingsfestival Utrecht", city: "Utrecht", province: "Utrecht", size: "large", genres: ["pop-rock"], month: 5, when: "5 May", free: true,
    url: "https://www.bevrijdingsfestivalutrecht.nl/", venue: "Park Transwijk", blurb: "Free Liberation Day festival in Park Transwijk: national and local acts on several stages, every 5 May." },
  { id: "spring-performing-arts", name: "SPRING Performing Arts Festival", city: "Utrecht", province: "Utrecht", size: "small", genres: ["theatre"], month: 5, when: "mid–late May",
    url: "https://springutrecht.nl/", blurb: "International festival of new dance, theatre and performance across Utrecht's stages." },
  { id: "soenda", name: "Soenda Festival", city: "Utrecht", province: "Utrecht", size: "medium", genres: ["dance"], month: 5, when: "late May (Saturday)",
    url: "https://www.soenda.net/", venue: "Fort Ruigenhoek", blurb: "Open-air techno and house festival at Fort Ruigenhoek, just north of the city." },
  { id: "verknipt", name: "Verknipt Festival", city: "Utrecht", province: "Utrecht", size: "large", genres: ["dance"], month: 6, when: "early June (weekend)",
    url: "https://verknipt.org/", venue: "Strijkviertel, De Meern", blurb: "Two-day hard-hitting techno and house festival on the Strijkviertel lakeside." },
  { id: "utrecht-pride", name: "Utrecht Pride", city: "Utrecht", province: "Utrecht", size: "medium", genres: ["heritage-tradition"], month: 6, when: "early June", free: true,
    url: "https://utrechtpride.nl/", venue: "Oudegracht + city centre", blurb: "Canal Pride on the Oudegracht plus a week of programme across the city." },
  { id: "tweetakt", name: "Tweetakt", city: "Utrecht", province: "Utrecht", size: "medium", genres: ["theatre"], month: 6, when: "early–mid June",
    next: { start: "2027-06-04", end: "2027-06-13", verifiedAt: "2026-08-22" },
    url: "https://www.tweetakt.nl/", venue: "Theatres + Fort Ruigenhoek", blurb: "Festival of theatre, performance and art for a young audience — and everyone who comes along." },
  { id: "de-parade", name: "De Parade Utrecht", city: "Utrecht", province: "Utrecht", size: "medium", genres: ["theatre"], month: 8, when: "mid–late Aug (closing city of the tour)",
    price: "Programme dependent",
    url: "https://deparade.nl/informatie/data-tijden-en-prijzen/", venue: "Moreelsepark", blurb: "The travelling theatre festival closes its tour in Utrecht, with performances and KinderParade in Moreelsepark." },
  { id: "festival-oude-muziek", name: "Festival Oude Muziek Utrecht", city: "Utrecht", province: "Utrecht", size: "large", genres: ["jazz-classical"], month: 8, when: "late Aug–early Sep",
    next: { start: "2026-08-28", end: "2026-09-06", verifiedAt: "2026-08-13" }, price: "Programme dependent",
    url: "https://oudemuziek.nl/", venue: "TivoliVredenburg + venues across Utrecht", blurb: "The world's largest early-music festival — hundreds of concerts in churches and halls across the city over ten days." },
  { id: "fortenfestival", name: "Fortenfestival — Hollandse Waterlinies", city: "Utrecht", province: "Utrecht", size: "medium", genres: ["heritage-tradition", "nature-outdoors"], month: 9, when: "early Sep (nine days)",
    next: { start: "2026-09-05", end: "2026-09-13", verifiedAt: "2026-08-21" }, price: "Varies per fort; much of it free",
    url: "https://www.hollandsewaterlinies.nl/nl/dit-kun-je-doen/activiteiten/fortenfestival", venue: "Forts across the Hollandse Waterlinies", blurb: "Forts, fortified towns and bunkers of the UNESCO Hollandse Waterlinies open up for tours, music, theatre and boat trips." },
  { id: "gaudeamus", name: "Gaudeamus Muziekweek", city: "Utrecht", province: "Utrecht", size: "small", genres: ["jazz-classical"], month: 9, when: "mid Sep",
    next: { start: "2026-09-09", end: "2026-09-13", verifiedAt: "2026-08-21" }, price: "Programme dependent",
    url: "https://gaudeamus.nl/", venue: "TivoliVredenburg + city venues", blurb: "Fifty-plus concerts of brand-new and experimental music by the next generation of composers." },
  { id: "leidsche-rijn-festival", addedAt: "2026-09-04", name: "Leidsche Rijn Festival", city: "Utrecht", province: "Utrecht", size: "medium", genres: ["theatre"], month: 9, when: "first Sunday of Sep", free: true,
    next: { start: "2026-09-06", end: "2026-09-06", verifiedAt: "2026-09-04" },
    url: "https://leidscherijnfestival.nl/", venue: "Castellum Hoge Woerd, De Meern", blurb: "Free art and culture festival for children at Castellum Hoge Woerd, with theatre, music and workshops across the site." },
  { id: "ilfu", addedAt: "2026-09-04", name: "ILFU — International Literature Festival Utrecht", city: "Utrecht", province: "Utrecht", size: "medium", genres: ["literature"], month: 9, when: "mid Sep–early Oct",
    next: { start: "2026-09-19", end: "2026-10-03", verifiedAt: "2026-09-04" }, price: "Per programme",
    url: "https://ilfu.com/", venue: "Venues across Utrecht", blurb: "The country's largest international literature festival: two weeks of readings, talks and performances by Dutch and international authors." },
  { id: "utrechts-uitfeest", name: "Utrechts Uitfeest", city: "Utrecht", province: "Utrecht", size: "medium", genres: ["theatre", "pop-rock"], month: 9, when: "mid Sep", free: true,
    url: "https://uitfeest.nl/", venue: "City centre", blurb: "Opening of the cultural season: free previews, performances and open doors across the city centre." },
  { id: "nederlands-film-festival", name: "Nederlands Film Festival", city: "Utrecht", province: "Utrecht", size: "large", genres: ["film"], month: 9, when: "late Sep–early Oct",
    next: { start: "2026-09-25", end: "2026-10-02", verifiedAt: "2026-08-16" }, price: "Programme dependent",
    url: "https://www.filmfestival.nl/festival", venue: "Stadsschouwburg + venues across the city", blurb: "Eight days in which Utrecht becomes the Dutch film capital: premieres, the Gouden Kalveren and free open-air screenings." },
  { id: "bockbier-festival-utrecht", name: "Bockbier Festival Utrecht", city: "Utrecht", province: "Utrecht", size: "small", genres: ["food-drink"], month: 10, when: "mid Oct",
    next: { start: "2026-10-16", end: "2026-10-18", verifiedAt: "2026-08-21" }, price: "Entry + tokens",
    url: "https://bockbier-festival.nl/", venue: "Janskerkhof", blurb: "Three days of 25+ bock beers, live music and BBQ on Janskerkhof — the city's autumn beer festival." },
  { id: "nacht-van-de-nacht", name: "Nacht van de Nacht", city: "Utrecht", province: "Utrecht", size: "medium", genres: ["nature-outdoors"], month: 10, when: "last Saturday of Oct", free: true,
    next: { start: "2026-10-24", end: "2026-10-24", verifiedAt: "2026-08-13" },
    url: "https://nachtvandenacht.nl/", venue: "Locations across Utrecht province", blurb: "National dark-sky evening: night walks, stargazing and lights-out actions across Utrecht province." },
  { id: "le-guess-who", name: "Le Guess Who?", city: "Utrecht", province: "Utrecht", size: "medium", genres: ["pop-rock"], month: 11, when: "early Nov (four days)",
    next: { start: "2026-11-05", end: "2026-11-08", verifiedAt: "2026-08-12" }, price: "From €79",
    url: "https://leguesswho.com/", venue: "TivoliVredenburg + city venues", blurb: "Boundary-pushing music across venues, churches and hidden spaces throughout Utrecht." },
  { id: "sint-maarten-parade", name: "Sint Maarten Parade", city: "Utrecht", province: "Utrecht", size: "medium", genres: ["heritage-tradition"], month: 11, when: "Saturday around 11 Nov", free: true,
    next: { start: "2026-11-07", end: "2026-11-07", verifiedAt: "2026-08-22" },
    url: "https://sintmaartenutrecht.nl/", venue: "City centre", blurb: "Light parade through the old centre with hundreds of lanterns, sculptures, choirs and orchestras — in 2026 the public walks the route." },
  { id: "smartlappenfestival", name: "Utrechts Smartlappenfestival", city: "Utrecht", province: "Utrecht", size: "small", genres: ["heritage-tradition", "pop-rock"], month: 11, when: "mid Nov", free: true,
    next: { start: "2026-11-13", end: "2026-11-15", verifiedAt: "2026-08-21" },
    url: "https://smartlappenfestival.nl/", venue: "Cafés and squares in the old centre", blurb: "Free tearjerker sing-alongs in cafés and on squares across the old city centre." },

  // ---- Amsterdam ----
  { id: "koningsdag-amsterdam", name: "Koningsdag Amsterdam", city: "Amsterdam", province: "Noord-Holland", size: "large", genres: ["heritage-tradition"], month: 4, when: "26–27 Apr", free: true,
    url: "https://www.koninklijkhuis.nl/onderwerpen/koningsdag", venue: "Whole city", blurb: "King's Night and King's Day: the biggest street party in the country, with free markets, boats and stages across the city." },
  { id: "holland-festival", name: "Holland Festival", city: "Amsterdam", province: "Noord-Holland", size: "large", genres: ["theatre", "jazz-classical"], month: 6, when: "June",
    url: "https://www.hollandfestival.nl/", venue: "Theatres and halls across Amsterdam", blurb: "The Netherlands' oldest and largest international performing-arts festival: theatre, music, dance and opera." },
  { id: "pride-amsterdam", name: "Pride Amsterdam", city: "Amsterdam", province: "Noord-Holland", size: "large", genres: ["heritage-tradition"], month: 7, when: "late Jul–early Aug", free: true,
    url: "https://pride.amsterdam/", venue: "Canals + city centre", blurb: "Nine days of Pride, closing with the Canal Parade on the Prinsengracht; 2026 is WorldPride." },
  { id: "grachtenfestival", name: "Grachtenfestival", city: "Amsterdam", province: "Noord-Holland", size: "medium", genres: ["jazz-classical"], month: 8, when: "mid Aug",
    url: "https://www.grachtenfestival.nl/", venue: "Canals, courtyards and stages across the city", blurb: "Ten days of classical and jazz concerts on and along the canals, many of them free." },
  { id: "pint-bockbierfestival", name: "PINT Bockbierfestival", city: "Amsterdam", province: "Noord-Holland", size: "medium", genres: ["food-drink"], month: 10, when: "early Oct",
    next: { start: "2026-10-02", end: "2026-10-03", verifiedAt: "2026-08-21" }, price: "Entry + tokens",
    url: "https://www.pintbockbierfestival.nl/", venue: "De Hallen Studio's", blurb: "The classic PINT bock-beer festival — 40+ bock beers — now at De Hallen after moving from Utrecht." },
  { id: "cinekid", name: "Cinekid Festival", city: "Amsterdam", province: "Noord-Holland", size: "medium", genres: ["film"], month: 10, when: "autumn half-term",
    next: { start: "2026-10-10", end: "2026-10-25", verifiedAt: "2026-08-22" },
    url: "https://cinekid.nl/en/festival", venue: "Westergas", blurb: "Children's film and media festival in the Westergas: premieres, workshops and a MediaLab for kids." },
  { id: "ade", name: "Amsterdam Dance Event", city: "Amsterdam", province: "Noord-Holland", size: "large", genres: ["dance"], month: 10, when: "late Oct",
    next: { start: "2026-10-21", end: "2026-10-25", verifiedAt: "2026-08-21" }, price: "Per event",
    url: "https://www.amsterdam-dance-event.nl/", venue: "Venues across Amsterdam", blurb: "1000+ events and 2500 DJs across the whole city — the world's biggest electronic-music gathering." },
  { id: "museumnacht-amsterdam", name: "Museumnacht Amsterdam", city: "Amsterdam", province: "Noord-Holland", size: "large", genres: ["heritage-tradition", "art-light"], month: 11, when: "first Saturday of Nov",
    next: { start: "2026-11-07", end: "2026-11-08", verifiedAt: "2026-08-21" }, price: "One ticket, all museums",
    url: "https://museumnacht.amsterdam/", venue: "Museums across Amsterdam", blurb: "70+ museums open 19:00–02:00 with music, performance and after-hours programming." },
  { id: "idfa", name: "IDFA", city: "Amsterdam", province: "Noord-Holland", size: "large", genres: ["film"], month: 11, when: "mid Nov",
    next: { start: "2026-11-12", end: "2026-11-22", verifiedAt: "2026-08-21" }, price: "Per screening",
    url: "https://festival.idfa.nl/", venue: "Cinemas across Amsterdam", blurb: "The world's largest documentary film festival: ten days of premieres, talks and immersive work." },
  { id: "amsterdam-light-festival", name: "Amsterdam Light Festival", city: "Amsterdam", province: "Noord-Holland", size: "large", genres: ["art-light"], month: 11, when: "late Nov–mid Jan", free: true,
    next: { start: "2026-11-26", end: "2027-01-17", verifiedAt: "2026-08-21" }, price: "Free on foot; cruises paid",
    url: "https://amsterdamlightfestival.com/", venue: "Canal ring", blurb: "Winter light-art route along the canals, walkable or by boat." },
];

const distanceKm: Record<string, number> = { Utrecht: 0, Amsterdam: 38, Amersfoort: 22 }; // ponytail: rough km from home; add cities as they appear, 60 otherwise
const rarity: Record<FestivalSize, number> = { small: 60, medium: 68, large: 76 }; // always < 80: festivals are never "Rare"
// Saved states from before festivals.ts existed, keyed by the id that edition had back then. Year-specific on purpose.
const legacyIds: Record<string, string> = { "le-guess-who-2026": "le-guess-who" };

export const festivalEventId = (f: Festival) => { const id = `${f.id}-${f.next?.start.slice(0, 4)}`; return legacyIds[id] ?? id; };
export const inRegions = (f: Festival, regions: string[]) => regions.includes(f.city) || regions.includes(f.province);
/** The next edition is known and hasn't ended yet. */
export const nextIsLive = (f: Festival, today: Date) => Boolean(f.next && +new Date(`${f.next.end}T23:59:00`) >= +today);

export function festivalToEvent(f: Festival, today: Date, state: EventState = "unseen"): EventRecord | null {
  if (!f.next) return null;
  const genre = GENRES[f.genres[0]];
  const seen = f.addedAt ?? f.next.verifiedAt ?? f.next.start;
  const daysAhead = Math.round((+new Date(`${f.next.start}T00:00:00`) - +today) / 86400000);
  return {
    id: festivalEventId(f), title: `${f.name} ${f.next.start.slice(0, 4)}`, shortDescription: f.blurb,
    startAt: `${f.next.start}T00:00:00`, endAt: f.next.end === f.next.start ? undefined : `${f.next.end}T23:59:00`,
    venueName: f.venue ?? f.city, city: f.city, region: f.city, country: "Netherlands", distanceKm: distanceKm[f.city] ?? 60,
    primaryCategory: genre.category, tags: ["festival", ...f.genres, f.size, f.free ? "free" : "ticketed"],
    priceLabel: f.price ?? (f.free ? "Free" : "Tickets"), isFree: Boolean(f.free),
    // Scores the detail panel shows: rarity by size, urgency by how close it is, preparation by whether tickets are involved.
    relevance: 75, rarity: rarity[f.size], preparation: f.free ? 30 : 55, urgency: daysAhead <= 14 ? 85 : daysAhead <= 60 ? 65 : 45,
    whyRelevant: f.blurb, whyNow: f.next.verifiedAt ? "Dates confirmed on the official site." : undefined, recommendedAction: "Check the programme and tickets",
    state, discoveredAt: seen, accent: genre.accent,
    sources: [{ id: "festivals", name: `${f.name} — official`, firstSeenAt: seen, url: f.url }], milestones: [], changes: [],
    dateStatus: f.next.verifiedAt ? "verified" : "manual", dateVerifiedAt: f.next.verifiedAt,
  };
}

/** Live editions that belong in the main list: festivals in the home regions, plus any you already have a state for. */
export const festivalEvents = (regions: string[], eventStates: Record<string, unknown>, today: Date) =>
  festivals.filter((f) => nextIsLive(f, today) && (inRegions(f, regions) || festivalEventId(f) in eventStates)).map((f) => festivalToEvent(f, today)!);
