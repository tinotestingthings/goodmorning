// ---------------------------------------------------------------------------
// Selectors voor de statuskaart en de drie oefensessies.
//
// Overgezet uit de losse progress.js van de goodmorning-integratie. Die had een
// eigen kopie van de Leitner-logica; hier komt alles uit leitner.js, zodat de
// boxen op een plek gedefinieerd blijven.
// ---------------------------------------------------------------------------

import { allBirds, hasPhoto } from "./birds.js";
import { boxInfo, BOX_COUNT } from "./leitner.js";

const KNOWN_BOX = 2;     // "goed gehad" -- minstens een keer goed beantwoord
const LEARNED_BOX = 3;   // telt als "geleerd" op de statuskaart
const MASTERED_BOX = 5;  // hoogste box = beheerst
const WEAK_MIN_SEEN = 2; // een paar pogingen nodig voor "lastig"
const WEAK_ACCURACY = 0.6;

export function collectionCounts() {
  const birds = allBirds();
  const boxes = new Array(BOX_COUNT).fill(0);
  let seen = 0, learned = 0, mastered = 0, fresh = 0;
  for (const bird of birds) {
    const info = boxInfo(bird);
    if (!info.started) { fresh += 1; continue; }
    seen += 1;
    boxes[Math.min(info.box, BOX_COUNT) - 1] += 1;
    if (info.box >= MASTERED_BOX) mastered += 1;
    else if (info.box >= LEARNED_BOX) learned += 1;
  }
  return { total: birds.length, seen, fresh, learned: learned + mastered, mastered, boxes };
}

export function dueBirds() {
  const now = Date.now();
  return allBirds().filter((b) => {
    const info = boxInfo(b);
    return info.started && info.dueAt <= now && hasPhoto(b);
  });
}

export function knownPool() {
  return allBirds().filter((b) => {
    const info = boxInfo(b);
    return info.started && info.box >= KNOWN_BOX && hasPhoto(b);
  });
}

export function weakPool() {
  return allBirds().filter((b) => {
    const info = boxInfo(b);
    if (!info.started || !hasPhoto(b)) return false;
    if (info.seen >= WEAK_MIN_SEEN && info.correct / info.seen < WEAK_ACCURACY) return true;
    return info.box === 1 && info.wrong > 0;
  });
}
