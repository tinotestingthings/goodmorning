// ---------------------------------------------------------------------------
// The bird dataset: loading it, and every question you can ask about a single
// bird (its display name, its bilingual fields, whether it can be quizzed).
//
// Screens read birds through here and never poke at raw field names, so the
// `_nl` / `_en` suffix convention from build_data.py stays in one file.
//
// IDENTITEIT is `id`, niet `scientificName`. Voor vogels zijn die twee gelijk
// (zie loadBirds), zodat elke opgeslagen sleutel -- Leitner-state, favorieten,
// de soortenlijst van een custom game -- geldig blijft. Een hondenras heeft
// straks geen soortnaam (een labrador en een chihuahua zijn allebei Canis
// lupus familiaris), dus daar wordt `id` een eigen waarde en blijft
// `scientificName` leeg. Alles wat een soort MOET onderscheiden gebruikt `id`;
// `scientificName` is vanaf nu puur weergave.
// ---------------------------------------------------------------------------

import { currentLanguage, otherLanguage } from "./i18n.js";

/**
 * De datasets waaruit Spotinus bestaat, met hun fotobestand. Elk kind is een
 * APARTE fetch, geen extra blok in birds.json: zo blijft een kapot of
 * ontbrekend uitbreidingsbestand een app met minder categorieën, in plaats van
 * een app die niet start. Vogels zijn verplicht (`zonder` ontbreekt), de rest
 * mag falen. Eén regel per categorie -- photos.js leest `photos` uit deze
 * lijst, zodat er geen tweede register naast kan gaan lopen. `kind` is de
 * tag-waarde uit filters.js; tools/build-tiles.mjs (de fototegel op Today)
 * leest dit register ook, dus een nieuwe categorie hier verschijnt daar vanzelf.
 */
export const DATASETS = [
  { kind: "bird", url: "data/birds.json", photos: "data/bird-photos.json" },
  { kind: "dog", url: "data/dogs.json", photos: "data/dog-photos.json", zonder: "honden" },
  // tilesFromPhotos: op de fototegel van Today zijn hier de foto's (gebouwen)
  // het onderwerp, niet de stijl zelf -- zie tools/build-tiles.mjs.
  { kind: "architecture", url: "data/arch.json", photos: "data/arch-photos.json", zonder: "bouwstijlen", tilesFromPhotos: true },
  { kind: "street", url: "data/street.json", photos: "data/street-photos.json", zonder: "straatobjecten" },
];

/** @type {Array<object>} */
let birds = [];
/** @type {Map<string, object>} */
let byId = new Map();

export function allBirds() {
  return birds;
}

export function speciesById(id) {
  return byId.get(id) ?? null;
}

async function fetchList(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error(`${url} is empty or malformed`);
  return data;
}

/**
 * Alle soorten inlezen: vogels verplicht, de uitbreidingen als het lukt.
 *
 * De bestanden gaan tegelijk de deur uit maar hebben een verschillend
 * gewicht. Vogels zijn de app: valt dat bestand om, dan hoort het foutscherm
 * met een retry-knop te verschijnen. De rest is uitbreiding: valt er een om,
 * dan is Spotinus even een app met minder categorieën -- dat is een betere
 * uitkomst dan een app die helemaal niet start. Zelfde afweging als bij
 * bird-photos.json.
 */
const optioneel = (url, zonder) =>
  fetchList(url).catch((err) => {
    console.warn(`[data] ${url} niet geladen, Spotinus toont geen ${zonder}`, err);
    return [];
  });

export async function loadBirds() {
  const lijsten = await Promise.all(
    DATASETS.map((d) => (d.zonder ? optioneel(d.url, d.zonder) : fetchList(d.url)))
  );

  // Elke soort krijgt haar `kind` uit het register (birds.json kent het veld
  // niet; de andere bestanden dragen het al, dus daar verandert niets).
  lijsten.forEach((lijst, i) => {
    for (const s of lijst) (s.tags ??= {}).kind ??= DATASETS[i].kind;
  });
  birds = lijsten.flat();
  // Pre-compute the search haystack once instead of rebuilding it per keystroke
  // for all 566 birds (the old code did the latter, un-debounced). Hier krijgt
  // elke soort ook zijn `id`: birds.json kent het veld niet, en voor vogels IS
  // de soortnaam de identiteit -- dat moet zo blijven, anders raakt elke
  // opgeslagen sleutel zijn soort kwijt.
  for (const bird of birds) {
    bird.id ??= bird.scientificName;
    bird.searchText = [bird.englishName, bird.dutchName, bird.scientificName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }
  byId = new Map(birds.map((b) => [b.id, b]));
  // Een soort zonder id, of twee soorten met hetzelfde id, is stille
  // dataverminking: ze delen dan één sleutel in de Leitner-state en in de
  // favorieten, dus je voortgang loopt door elkaar zonder dat iets het meldt.
  // Precies waar deze Map load-bearing werd toen de tweede dataset erbij kwam.
  // Liever het foutscherm met een retry-knop -- loadData() vangt deze throw al
  // af -- dan dat.
  const zonderId = birds.filter((b) => !b.id);
  if (zonderId.length || byId.size !== birds.length) {
    throw new Error(
      `soortdata: ${zonderId.length} soort(en) zonder id, ` +
        `${birds.length - byId.size} dubbel id`
    );
  }
  return birds;
}

// --- Per-bird accessors -----------------------------------------------------

/** A bilingual field, falling back to the other language rather than showing blank. */
export function bilingual(bird, field) {
  return bird[`${field}_${currentLanguage()}`] || bird[`${field}_${otherLanguage()}`] || null;
}

/** Dutch Wikipedia titles carry disambiguators like "Vink (vogel)" -- strip them. */
export function dutchName(bird) {
  if (!bird.dutchName) return null;
  return bird.dutchName.replace(/\s*\((vogel|dier|geslacht)\)\s*$/i, "");
}

/** The name shown largest, in the reader's language. */
export function primaryName(bird) {
  return currentLanguage() === "nl"
    ? dutchName(bird) || bird.englishName
    : bird.englishName || dutchName(bird);
}

/** The other common name(s), shown small beside the scientific name. */
export function secondaryNames(bird) {
  return (currentLanguage() === "nl" ? [bird.englishName] : [dutchName(bird)]).filter(Boolean);
}

/** BCP-47 tag for the secondary names, so screen readers switch pronunciation. */
export function secondaryNameLang() {
  return otherLanguage();
}

export function photoUrl(bird, { full = false } = {}) {
  return full
    ? bird.imageUrl || bird.imageThumbUrl || null
    : bird.imageThumbUrl || bird.imageUrl || null;
}

/** A bird can only be quizzed on sight if it actually has a photo. */
export function hasPhoto(bird) {
  return Boolean(bird.imageUrl || bird.imageThumbUrl);
}

/** Normalised comparison for typed answers: case, accents, brackets, punctuation. */
export function normalizeGuess(str) {
  return String(str ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function matchesGuess(bird, guess) {
  const needle = normalizeGuess(guess);
  if (!needle) return false;
  // `aliases` komt uit de data en bevat alleen echte tweede namen die de kaart
  // toont ("Stolperstein (struikelsteen)"): het buildscript weet dat die
  // haakjes handgeschreven zijn. Ze hier uit de naam terugparsen kan niet --
  // dan zou "(soort)" bij een vogel en "(korthaar)" bij twee verschillende
  // hondenrassen even goed als antwoord gelden.
  return [bird.englishName, dutchName(bird), bird.scientificName, ...(bird.aliases ?? [])]
    .filter(Boolean)
    .some((candidate) => normalizeGuess(candidate) === needle);
}

/** Free-text search across all three names, using the precomputed haystack. */
export function searchBirds(pool, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return pool;
  return pool.filter((b) => b.searchText.includes(needle));
}
