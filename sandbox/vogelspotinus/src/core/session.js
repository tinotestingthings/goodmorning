// ---------------------------------------------------------------------------
// De oefensessie: een BEGRENSDE reeks met een einde en een samenvatting.
//
// Opbouw van een sessie:
//   1. Herhalingen eerst: alle vervallen kaarten, afgekapt op REVIEW_CAP.
//   2. Nieuwe vogels erdoorheen: maximaal NEW_PER_DAY per dag (over sessies
//      heen geteld), in cursusvolgorde -- vaakst gehoord in het Griftpark
//      eerst. Elke nieuwe vogel krijgt een introkaart en even later zijn
//      eerste vraag.
//   3. Fout beantwoord? De vogel komt even verderop in dezelfde sessie terug
//      (ongeteld) tot hij een keer goed gaat -- je verlaat de sessie niet met
//      een vogel die je alleen maar fout had.
//
// Alleen het EERSTE antwoord per vogel telt voor de Leitner-planning; de
// herkansingen zijn oefening binnen de sessie, geen dubbele bestraffing.
//
// Dit verving twee structurele fouten in de oude aanpak: sessies zonder einde
// (pickNext deelde de hele pool opnieuw uit zodra niets meer "due" was) en
// een onbegrensde stroom nieuwe vogels die de echte herhalingen verdrong.
// ---------------------------------------------------------------------------

import { dueBirds } from "./progress.js";
import { activeCourse, inCourse, nextNewBirds } from "./course.js";
import { boxInfo, recordAnswer } from "./leitner.js";
import { bumpNewToday, newTodayCount } from "./stats.js";
import { allBirds, hasPhoto } from "./birds.js";
import { pickDistractors } from "./distractors.js";
import { shuffle } from "./dom.js";

const REVIEW_CAP = 20;
export const NEW_PER_DAY = 5;
const RETRY_GAP = 3;      // aantal vragen tussen fout antwoord en herkansing
const INTRO_TEST_GAP = 2; // aantal vragen tussen introkaart en eerste vraag
const SOUND_CUE_CHANCE = 0.35;
const PHOTO_PICK_CHANCE = 0.25;
const OPTION_COUNT = 4;

/**
 * Welke vraagvorm past bij deze vogel, op dit niveau?
 *  - cue "sound": af en toe, zodra de vogel niet gloednieuw is -- het
 *    Griftpark-bronmateriaal is nota bene een geluidsdetector.
 *  - response "type": vanaf box 4 moet de naam uit het geheugen komen,
 *    herkennen uit vier opties is dan te makkelijk.
 *  - response "photo-choice": "welke foto is de X?" -- traint de omgekeerde
 *    richting en doorbreekt het onthouden van een foto.
 */
function questionShape(bird, { firstTest }) {
  const box = boxInfo(bird).box;
  if (firstTest) return { cue: "photo", response: "choice" };
  if (box >= 4) {
    const cue = bird.soundUrl && Math.random() < SOUND_CUE_CHANCE ? "sound" : "photo";
    return { cue, response: "type" };
  }
  if (bird.soundUrl && Math.random() < SOUND_CUE_CHANCE) {
    return { cue: "sound", response: "choice" };
  }
  if (Math.random() < PHOTO_PICK_CHANCE) return { cue: "name", response: "photo-choice" };
  return { cue: "photo", response: "choice" };
}

/** Afleiders: uit de cursus als de vogel daarin zit, aangevuld uit de hele dataset. */
export function distractorsFor(bird, count = OPTION_COUNT - 1) {
  const everyone = allBirds().filter(hasPhoto);
  const pool = inCourse(bird) ? activeCourse().birds.filter(hasPhoto) : everyone;
  const picked = pickDistractors(bird, pool, count);
  if (picked.length < count) {
    const rest = everyone.filter((b) => b !== bird && !picked.includes(b));
    picked.push(...pickDistractors(bird, rest, count - picked.length));
  }
  return picked;
}

/**
 * Waaruit de VOLGENDE sessie zal bestaan, zonder er een te bouwen. Home leest
 * hierop, zodat de knop niet iets anders belooft dan de sessie deelt: die
 * beloofde eerst het ongelimiteerde aantal vervallen kaarten, terwijl de
 * sessie er REVIEW_CAP van neemt.
 */
export function plannedSessionSize() {
  const reviews = reviewQueue().length;
  const fresh = nextNewBirds(Math.max(0, NEW_PER_DAY - newTodayCount())).length;
  return { reviews, fresh, total: reviews + fresh };
}

/**
 * De herhalingen voor één sessie, afgekapt op REVIEW_CAP.
 *
 * Cursusvogels krijgen de plekken eerst. Vrij oefenen schrijft namelijk ook
 * Leitner-rijen voor vogels BUITEN de cursus (dat is de bedoeling: wat je bent
 * gaan leren blijft terugkomen), maar zonder voorrang vulde één avond vrij
 * oefenen de Griftpark-sessie met exoten -- 462 van de 561 oefenbare vogels
 * zitten niet in de cursus. De rest schuift aan zolang er plek over is.
 */
function reviewQueue() {
  const due = dueBirds();
  const mine = shuffle(due.filter(inCourse));
  const rest = shuffle(due.filter((b) => !inCourse(b)));
  return [...mine, ...rest].slice(0, REVIEW_CAP);
}

/**
 * Zet herhalingen en nieuwe vogels in één rij, met echte ruimte tussen de
 * introkaart van een vogel en zijn eerste vraag.
 *
 * De vorige versie rekende de posities vooruit met splice + Math.min, en die
 * clamp liet de tussenruimte naar NUL zakken zodra er weinig te herhalen was --
 * precies op dag één. Je kreeg de vraag dan direct na de introkaart, met de
 * foto nog op je netvlies, en beantwoordde vijf nieuwe vogels "goed" zonder ze
 * te kennen. Nu houden we de wachtenden bij en laten we een vraag pas los als
 * er genoeg tussen zit; is er niets meer om mee te vullen, dan schuiven de
 * intro's van de andere nieuwe vogels ertussen.
 */
function buildQueue(reviews, fresh) {
  const items = [];
  const waiting = [];
  let r = 0;
  let f = 0;

  const release = () => {
    while (waiting.length && items.length - waiting[0].at > INTRO_TEST_GAP) {
      items.push({ kind: "test", bird: waiting.shift().bird, counts: true, firstTest: true });
    }
  };

  while (r < reviews.length || f < fresh.length) {
    release();
    // Nieuwe vogels gelijkmatig over de sessie uitsmeren in plaats van vooraan
    // te proppen: pak er een zodra dit aandeel achterloopt op de voortgang.
    const takeFresh =
      f < fresh.length &&
      (r >= reviews.length || f * (reviews.length + fresh.length) <= items.length * fresh.length);
    if (takeFresh) {
      items.push({ kind: "intro", bird: fresh[f], counts: false, firstTest: false });
      waiting.push({ bird: fresh[f], at: items.length - 1 });
      f += 1;
    } else {
      items.push({ kind: "test", bird: reviews[r], counts: true, firstTest: false });
      r += 1;
    }
  }

  // Staart: wat nog wacht komt eruit, elke ronde eentje, zodat er altijd
  // minstens één andere kaart tussen een introkaart en zijn vraag zit.
  while (waiting.length) {
    release();
    if (waiting.length) {
      items.push({ kind: "test", bird: waiting.shift().bird, counts: true, firstTest: true });
    }
  }
  return items;
}

/**
 * Bouw en beheer een sessie. De items muteren onderweg (herkansingen worden
 * ingevoegd), dus de voortgangsbalk rekent met een levend totaal.
 */
export function createSession() {
  const budget = Math.max(0, NEW_PER_DAY - newTodayCount());
  const items = buildQueue(reviewQueue(), nextNewBirds(budget));

  let index = 0;
  const outcome = {
    answered: 0,
    correct: 0,
    newIntroduced: 0,
    /** Vogels die deze sessie fout gingen, voor de samenvatting. */
    missed: new Set(),
  };

  return {
    get length() {
      return items.length;
    },
    get position() {
      return index;
    },
    get isEmpty() {
      return items.length === 0;
    },
    current() {
      return items[index] ?? null;
    },
    /** Vraagvorm voor het huidige testitem; per item een keer bepalen. */
    shapeFor(item) {
      return questionShape(item.bird, { firstTest: item.firstTest });
    },
    /**
     * Introkaart gezien. Dit kost GEEN dagbudget: dat gebeurt pas bij het
     * eerste antwoord (zie answer()).
     *
     * Het budget hing hier eerst aan, en dat pakte verkeerd uit: de kaart
     * verschijnt zodra het scherm rendert, dus een sessie openen en weglopen
     * schreef een nieuwe vogel af zonder dat je iets leerde. De vogel bleef
     * ongestart, werd volgende sessie opnieuw aangeboden en opnieuw
     * afgeschreven -- vijf keer openen en je dag was op met nul geleerde
     * vogels. Nu blijft dit puur een weergave-signaal voor de samenvatting.
     */
    introShown(item) {
      if (item.kind !== "intro" || item.introCounted) return;
      item.introCounted = true;
    },
    /**
     * Antwoord op het huidige testitem. Alleen het eerste (tellende) antwoord
     * per vogel gaat de Leitner-planning in; een fout plant bovendien een
     * ongetelde herkansing verderop in deze sessie.
     */
    answer(item, correct) {
      if (item.counts) {
        // Het dagbudget gaat eraf op het moment dat een nieuwe vogel echt in
        // de planning terechtkomt -- recordAnswer schrijft dan zijn eerste rij.
        if (item.firstTest) {
          bumpNewToday();
          outcome.newIntroduced += 1;
        }
        recordAnswer(item.bird, correct);
        outcome.answered += 1;
        if (correct) outcome.correct += 1;
      }
      if (!correct) {
        outcome.missed.add(item.bird);
        const retryAt = Math.min(items.length, index + 1 + RETRY_GAP);
        items.splice(retryAt, 0, { kind: "test", bird: item.bird, counts: false, firstTest: false });
      } else {
        outcome.missed.delete(item.bird);
      }
    },
    advance() {
      index += 1;
      return items[index] ?? null;
    },
    summary() {
      return { ...outcome, missed: [...outcome.missed] };
    },
  };
}
