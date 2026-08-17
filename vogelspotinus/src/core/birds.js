// ---------------------------------------------------------------------------
// The bird dataset: loading it, and every question you can ask about a single
// bird (its display name, its bilingual fields, whether it can be quizzed).
//
// Screens read birds through here and never poke at raw field names, so the
// `_nl` / `_en` suffix convention from build_data.py stays in one file.
// ---------------------------------------------------------------------------

import { currentLanguage, otherLanguage } from "./i18n.js";

const DATA_URL = "data/birds.json";

/** @type {Array<object>} */
let birds = [];
/** @type {Map<string, object>} */
let byScientificName = new Map();

export function allBirds() {
  return birds;
}

export function birdByScientificName(name) {
  return byScientificName.get(name) ?? null;
}

export async function loadBirds() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`${DATA_URL} responded ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0)
    throw new Error(`${DATA_URL} is empty or malformed`);

  birds = data;
  byScientificName = new Map(data.map((b) => [b.scientificName, b]));
  // Pre-compute the search haystack once instead of rebuilding it per keystroke
  // for all 566 birds (the old code did the latter, un-debounced).
  for (const bird of birds) {
    bird.searchText = [bird.englishName, bird.dutchName, bird.scientificName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
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
  return [bird.englishName, dutchName(bird), bird.scientificName]
    .filter(Boolean)
    .some((candidate) => normalizeGuess(candidate) === needle);
}

/** Free-text search across all three names, using the precomputed haystack. */
export function searchBirds(pool, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return pool;
  return pool.filter((b) => b.searchText.includes(needle));
}
