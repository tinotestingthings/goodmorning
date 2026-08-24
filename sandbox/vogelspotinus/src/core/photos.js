// ---------------------------------------------------------------------------
// Extra foto's per soort (data/bird-photos.json, gebouwd door
// tools/fetch-bird-photos.mjs). Een soort met maar EEN foto traint je op die
// foto in plaats van op de vogel; dit module geeft elke vraag een andere kans.
//
// Het bestand is verrijking: laden gebeurt na de boot en mag falen. Zolang het
// er niet is, valt alles terug op de ene Wikipedia-foto uit birds.json.
//
// De sleutel in het JSON-bestand is de soortnaam; opgezocht wordt op `id`.
// Voor vogels zijn die gelijk (birds.js), dus het bestand hoeft niet opnieuw
// gebouwd te worden.
// ---------------------------------------------------------------------------

import { allBirds, photoUrl } from "./birds.js";

const DATA_URLS = ["data/bird-photos.json", "data/dog-photos.json"];

/** @type {Record<string, Array<{u: string, a: string}>>} gesleuteld op soort-id */
let extra = {};
/** Laatst getoonde variant per soort, zodat twee opeenvolgende vragen over
 *  dezelfde vogel niet toevallig dezelfde foto herhalen. */
const lastShown = new Map();

export async function loadExtraPhotos() {
  // Elk bestand apart: ontbreekt er één, dan houden we de andere gewoon. Beide
  // sleutelen op soort-id, dus ze kunnen zonder meer samengevoegd worden.
  const sets = await Promise.all(
    DATA_URLS.map(async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return data && typeof data === "object" ? data : null;
      } catch {
        return null; // Offline of bestand ontbreekt: de basisfoto's blijven werken.
      }
    })
  );
  const merged = Object.assign({}, ...sets.filter(Boolean));
  if (!Object.keys(merged).length) return;
  extra = merged;
  backfillMissingBasePhotos();
}

/**
 * Vogels zonder Wikipedia-foto krijgen er alsnog een uit deze set.
 *
 * hasPhoto() in birds.js kijkt alleen naar imageUrl/imageThumbUrl, en dat is de
 * poort voor ALLES: quizpools, herhalingen en nextNewBirds(). Een cursussoort
 * zonder Wikipedia-foto viel daardoor overal buiten -- de havik (Accipiter
 * gentilis) kon nooit geleerd worden, terwijl de teller wel tot 100 telde, dus
 * de cursus was niet uit te krijgen. Hier één veld vullen lost dat overal op,
 * zonder dat birds.js dit bestand hoeft te kennen (dat zou een import-cyclus zijn).
 */
function backfillMissingBasePhotos() {
  for (const bird of allBirds()) {
    if (bird.imageUrl || bird.imageThumbUrl) continue;
    const first = extra[bird.id]?.[0]?.u;
    if (first) bird.imageThumbUrl = first;
  }
}

/** Alle beschikbare foto-URL's voor een vogel: Wikipedia eerst, dan iNaturalist. */
export function photoVariants(bird) {
  const urls = [];
  const base = photoUrl(bird);
  if (base) urls.push(base);
  for (const p of extra[bird.id] ?? []) {
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
  const previous = lastShown.get(bird.id);
  let pick;
  do {
    pick = urls[Math.floor(Math.random() * urls.length)];
  } while (pick === previous);
  lastShown.set(bird.id, pick);
  return pick;
}

/** Bronvermelding voor een iNaturalist-foto, of null voor de Wikipedia-basisfoto. */
export function photoAttribution(bird, url) {
  return (extra[bird.id] ?? []).find((p) => p.u === url)?.a ?? null;
}
