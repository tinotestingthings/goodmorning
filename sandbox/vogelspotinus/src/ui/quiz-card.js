// ---------------------------------------------------------------------------
// The parts every quiz mode shares: the photo card, the live result line and
// the revealed answer block. Type-the-answer and multiple-choice differ only
// in their controls, so only the controls live in the mode modules.
// ---------------------------------------------------------------------------

import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { bilingual, primaryName } from "../core/birds.js";
import { birdPhoto, soundButton } from "./bird-media.js";
import { nameLine } from "./bird-names.js";

/**
 * Reading order is photo -> controls -> verdict -> answer -> "next", so the
 * feedback appears directly under what the player just did and "next bird"
 * always sits at the bottom of the card.
 *
 * @param {object} bird
 * @param {HTMLElement} controls mode-specific input area
 * @param {HTMLElement} footer   the advance button, placed after the answer
 * @returns {{card: HTMLElement, result: HTMLElement, answer: HTMLElement}}
 */
export function questionCard(bird, controls, footer) {
  // alt is deliberately empty: the photo IS the question, so describing it
  // would hand over the answer to anyone using a screen reader. `vary` draait
  // door de fotovarianten heen zodat je de vogel leert, niet de foto.
  const photo = birdPhoto(bird, { fit: "cover", alt: "", vary: true });
  photo.setAttribute("aria-label", t("a11yQuizPhoto"));

  const sound = soundButton(bird);
  const result = h("p", { class: "quiz-result", role: "status", "aria-live": "polite" });
  const answer = h("div", { class: "quiz-answer" });

  const card = h(
    "div",
    { class: "quiz-card" },
    photo,
    sound ? h("div", { class: "quiz-sound-row" }, sound) : null,
    controls,
    result,
    answer,
    footer
  );
  return { card, result, answer };
}

/** Fill the answer block with the species' names, its fact and a source link. */
export function fillAnswer(answerEl, bird) {
  // Compacts the photo (see .quiz-card.answered) so the answer, the fact and
  // the "next bird" button all fit on a phone screen at once.
  answerEl.closest(".quiz-card")?.classList.add("answered");
  const fact = bilingual(bird, "fact");
  // De herkenkenmerken staan bóven het weetje: bij een bouwstijl of
  // straatobject zijn ze het antwoord op "waarom was dit Jugendstil?", en juist
  // dat wil je lezen als je het net fout had. Alleen die twee categorieën
  // hebben het veld, dus bij een vogel of hond verschijnt de regel niet.
  const features = bilingual(bird, "features");
  answerEl.replaceChildren(
    h("p", { class: "quiz-answer-name" }, primaryName(bird)),
    nameLine(bird, { className: "names" }),
    features?.length
      ? h(
          "p",
          { class: "quiz-answer-features" },
          h("span", { class: "quiz-answer-label" }, t("styleFeatures")),
          features.join(" · ")
        )
      : null,
    fact ? h("p", { class: "quiz-answer-fact" }, fact) : null,
    bird.wikipediaUrl
      ? h(
          "a",
          { href: bird.wikipediaUrl, target: "_blank", rel: "noopener noreferrer" },
          t("moreInfo")
        )
      : null
  );
}

/** Set the correct/incorrect line. `correct === null` means "revealed, not scored". */
export function setResult(resultEl, correct) {
  resultEl.className = "quiz-result";
  if (correct === null) {
    resultEl.textContent = "";
    return;
  }
  resultEl.classList.add(correct ? "correct" : "wrong");
  resultEl.textContent = correct ? t("correct") : t("wrong");
}

export function emptyPoolCard() {
  return h("div", { class: "quiz-card" }, h("p", { class: "empty-state" }, t("noResults")));
}
