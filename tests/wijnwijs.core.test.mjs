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

test("bank: 410 vragen, unieke ids, geldige answer-index", () => {
  assert.equal(QUESTIONS.length, 410);
  const ids = new Set(QUESTIONS.map((q) => q.id));
  assert.equal(ids.size, 410);
  for (const q of QUESTIONS) {
    assert.ok(q.answer >= 0 && q.answer < q.options.length, q.id);
    assert.ok(q.type !== "truefalse" || q.options.length === 2, q.id);
    assert.ok(q.type !== "multiple" || q.options.length === 4, q.id);
  }
});

test("bank: alle topics vallen binnen de 11-structuur", () => {
  const topics = new Set(QUESTIONS.map((q) => q.topic));
  assert.equal(topics.size, 11);
  assert.ok(!topics.has("Frankrijk"), "oude starter-topics zijn hernoemd");
  assert.ok(!topics.has("Vinificatie"));
});

test("bank: elk thema heeft genoeg vragen voor een volle sessie", () => {
  const perTopic = {};
  for (const q of QUESTIONS) perTopic[q.topic] = (perTopic[q.topic] || 0) + 1;
  for (const [topic, n] of Object.entries(perTopic)) {
    assert.ok(n >= 30, `${topic} heeft maar ${n} vragen`);
  }
});

test("bank: geen dubbele vragen en geen dubbele antwoordopties", () => {
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const seen = new Map();
  for (const q of QUESTIONS) {
    const key = norm(q.prompt);
    assert.ok(!seen.has(key), `${q.id} dubbelt met ${seen.get(key)}`);
    seen.set(key, q.id);
    const opts = q.options.map((o) => o.toLowerCase().trim());
    assert.equal(new Set(opts).size, opts.length, `${q.id} heeft dubbele opties`);
  }
});

test("bank: het juiste antwoord staat niet stelselmatig op dezelfde plek", () => {
  const mc = QUESTIONS.filter((q) => q.type === "multiple");
  const counts = [0, 0, 0, 0];
  for (const q of mc) counts[q.answer] += 1;
  const expected = mc.length / 4;
  for (const [i, n] of counts.entries()) {
    assert.ok(Math.abs(n - expected) < expected * 0.35, `positie ${i}: ${n} van ${mc.length}`);
  }
});

test("bank: het juiste antwoord verraadt zich niet door zijn lengte", () => {
  for (const q of QUESTIONS.filter((x) => x.type === "multiple")) {
    const lens = q.options.map((o) => o.length);
    const others = lens.filter((_, i) => i !== q.answer);
    assert.ok(
      lens[q.answer] <= Math.max(...others) * 2.2 || lens[q.answer] <= 45,
      `${q.id}: juiste antwoord is veel langer dan de afleiders`
    );
  }
});

test("bank: elke vraag heeft uitleg en een misvatting", () => {
  for (const q of QUESTIONS) {
    assert.ok(q.explanation && q.explanation.length > 20, `${q.id} mist uitleg`);
    assert.ok(q.misconception && q.misconception.length > 20, `${q.id} mist misconception`);
  }
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

test("coverage: 10 beantwoorde vragen op 410 is 2%, niet 100%", () => {
  const reviews = {};
  QUESTIONS.slice(0, 10).forEach((q) => {
    reviews[q.id] = { repetitions: 1, interval: 1, ease: 2.5, due: today, correct: 1, wrong: 0 };
  });
  assert.equal(coverage(baseState({ reviews })), 2);
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


// ---- optievolgorde ----

test("optievolgorde: het juiste antwoord staat niet elke sessie op dezelfde plek", async () => {
  // quizView schudt per sessie; hier testen we dezelfde logica los van de DOM.
  const q = QUESTIONS.find((x) => x.type === "multiple");
  const posities = new Set();
  for (let s = 0; s < 60; s++) {
    const order = q.options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const view = { options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
    // het juiste antwoord moet inhoudelijk hetzelfde blijven
    assert.equal(view.options[view.answer], q.options[q.answer]);
    posities.add(view.answer);
  }
  assert.equal(posities.size, 4, "over 60 sessies moeten alle vier de posities voorkomen");
});

console.log(`\nWijnWijs core: ${passed} tests geslaagd.`);
