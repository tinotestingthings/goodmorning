// Oefenscherm: modus-keuze, de quizflow zelf (meerkeuze/waar-onwaar én
// flashcards) en het resultaatscherm. Er is één sessie-engine; elke ingang
// (dagelijkse herhaling, topic, examen, zwakke plekken, wijnboek) bouwt alleen
// een andere vragenlijst.

import { h } from "../core/dom.js";
import { getState, update } from "../core/state.js";
import { buildSession, weakIds, dueCount, questionById, gradeReview, activePool } from "../core/srs.js";
import { registerAnswer, answeredToday, displayStreak } from "../core/stats.js";
import { progressRing } from "../ui.js";

// De lopende sessie. null = modus-keuze tonen.
let session = null;

export function startSession(ctx, { title, ids, mode = "quiz", size = 6 }) {
  const state = getState();
  const list = buildSession(state, size, ids);
  if (!list.length) {
    ctx.toast("Er staan geen vragen in deze stapel.");
    return;
  }
  session = {
    title,
    mode, // "quiz" | "flashcards"
    ids: list,
    views: {},   // qid -> volgorde waarin de opties nu getoond worden
    index: 0,
    correctCount: 0,
    selected: null,
    checked: false,
    revealed: false,
    showWhy: false,
    finished: false
  };
  ctx.go("practice");
}

export function renderPractice(root, ctx) {
  if (session && session.finished) return root.appendChild(resultView(ctx));
  if (session) return root.appendChild(quizView(ctx));
  root.appendChild(modeView(ctx));
}

// ---- modus-keuze ----

function modeView(ctx) {
  const state = getState();
  const due = dueCount(state);
  const weak = weakIds(state);
  const done = answeredToday(state);
  const goalPct = Math.min(100, Math.round((done / state.dailyGoal) * 100));
  const sessionSize = Math.min(6, activePool(state).length);

  const modes = [
    {
      glyph: "✓", cls: "green", title: "Herhaling",
      sub: due > 0 ? `${due} herhaling${due === 1 ? "" : "en"} gepland` : "Mix van gepland en nieuw",
      start: () => startSession(ctx, { title: "Dagelijkse herhaling", size: 6 })
    },
    {
      glyph: "Aa", cls: "gold", title: "Flashcards",
      sub: "Zelf beoordelen: wist ik / wist ik niet",
      start: () => startSession(ctx, { title: "Flashcards", mode: "flashcards", size: 6 })
    },
    {
      glyph: "★", cls: "rose", title: "Examenstand",
      sub: "10 vragen achter elkaar, uitleg pas onderweg",
      start: () => startSession(ctx, { title: "Examenstand", size: 10 })
    },
    {
      glyph: "↗", cls: "blue", title: "Zwakke plekken",
      sub: weak.length >= 3
        ? `${weak.length} vragen die je fout had`
        : "Beschikbaar zodra er echte zwakke plekken zijn",
      disabled: weak.length < 3,
      start: () => startSession(ctx, { title: "Zwakke plekken", ids: weak, size: Math.min(10, weak.length) })
    }
  ];

  const el = h("section", { class: "page practice-page" },
    h("div", { class: "page-heading" },
      h("p", { class: "eyebrow" }, "Herhaal & beheers"),
      h("h1", null, "Oefenen"),
      h("p", null, "Geplande herhalingen eerst, daarna nieuwe vragen.")
    ),
    h("article", { class: "practice-hero" },
      h("div", null,
        h("span", { class: "card-kicker" }, "Vandaag klaar voor jou"),
        h("h2", null, `${sessionSize} vragen in ± ${Math.max(2, Math.round(sessionSize * 0.7))} minuten`),
        h("p", null, due > 0
          ? `${due} herhaling${due === 1 ? "" : "en"} staan gepland; de rest vult aan met nieuwe vragen.`
          : "Er staan geen herhalingen gepland — je krijgt vooral nieuwe vragen."),
        h("button", { class: "button light", onClick: () => { startSession(ctx, { title: "Dagelijkse herhaling", size: 6 }); } },
          "Begin herhaling ", h("span", null, "→"))
      ),
      progressRing(goalPct, 96)
    ),
    h("div", { class: "mode-grid" },
      modes.map((m) => h("button", {
        class: "mode-card",
        disabled: !!m.disabled,
        style: m.disabled ? { opacity: 0.5, cursor: "not-allowed" } : null,
        onClick: () => { if (!m.disabled) m.start(); }
      },
        h("span", { class: `mode-glyph ${m.cls}` }, m.glyph),
        h("strong", null, m.title),
        h("small", null, m.sub),
        h("b", null, "→")
      ))
    ),
    state.ignoredIds.length > 0 && h("button", {
      class: "aside-stack",
      onClick: () => startSession(ctx, { title: "Opzijgezette vragen", ids: getState().ignoredIds, size: getState().ignoredIds.length })
    },
      h("span", null, "↺"),
      h("div", null,
        h("strong", null, "Opzijgezette vragen"),
        h("small", null, `${state.ignoredIds.length} vragen wachten op je`)
      )
    )
  );
  return el;
}

// ---- quiz / flashcards ----

function currentQuestion() {
  return questionById(session.ids[session.index]);
}

// De volgorde van de antwoorden staat vast in de vragenbank. Zou de app die
// één op één tonen, dan hoort bij een vraag altijd dezelfde letter en kun je
// met spaced repetition de plék onthouden in plaats van de stof. Daarom krijgt
// elke vraag per sessie een eigen, geschudde volgorde — zoals op een echt
// examen. Waar/niet-waar blijft staan: daar is "Waar" altijd de eerste keuze.
function viewFor(q) {
  if (q.type === "truefalse") return { options: q.options, answer: q.answer };
  if (!session.views[q.id]) {
    const order = q.options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    session.views[q.id] = order;
  }
  const order = session.views[q.id];
  return { options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
}

// Antwoord verwerken: SRS, XP, dagteller en streak in één update.
function grade(correct) {
  const q = currentQuestion();
  update((s) => ({
    ...s,
    xp: s.xp + (correct ? 12 : 3),
    ...registerAnswer(s),
    reviews: { ...s.reviews, [q.id]: gradeReview(s.reviews[q.id], correct) }
  }));
  if (correct) session.correctCount += 1;
}

function next(ctx) {
  session.index += 1;
  session.selected = null;
  session.checked = false;
  session.revealed = false;
  session.showWhy = false;
  if (session.index >= session.ids.length) session.finished = true;
  ctx.rerender();
}

function setAside(ctx) {
  const q = currentQuestion();
  update((s) => ({
    ...s,
    ignoredIds: s.ignoredIds.includes(q.id) ? s.ignoredIds : [...s.ignoredIds, q.id]
  }));
  ctx.toast("Vraag opzijgezet. Je vindt hem terug via Profiel.");
  session.ids.splice(session.index, 1);
  if (session.index >= session.ids.length) session.finished = true;
  session.selected = null;
  session.checked = false;
  session.revealed = false;
  if (!session.ids.length) session = null;
  ctx.rerender();
}

function quizView(ctx) {
  const q = currentQuestion();
  const view = viewFor(q);   // geschudde optievolgorde voor deze sessie
  const flash = session.mode === "flashcards";

  const top = h("div", { class: "quiz-top" },
    h("button", { "aria-label": "Sessie sluiten", onClick: () => { session = null; ctx.rerender(); } }, "×"),
    h("div", null, h("span", { style: { width: `${((session.index + 1) / session.ids.length) * 100}%` } })),
    h("strong", null, `${session.index + 1}/${session.ids.length}`)
  );
  const meta = h("div", { class: "quiz-meta" },
    h("span", null, session.title),
    h("span", null, `${q.topic} · ${flash ? "Flashcard" : q.type === "truefalse" ? "Waar of niet waar" : "Meerkeuze"}`)
  );

  const card = h("article", { class: "question-card" }, h("h1", null, q.prompt));

  if (flash) {
    if (!session.revealed) {
      card.appendChild(h("div", { class: "quiz-actions" },
        h("button", { class: "aside-button", onClick: () => setAside(ctx) }, "Opzijzetten"),
        h("button", { class: "button primary", onClick: () => { session.revealed = true; ctx.rerender(); } }, "Toon antwoord")
      ));
    } else {
      card.appendChild(h("div", { class: "feedback success" },
        h("strong", null, q.options[q.answer]),
        h("p", null, q.explanation)
      ));
      card.appendChild(h("div", { class: "quiz-actions" },
        h("button", { class: "aside-button", onClick: () => { grade(false); next(ctx); } }, "Wist ik niet"),
        h("button", { class: "button primary", onClick: () => { grade(true); next(ctx); } }, "Wist ik ✓")
      ));
    }
    return h("section", { class: "quiz-view" }, top, meta, card);
  }

  const answers = h("div", { class: "answer-list" },
    view.options.map((opt, i) => {
      const isCorrect = session.checked && i === view.answer;
      const isWrong = session.checked && session.selected === i && i !== view.answer;
      return h("button", {
        disabled: session.checked,
        class: `${session.selected === i ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`,
        onClick: () => { session.selected = i; ctx.rerender(); }
      },
        h("span", null, String.fromCharCode(65 + i)),
        opt,
        h("b", null, isCorrect ? "✓" : isWrong ? "×" : "")
      );
    })
  );
  card.appendChild(answers);

  if (session.checked) {
    const good = session.selected === view.answer;
    const feedback = h("div", { class: `feedback ${good ? "success" : "error"}` },
      h("strong", null, good ? "Precies!" : "Nog niet helemaal."),
      h("p", null, q.explanation)
    );
    if (!good) {
      feedback.appendChild(h("button", {
        class: "why-button",
        onClick: () => { session.showWhy = !session.showWhy; ctx.rerender(); }
      }, "Waarom was dit fout? ", h("span", null, session.showWhy ? "−" : "+")));
      if (session.showWhy) feedback.appendChild(h("p", { class: "misconception" }, q.misconception));
    }
    card.appendChild(feedback);
  }

  const actions = h("div", { class: "quiz-actions" },
    h("button", { class: "aside-button", onClick: () => setAside(ctx) }, "Opzijzetten"),
    session.checked
      ? h("button", { class: "button primary", onClick: () => next(ctx) }, "Volgende ", h("span", null, "→"))
      : h("button", {
          class: "button primary",
          disabled: session.selected === null,
          onClick: () => { session.checked = true; grade(session.selected === view.answer); ctx.rerender(); }
        }, "Controleer")
  );

  return h("section", { class: "quiz-view" }, top, meta, card, actions);
}

// ---- resultaat ----

function resultView(ctx) {
  const state = getState();
  const n = session.ids.length;
  const good = session.correctCount;
  const xpGained = good * 12 + (n - good) * 3;
  const el = h("section", { class: "page practice-page" },
    h("section", { class: "quiz-result" },
      h("div", { class: "result-medal" }, "★"),
      h("span", { class: "card-kicker dark" }, "Sessie afgerond"),
      h("h1", null, `${good} van ${n} goed`),
      h("p", null, "Je antwoorden zijn verwerkt in je persoonlijke herhaalplanning."),
      h("div", { class: "result-stats" },
        h("span", null, h("b", null, `+${xpGained}`), " XP"),
        h("span", null, h("b", null, `${Math.round((good / n) * 100)}%`), " score"),
        h("span", null, h("b", null, String(displayStreak(state))), ` dag${displayStreak(state) === 1 ? "" : "en"} streak`)
      ),
      h("button", { class: "button primary", onClick: () => { session = null; ctx.rerender(); } }, "Terug naar oefenen")
    )
  );
  return el;
}
