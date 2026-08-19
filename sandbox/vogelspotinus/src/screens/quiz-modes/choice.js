// ---------------------------------------------------------------------------
// Quiz mode: multiple choice.
//
// Distractors are drawn from the same filtered pool as the target and ranked
// by similarity (family, size, colour), so the wrong answers are the species
// you would actually confuse in the field -- random distractors made every
// question a giveaway.
//
// Every answer feeds the Leitner state: playing a multiple-choice game IS
// practice, so it counts as practice. Before, only "Overhoren" recorded
// anything and a whole game session advanced your progress by zero.
// ---------------------------------------------------------------------------

import { h, shuffle } from "../../core/dom.js";
import { t } from "../../core/i18n.js";
import { primaryName } from "../../core/birds.js";
import { pickDistractors } from "../../core/distractors.js";
import { recordAnswer } from "../../core/leitner.js";
import { emptyPoolCard, fillAnswer, questionCard, setResult } from "../../ui/quiz-card.js";

const OPTION_COUNT = 4;

export const choiceMode = {
  id: "choice",
  labelKey: "multipleChoice",
  gameMode: "quiz-choice",

  start(api) {
    this.api = api;
    this.next();
  },

  next() {
    const api = this.api;
    const bird = api.randomBird();
    if (!bird) {
      api.container.replaceChildren(emptyPoolCard());
      return;
    }

    const distractors = pickDistractors(bird, api.pool(), OPTION_COUNT - 1, primaryName);
    const options = shuffle([bird, ...distractors]);

    const grid = h("div", { class: "choice-grid" });
    const nextButton = h(
      "button",
      { type: "button", class: "secondary", onclick: () => this.next() },
      t("nextBird")
    );
    const controls = h("div", { class: "quiz-controls" }, grid);
    const footer = h("div", { class: "quiz-actions" }, nextButton);

    const { card, result, answer } = questionCard(bird, controls, footer);
    api.container.replaceChildren(card);

    // Buttons are matched to their bird by identity. The old code compared
    // rendered text, so two species sharing a display name could highlight the
    // wrong button as "correct".
    const buttons = new Map();
    let settled = false;

    for (const option of options) {
      const button = h("button", { type: "button", class: "choice-btn" }, primaryName(option));
      button.addEventListener("click", () => {
        if (settled) return;
        settled = true;
        const correct = option === bird;
        for (const [optionBird, el] of buttons) {
          el.disabled = true;
          if (optionBird === bird) el.classList.add("choice-correct");
        }
        if (!correct) button.classList.add("choice-wrong");
        setResult(result, correct);
        fillAnswer(answer, bird);
        api.recordScore(correct);
        recordAnswer(bird, correct);
        nextButton.focus();
      });
      buttons.set(option, button);
      grid.append(button);
    }
  },
};
