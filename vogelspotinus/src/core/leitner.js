// ---------------------------------------------------------------------------
// Leitner spaced-repetition scheduling. Pure logic + persistence, no DOM --
// the study screen renders it, this module decides what is due.
// ---------------------------------------------------------------------------

import { KEYS, read, write } from "./storage.js";
import { shuffle } from "./dom.js";
import { bumpDailyStat } from "./stats.js";

export const BOX_COUNT = 5;

/** Days until the next review after a card moves INTO box N (index 0 unused). */
const INTERVAL_DAYS = [0, 0, 1, 3, 7, 30];
const DAY_MS = 24 * 60 * 60 * 1000;

/** How many of the most-due cards to pick randomly from, so drills aren't identical. */
const PICK_WINDOW = 5;

/** @type {Record<string, {box: number, dueAt: number}>} */
let state = {};

export function loadLeitnerState() {
  const stored = read(KEYS.leitner, {});
  state = stored && typeof stored === "object" ? stored : {};
}

function entryFor(bird) {
  return state[bird.scientificName] ?? { box: 1, dueAt: 0 };
}

/**
 * Genormaliseerde rij voor een vogel: alle velden aanwezig, plus `started`
 * (staat er uberhaupt een rij voor deze vogel). progress.js leest hierop, zodat
 * de box-logica op een plek blijft.
 */
export function boxInfo(bird) {
  const raw = state[bird.scientificName];
  return {
    started: !!raw,
    box: raw?.box ?? 1,
    dueAt: raw?.dueAt ?? 0,
    seen: raw?.seen ?? 0,
    correct: raw?.correct ?? 0,
    wrong: raw?.wrong ?? 0,
    lastSeen: raw?.lastSeen ?? 0,
  };
}

/** Record an honest self-report. Correct promotes one box; a miss resets to box 1. */
export function recordAnswer(bird, knewIt) {
  const before = entryFor(bird);
  const box = knewIt ? Math.min(BOX_COUNT, before.box + 1) : 1;
  // seen/correct/wrong/lastSeen worden meegedragen: bestaande rijen hebben ze
  // al en de vault-backup rekent erop. Ze alleen op {box,dueAt} overschrijven
  // wist die historie bij het eerstvolgende antwoord.
  state[bird.scientificName] = {
    box,
    dueAt: Date.now() + INTERVAL_DAYS[box] * DAY_MS,
    seen: (before.seen ?? 0) + 1,
    correct: (before.correct ?? 0) + (knewIt ? 1 : 0),
    wrong: (before.wrong ?? 0) + (knewIt ? 0 : 1),
    lastSeen: Date.now(),
  };
  write(KEYS.leitner, state);
  bumpDailyStat();
}

/**
 * The next bird to drill: prefer cards that are actually due, lowest box and
 * longest overdue first, then pick randomly within a small window so a session
 * doesn't replay in a fixed order. Falls back to the whole pool when nothing
 * is due, so the screen is never empty while cards exist.
 */
export function pickNext(pool) {
  if (pool.length === 0) return null;
  const now = Date.now();
  const scored = pool.map((bird) => ({ bird, entry: entryFor(bird) }));
  const due = scored.filter((x) => x.entry.dueAt <= now);
  const candidates = due.length ? due : scored;
  candidates.sort((a, b) => a.entry.box - b.entry.box || a.entry.dueAt - b.entry.dueAt);
  const window = candidates.slice(0, Math.min(PICK_WINDOW, candidates.length));
  return shuffle(window)[0].bird;
}

/** Counts for the progress readout, over whatever pool is currently selected. */
export function progress(pool) {
  let fresh = 0;
  let reviewing = 0;
  let mastered = 0;
  for (const bird of pool) {
    const entry = state[bird.scientificName];
    if (!entry) fresh += 1;
    else if (entry.box >= BOX_COUNT) mastered += 1;
    else reviewing += 1;
  }
  return { fresh, reviewing, mastered };
}
