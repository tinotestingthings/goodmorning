// ---------------------------------------------------------------------------
// De cursus: een geordende, eindige leerlijst ("leer deze 100 vogels") bovenop
// de Leitner-state. De cursus bepaalt WELKE nieuwe soorten je leert en in welke
// volgorde; leitner.js bepaalt WANNEER een eenmaal geleerde soort terugkomt.
//
// Er zijn er vier (zie src/data/courses.js) en je kiest er één als actief.
// Dagkaart, oefensessie en de voortgang op Home volgen die keuze -- dat is het
// verschil tussen "ik kan bouwstijlen opzoeken" en "ik leer bouwstijlen".
//
// Voortgang wordt niet apart opgeslagen: alles is afleidbaar uit de
// Leitner-state. Wisselen van cursus raakt dus NIETS kwijt -- de voortgang van
// de vorige cursus staat er onveranderd nog, je telt hem alleen even niet mee.
// ---------------------------------------------------------------------------

import { buildCourses } from "../data/courses.js";
import { hasPhoto, speciesById } from "./birds.js";
import { boxInfo, BOX_COUNT } from "./leitner.js";
import { EVENTS, emit } from "./events.js";
import { KEYS, read, write } from "./storage.js";

const LEARNED_BOX = 3; // zelfde drempel als progress.js: vanaf box 3 telt "geleerd"

let courses = null;
let activeId = null;

/**
 * Alle cursussen die daadwerkelijk iets te leren hebben, één keer opgelost
 * tegen de dataset. Een cursus waarvan het databestand niet laadde (street.json
 * kan falen) houdt nul soorten over en verdwijnt hier, zodat hij ook niet te
 * kiezen is.
 */
export function allCourses() {
  if (!courses) {
    courses = buildCourses()
      .map((course) => {
        const birds = course.ids.map(speciesById).filter(Boolean);
        // Set erbij: inCourse() wordt per herhaling in een filter aangeroepen,
        // en een lineaire zoektocht door 100 soorten per keer telt op.
        return { ...course, birds, idSet: new Set(birds.map((b) => b.id)) };
      })
      .filter((course) => course.birds.length > 0);
  }
  return courses;
}

/**
 * De actieve cursus. De opgeslagen keuze wordt hier alleen GELEZEN: bij het
 * opstarten schrijven zou een Supabase-push uitlokken voor iets wat de
 * gebruiker niet deed. Staat er niets (of iets onbekends, bijvoorbeeld omdat
 * die dataset nu niet laadde), dan is de eerste cursus de actieve -- en dat is
 * Griftpark, precies het gedrag van vóór de cursuskeuze.
 */
export function activeCourse() {
  const beschikbaar = allCourses();
  const gekozen = activeId ?? read(KEYS.course, null);
  return beschikbaar.find((c) => c.id === gekozen) ?? beschikbaar[0] ?? null;
}

export function activeCourseId() {
  return activeCourse()?.id ?? null;
}

/** Van cursus wisselen. Schrijft wél weg: dit is een keuze van de gebruiker. */
export function setActiveCourse(id) {
  if (!allCourses().some((c) => c.id === id)) return;
  if (id === activeCourseId()) return;
  activeId = id;
  write(KEYS.course, id);
  emit(EVENTS.courseChanged, id);
}

export function inCourse(bird) {
  return activeCourse()?.idSet.has(bird.id) ?? false;
}

/** Hoe vaak de luistervink deze soort in het Griftpark hoorde (of null). */
export function courseDetections(bird) {
  return activeCourse()?.detections?.get(bird.id) ?? null;
}

/**
 * Voortgang binnen de actieve cursus, voor de statuskaart op Home:
 * gestart (ooit gezien), geleerd (box >= 3) en beheerst (hoogste box).
 */
export function courseProgress() {
  const birds = activeCourse()?.birds ?? [];
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
 * De volgende `count` nog niet gestarte soorten uit de actieve cursus, in
 * cursusvolgorde. Alleen soorten met foto: zonder foto valt er niets te
 * overhoren.
 */
export function nextNewBirds(count) {
  const fresh = [];
  for (const bird of activeCourse()?.birds ?? []) {
    if (fresh.length >= count) break;
    if (!hasPhoto(bird)) continue;
    if (!boxInfo(bird).started) fresh.push(bird);
  }
  return fresh;
}
