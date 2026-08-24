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
import { allBirds, hasPhoto } from "./birds.js";

const STRIDE = 37;
const DAY_MS = 24 * 60 * 60 * 1000;
/**
 * Hoeveel hondenrassen meedoen aan de dagkaart.
 *
 * De cursus is een vogellijst, dus zonder dit zou "Dier van vandaag" altijd een
 * vogel zijn. Alle 361 rassen meenemen zou het omgekeerde probleem geven: je
 * krijgt vooral rassen waar niemand ooit van hoorde. De populairste 50 (op
 * Wikipedia-bezoeken) zijn precies de honden die je op straat tegenkomt.
 */
const DAILY_DOGS = 50;

/** Lokale kalenderdag als dagnummer -- dezelfde dagdefinitie als stats.js. */
function dayNumber(date = new Date()) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(local.getTime() / DAY_MS);
}

/**
 * Cursusvogels plus de bekendste honden. Bewust ZONDER foto-filter, zodat de
 * lengte van deze lijst niet afhangt van wat er al geladen is -- zie
 * speciesOfTheDay().
 */
function dailyPool() {
  const dogs = allBirds()
    .filter((s) => s.tags?.kind === "dog")
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, DAILY_DOGS);
  return [...activeCourse().birds, ...dogs];
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
