// Haalt per cursussoort extra foto's op bij iNaturalist, zodat de quiz niet
// telkens dezelfde ene Wikipedia-foto toont (dan onthoud je de foto in plaats
// van de vogel). Alleen CC-gelicenseerde taxonfoto's, met bronvermelding.
//
// Schrijft vogelspotinus/data/bird-photos.json:
//   { "<scientificName>": [ { "u": mediumUrl, "a": attribution }, ... ] }
//
// Draaien (duurt ~4 min, ~1 request/s uit beleefdheid voor de API):
//   node tools/fetch-bird-photos.mjs sandbox/vogelspotinus
//   node tools/fetch-bird-photos.mjs sandbox/vogelspotinus --only "Pica pica"
//
// DE SOORT MOET KLOPPEN. De eerste versie pakte blind results[0] van een
// fuzzy `q=`-zoekopdracht; die zoekopdracht rankt op waarnemingsaantal en is
// Amerikaans gedomineerd, dus 14 van de 100 soorten kregen de foto's van een
// ANDERE vogel: "Pica pica" -> Dryobates pubescens (fuzzy match op het oude
// Picoides pubescens), "Spinus spinus" EN "Carduelis carduelis" -> allebei
// Spinus tristis, "Corvus corone" -> Corvus cornix. De app leerde je die
// soorten dus fout aan. Daarom matcht deze versie op naam:
//   1. een resultaat waarvan `name` exact de gevraagde soort is, of anders
//   2. een resultaat waarvan `matched_term` de gevraagde soort is -- dat is
//      hoe iNaturalist een hernoemd taxon terugmeldt (Accipiter gentilis ->
//      Astur gentilis, Corvus monedula -> Coloeus monedula: dezelfde vogel).
// Lukt geen van beide, dan krijgt de soort GEEN extra foto's en valt de app
// terug op de Wikipedia-foto. Liever één juiste foto dan vier verkeerde.
//
// Elke run verifieert opnieuw en overschrijft: er is geen "al gedaan"-geheugen
// dat een fout resultaat voor eeuwig vastzet. De app werkt ook zonder dit
// bestand; het is verrijking, geen dependency.

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const args = process.argv.slice(2);
const APP_DIR = args.find((a) => !a.startsWith("--")) || "vogelspotinus";
const onlyIndex = args.indexOf("--only");
const ONLY = onlyIndex >= 0 ? args[onlyIndex + 1] : null;

const COURSE_FILE = `${APP_DIR}/src/data/course-griftpark.js`;
const OUT = `${APP_DIR}/data/bird-photos.json`;
const PHOTOS_PER_SPECIES = 4;
const UA = "goodmorning-vogelspotinus/1.0 (personal bird-learning PWA)";
const API = "https://api.inaturalist.org/v1";
const SEARCH_RESULTS = 12; // genoeg om de juiste soort voorbij de fuzzy ruis te vinden

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

/**
 * Het taxon dat ECHT deze soort is, of null. Exacte naam wint; anders een
 * hernoemd taxon dat via matched_term op de gevraagde naam terugslaat.
 */
function resolveTaxon(results, scientificName) {
  const exact = results.find((t) => t?.name === scientificName);
  if (exact) return { taxon: exact, via: "exact" };
  const renamed = results.find((t) => t?.matched_term === scientificName);
  if (renamed) return { taxon: renamed, via: `hernoemd naar ${renamed.name}` };
  return null;
}

// iNat square-thumb -> medium (~500px). Standaard URL-patroon van hun CDN.
const mediumUrl = (photo) =>
  (photo.medium_url || photo.url || "").replace(/\/square(\.[a-z]+)/i, "/medium$1");

const toEntry = (p) => ({ u: mediumUrl(p), a: p.attribution || "" });
const usable = (p) => p && p.license_code && mediumUrl(p);

/**
 * Foto's uit WAARNEMINGEN in plaats van uit de taxonpagina.
 *
 * De taxonfoto's van iNaturalist zijn curatorkeuzes en bevatten met opzet ook
 * nestjongen, vogels in de hand en afwijkende exemplaren -- bij Ekster stond
 * een volledig witte (leucistische) vogel op plek 3. Prima voor een encyclopedie,
 * fout voor een determinatietrainer: je leert er de soort niet aan.
 *
 * `term_id=1&term_value_id=2` is de annotatie "levensfase = volwassen", en
 * research grade betekent dat meerdere mensen de soort bevestigd hebben.
 * order_by=votes zet de best beoordeelde foto's vooraan.
 */
async function observationPhotos(taxonId, { adultsOnly }) {
  const lifeStage = adultsOnly ? "&term_id=1&term_value_id=2" : "";
  const res = await getJson(
    `${API}/observations?taxon_id=${taxonId}&quality_grade=research&photos=true` +
      `&licensed=true&order_by=votes&per_page=${PHOTOS_PER_SPECIES * 2}${lifeStage}`
  );
  const seen = new Set();
  const photos = [];
  for (const obs of res.results ?? []) {
    const photo = (obs.photos ?? []).find(usable);
    if (!photo) continue;
    const entry = toEntry(photo);
    if (seen.has(entry.u)) continue; // nooit twee keer dezelfde foto
    seen.add(entry.u);
    photos.push(entry);
    if (photos.length >= PHOTOS_PER_SPECIES) break;
  }
  return photos;
}

/** Laatste redmiddel: de curatorfoto's van de taxonpagina. */
async function taxonPhotos(taxonId) {
  const detail = await getJson(`${API}/taxa/${taxonId}`);
  return (detail.results?.[0]?.taxon_photos ?? [])
    .map((tp) => tp.photo)
    .filter(usable)
    .slice(0, PHOTOS_PER_SPECIES)
    .map(toEntry);
}

const { GRIFTPARK_COURSE } = await import(`../${COURSE_FILE}`);
const allSpecies = GRIFTPARK_COURSE.species.map(([sci]) => sci);
const species = ONLY ? allSpecies.filter((s) => s === ONLY) : allSpecies;
if (ONLY && species.length === 0) {
  console.error(`--only "${ONLY}" staat niet in de cursuslijst`);
  process.exit(2);
}

// Bij --only blijft de rest van het bestand staan; anders bouwen we opnieuw op,
// zodat een eerder fout resultaat niet kan blijven hangen.
const out = ONLY && existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};

const unresolved = [];
const failed = [];
let done = 0;

for (const sci of species) {
  done += 1;
  try {
    const search = await getJson(
      `${API}/taxa?q=${encodeURIComponent(sci)}&rank=species&per_page=${SEARCH_RESULTS}`
    );
    const hit = resolveTaxon(search.results ?? [], sci);
    if (!hit) {
      delete out[sci]; // een eerdere, mogelijk foute reeks mag niet blijven staan
      unresolved.push(sci);
      console.warn(`[${done}/${species.length}] ${sci}: GEEN match -- alleen Wikipedia-foto`);
      await sleep(1100);
      continue;
    }

    // Beste bron eerst, dan afzwakken: volwassen + research grade -> research
    // grade -> curatorfoto's. De annotatie "volwassen" is lang niet overal
    // gezet (Ransuil heeft er 15), dus zonder deze trap zouden juist de minder
    // gefotografeerde soorten leeg blijven.
    await sleep(1100);
    let photos = await observationPhotos(hit.taxon.id, { adultsOnly: true });
    let source = "volwassen";
    if (photos.length < PHOTOS_PER_SPECIES) {
      await sleep(1100);
      const wider = await observationPhotos(hit.taxon.id, { adultsOnly: false });
      if (wider.length > photos.length) {
        photos = wider;
        source = "research grade";
      }
    }
    if (photos.length === 0) {
      await sleep(1100);
      photos = await taxonPhotos(hit.taxon.id);
      source = "taxonfoto's";
    }

    if (photos.length) out[sci] = photos;
    else delete out[sci];

    const note = hit.via === "exact" ? "" : `, ${hit.via}`;
    console.log(`[${done}/${species.length}] ${sci}: ${photos.length} foto's (${source}${note})`);
    writeFileSync(OUT, JSON.stringify(out));
  } catch (err) {
    failed.push(`${sci}: ${err.message}`);
    console.warn(`[${done}/${species.length}] ${sci}: FOUT -- ${err.message}`);
  }
  await sleep(1100);
}

writeFileSync(OUT, JSON.stringify(out));
const total = Object.values(out).reduce((s, a) => s + a.length, 0);
console.log(`\nklaar: ${Object.keys(out).length} soorten, ${total} foto's -> ${OUT}`);
if (unresolved.length) console.log(`zonder match (${unresolved.length}): ${unresolved.join(", ")}`);
if (failed.length) {
  console.error(`MISLUKT (${failed.length}):\n  ${failed.join("\n  ")}`);
  console.error("Draai opnieuw -- mislukte soorten hebben geen of oude data.");
  process.exit(1);
}
