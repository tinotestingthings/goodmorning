// ---------------------------------------------------------------------------
// Quiz mode: multiple choice.
//
// Distractors are drawn from the same filtered pool as the target, so a
// "black, very common, small birds" game only ever offers other black, very
// common, small birds as wrong answers.
// ---------------------------------------------------------------------------

import { h, shuffle } from "../../core/dom.js";
import { t } from "../../core/i18n.js";
import { primaryName } from "../../core/birds.js";
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

    const distractors = shuffle(api.pool().filter((b) => b !== bird)).slice(0, OPTION_COUNT - 1);
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
        nextButton.focus();
      });
      buttons.set(option, button);
      grid.append(button);
    }
  },
};
