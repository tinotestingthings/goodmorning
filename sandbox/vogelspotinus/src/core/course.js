// ---------------------------------------------------------------------------
// De cursus: een geordende, eindige leerlijst ("leer deze 100 vogels") bovenop
// de Leitner-state. De cursus bepaalt WELKE nieuwe vogels je leert en in welke
// volgorde; leitner.js bepaalt WANNEER een eenmaal geleerde vogel terugkomt.
//
// Voortgang wordt niet apart opgeslagen: alles is afleidbaar uit de
// Leitner-state, dus een cursuswijziging kan nooit voortgang kwijtraken.
// ---------------------------------------------------------------------------

import { GRIFTPARK_COURSE } from "../data/course-griftpark.js";
import { hasPhoto, speciesById } from "./birds.js";
import { boxInfo, BOX_COUNT } from "./leitner.js";

const LEARNED_BOX = 3; // zelfde drempel als progress.js: vanaf box 3 telt "geleerd"

let course = null;

/**
 * Resolve de soortenlijst een keer tegen de dataset; onbekende namen vallen
 * stil weg. De cursus is een VOGELlijst en noteert soortnamen; die zijn voor
 * vogels gelijk aan het id, dus opzoeken kan gewoon op id.
 */
export function activeCourse() {
  if (!course) {
    const birds = [];
    const detections = new Map();
    for (const [sci, n] of GRIFTPARK_COURSE.species) {
      const bird = speciesById(sci);
      if (!bird) continue;
      birds.push(bird);
      detections.set(bird.id, n);
    }
    course = { ...GRIFTPARK_COURSE, birds, detections };
  }
  return course;
}

export function inCourse(bird) {
  return activeCourse().detections.has(bird.id);
}

/** Hoe vaak de luistervink deze soort in het Griftpark hoorde (of null). */
export function courseDetections(bird) {
  return activeCourse().detections.get(bird.id) ?? null;
}

/**
 * Voortgang binnen de cursus, voor de statuskaart op Home:
 * gestart (ooit gezien), geleerd (box >= 3) en beheerst (hoogste box).
 */
export function courseProgress() {
  const { birds } = activeCourse();
  let started = 0;
  let learned = 0;
  let mastered = 0;
  for (const bird of birds) {
    const info = boxInfo(bird);
    if (!info.started) continue;
    started += 1;
    if (info.box >= BOX_COUNT) mastered += 1;
    else if (info.box >= LEARNED_BOX) learned += 1;
  }
  return { total: birds.length, started, learned: learned + mastered, mastered };
}

/**
 * De volgende `count` nog niet gestarte cursusvogels, in cursusvolgorde --
 * de vaakst gehoorde soorten eerst. Alleen vogels met foto: zonder foto valt
 * er niets te overhoren.
 */
export function nextNewBirds(count) {
  const fresh = [];
  for (const bird of activeCourse().birds) {
    if (fresh.length >= count) break;
    if (!hasPhoto(bird)) continue;
    if (!boxInfo(bird).started) fresh.push(bird);
  }
  return fresh;
}
