// ---------------------------------------------------------------------------
// De vogel van vandaag: elke dag één uitgelichte soort uit de cursus.
//
// Puur decoratief -- het raakt de Leitner-planning niet en kost geen budget.
// Het bestaat omdat het homescherm anders alleen cijfers toont: één vogel om
// naar te kijken maakt het scherm vrolijk zonder het voller te maken.
//
// De keuze is DETERMINISTISCH per kalenderdag: dezelfde dag geeft dezelfde
// vogel (ook na een herstart, en op elk apparaat), en de stap van 37 per dag
// loopt de hele lijst rond zonder twee dagen achter elkaar dezelfde soort --
// 37 is priem en dus copriem met elke lijstlengte onder de 37 keer 2.
// ---------------------------------------------------------------------------

import { activeCourse } from "./course.js";
import { hasPhoto } from "./birds.js";

const STRIDE = 37;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Lokale kalenderdag als dagnummer -- dezelfde dagdefinitie als stats.js. */
function dayNumber(date = new Date()) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(local.getTime() / DAY_MS);
}

/**
 * De uitgelichte vogel voor `date`, of null als de cursus geen enkele soort
 * met foto bevat (dan toont het homescherm dit blok gewoon niet).
 */
export function birdOfTheDay(date = new Date()) {
  const pool = activeCourse().birds.filter(hasPhoto);
  if (pool.length === 0) return null;
  return pool[(dayNumber(date) * STRIDE) % pool.length];
}
