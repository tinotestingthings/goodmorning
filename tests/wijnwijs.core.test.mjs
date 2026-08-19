// Kerngedrag van de herbouwde WijnWijs (sandbox/wine/src): SRS-planning,
// sessie-opbouw, streak/dagteller en de eerlijke statistieken.
// Draaien: node tests/wijnwijs.core.test.mjs   (geen dependencies)

import assert from "node:assert/strict";
import { gradeReview, buildSession, weakIds } from "../sandbox/wine/src/core/srs.js";
import { registerAnswer, coverage, mastery, weekBars, displayStreak } from "../sandbox/wine/src/core/stats.js";
import { todayKey, shiftDays } from "../sandbox/wine/src/core/state.js";
import { QUESTIONS } from "../sandbox/wine/src/data/questions.js";

const today = todayKey();
const yesterday = shiftDays(today, -1);
let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

function baseState(extra = {}) {
  return {
    version: 3, activeLevel: "SDEN 2", xp: 0, streak: 0, lastPracticeDate: "",
    dailyGoal: 10, reviews: {}, ignoredIds: [], tastings: [], practiceLog: {},
    ...extra
  };
}

// ---- vragenbank ----

test("bank: 210 vragen, unieke ids, geldige answer-index", () => {
  assert.equal(QUESTIONS.length, 210);
  const ids = new Set(QUESTIONS.map((q) => q.id));
  assert.equal(ids.size, 210);
  for (const q of QUESTIONS) {
    assert.ok(q.answer >= 0 && q.answer < q.options.length, q.id);
    assert.ok(q.type !== "truefalse" || q.options.length === 2, q.id);
  }
});

test("bank: alle topics vallen binnen de 11-structuur", () => {
  const topics = new Set(QUESTIONS.map((q) => q.topic));
  assert.equal(topics.size, 11);
  assert.ok(!topics.has("Frankrijk"), "oude starter-topics zijn hernoemd");
  assert.ok(!topics.has("Vinificatie"));
});

// ---- SRS ----

test("gradeReview: eerste keer goed -> herhaling morgen", () => {
  const r = gradeReview(undefined, true);
  assert.equal(r.repetitions, 1);
  assert.equal(r.interval, 1);
  assert.equal(r.due, shiftDays(today, 1));
});

test("gradeReview: tweede keer goed -> interval 3, daarna groeiend", () => {
  const r1 = gradeReview(undefined, true);
  const r2 = gradeReview(r1, true);
  assert.equal(r2.interval, 3);
  const r3 = gradeReview(r2, true);
  assert.ok(r3.interval >= 4);
});

test("gradeReview: fout -> reset naar morgen, ease daalt maar niet onder 1.3", () => {
  let r = gradeReview(undefined, true);
  r = gradeReview(r, false);
  assert.equal(r.repetitions, 0);
  assert.equal(r.interval, 1);
  for (let i = 0; i < 20; i++) r = gradeReview(r, false);
  assert.ok(r.ease >= 1.3);
});

test("buildSession: due-vragen komen vóór nieuwe vragen", () => {
  const dueId = QUESTIONS[5].id;
  const state = baseState({
    reviews: { [dueId]: { repetitions: 1, interval: 1, ease: 2.5, due: yesterday, correct: 1, wrong: 0 } }
  });
  for (let i = 0; i < 5; i++) {
    assert.equal(buildSession(state, 6)[0], dueId);
  }
});

test("buildSession: respecteert opzijgezette vragen", () => {
  const banned = QUESTIONS[0].id;
  const state = baseState({ ignoredIds: [banned] });
  for (let i = 0; i < 10; i++) {
    assert.ok(!buildSession(state, 210).includes(banned));
  }
});

test("weakIds: alleen vragen met meer fout dan goed (of recent fout)", () => {
  const [a, b] = [QUESTIONS[0].id, QUESTIONS[1].id];
  const state = baseState({
    reviews: {
      [a]: { repetitions: 3, interval: 7, ease: 2.6, due: today, correct: 5, wrong: 1 },
      [b]: { repetitions: 0, interval: 1, ease: 2.1, due: today, correct: 1, wrong: 3 }
    }
  });
  const weak = weakIds(state);
  assert.ok(weak.includes(b));
  assert.ok(!weak.includes(a));
});

// ---- streak & logboek ----

test("registerAnswer: eerste sessie ooit -> streak 1", () => {
  const m = registerAnswer(baseState());
  assert.equal(m.streak, 1);
  assert.equal(m.lastPracticeDate, today);
  assert.equal(m.practiceLog[today], 1);
});

test("registerAnswer: gisteren geoefend -> streak +1", () => {
  const m = registerAnswer(baseState({ streak: 4, lastPracticeDate: yesterday }));
  assert.equal(m.streak, 5);
});

test("registerAnswer: dag overgeslagen -> streak terug naar 1", () => {
  const m = registerAnswer(baseState({ streak: 9, lastPracticeDate: shiftDays(today, -3) }));
  assert.equal(m.streak, 1);
});

test("registerAnswer: tweede antwoord vandaag verhoogt alleen het logboek", () => {
  const s = baseState({ streak: 2, lastPracticeDate: today, practiceLog: { [today]: 5 } });
  const m = registerAnswer(s);
  assert.equal(m.streak, 2);
  assert.equal(m.practiceLog[today], 6);
});

test("displayStreak: gebroken streak toont 0", () => {
  assert.equal(displayStreak(baseState({ streak: 7, lastPracticeDate: shiftDays(today, -2) })), 0);
  assert.equal(displayStreak(baseState({ streak: 7, lastPracticeDate: yesterday })), 7);
});

// ---- eerlijke statistieken ----

test("coverage: 10 beantwoorde vragen op 210 is 5%, niet 100%", () => {
  const reviews = {};
  QUESTIONS.slice(0, 10).forEach((q) => {
    reviews[q.id] = { repetitions: 1, interval: 1, ease: 2.5, due: today, correct: 1, wrong: 0 };
  });
  assert.equal(coverage(baseState({ reviews })), 5);
});

test("mastery: kent geen plafond van 88", () => {
  const reviews = {};
  QUESTIONS.forEach((q) => {
    reviews[q.id] = { repetitions: 3, interval: 7, ease: 2.6, due: today, correct: 3, wrong: 0 };
  });
  assert.equal(mastery(baseState({ reviews })), 100);
});

test("weekBars: telt echte dagen, vandaag zit in de juiste kolom", () => {
  const state = baseState({ practiceLog: { [today]: 8 } });
  const bars = weekBars(state);
  assert.equal(bars.length, 7);
  const todayBar = bars.find((b) => b.isToday);
  assert.equal(todayBar.count, 8);
  assert.equal(bars.reduce((s, b) => s + b.count, 0), 8);
});

console.log(`\nWijnWijs core: ${passed} tests geslaagd.`);
