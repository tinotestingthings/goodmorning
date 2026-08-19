// ---------------------------------------------------------------------------
// Extra foto's per soort (data/bird-photos.json, gebouwd door
// tools/fetch-bird-photos.mjs). Een soort met maar EEN foto traint je op die
// foto in plaats van op de vogel; dit module geeft elke vraag een andere kans.
//
// Het bestand is verrijking: laden gebeurt na de boot en mag falen. Zolang het
// er niet is, valt alles terug op de ene Wikipedia-foto uit birds.json.
// ---------------------------------------------------------------------------

import { photoUrl } from "./birds.js";

const DATA_URL = "data/bird-photos.json";

/** @type {Record<string, Array<{u: string, a: string}>>} */
let extra = {};
/** Laatst getoonde variant per soort, zodat twee opeenvolgende vragen over
 *  dezelfde vogel niet toevallig dezelfde foto herhalen. */
const lastShown = new Map();

export async function loadExtraPhotos() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) return;
    const data = await res.json();
    if (data && typeof data === "object") extra = data;
  } catch {
    // Offline of bestand ontbreekt: prima, de app werkt met de basisfoto's.
  }
}

/** Alle beschikbare foto-URL's voor een vogel: Wikipedia eerst, dan iNaturalist. */
export function photoVariants(bird) {
  const urls = [];
  const base = photoUrl(bird);
  if (base) urls.push(base);
  for (const p of extra[bird.scientificName] ?? []) {
    if (p?.u && !urls.includes(p.u)) urls.push(p.u);
  }
  return urls;
}

export function hasMultiplePhotos(bird) {
  return photoVariants(bird).length > 1;
}

/**
 * Een foto-URL voor een quizvraag: willekeurig uit de varianten, maar nooit
 * twee keer op rij dezelfde zolang er keuze is.
 */
export function quizPhotoUrl(bird) {
  const urls = photoVariants(bird);
  if (urls.length === 0) return null;
  if (urls.length === 1) return urls[0];
  const previous = lastShown.get(bird.scientificName);
  let pick;
  do {
    pick = urls[Math.floor(Math.random() * urls.length)];
  } while (pick === previous);
  lastShown.set(bird.scientificName, pick);
  return pick;
}

/** Bronvermelding voor een iNaturalist-foto, of null voor de Wikipedia-basisfoto. */
export function photoAttribution(bird, url) {
  return (extra[bird.scientificName] ?? []).find((p) => p.u === url)?.a ?? null;
}
