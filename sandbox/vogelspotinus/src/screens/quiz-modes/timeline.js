// ---------------------------------------------------------------------------
// Quizmodus: zet drie bouwstijlen op volgorde, oudste eerst.
//
// Dit is het enige vraagtype dat het VERHAAL toetst in plaats van het plaatje.
// Bij de andere modi kun je "Jugendstil" leren als een plaatje met krullen;
// hier moet je weten dat hij ná de neostijlen komt en vóór de Amsterdamse
// School. Dat is precies wat de chronologische opzet van de dataset wil leren
// (zie docs/spotinus-architectuur.md: "de tijdlijn is de cursus").
//
// Net als de rasgroepquiz raakt deze modus de Leitner-planning NIET: die plant
// per soort, en de vraag gaat hier over de verhouding tussen drie stijlen. De
// score in de kop telt wel mee.
//
// Ordenen gebeurt door te tikken, niet door te slepen: op een telefoon is
// drag-and-drop tussen kaarten onhandig en met een schermlezer onbruikbaar.
// Tik de kaarten aan in de volgorde die je denkt; tik een gekozen kaart nog
// eens aan om hem terug te nemen.
// ---------------------------------------------------------------------------

import { h, shuffle } from "../../core/dom.js";
import { t } from "../../core/i18n.js";
import { allBirds, hasPhoto, primaryName } from "../../core/birds.js";
import { emptyPoolCard, setResult } from "../../ui/quiz-card.js";
import { birdCard } from "../../ui/bird-card.js";
import { openBirdDetail } from "../../ui/detail-sheet.js";

const CARDS_PER_QUESTION = 3;

/** Alleen bouwstijlen kunnen op een tijdlijn: zij hebben `startYear`. */
function orderablePool() {
  return allBirds().filter(
    (s) => s.tags?.kind === "architecture" && Number.isFinite(s.startYear) && hasPhoto(s)
  );
}

/**
 * Klopt de gekozen volgorde?
 *
 * Niet vergelijken met één "juiste" permutatie: drie paren stijlen delen een
 * startjaar (1895, 1920, 1960), en dan zijn twee volgordes allebei goed. De
 * vraag is of de jaartallen oplopen, niet of je dezelfde lijst had als ik.
 */
export function isChronological(chosen) {
  return chosen.every((s, i) => i === 0 || chosen[i - 1].startYear <= s.startYear);
}

const withPeriod = (style) => `${primaryName(style)} · ${style.period ?? style.startYear}`;

export const timelineMode = {
  id: "timeline",
  labelKey: "timelineMode",
  gameMode: "quiz-timeline",

  start(api) {
    this.api = api;
    this.next();
  },

  next() {
    const api = this.api;
    const pool = orderablePool();
    if (pool.length < CARDS_PER_QUESTION) {
      api.container.replaceChildren(emptyPoolCard());
      return;
    }

    const styles = shuffle([...pool]).slice(0, CARDS_PER_QUESTION);
    const chosen = [];
    let settled = false;

    const result = h("p", { class: "quiz-result", role: "status", "aria-live": "polite" });
    const explain = h("div", { class: "quiz-answer" });
    const nextButton = h(
      "button",
      { type: "button", class: "secondary", onclick: () => this.next() },
      t("nextQuestion")
    );

    const kaarten = new Map();

    /** Badges hernummeren na elke tik, zodat 1-2-3 altijd klopt met de rij. */
    const sync = () => {
      for (const [style, { card, badge }] of kaarten) {
        const plek = chosen.indexOf(style);
        badge.textContent = plek < 0 ? "" : String(plek + 1);
        badge.hidden = plek < 0;
        card.classList.toggle("timeline-picked", plek >= 0);
        card.setAttribute(
          "aria-label",
          plek < 0
            ? primaryName(style)
            : `${primaryName(style)} — ${t("timelinePosition")} ${plek + 1}`
        );
      }
    };

    const finish = () => {
      settled = true;
      const correct = isChronological(chosen);
      setResult(result, correct);
      // De juiste volgorde mét periode is de hele les: je ziet niet alleen dát
      // je fout zat, maar waar de drie stijlen ten opzichte van elkaar staan.
      const opVolgorde = [...styles].sort((a, b) => a.startYear - b.startYear);
      explain.replaceChildren(
        h("p", { class: "quiz-answer-name" }, t("timelineCorrectOrder")),
        h(
          "ol",
          { class: "timeline-answer" },
          ...opVolgorde.map((style) => h("li", {}, withPeriod(style)))
        )
      );
      api.recordScore(correct);
      nextButton.focus();
    };

    for (const style of styles) {
      const badge = h("span", { class: "timeline-badge", hidden: true });
      const card = birdCard(style, {
        onOpen: () => {
          // Na het antwoord is de kaart weer een gewone kaart: dan mag het
          // detailblad open, dat de periode noemt. Daarvóór zou dat de vraag
          // weggeven.
          if (settled) {
            openBirdDetail(style);
            return;
          }
          const plek = chosen.indexOf(style);
          if (plek >= 0) chosen.splice(plek, 1);
          else chosen.push(style);
          sync();
          if (chosen.length === CARDS_PER_QUESTION) finish();
        },
      });
      card.classList.add("group-card", "timeline-card");
      card.append(badge);
      kaarten.set(style, { card, badge });
    }

    const card = h(
      "div",
      { class: "quiz-card" },
      h("p", { class: "session-prompt" }, t("timelinePrompt")),
      h("div", { class: "group-grid" }, ...[...kaarten.values()].map((k) => k.card)),
      result,
      explain,
      h("div", { class: "quiz-actions" }, nextButton)
    );
    api.container.replaceChildren(card);
    sync();
  },
};
