// ---------------------------------------------------------------------------
// De soort van vandaag: elke dag één uitgelichte soort uit de ACTIEVE cursus.
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
 * De soorten van de actieve cursus. Vroeger stonden hier de cursusvogels plús
 * de vijftig bekendste honden, omdat de cursus per definitie een vogellijst was
 * en "Dier van vandaag" anders nooit een hond toonde. Nu je een cursus kiest,
 * hoort de dagkaart bij die keuze: leer je bouwstijlen, dan is de kaart een
 * bouwstijl. Honden hebben hun eigen cursus.
 *
 * Bewust ZONDER foto-filter, zodat de lengte van deze lijst niet afhangt van
 * wat er al geladen is -- zie speciesOfTheDay().
 */
function dailyPool() {
  return activeCourse()?.birds ?? [];
}

/**
 * De uitgelichte soort voor `date`, of null als er geen enkele soort met foto
 * is (dan toont het homescherm dit blok gewoon niet).
 *
 * EERST de index bepalen, DAAROM PAS op foto filteren. Andersom -- filteren en
 * dan indexeren -- maakt de poollengte afhankelijk van of photos.js zijn
 * ontbrekende basisfoto's al heeft aangevuld, en dat gebeurt asynchroon ná de
 * eerste render. De havik (Accipiter gentilis) is zo'n geval: met hem erbij is
 * de pool 150 lang en valt de keuze op index 119, zonder hem 149 en index 6.
 * Twee heel verschillende dieren op dezelfde dag, afhankelijk van wie de race
 * won. Nu ligt de index vast en stappen we alleen vooruit als de gekozen soort
 * (nog) geen foto heeft.
 */
export function speciesOfTheDay(date = new Date()) {
  const candidates = dailyPool();
  if (candidates.length === 0) return null;
  const start = (dayNumber(date) * STRIDE) % candidates.length;
  for (let step = 0; step < candidates.length; step += 1) {
    const candidate = candidates[(start + step) % candidates.length];
    if (hasPhoto(candidate)) return candidate;
  }
  return null;
}
