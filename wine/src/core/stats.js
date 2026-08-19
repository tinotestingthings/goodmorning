// Eerlijke statistieken. Elke formule hier is te herleiden tot echte data:
// geen plafonds, geen hardgecodeerde grafieken. (De oude app capte
// "kennisbeheersing" op 88 en tekende de weekgrafiek alleen op vrijdag.)

import { activePool } from "./srs.js";
import { todayKey, shiftDays } from "./state.js";

// Vandaag beantwoord: rechtstreeks uit het oefenlogboek.
export function answeredToday(state) {
  return state.practiceLog[todayKey()] || 0;
}

// Streak zoals getoond: de teller loopt alleen door als er gisteren of vandaag
// geoefend is; anders is hij gebroken en tonen we 0.
export function displayStreak(state) {
  const today = todayKey();
  const yesterday = shiftDays(today, -1);
  if (state.lastPracticeDate === today || state.lastPracticeDate === yesterday) {
    return state.streak;
  }
  return 0;
}

// Bij het eerste antwoord van de dag de streak bijwerken; daarna alleen het
// logboek ophogen. Geeft de mutaties terug die de caller in de state zet.
export function registerAnswer(state) {
  const today = todayKey();
  const yesterday = shiftDays(today, -1);
  let streak = state.streak;
  if (state.lastPracticeDate !== today) {
    streak = state.lastPracticeDate === yesterday ? state.streak + 1 : 1;
  }
  const practiceLog = { ...state.practiceLog, [today]: (state.practiceLog[today] || 0) + 1 };
  // logboek beperkt houden: alles ouder dan 30 dagen weg
  const cutoff = shiftDays(today, -30);
  for (const key of Object.keys(practiceLog)) {
    if (key < cutoff) delete practiceLog[key];
  }
  return { streak, lastPracticeDate: today, practiceLog };
}

// Dekking: hoeveel van de vragen van dit niveau heb je ten minste één keer
// beantwoord?
export function coverage(state) {
  const pool = activePool(state);
  if (!pool.length) return 0;
  const answered = pool.filter((q) => state.reviews[q.id]).length;
  return Math.round((answered / pool.length) * 100);
}

// Kennisbeheersing: gemiddelde beheersing over de héle leerstof. Een vraag
// telt vol mee na drie geslaagde herhalingen. Geen plafond.
export function mastery(state) {
  const pool = activePool(state);
  if (!pool.length) return 0;
  let sum = 0;
  for (const q of pool) {
    const r = state.reviews[q.id];
    if (r) sum += Math.min(r.repetitions, 3) / 3;
  }
  return Math.round((sum / pool.length) * 100);
}

// Retentie: aandeel van de beantwoorde vragen dat je minstens twee herhalingen
// hebt volgehouden.
export function retention(state) {
  const answered = Object.values(state.reviews);
  if (!answered.length) return 0;
  const kept = answered.filter((r) => (r.repetitions || 0) >= 2).length;
  return Math.round((kept / answered.length) * 100);
}

// Examengereedheid: gewogen mix van de drie bovenstaande, transparant en
// zonder plafond. De weging staat in de UI-toelichting.
export function readiness(state) {
  return Math.round(0.5 * mastery(state) + 0.3 * coverage(state) + 0.2 * retention(state));
}

// Weekgrafiek: echte aantallen per dag, maandag t/m zondag van deze week.
export function weekBars(state) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const labels = ["M", "D", "W", "D", "V", "Z", "Z"];
  const bars = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = todayKey(d);
    bars.push({
      label: labels[i],
      count: state.practiceLog[key] || 0,
      isToday: key === todayKey(now)
    });
  }
  return bars;
}

export function answeredThisWeek(state) {
  return weekBars(state).reduce((sum, b) => sum + b.count, 0);
}

// Voortgang per topic: dekking én nauwkeurigheid, uit echte antwoorden.
export function topicStats(state) {
  const byTopic = new Map();
  for (const q of activePool(state)) {
    const t = byTopic.get(q.topic) || { topic: q.topic, total: 0, answered: 0, correct: 0, wrong: 0, masterySum: 0, ids: [] };
    t.total += 1;
    t.ids.push(q.id);
    const r = state.reviews[q.id];
    if (r) {
      t.answered += 1;
      t.correct += r.correct;
      t.wrong += r.wrong;
      t.masterySum += Math.min(r.repetitions, 3) / 3;
    }
    byTopic.set(q.topic, t);
  }
  return [...byTopic.values()].map((t) => ({
    ...t,
    coverage: Math.round((t.answered / t.total) * 100),
    mastery: Math.round((t.masterySum / t.total) * 100),
    accuracy: t.correct + t.wrong > 0
      ? Math.round((t.correct / (t.correct + t.wrong)) * 100)
      : null
  }));
}

// Zwakste topics: alleen tonen wanneer er genoeg antwoorden zijn om iets
// zinnigs te zeggen (minstens 5 antwoorden in het topic, nauwkeurigheid < 80%).
export function weakTopics(state) {
  return topicStats(state)
    .filter((t) => t.correct + t.wrong >= 5 && t.accuracy !== null && t.accuracy < 80)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);
}

// Eerlijke aanbeveling: het topic waar je dekking het laagst is.
export function nextTopic(state) {
  const all = topicStats(state);
  if (!all.length) return null;
  return all.sort((a, b) => a.coverage - b.coverage || b.total - a.total)[0];
}
