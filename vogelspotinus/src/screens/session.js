// ---------------------------------------------------------------------------
// De oefensessie op het scherm. De opbouw en volgorde komen uit
// core/session.js; hier staat alleen het renderen van de vier vraagvormen,
// de introkaart en de samenvatting.
//
// Een sessie heeft een EINDE. Dat is de hele pointe.
// ---------------------------------------------------------------------------

import { byId, h, shuffle } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { registerScreen, showScreen } from "../core/nav.js";
import { bilingual, matchesGuess, primaryName } from "../core/birds.js";
import { createSession, distractorsFor } from "../core/session.js";
import { courseDetections } from "../core/course.js";
import { courseTrackAndLine } from "../ui/course-progress.js";
import { stopSound } from "../core/sound.js";
import { birdPhoto, soundButton } from "../ui/bird-media.js";
import { nameLine } from "../ui/bird-names.js";

let session = null;

function status(text) {
  byId("session-status").textContent = text;
}

function progressBar() {
  const done = session.position;
  const total = Math.max(1, session.length);
  return h(
    "div",
    { class: "session-bar", "aria-hidden": "true" },
    h("span", { class: "session-bar-fill", style: { width: `${Math.round((done / total) * 100)}%` } })
  );
}

function render() {
  stopSound();
  const item = session?.current() ?? null;
  if (!session || session.isEmpty) {
    renderEmpty();
    return;
  }
  if (!item) {
    renderSummary();
    return;
  }
  status(`${session.position + 1} / ${session.length}`);
  const body = byId("session-body");
  body.replaceChildren(progressBar(), item.kind === "intro" ? introCard(item) : testCard(item));
  window.scrollTo({ top: 0 });
}

function next() {
  session.advance();
  render();
}

// --- Introkaart -------------------------------------------------------------

function introCard(item) {
  const bird = item.bird;
  session.introShown(item);
  const fact = bilingual(bird, "fact");
  const heard = courseDetections(bird);
  const sound = soundButton(bird);

  return h(
    "div",
    { class: "quiz-card session-intro" },
    h("p", { class: "session-badge" }, t("newBirdBadge")),
    birdPhoto(bird, { fit: "cover", vary: true }),
    h("h2", { class: "quiz-answer-name" }, primaryName(bird)),
    nameLine(bird, { className: "names" }),
    heard
      ? h("p", { class: "session-heard" }, `${heard.toLocaleString("nl-NL")}× ${t("heardInGriftpark")}`)
      : null,
    sound ? h("div", { class: "quiz-sound-row" }, sound) : null,
    fact ? h("p", { class: "quiz-answer-fact" }, fact) : null,
    h(
      "div",
      { class: "quiz-actions" },
      h("button", { type: "button", class: "primary", onclick: next }, t("introNext"))
    )
  );
}

// --- Vraagvormen ------------------------------------------------------------

/** Gedeeld antwoordblok: verdict + naam + weetje + volgende-knop. */
function revealAnswer(card, item, correct, { showPhoto = false } = {}) {
  const bird = item.bird;
  session.answer(item, correct);
  card.classList.add("answered");

  const fact = bilingual(bird, "fact");
  const nextButton = h("button", { type: "button", class: "primary", onclick: next }, t("nextBird"));
  card.append(
    h("p", { class: `quiz-result ${correct ? "correct" : "wrong"}`, role: "status" },
      correct ? t("correct") : t("wrong")),
    h(
      "div",
      { class: "quiz-answer" },
      showPhoto ? birdPhoto(bird, { fit: "cover" }) : null,
      h("p", { class: "quiz-answer-name" }, primaryName(bird)),
      nameLine(bird, { className: "names" }),
      fact && !correct ? h("p", { class: "quiz-answer-fact" }, fact) : null
    ),
    h("div", { class: "quiz-actions" }, nextButton)
  );
  nextButton.focus();
}

/** Meerkeuze op naam, met een foto- of geluidscue. */
function choiceCard(item, shape) {
  const bird = item.bird;
  const options = shuffle([bird, ...distractorsFor(bird)]);
  let settled = false;

  const card = h("div", { class: "quiz-card" });
  if (shape.cue === "sound") {
    const sound = soundButton(bird, { variant: "button" });
    card.append(
      h("p", { class: "session-prompt" }, t("whichBirdDoYouHear")),
      h("div", { class: "quiz-sound-row session-sound-cue" }, sound)
    );
  } else {
    const photo = birdPhoto(bird, { fit: "cover", alt: "", vary: true });
    photo.setAttribute("aria-label", t("a11yQuizPhoto"));
    card.append(photo);
  }

  const buttons = new Map();
  const grid = h("div", { class: "choice-grid" });
  for (const option of options) {
    const button = h("button", { type: "button", class: "choice-btn" }, primaryName(option));
    button.addEventListener("click", () => {
      if (settled) return;
      settled = true;
      stopSound();
      const correct = option === bird;
      for (const [optionBird, el] of buttons) {
        el.disabled = true;
        if (optionBird === bird) el.classList.add("choice-correct");
      }
      if (!correct) button.classList.add("choice-wrong");
      revealAnswer(card, item, correct, { showPhoto: shape.cue === "sound" });
    });
    buttons.set(option, button);
    grid.append(button);
  }
  card.append(grid);
  return card;
}

/** "Welke foto is de X?" -- vier foto's, een naam. */
function photoChoiceCard(item) {
  const bird = item.bird;
  const options = shuffle([bird, ...distractorsFor(bird)]);
  let settled = false;

  const card = h("div", { class: "quiz-card" });
  card.append(h("p", { class: "session-prompt" }, `${t("whichPhotoIs")} ${primaryName(bird)}?`));

  const grid = h("div", { class: "photo-choice-grid" });
  for (const option of options) {
    const photo = birdPhoto(option, { fit: "cover", alt: "", zoomable: false, vary: true });
    const button = h("button", { type: "button", class: "photo-choice-btn" }, photo);
    button.addEventListener("click", () => {
      if (settled) return;
      settled = true;
      const correct = option === bird;
      for (const el of grid.querySelectorAll(".photo-choice-btn")) el.disabled = true;
      button.classList.add(correct ? "choice-correct" : "choice-wrong");
      if (!correct) {
        const winner = [...grid.children][options.indexOf(bird)];
        winner?.classList.add("choice-correct");
      }
      revealAnswer(card, item, correct);
    });
    grid.append(button);
  }
  card.append(grid);
  return card;
}

/** Typ de naam -- voor vogels in de hoogste boxen. "Toon antwoord" telt als fout. */
function typeCard(item, shape) {
  const bird = item.bird;
  let settled = false;

  const card = h("div", { class: "quiz-card" });
  if (shape.cue === "sound") {
    card.append(
      h("p", { class: "session-prompt" }, t("whichBirdDoYouHear")),
      h("div", { class: "quiz-sound-row session-sound-cue" }, soundButton(bird))
    );
  } else {
    const photo = birdPhoto(bird, { fit: "cover", alt: "", vary: true });
    photo.setAttribute("aria-label", t("a11yQuizPhoto"));
    card.append(photo);
  }

  const input = h("input", {
    type: "text",
    class: "quiz-input",
    autocomplete: "off",
    autocapitalize: "off",
    spellcheck: false,
    placeholder: t("typeAnswer"),
    "aria-label": t("typeAnswer"),
  });
  const submit = h("button", { type: "button", class: "primary" }, t("check"));
  const reveal = h("button", { type: "button", class: "secondary" }, t("reveal"));

  const finish = (correct) => {
    if (settled) return;
    settled = true;
    stopSound();
    input.disabled = true;
    submit.disabled = true;
    reveal.disabled = true;
    revealAnswer(card, item, correct, { showPhoto: shape.cue === "sound" });
  };

  submit.addEventListener("click", () => {
    if (input.value.trim()) finish(matchesGuess(bird, input.value));
  });
  reveal.addEventListener("click", () => finish(false));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && input.value.trim()) finish(matchesGuess(bird, input.value));
  });

  card.append(h("div", { class: "quiz-controls" }, input, h("div", { class: "quiz-actions" }, submit, reveal)));
  setTimeout(() => input.focus(), 0);
  return card;
}

function testCard(item) {
  const shape = session.shapeFor(item);
  if (shape.response === "type") return typeCard(item, shape);
  if (shape.response === "photo-choice") return photoChoiceCard(item);
  return choiceCard(item, shape);
}

// --- Einde en leeg ----------------------------------------------------------

function courseLine() {
  return h("div", { class: "course-progress" }, ...courseTrackAndLine());
}

function renderSummary() {
  status("");
  const s = session.summary();
  const body = byId("session-body");

  body.replaceChildren(
    h(
      "div",
      { class: "quiz-card session-summary" },
      h("h2", {}, t("sessionDoneTitle")),
      s.answered > 0
        ? h("p", { class: "session-score" }, `${s.correct} / ${s.answered} ${t("sessionScore")}`)
        : null,
      s.newIntroduced > 0
        ? h("p", { class: "session-new-line" }, `${s.newIntroduced} ${t("sessionNewBirds")}`)
        : null,
      s.missed.length
        ? h(
            "div",
            { class: "session-missed" },
            h("p", { class: "field-legend" }, t("sessionMissed")),
            h("div", { class: "chip-row" }, ...s.missed.map((b) => h("span", { class: "chip" }, primaryName(b))))
          )
        : null,
      courseLine(),
      h(
        "div",
        { class: "quiz-actions" },
        h("button", { type: "button", class: "primary", onclick: () => showScreen("home") }, t("backHome"))
      )
    )
  );
}

function renderEmpty() {
  status("");
  byId("session-body").replaceChildren(
    h(
      "div",
      { class: "quiz-card session-summary" },
      h("h2", {}, t("sessionEmptyTitle")),
      h("p", { class: "count-line" }, t("sessionEmptyBody")),
      courseLine(),
      h(
        "div",
        { class: "quiz-actions" },
        h("button", { type: "button", class: "secondary", onclick: () => showScreen("quiz") }, t("freePractice")),
        h("button", { type: "button", class: "primary", onclick: () => showScreen("home") }, t("backHome"))
      )
    )
  );
}

export function registerSessionScreen() {
  registerScreen("session", {
    mount() {
      byId("session-close").addEventListener("click", () => showScreen("home"));
    },
    render() {
      // Elke binnenkomst op het scherm is een nieuwe sessie; een sessie
      // halverwege verlaten gooit alleen de rest van de wachtrij weg, nooit
      // beantwoorde vragen (die zijn al in de Leitner-state geschreven).
      session = createSession();
      render();
    },
  });
}
