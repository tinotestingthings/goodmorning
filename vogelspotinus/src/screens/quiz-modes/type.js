// ---------------------------------------------------------------------------
// Quiz mode: type the answer.
// ---------------------------------------------------------------------------

import { h } from "../../core/dom.js";
import { t } from "../../core/i18n.js";
import { matchesGuess } from "../../core/birds.js";
import { emptyPoolCard, fillAnswer, questionCard, setResult } from "../../ui/quiz-card.js";

export const typeMode = {
  id: "type",
  labelKey: "typeAnswer",
  gameMode: "quiz-text",

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
    const next = h(
      "button",
      { type: "button", class: "secondary", onclick: () => this.next() },
      t("nextBird")
    );

    const controls = h(
      "div",
      { class: "quiz-controls" },
      input,
      h("div", { class: "quiz-actions" }, submit, reveal)
    );
    const footer = h("div", { class: "quiz-actions" }, next);

    const { card, result, answer } = questionCard(bird, controls, footer);
    api.container.replaceChildren(card);

    let settled = false;
    const finish = (correct) => {
      if (settled) return;
      settled = true;
      input.disabled = true;
      submit.disabled = true;
      reveal.disabled = true;
      setResult(result, correct);
      fillAnswer(answer, bird);
      if (correct !== null) api.recordScore(correct);
      next.focus();
    };

    const check = () => {
      const guess = input.value.trim();
      if (!guess || settled) return;
      finish(matchesGuess(bird, guess));
    };

    submit.addEventListener("click", check);
    reveal.addEventListener("click", () => finish(null));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") check();
    });
    input.focus();
  },
};
