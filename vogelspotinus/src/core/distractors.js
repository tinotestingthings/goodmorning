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
  // Zelfde diersoort weegt het zwaarst: een hond tussen drie mezen is geen
  // vraag, die herken je zonder te kijken.
  if (bird.tags?.kind && candidate.tags?.kind === bird.tags.kind) score += 6;
  if (bird.tags?.family && candidate.tags?.family === bird.tags.family) score += 4;
  // Hondenrassen hebben geen familie in de data (de FCI-groep is nergens
  // machineleesbaar te krijgen). Land van herkomst is dan de beste vervanger:
  // herders uit hetzelfde land lijken op elkaar, en zonder zo'n term wordt
  // "labrador of chihuahua?" precies de te makkelijke vraag waarvoor dit
  // module bestaat.
  if (!bird.tags?.family && bird.origin_en && candidate.origin_en === bird.origin_en) score += 3;
  // Bouwstijlen: tijdgenoten zijn de verwarrende buren. Neogotiek naast
  // neorenaissance is de vraag die je op straat ook echt hebt; neogotiek naast
  // Superdutch is er geen.
  if (bird.tags?.era && candidate.tags?.era === bird.tags.era) score += 3;
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
  const seen = new Set([displayName ? displayName(bird) : bird.id]);
  const scored = [];
  for (const candidate of pool) {
    if (candidate === bird) continue;
    const name = displayName ? displayName(candidate) : candidate.id;
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
