// ---------------------------------------------------------------------------
// Quizmodus: welke FCI-rasgroep is dit?
//
// Anders dan de andere modi gaat de vraag niet over EEN dier maar over een
// PATROON: je krijgt drie honden uit dezelfde rasgroep te zien en moet zeggen
// welke groep dat is. Dat werkt alleen met meerdere voorbeelden -- aan één
// hond zie je een ras, aan drie zie je waar de groep voor staat.
//
// Daarom raakt deze modus de Leitner-planning NIET. Die plant per soort, en
// hier is de soort het onderwerp niet; een goede beurt zegt niets over of je
// de beagle kent. De score in de kop telt wel gewoon mee.
//
// Honden zonder rasgroep in de data (21 van de 361) doen niet mee. Groep 4 is
// één ras -- de teckel -- dus daar zijn de drie kaartjes drie verschillende
// foto's van dezelfde hond. Dat is precies de les van die groep.
// ---------------------------------------------------------------------------

import { h, shuffle } from "../../core/dom.js";
import { t } from "../../core/i18n.js";
import { allBirds, hasPhoto, primaryName } from "../../core/birds.js";
import { photoVariants } from "../../core/photos.js";
import { FCI_GROUPS, groupAbout, groupHint, groupName } from "../../data/fci-groups.js";
import { emptyPoolCard, setResult } from "../../ui/quiz-card.js";
import { PLACEHOLDER_IMG } from "../../ui/bird-media.js";

const OPTION_COUNT = 4;
const CARDS_PER_QUESTION = 3;

const label = (group) => groupName(group.n);

/** Alle honden met een rasgroep én een foto, gebundeld per groep. */
function byGroup() {
  const buckets = new Map();
  for (const species of allBirds()) {
    const n = species.tags?.fciGroup;
    if (!n || !hasPhoto(species)) continue;
    if (!buckets.has(n)) buckets.set(n, []);
    buckets.get(n).push(species);
  }
  return buckets;
}

/**
 * Drie kaartjes voor een groep. Zijn er genoeg rassen, dan drie verschillende;
 * anders (groep 4) vullen we aan met andere foto's van hetzelfde ras, zodat de
 * vraag altijd drie beelden toont.
 */
function pickThree(dogs) {
  const shuffled = shuffle([...dogs]);
  if (shuffled.length >= CARDS_PER_QUESTION) return shuffled.slice(0, CARDS_PER_QUESTION);
  const cards = [];
  const varianten = shuffled.flatMap((dog) => photoVariants(dog).map((url) => ({ dog, url })));
  for (const variant of shuffle(varianten).slice(0, CARDS_PER_QUESTION)) cards.push(variant);
  return cards.length ? cards : shuffled;
}

/** Eén miniatuurkaartje: dezelfde vorm als in Bladeren, maar kleiner. */
function miniCard(entry) {
  const dog = entry.dog ?? entry;
  const url = entry.url ?? photoVariants(dog)[0] ?? PLACEHOLDER_IMG;
  return h(
    "figure",
    { class: "group-card" },
    h("img", { src: url, alt: "", loading: "lazy" }),
    h("figcaption", {}, primaryName(dog))
  );
}

export const groupMode = {
  id: "group",
  labelKey: "fciGroupMode",
  gameMode: "quiz-group",

  start(api) {
    this.api = api;
    this.next();
  },

  next() {
    const api = this.api;
    const buckets = byGroup();
    // Een groep kan alleen de VRAAG zijn als er iets te zien is. Zonder honden
    // in de dataset (of met alleen vogels geladen) is er geen vraag te stellen.
    const speelbaar = FCI_GROUPS.filter((g) => (buckets.get(g.n) ?? []).length > 0);
    if (speelbaar.length < OPTION_COUNT) {
      api.container.replaceChildren(emptyPoolCard());
      return;
    }

    const answer = speelbaar[Math.floor(Math.random() * speelbaar.length)];
    const cards = pickThree(buckets.get(answer.n));
    // Afleiders uit de groepen die ook echt bestaan, zodat een fout antwoord
    // een groep is die je had kunnen kiezen.
    const distractors = shuffle(speelbaar.filter((g) => g !== answer)).slice(0, OPTION_COUNT - 1);
    const options = shuffle([answer, ...distractors]);

    const grid = h("div", { class: "group-grid" }, ...cards.map(miniCard));
    const choices = h("div", { class: "choice-grid" });
    const result = h("p", { class: "quiz-result", role: "status", "aria-live": "polite" });
    const explain = h("div", { class: "quiz-answer" });
    const nextButton = h(
      "button",
      { type: "button", class: "secondary", onclick: () => this.next() },
      t("nextQuestion")
    );

    const card = h(
      "div",
      { class: "quiz-card" },
      h("p", { class: "session-prompt" }, t("whichGroup")),
      grid,
      choices,
      result,
      explain,
      h("div", { class: "quiz-actions" }, nextButton)
    );
    api.container.replaceChildren(card);

    const buttons = new Map();
    let settled = false;
    for (const option of options) {
      const button = h("button", { type: "button", class: "choice-btn" }, label(option));
      button.addEventListener("click", () => {
        if (settled) return;
        settled = true;
        const correct = option === answer;
        for (const [group, el] of buttons) {
          el.disabled = true;
          if (group === answer) el.classList.add("choice-correct");
        }
        if (!correct) button.classList.add("choice-wrong");
        setResult(result, correct);
        // De uitleg is het punt van deze modus: je leert de groep pas als je
        // weet waar hij voor staat. Hij komt daarom ook bij een goed antwoord.
        explain.replaceChildren(
          h("p", { class: "quiz-answer-name" }, `${t("fciGroupShort")} ${answer.n} · ${label(answer)}`),
          h("p", { class: "names" }, groupHint(answer.n)),
          h("p", { class: "quiz-answer-fact" }, groupAbout(answer.n))
        );
        api.recordScore(correct);
        nextButton.focus();
      });
      buttons.set(option, button);
      choices.append(button);
    }
  },
};
