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
  const reviews = Math.min(dueBirds().length, REVIEW_CAP);
  const fresh = nextNewBirds(Math.max(0, NEW_PER_DAY - newTodayCount())).length;
  return { reviews, fresh, total: reviews + fresh };
}

/**
 * Bouw en beheer een sessie. De items muteren onderweg (herkansingen worden
 * ingevoegd), dus de voortgangsbalk rekent met een levend totaal.
 */
export function createSession() {
  const reviews = shuffle(dueBirds().slice()).slice(0, REVIEW_CAP);
  const budget = Math.max(0, NEW_PER_DAY - newTodayCount());
  const fresh = nextNewBirds(budget);

  /** @type {Array<{kind: "intro"|"test", bird: object, counts: boolean, firstTest: boolean}>} */
  const items = reviews.map((bird) => ({ kind: "test", bird, counts: true, firstTest: false }));

  // Nieuwe vogels verspreid tussen de herhalingen: intro, even wat anders,
  // dan de eerste vraag. Zo landt de naam voordat hij wordt overhoord, maar
  // niet met de foto nog op het netvlies.
  fresh.forEach((bird, i) => {
    const introAt = Math.min(items.length, i * (INTRO_TEST_GAP + 2));
    items.splice(introAt, 0, { kind: "intro", bird, counts: false, firstTest: false });
    const testAt = Math.min(items.length, introAt + 1 + INTRO_TEST_GAP);
    items.splice(testAt, 0, { kind: "test", bird, counts: true, firstTest: true });
  });

  let index = 0;
  const outcome = {
    answered: 0,
    correct: 0,
    newIntroduced: 0,
    reviewsDone: 0,
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
    /** Introkaart gezien: telt mee voor het dagbudget nieuwe vogels.
     *  Idempotent per item -- een re-render (bv. taalwissel) telt niet dubbel. */
    introShown(item) {
      if (item.kind !== "intro" || item.introCounted) return;
      item.introCounted = true;
      bumpNewToday();
      outcome.newIntroduced += 1;
    },
    /**
     * Antwoord op het huidige testitem. Alleen het eerste (tellende) antwoord
     * per vogel gaat de Leitner-planning in; een fout plant bovendien een
     * ongetelde herkansing verderop in deze sessie.
     */
    answer(item, correct) {
      if (item.counts) {
        recordAnswer(item.bird, correct);
        outcome.answered += 1;
        if (correct) outcome.correct += 1;
        if (!item.firstTest) outcome.reviewsDone += 1;
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
