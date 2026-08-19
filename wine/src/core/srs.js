// Spaced repetition (SM-2-variant, zelfde parameters als de oude app) en
// sessie-opbouw. Een "review" is {repetitions, interval, ease, due, correct,
// wrong}; due is een YYYY-MM-DD-sleutel.

import { QUESTIONS } from "../data/questions.js";
import { todayKey, shiftDays } from "./state.js";

export function questionById(id) {
  return QUESTIONS.find((q) => q.id === id);
}

// Actieve pool voor een niveau: alle vragen van dat niveau, minus opzijgezet.
export function activePool(state) {
  return QUESTIONS.filter(
    (q) => q.level.includes(state.activeLevel) && !state.ignoredIds.includes(q.id)
  );
}

export function levelHasContent(level) {
  return QUESTIONS.some((q) => q.level.includes(level) && q.level.length === 1) ||
    QUESTIONS.filter((q) => q.level.includes(level)).length >= 50;
}

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Sessie-opbouw: eerst vragen waarvan de herhaling vandaag (of eerder) gepland
// staat, dan nieuwe vragen, dan de rest — alles binnen de groep geschud.
export function buildSession(state, size, ids) {
  const today = todayKey();
  let pool;
  if (ids && ids.length) {
    const set = new Set(ids);
    pool = QUESTIONS.filter((q) => set.has(q.id));
  } else {
    pool = activePool(state);
  }
  const due = [];
  const fresh = [];
  const rest = [];
  for (const q of pool) {
    const r = state.reviews[q.id];
    if (r && r.due <= today) due.push(q);
    else if (!r) fresh.push(q);
    else rest.push(q);
  }
  return [...shuffled(due), ...shuffled(fresh), ...shuffled(rest)]
    .slice(0, size)
    .map((q) => q.id);
}

// Zwakke plekken: vragen die je vaker fout dan goed had, of recent fout.
export function weakIds(state) {
  return activePool(state)
    .filter((q) => {
      const r = state.reviews[q.id];
      return r && (r.wrong > r.correct || (r.wrong > 0 && r.repetitions === 0));
    })
    .map((q) => q.id);
}

export function dueCount(state) {
  const today = todayKey();
  return activePool(state).filter((q) => {
    const r = state.reviews[q.id];
    return r && r.due <= today;
  }).length;
}

// Beoordeel een antwoord en geef de nieuwe review terug.
export function gradeReview(existing, correct) {
  const today = todayKey();
  const r = existing || {
    repetitions: 0, interval: 0, ease: 2.5, due: today, correct: 0, wrong: 0
  };
  const repetitions = correct ? r.repetitions + 1 : 0;
  const interval = correct
    ? repetitions === 1 ? 1 : repetitions === 2 ? 3 : Math.max(4, Math.round(r.interval * r.ease))
    : 1;
  const ease = Math.max(1.3, r.ease + (correct ? 0.08 : -0.2));
  return {
    repetitions,
    interval,
    ease,
    due: shiftDays(today, interval),
    correct: r.correct + (correct ? 1 : 0),
    wrong: r.wrong + (correct ? 0 : 1)
  };
}
