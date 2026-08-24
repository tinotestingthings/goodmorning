// Bouwt de hondendataset voor Spotinus: `dogs.json` + `dog-photos.json`, in
// exact hetzelfde formaat als `birds.json` + `bird-photos.json`, zodat de app
// er verder niets van hoeft te weten.
//
//   node tools/build-dogs.mjs sandbox/vogelspotinus
//   node tools/build-dogs.mjs sandbox/vogelspotinus --limit 20      # proefrun
//   node tools/build-dogs.mjs sandbox/vogelspotinus --exclude tools/dogs-photo-excludes.txt
//
// Bronnen, allemaal vrij (Wikidata CC0, Wikipedia CC BY-SA, Commons per foto):
//   Wikidata SPARQL   -- welke rassen er zijn, foto, land van herkomst, hoogte
//   nl/en.wikipedia   -- Nederlandse en Engelse naam + introtekst
//   en.wikipedia      -- het `colour`-veld uit {{Infobox dog breed}}
//   en.wikipedia      -- de foto's die IN het artikel staan (zie WAAROM hieronder)
//   Commons           -- licentie en bronvermelding per foto
//
// WAAROM ARTIKELFOTO'S EN NIET DE COMMONS-CATEGORIE. Gemeten op 23 aug 2026:
// `Category:Labrador Retriever` levert binnen vier bestanden een röntgenfoto van
// heupdysplasie, `Category:Keeshond` een foto van een muzikant. De foto's in het
// artikel zijn door redacteuren gekozen en zijn wél van de hond -- gemiddeld
// 12,3 bruikbare per ras over een steekproef van vier. Automatisch fout
// materiaal leert je het ras verkeerd aan, dus liever minder en juist.
//
// Elke run haalt alles opnieuw op en overschrijft; er is geen "al gedaan"-
// geheugen dat een fout resultaat vastzet. De run duurt ~3 minuten omdat
// vrijwel alles gebatcht kan (50 titels per call).
//
// DE ENIGE HANDMATIGE STAP: het script schrijft `dogs-photo-check.html`, een
// contactvel met alle gekozen foto's. Scroll dat één keer door, zet de rotte in
// het exclude-bestand en draai opnieuw.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1]?.startsWith("--") ? true : args[i + 1]) : null;
};
const APP_DIR = args.find((a) => !a.startsWith("--") && !args[args.indexOf(a) - 1]?.startsWith("--"))
  || "sandbox/vogelspotinus";
const LIMIT = flag("limit") ? Number(flag("limit")) : null;
const EXCLUDE_FILE = flag("exclude");

const OUT_DOGS = `${APP_DIR}/data/dogs.json`;
const OUT_PHOTOS = `${APP_DIR}/data/dog-photos.json`;
const OUT_REPORT = "tools/dogs-colour-report.txt";
const OUT_SHEET = "tools/dogs-photo-check.html";

const UA = "goodmorning-spotinus/1.0 (personal bird+dog learning PWA; dubbolbiutifu@gmail.com)";
const PAUSE_MS = 1300; // de Wikimedia-API blokte tijdens het testen na ~10 snelle calls
const BATCH = 50; // titels per API-call voor anonieme clients
const WIKITEXT_BATCH = 20; // wikitext is zwaar; kleiner batchen scheelt time-outs
const PHOTOS_PER_BREED = 4;
const THUMB_WIDTH = 960;
// Niet het onbewerkte origineel: Commons-originelen zijn regelmatig 10 MB+, en
// dit is de foto die de lightbox op een telefoon inlaadt. 1600px is daar ruim.
const FULL_WIDTH = 1600;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
let calls = 0;

async function api(host, params, poging = 1) {
  const url = new URL(`https://${host}/w/api.php`);
  for (const [k, v] of Object.entries({ format: "json", formatversion: "2", ...params })) {
    url.searchParams.set(k, String(v));
  }
  let text;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    text = await res.text();
  } catch (err) {
    // Eén hik in het netwerk kostte anders de hele run van drie minuten, en
    // dat gebeurde tijdens het bouwen gewoon een keer. Twee keer opnieuw
    // proberen met wat meer lucht ertussen; blijft het mis, dan stopt de run
    // alsnog zonder half werk weg te schrijven.
    if (poging > 3) throw err;
    await sleep(PAUSE_MS * poging * 3);
    return api(host, params, poging + 1);
  }
  calls += 1;
  await sleep(PAUSE_MS);
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${host} gaf geen JSON: ${text.slice(0, 120).replace(/\s+/g, " ")}`);
  }
  if (json.error) throw new Error(`${host}: ${json.error.info}`);
  return json;
}

/**
 * Eén query, volledig uitgelezen.
 *
 * Elke prop heeft zijn eigen stille limiet: `prop=extracts` levert er maar 20
 * per call, `prop=pageviews` nog minder, en `prop=images` kapt af bij veel
 * bestanden. Vraag je 50 titels op, dan krijg je gewoon de eerste zoveel terug
 * zonder foutmelding -- de eerste volledige run leverde daardoor 150 van de 361
 * teksten op en niemand die het meldde. MediaWiki zegt zelf wanneer een query
 * niet af is, via `continue`; dat volgen is betrouwbaarder dan per prop een
 * limiet uit de documentatie overtypen.
 *
 * SAMENVOEGEN, NIET OVERSCHRIJVEN. Elke vervolgcall geeft ALLE gevraagde
 * titels terug, maar vult de gevraagde prop maar voor een deel ervan in. Wie
 * botweg overschrijft, wist het goede antwoord van ronde 1 met het lege veld
 * uit ronde 2 -- gemeten op nl.wikipedia leverde dat een top-30 op waarin de
 * labrador en de golden retriever allebei op nul stonden en de lijst verder
 * alfabetisch achterstevoren liep. Daarom: arrays plakken, objecten (zoals
 * `pageviews`) samenvoegen, en een lege waarde nooit over een gevulde heen.
 */
const leeg = (v) =>
  v == null || (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);

async function apiPages(host, params) {
  const pages = new Map();
  const alias = new Map();
  let cont = {};
  for (let guard = 0; guard < 50; guard += 1) {
    const json = await api(host, { ...params, ...cont });
    for (const r of [...(json.query?.normalized ?? []), ...(json.query?.redirects ?? [])]) {
      alias.set(r.to, alias.get(r.from) ?? r.from);
    }
    for (const page of json.query?.pages ?? []) {
      const prev = pages.get(page.title);
      if (!prev) {
        pages.set(page.title, { ...page });
        continue;
      }
      for (const [k, v] of Object.entries(page)) {
        if (Array.isArray(v) && Array.isArray(prev[k])) prev[k] = [...prev[k], ...v];
        else if (!leeg(v) && typeof v === "object" && !Array.isArray(v) && prev[k] && typeof prev[k] === "object") {
          prev[k] = { ...prev[k], ...v };
        } else if (!leeg(v) || leeg(prev[k])) prev[k] = v;
      }
    }
    if (!json.continue) break;
    cont = json.continue;
  }
  return { pages: [...pages.values()], alias };
}

/** Loop alle batches langs en roep `fn` aan per batch; toont voortgang. */
async function batched(label, items, size, fn) {
  const groups = chunk(items, size);
  for (const [i, group] of groups.entries()) {
    process.stdout.write(`\r  ${label}: batch ${i + 1}/${groups.length}   `);
    await fn(group);
  }
  process.stdout.write(`\r  ${label}: ${groups.length} batches klaar        \n`);
}

// --- 1. Wikidata: welke rassen bestaan er ----------------------------------

const SPARQL = `
SELECT ?item ?en ?nl ?img ?originEn ?originNl ?height ?enwiki ?nlwiki WHERE {
  ?item wdt:P31 wd:Q39367 ; wdt:P18 ?img .
  ?enwiki schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> .
  ?nlwiki schema:about ?item ; schema:isPartOf <https://nl.wikipedia.org/> .
  ?item rdfs:label ?en FILTER(lang(?en)="en")
  OPTIONAL { ?item rdfs:label ?nl FILTER(lang(?nl)="nl") }
  OPTIONAL { ?item wdt:P495 ?o . ?o rdfs:label ?originEn FILTER(lang(?originEn)="en")
             OPTIONAL { ?o rdfs:label ?originNl FILTER(lang(?originNl)="nl") } }
  OPTIONAL { ?item wdt:P2048 ?height }
}`;

async function fetchBreeds() {
  const url = new URL("https://query.wikidata.org/sparql");
  url.searchParams.set("query", SPARQL);
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/sparql-results+json" },
  });
  if (!res.ok) throw new Error(`Wikidata SPARQL gaf ${res.status}`);
  calls += 1;

  // Eén ras levert meerdere rijen (meerdere herkomstlanden, meerdere hoogtes).
  const byQid = new Map();
  for (const row of (await res.json()).results.bindings) {
    const qid = row.item.value.split("/").pop();
    let b = byQid.get(qid);
    if (!b) byQid.set(qid, (b = { qid, heights: [] }));
    b.en ??= row.en?.value;
    b.nl ??= row.nl?.value;
    b.img ??= row.img?.value;
    b.originEn ??= row.originEn?.value;
    b.originNl ??= row.originNl?.value;
    b.enTitle ??= decodeURIComponent(row.enwiki.value.split("/wiki/").pop()).replace(/_/g, " ");
    b.nlTitle ??= decodeURIComponent(row.nlwiki.value.split("/wiki/").pop()).replace(/_/g, " ");
    // P2048 komt in cm; onzin-waarden (inches, gewichten) laten we vallen.
    const h = Number(row.height?.value);
    if (h >= 10 && h <= 120 && !b.heights.includes(h)) b.heights.push(h);
  }
  return [...byQid.values()];
}

// --- 2. Kleuren uit het infobox-veld ---------------------------------------

// Hondenkleurentaal is niet de kleurentaal van de vogeldataset. "Blue" is bij
// een hond grijs, "red" is roestbruin en "merle"/"brindle" zijn patronen, geen
// kleuren. Alleen wat een mens ook echt als die kleur zou aanwijzen mapt door;
// de rest komt in het rapport en blijft leeg. Een gemiste kleur kost niets
// (filter minder scherp), een foute kleur kost wel iets (filter liegt).
const COLOUR_MAP = [
  [/\b(jet[- ]?black|black)\b/g, "black"],
  [/\b(pure[- ]?white|white)\b/g, "white"],
  [/\b(gr[ae]y|silver|steel|blue)\b/g, "grey"], // "blue" = blauwgrijs bij honden
  [/\b(brown|chocolate|liver|mahogany|sable|brindle)\b/g, "brown"],
  [/\b(red|rust|ruby|orange)\b/g, "red"],
  [/\b(fawn|cream|apricot|wheaten|beige|tan|isabella|blonde?)\b/g, "beige"],
  [/\b(gold(en)?|yellow|lemon)\b/g, "yellow"],
];
/** Woorden die we bewust NIET als kleur tellen -- patronen en vaagheden. */
const NOT_A_COLOUR =
  /\b(merle|piebald|particolou?r|tricolou?r|bicolou?r|spotted|ticked|masked|any|all|various|solid|marking|patch|shade|colou?r)\b/;

const unmatchedWords = new Map();

/** Haal het `colour`/`color`-veld uit {{Infobox dog breed}} en maak het schoon. */
function colourField(wikitext) {
  const m = /^\s*\|\s*colou?rs?\s*=\s*(.+)$/im.exec(wikitext ?? "");
  if (!m) return null;
  return m[1]
    .replace(/<ref[^>]*\/>/gi, "")
    .replace(/<ref[\s\S]*?<\/ref>/gi, "")
    .replace(/\{\{[^}]*\}\}/g, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]|]*)\]\]/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function coloursFrom(raw) {
  if (!raw) return [];
  const text = raw.toLowerCase();
  const found = new Set();
  let leftover = text;
  for (const [re, bucket] of COLOUR_MAP) {
    if (re.test(text)) found.add(bucket);
    re.lastIndex = 0;
    leftover = leftover.replace(re, " ");
  }
  for (const w of leftover.match(/[a-z]{4,}/g) ?? []) {
    if (NOT_A_COLOUR.test(w)) continue;
    unmatchedWords.set(w, (unmatchedWords.get(w) ?? 0) + 1);
  }
  return [...found];
}

// --- 3. FCI-groep -----------------------------------------------------------

// De tien officiële rasgroepen van de Fédération Cynologique Internationale.
// Ze staan NIET in de Engelse infobox (die is bij een sjabloonherziening
// gesneuveld) en Wikidata's P279 dekt maar een derde. De NEDERLANDSE Wikipedia
// heeft ze wel, op twee onafhankelijke plekken in dezelfde pagina:
//
//   | classificatie= [[...|FCI]]: Groep 8 Sectie 1 #122
//   {{Navigatie FCI-groep8}}
//
// Gemeten op 23 aug 2026 over alle 361 rassen: 337 via het classificatieveld,
// 331 via het navigatiesjabloon, 340 via minstens een van beide -- en in nul
// gevallen spreken ze elkaar tegen. Dat maakt ze samen betrouwbaar genoeg om
// een quiz op te bouwen; de 21 rassen zonder groep doen simpelweg niet mee.
const FCI_GROUP = /Navigatie\s+FCI[-\s]*groep\s*(\d{1,2})/i;
const FCI_CLASSIFICATIE = /classificatie\s*=[^\n]*?Groep\s*(\d{1,2})(?:[^\n]*?Sectie\s*(\d{1,2}))?/i;

function fciFrom(wikitext) {
  if (!wikitext) return null;
  const nav = FCI_GROUP.exec(wikitext)?.[1];
  const cls = FCI_CLASSIFICATIE.exec(wikitext);
  const group = Number(nav ?? cls?.[1]);
  if (!group || group < 1 || group > 10) return null;
  // Spreken de twee bronnen elkaar tegen, dan vertrouwen we geen van beide.
  if (nav && cls?.[1] && nav !== cls[1]) return null;
  return { group, section: cls?.[2] ? Number(cls[2]) : null };
}

// --- 3. Foto's --------------------------------------------------------------

/** Bestandsnamen die nooit een quizfoto zijn: anatomie, kaarten, insignes. */
const BAD_NAME =
  /dysplasi|x-?ray|radiograph|skull|skelet|anatom|diagram|logo|coat[ _]of[ _]arms|stamp|postage|drawing|painting|illustrat|engraving|lithograph|chart|icon|\bmap\b|flag|statue|monument|grave|crest|seal\b|poster|cover|badge/i;
/** Een jaartal vóór 1990 in de naam betekent bijna altijd een historisch beeld. */
const OLD_YEAR = /\b(1[0-9]{3})\b/;
/**
 * Commons noteert bij bijna elk bestand wanneer het beeld is GEMAAKT. Dat is
 * het scherpste onderscheid tussen een foto en een schilderij dat we hebben,
 * en het staat gewoon in de metadata die we toch al ophalen: de kandidaten die
 * doorglipten dateerden van 1737, 1881, 1917 en 1920, de goede van 2005-2007.
 * Ontbreekt de datum, dan weren we niets -- onbekend is geen bewijs.
 */
const OLDEST_PHOTO_YEAR = 1990;

function madeBefore(meta, jaar) {
  const ruw = meta.DateTimeOriginal?.value ?? meta.DateTime?.value ?? "";
  const gevonden = String(ruw).replace(/<[^>]*>/g, "").match(/\b(1[5-9]\d{2}|20[0-4]\d)\b/)?.[1];
  return gevonden ? Number(gevonden) < jaar : false;
}
/** Historische licenties: precies de schilderijen en gravures die we niet willen. */
const HISTORIC_LICENSE = /pd-(old|art|us|1923)|public domain.*(old|art)/i;

/** Commons-bestandsnaam uit een File:-titel of een Special:FilePath-URL. */
const fileNameOf = (s) =>
  decodeURIComponent(String(s).replace(/^File:/, "").split("/").pop().split("?")[0]).replace(/_/g, " ");

function usablePhoto(page, excluded) {
  const info = page.imageinfo?.[0];
  if (!info) return null;
  const name = page.title.replace(/^File:/, "");
  if (excluded.has(name)) return null;
  if (BAD_NAME.test(name)) return null;
  const year = OLD_YEAR.exec(name);
  if (year && Number(year[1]) < 1990) return null;
  if (!/^image\/(jpeg|png)$/.test(info.mime ?? "")) return null;
  if ((info.width ?? 0) < 400) return null;

  const meta = info.extmetadata ?? {};
  const license = meta.LicenseShortName?.value ?? "";
  if (!license) return null;
  if (HISTORIC_LICENSE.test(license)) return null;
  if (madeBefore(meta, OLDEST_PHOTO_YEAR)) return null;

  const artist = (meta.Artist?.value ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return {
    name,
    u: info.thumburl || info.url,
    a: [artist, license].filter(Boolean).join(", ") || license,
  };
}

/** Foto's waarvan de naam het ras noemt, eerst -- die zijn vrijwel altijd raak. */
function rankPhotos(photos, breed) {
  const words = `${breed.enTitle} ${breed.nl ?? ""}`
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 3);
  const score = (p) => (words.some((w) => p.name.toLowerCase().includes(w)) ? 0 : 1);
  return [...photos].sort((a, b) => score(a) - score(b));
}

// --- 4. Samenstellen --------------------------------------------------------

/** Nederlandse artikeltitels dragen soms een disambiguator, net als bij vogels. */
const cleanDutch = (title) => title.replace(/\s*\((hond|hondenras|ras)\)\s*$/i, "").trim();

/**
 * Introtekst opschonen en inkorten tot twee zinnen.
 *
 * `exintro` geeft de hele inleiding terug, en die is bij honden vaak meerdere
 * alinea's: 394 tekens gemiddeld tegen 205 bij de vogels, met uitschieters naar
 * 3000. De kaart en het detailblad zijn op dat kortere formaat gebouwd (de
 * dagkaart kapt zelf al af met "..."), en over 361 rassen scheelt inkorten
 * ~190 KB in een bestand dat de app bij het opstarten binnenhaalt.
 *
 * De negatieve lookbehind houdt afkortingen als "ca." en "bijv." heel; splitsen
 * daar zou een halve eerste zin opleveren.
 */
const SENTENCE_BREAK =
  /(?<!\b(?:ca|bijv|resp|nl|dhr|mevr|dr|mr|st|mt|approx|etc|vs)\.)(?<=[.!?])\s+(?=[A-ZÀ-Þ"'(])/;
const MAX_FACT = 480;

function tidy(text, sentences = 2) {
  if (!text) return null;
  const clean = text.replace(/\s+/g, " ").trim();
  const parts = clean.split(SENTENCE_BREAK);
  let out = parts[0] ?? "";
  for (let i = 1; i < parts.length && i < sentences; i += 1) {
    if (out.length + parts[i].length + 1 > MAX_FACT) break;
    out += ` ${parts[i]}`;
  }
  if (out.length <= MAX_FACT) return out;
  return `${out.slice(0, MAX_FACT - 1).replace(/\s+\S*$/, "")}…`;
}

const sizeBucket = (cm) => (cm == null ? null : cm < 35 ? "small" : cm <= 55 ? "medium" : "large");

/** Commons-bestandsnaam -> stabiele URL, met breedte voor de thumb. */
const commonsUrl = (fileUrl, width) => {
  const name = fileUrl.split("/").pop();
  const base = `https://commons.wikimedia.org/wiki/Special:FilePath/${name}`;
  return width ? `${base}?width=${width}` : base;
};

async function main() {
  console.log(`Spotinus hondendataset -> ${APP_DIR}\n`);

  const excluded = new Set(
    EXCLUDE_FILE && existsSync(EXCLUDE_FILE)
      ? readFileSync(EXCLUDE_FILE, "utf8")
          .split("\n")
          .map((l) => l.replace(/#.*$/, "").trim())
          .filter(Boolean)
      : []
  );
  if (excluded.size) console.log(`  ${excluded.size} foto's uitgesloten via ${EXCLUDE_FILE}\n`);

  let breeds = await fetchBreeds();
  console.log(`  Wikidata: ${breeds.length} rassen met foto + en- en nl-artikel`);
  if (LIMIT) {
    breeds = breeds.slice(0, LIMIT);
    console.log(`  --limit ${LIMIT}: beperkt tot ${breeds.length}\n`);
  }

  const byEnTitle = new Map(breeds.map((b) => [b.enTitle, b]));
  const byNlTitle = new Map(breeds.map((b) => [b.nlTitle, b]));
  const enTitles = [...byEnTitle.keys()];
  const nlTitles = [...byNlTitle.keys()];

  // `redirects` laat de API zelf doorverwijzen; we matchen terug via de
  // normalized/redirects-tabel zodat een hernoemd artikel niet stil wegvalt.
  const finder = (alias, index) => (title) => index.get(title) ?? index.get(alias.get(title));

  await batched("en-tekst", enTitles, BATCH, async (group) => {
    const { pages, alias } = await apiPages("en.wikipedia.org", {
      action: "query", prop: "extracts", exintro: 1, explaintext: 1, exlimit: "max",
      redirects: 1, titles: group.join("|"),
    });
    const find = finder(alias, byEnTitle);
    for (const page of pages) {
      const b = find(page.title);
      if (b && page.extract) b.factEn = page.extract;
    }
  });

  await batched("nl-tekst", nlTitles, BATCH, async (group) => {
    const { pages, alias } = await apiPages("nl.wikipedia.org", {
      action: "query", prop: "extracts", exintro: 1, explaintext: 1, exlimit: "max",
      redirects: 1, titles: group.join("|"),
    });
    const find = finder(alias, byNlTitle);
    for (const page of pages) {
      const b = find(page.title);
      if (b && page.extract) b.factNl = page.extract;
    }
  });

  await batched("kleuren", enTitles, WIKITEXT_BATCH, async (group) => {
    const { pages, alias } = await apiPages("en.wikipedia.org", {
      action: "query", prop: "revisions", rvprop: "content", rvslots: "main", redirects: 1,
      titles: group.join("|"),
    });
    const find = finder(alias, byEnTitle);
    for (const page of pages) {
      const b = find(page.title);
      if (!b) continue;
      b.colourRaw = colourField(page.revisions?.[0]?.slots?.main?.content);
      b.colors = coloursFrom(b.colourRaw);
    }
  });

  // Nederlandse bezoekcijfers: dat is wat "welke honden zie je HIER" het dichtst
  // benadert. De Engelse cijfers meten vooral Amerikaanse interesse.
  await batched("nl-populariteit", nlTitles, BATCH, async (group) => {
    const { pages, alias } = await apiPages("nl.wikipedia.org", {
      action: "query", prop: "pageviews", pvipdays: 60, redirects: 1, titles: group.join("|"),
    });
    const find = finder(alias, byNlTitle);
    for (const page of pages) {
      const b = find(page.title);
      if (!b) continue;
      b.nlPopularity = Object.values(page.pageviews ?? {}).reduce((sum, n) => sum + (n ?? 0), 0);
    }
  });

  await batched("fci-groepen", nlTitles, WIKITEXT_BATCH, async (group) => {
    const { pages, alias } = await apiPages("nl.wikipedia.org", {
      action: "query", prop: "revisions", rvprop: "content", rvslots: "main", redirects: 1,
      titles: group.join("|"),
    });
    const find = finder(alias, byNlTitle);
    for (const page of pages) {
      const b = find(page.title);
      if (!b) continue;
      b.fci = fciFrom(page.revisions?.[0]?.slots?.main?.content);
    }
  });

  await batched("populariteit", enTitles, BATCH, async (group) => {
    const { pages, alias } = await apiPages("en.wikipedia.org", {
      action: "query", prop: "pageviews", pvipdays: 60, redirects: 1, titles: group.join("|"),
    });
    const find = finder(alias, byEnTitle);
    for (const page of pages) {
      const b = find(page.title);
      if (!b) continue;
      b.popularity = Object.values(page.pageviews ?? {}).reduce((sum, n) => sum + (n ?? 0), 0);
    }
  });

  await batched("fotolijsten", enTitles, BATCH, async (group) => {
    const { pages, alias } = await apiPages("en.wikipedia.org", {
      action: "query", prop: "images", imlimit: "max", redirects: 1, titles: group.join("|"),
    });
    const find = finder(alias, byEnTitle);
    for (const page of pages) {
      const b = find(page.title);
      if (!b) continue;
      // Voorfilteren op naam bespaart het leeuwendeel van de imageinfo-calls.
      // Ontdubbelen moet: bij een vervolgcall (`continue`) kan hetzelfde
      // bestand nog een keer langskomen, en dan stond dezelfde foto twee keer
      // in de rotatie.
      b.candidates = [
        ...new Set(
          (page.images ?? [])
            .map((i) => i.title)
            .filter((t) => /\.(jpe?g|png)$/i.test(t) && !BAD_NAME.test(t))
        ),
      ].slice(0, 10);
    }
  });

  // Licentie + bronvermelding per bestand, in batches over alle rassen heen.
  const fileOwner = new Map();
  for (const b of breeds) for (const f of b.candidates ?? []) {
    if (!fileOwner.has(f)) fileOwner.set(f, []);
    fileOwner.get(f).push(b);
    b.photos = [];
  }
  // Een foto die in MEERDERE rasartikelen staat, is niet van dat ras: het is een
  // navigatiesjabloon of een plaatje uit een algemeen kader. Gemeten op 23 aug
  // 2026 haalde dat er precies de goede uit -- één labradorfoto stond bij 23
  // rassen, en een foto van een ELAND bij 12. Kosten: 39 van de 894 foto's, en
  // drie rassen die het daardoor met alleen hun hoofdfoto moeten doen.
  const gedeeld = [...fileOwner.entries()].filter(([, owners]) => owners.length > 1);
  for (const [file] of gedeeld) fileOwner.delete(file);
  if (gedeeld.length) console.log(`  ${gedeeld.length} gedeelde foto's overgeslagen (sjabloonbeelden)`);

  await batched("licenties", [...fileOwner.keys()], BATCH, async (group) => {
    const { pages } = await apiPages("commons.wikimedia.org", {
      action: "query", prop: "imageinfo", iiprop: "url|extmetadata|mime|size",
      iiurlwidth: THUMB_WIDTH, titles: group.join("|"),
    });
    for (const page of pages) {
      const photo = usablePhoto(page, excluded);
      if (!photo) continue;
      for (const b of fileOwner.get(page.title) ?? []) {
        // De hoofdfoto (P18) staat meestal óók in het artikel. Hem als "extra"
        // meesturen levert twee URL's naar hetzelfde plaatje op: photoVariants()
        // dedupliceert op URL en ziet het verschil niet, dus de quiz zou
        // dezelfde foto als twee varianten tonen.
        if (fileNameOf(photo.name) === fileNameOf(b.img)) continue;
        b.photos.push(photo);
      }
    }
  });

  // --- Wegschrijven ---------------------------------------------------------

  const dogs = [];
  const photosOut = {};
  for (const b of breeds) {
    const id = `dog:${b.qid}`;
    const heightCm = b.heights.length
      ? Math.round(b.heights.reduce((a, c) => a + c, 0) / b.heights.length)
      : null;
    const picked = rankPhotos(b.photos ?? [], b).slice(0, PHOTOS_PER_BREED);

    dogs.push({
      id,
      englishName: b.enTitle,
      dutchName: cleanDutch(b.nlTitle),
      // Een hondenras heeft geen eigen soortnaam: labrador en chihuahua zijn
      // allebei Canis lupus familiaris. De app laat de cursieve regel dan weg.
      scientificName: null,
      fact_en: tidy(b.factEn),
      fact_nl: tidy(b.factNl),
      origin_en: b.originEn ?? null,
      origin_nl: b.originNl ?? b.originEn ?? null,
      lengthCm: heightCm,
      popularity: b.popularity ?? 0,
      // Aparte teller voor Nederland; `popularity` blijft de Engelse, zodat de
      // "meest voorkomend"-sortering in Bladeren niet ineens iets anders meet.
      nlPopularity: b.nlPopularity ?? 0,
      imageUrl: commonsUrl(b.img, FULL_WIDTH),
      imageThumbUrl: commonsUrl(b.img, THUMB_WIDTH),
      wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(b.enTitle.replace(/ /g, "_"))}`,
      dutchWikipediaUrl: `https://nl.wikipedia.org/wiki/${encodeURIComponent(b.nlTitle.replace(/ /g, "_"))}`,
      // Honden blaffen niet per ras herkenbaar; geen geluidsvraag dus. De app
      // slaat luistervragen al over zodra soundUrl leeg is.
      soundUrl: null,
      tags: {
        kind: "dog",
        colors: b.colors ?? [],
        sizeBucket: sizeBucket(heightCm),
        // Als `family`: de rasgroep is voor een hond wat de vogelfamilie voor
        // een vogel is, dus distractors.js en de familiefilter werken er zonder
        // wijziging op. Ontbreekt hij, dan valt die code terug op herkomstland.
        ...(b.fci ? { family: `fci-${b.fci.group}`, fciGroup: b.fci.group } : {}),
      },
      ...(b.fci?.section ? { fciSection: b.fci.section } : {}),
    });
    if (picked.length) photosOut[id] = picked.map(({ u, a }) => ({ u, a }));
  }

  for (const file of [OUT_DOGS, OUT_PHOTOS, OUT_REPORT, OUT_SHEET]) {
    mkdirSync(dirname(file), { recursive: true });
  }
  writeFileSync(OUT_DOGS, JSON.stringify(dogs, null, 0));
  writeFileSync(OUT_PHOTOS, JSON.stringify(photosOut, null, 0));
  writeFileSync(OUT_REPORT, colourReport(breeds));
  writeFileSync(OUT_SHEET, contactSheet(breeds));

  const metFoto = dogs.filter((d) => photosOut[d.id]?.length >= 2).length;
  const totaalFotos = Object.values(photosOut).reduce((n, p) => n + p.length, 0);
  console.log(`
${dogs.length} rassen -> ${OUT_DOGS}
  ${dogs.filter((d) => d.fact_nl).length} met Nederlandse tekst
  ${dogs.filter((d) => d.origin_en).length} met land van herkomst
  ${dogs.filter((d) => d.lengthCm).length} met schofthoogte
  ${dogs.filter((d) => d.tags.colors.length).length} met minstens één kleur
  ${dogs.filter((d) => d.tags.fciGroup).length} met een FCI-rasgroep
  ${dogs.filter((d) => d.nlPopularity > 0).length} met Nederlandse bezoekcijfers

${totaalFotos} foto's -> ${OUT_PHOTOS}
  ${metFoto} rassen met 2 of meer foto's, ${dogs.length - Object.keys(photosOut).length} zonder extra foto

${calls} API-calls.

NU JIJ: open ${OUT_SHEET}, scroll er één keer doorheen, en zet wat er
niet hoort in een exclude-bestand (één bestandsnaam per regel). Daarna:
  node tools/build-dogs.mjs ${APP_DIR} --exclude tools/dogs-photo-excludes.txt`);
}

function colourReport(breeds) {
  const zonder = breeds.filter((b) => b.colourRaw && !b.colors?.length);
  const geenVeld = breeds.filter((b) => !b.colourRaw);
  const woorden = [...unmatchedWords.entries()].sort((a, b) => b[1] - a[1]).slice(0, 60);
  return [
    "Kleurenrapport — wat de trefwoordmatch niet kon plaatsen.",
    "Kleuren zijn een filter, geen quizantwoord: een gemiste match kost niets,",
    "een foute match wel. Bij twijfel blijft het veld leeg.",
    "",
    `${geenVeld.length} rassen hebben geen colour-veld in de infobox.`,
    `${zonder.length} rassen hebben er wel een, maar leverden geen enkele kleur op:`,
    "",
    ...zonder.slice(0, 60).map((b) => `  ${b.enTitle.padEnd(34)} ${b.colourRaw.slice(0, 90)}`),
    "",
    "Vaakst voorkomende woorden die geen kleur werden:",
    ...woorden.map(([w, n]) => `  ${String(n).padStart(4)}  ${w}`),
    "",
  ].join("\n");
}

/** Contactvel: alle gekozen foto's op één pagina, vier per ras, naam eronder. */
function contactSheet(breeds) {
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const rows = breeds
    .map((b) => {
      const picked = rankPhotos(b.photos ?? [], b).slice(0, PHOTOS_PER_BREED);
      const cells = picked.length
        ? picked
            .map(
              (p) =>
                `<figure><img loading="lazy" src="${esc(p.u)}" alt=""><figcaption>${esc(p.name)}</figcaption></figure>`
            )
            .join("")
        : `<p class="none">geen bruikbare foto's</p>`;
      return `<section><h2>${esc(b.nl ?? b.enTitle)} <small>${esc(b.enTitle)}</small></h2><div class="row">${cells}</div></section>`;
    })
    .join("\n");
  return `<!doctype html><meta charset="utf-8"><title>Spotinus — foto's nakijken</title>
<style>
  body{font:15px/1.5 system-ui,sans-serif;margin:0;padding:2rem;background:#f5f6f8;color:#1a1d24}
  h1{font-size:1.4rem} p.intro{max-width:44rem;color:#5a6270}
  section{border-top:1px solid #dde1e6;padding:1rem 0}
  h2{font-size:1rem;margin:0 0 .6rem} h2 small{font-weight:400;color:#5a6270}
  .row{display:flex;gap:.75rem;flex-wrap:wrap}
  figure{margin:0;width:190px}
  img{width:190px;height:150px;object-fit:cover;border-radius:4px;background:#e7eaee}
  figcaption{font:11px/1.4 ui-monospace,monospace;color:#5a6270;word-break:break-all;margin-top:.3rem}
  .none{color:#a83f3b;font-size:.85rem;margin:0}
  @media (prefers-color-scheme:dark){body{background:#0f1115;color:#eef0f3}
    section{border-color:#2a2e37} h2 small,figcaption,p.intro{color:#a5acb8} img{background:#1d212a}}
</style>
<h1>Foto's nakijken — ${breeds.length} rassen</h1>
<p class="intro">Scroll er één keer doorheen. Wat geen goede quizfoto is (close-up van een oog,
een mens in beeld, een tekening die door het filter kwam): zet de bestandsnaam eronder in
<code>tools/dogs-photo-excludes.txt</code>, één per regel, en draai het script opnieuw.</p>
${rows}`;
}

main().catch((err) => {
  console.error(`\nAfgebroken: ${err.message}`);
  console.error("Er is niets weggeschreven; draai opnieuw.");
  process.exit(1);
});
