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

/** @type {Record<string, {box: number, dueAt: number}>} gesleuteld op soort-id */
let state = {};

export function loadLeitnerState() {
  const stored = read(KEYS.leitner, {});
  state = stored && typeof stored === "object" ? stored : {};
}

function entryFor(bird) {
  return state[bird.id] ?? { box: 1, dueAt: 0 };
}

/**
 * Genormaliseerde rij voor een vogel: alle velden aanwezig, plus `started`
 * (staat er uberhaupt een rij voor deze vogel). progress.js leest hierop, zodat
 * de box-logica op een plek blijft.
 */
export function boxInfo(bird) {
  const raw = state[bird.id];
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
  state[bird.id] = {
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
 * The next bird to drill: the most-due card, lowest box and longest overdue
 * first, picked randomly within a small window so a session doesn't replay in
 * a fixed order. Returns null when nothing is due -- the old fallback ("just
 * deal the whole pool again") meant a review session literally never ended:
 * after the last due card it started re-dealing cards you had just answered.
 */
export function pickNext(pool) {
  const now = Date.now();
  const due = pool
    .map((bird) => ({ bird, entry: entryFor(bird) }))
    .filter((x) => x.entry.dueAt <= now);
  if (due.length === 0) return null;
  due.sort((a, b) => a.entry.box - b.entry.box || a.entry.dueAt - b.entry.dueAt);
  const window = due.slice(0, Math.min(PICK_WINDOW, due.length));
  return shuffle(window)[0].bird;
}

/** Counts for the progress readout, over whatever pool is currently selected. */
export function progress(pool) {
  let fresh = 0;
  let reviewing = 0;
  let mastered = 0;
  for (const bird of pool) {
    const entry = state[bird.id];
    if (!entry) fresh += 1;
    else if (entry.box >= BOX_COUNT) mastered += 1;
    else reviewing += 1;
  }
  return { fresh, reviewing, mastered };
}
