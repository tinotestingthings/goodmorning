// ---------------------------------------------------------------------------
// Quiz mode: "Overhoren" -- a Leitner spaced-repetition drill driven by the
// user's own honest self-report, so progress is a record of mastery rather
// than a guess at it.
//
// It is a quiz mode like the other two, implementing the same interface,
// rather than a separate file the quiz screen has to reach into by name.
// ---------------------------------------------------------------------------

import { h, icon } from "../../core/dom.js";
import { t } from "../../core/i18n.js";
import { bilingual, primaryName } from "../../core/birds.js";
import { pickNext, progress, recordAnswer } from "../../core/leitner.js";
import { stopSound } from "../../core/sound.js";
import { birdPhoto, soundButton } from "../../ui/bird-media.js";
import { nameLine } from "../../ui/bird-names.js";

export const studyMode = {
  id: "study",
  labelKey: "study",
  gameMode: "quiz-study",
  /** Study reports its own progress instead of a running score. */
  ownsStatus: true,

  start(api) {
    this.api = api;
    this.next();
  },

  next() {
    this.current = pickNext(this.api.pool());
    this.revealed = false;
    this.render();
  },

  updateStatus() {
    const { fresh, reviewing, mastered } = progress(this.api.pool());
    this.api.setStatus(
      `${fresh} ${t("studyNew")} · ${reviewing} ${t("studyReviewing")} · ${mastered} ${t("studyMastered")}`
    );
  },

  render() {
    const api = this.api;
    this.updateStatus();

    if (!this.current) {
      api.container.replaceChildren(
        h("div", { class: "quiz-card" }, h("p", { class: "empty-state" }, t("studyDone")))
      );
      return;
    }

    api.container.replaceChildren(this.revealed ? this.answerCard() : this.promptCard());
  },

  promptCard() {
    const photo = birdPhoto(this.current, { fit: "cover", zoomable: false, alt: "" });
    const flip = h(
      "button",
      {
        type: "button",
        class: "study-flip",
        onclick: () => {
          this.revealed = true;
          this.render();
        },
      },
      photo,
      h("span", { class: "tap-hint" }, icon("eye"), " ", t("tapToReveal"))
    );
    return h("div", { class: "quiz-card" }, flip);
  },

  answerCard() {
    const bird = this.current;
    const fact = bilingual(bird, "fact");
    const sound = soundButton(bird);

    const answer = (knew) => {
      stopSound();
      recordAnswer(bird, knew);
      this.next();
    };

    return h(
      "div",
      { class: "quiz-card" },
      birdPhoto(bird, { fit: "cover" }),
      h("h2", { class: "quiz-answer-name" }, primaryName(bird)),
      nameLine(bird, { className: "names" }),
      sound ? h("div", { class: "quiz-sound-row" }, sound) : null,
      fact ? h("p", { class: "quiz-answer-fact" }, fact) : null,
      h(
        "div",
        { class: "quiz-actions" },
        h(
          "button",
          { type: "button", class: "secondary", onclick: () => answer(false) },
          icon("close"),
          h("span", {}, t("didntKnowIt"))
        ),
        h(
          "button",
          { type: "button", class: "primary", onclick: () => answer(true) },
          icon("check"),
          h("span", {}, t("knewIt"))
        )
      )
    );
  },
};
