// ---------------------------------------------------------------------------
// Afleiders voor meerkeuzevragen. Willekeurige afleiders maken de vraag te
// makkelijk ("meerkoet of ijsvogel?" leert je niets); verwante en gelijkende
// soorten dwingen je naar het onderscheidende kenmerk te kijken ("meerkoet of
// waterhoen?" is de vraag die je in het park ook echt hebt).
//
// Score per kandidaat: zelfde familie weegt het zwaarst, daarna zelfde
// grootteklasse en kleuroverlap. Binnen gelijke score wordt geschud, zodat
// dezelfde vraag niet altijd dezelfde vier opties toont.
// ---------------------------------------------------------------------------

import { shuffle } from "./dom.js";

function similarity(bird, candidate) {
  let score = 0;
  if (bird.tags?.family && candidate.tags?.family === bird.tags.family) score += 4;
  if (bird.tags?.sizeBucket && candidate.tags?.sizeBucket === bird.tags.sizeBucket) score += 1;
  const colors = bird.tags?.colors ?? [];
  const otherColors = candidate.tags?.colors ?? [];
  if (colors.length && otherColors.some((c) => colors.includes(c))) score += 1;
  return score;
}

/**
 * Kies `count` afleiders voor `bird` uit `pool` (de vogel zelf wordt
 * uitgesloten). Meest gelijkende eerst, aangevuld met willekeur als de pool
 * weinig verwanten bevat. Twee soorten met dezelfde weergavenaam kunnen niet
 * allebei optie zijn -- dan zouden er twee "goede" knoppen op het scherm staan.
 */
export function pickDistractors(bird, pool, count, displayName) {
  const seen = new Set([displayName ? displayName(bird) : bird.scientificName]);
  const scored = [];
  for (const candidate of pool) {
    if (candidate === bird) continue;
    const name = displayName ? displayName(candidate) : candidate.scientificName;
    if (seen.has(name)) continue;
    seen.add(name);
    scored.push({ candidate, score: similarity(bird, candidate), tiebreak: Math.random() });
  }
  scored.sort((a, b) => b.score - a.score || a.tiebreak - b.tiebreak);
  // Klein venster boven `count`, zodat de opties per keer wisselen maar wel
  // uit de meest gelijkende soorten blijven komen.
  const window = scored.slice(0, count + 2);
  return shuffle(window).slice(0, count).map((x) => x.candidate);
}
