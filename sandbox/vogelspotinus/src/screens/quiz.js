// ---------------------------------------------------------------------------
// Quiz: owns the filtered pool, the score and the options sheet, and delegates
// the actual question to whichever mode is active.
//
// All three modes (type, choice, study) implement the same interface, so the
// screen never needs to know which one it is talking to -- the previous
// version special-cased "study" in six places with `typeof` checks across a
// file boundary.
// ---------------------------------------------------------------------------

import { byId, h } from "../core/dom.js";
import { matchCountText, t } from "../core/i18n.js";
import { EVENTS, on } from "../core/events.js";
import { registerScreen, gameContext, currentScreenId, refreshScreen } from "../core/nav.js";
import { allBirds, hasPhoto } from "../core/birds.js";
import { emptySelection, filterBirds, kindPool } from "../core/filters.js";
import { openSheet, sheetBody } from "../ui/sheet.js";
import { renderFilterBar, renderKindSwitch } from "../ui/filter-bar.js";
import { typeMode } from "./quiz-modes/type.js";
import { choiceMode } from "./quiz-modes/choice.js";
import { studyMode } from "./quiz-modes/study.js";
import { groupMode } from "./quiz-modes/group.js";

const MODES = [typeMode, choiceMode, studyMode, groupMode];
const MODE_BY_GAME_MODE = new Map(MODES.map((m) => [m.gameMode, m]));

const selection = emptySelection();
let activeMode = typeMode;
let score = { correct: 0, total: 0 };
let lastBird = null;
let sheetCountEl = null;
let sheetBarEl = null;

function isGameContext() {
  return gameContext()?.gameMode?.startsWith("quiz") ?? false;
}

function activeFilters() {
  return isGameContext() ? gameContext().filters : selection;
}

/** Only birds with a photo can be quizzed on sight. */
function pool() {
  // Escape-hatch voor de oefensessies vanaf de statuskaart: die leveren een
  // expliciete vogellijst in plaats van filters (bv. "alles wat vandaag terug
  // moet komen"), wat je met filterBirds niet kunt uitdrukken.
  const explicit = gameContext()?.birds;
  if (Array.isArray(explicit)) return explicit;
  return filterBirds(allBirds(), activeFilters()).filter(hasPhoto);
}

function randomBird() {
  const birds = pool();
  if (birds.length === 0) return null;
  let candidate;
  do {
    candidate = birds[Math.floor(Math.random() * birds.length)];
  } while (birds.length > 1 && candidate === lastBird);
  lastBird = candidate;
  return candidate;
}

function setStatus(text) {
  byId("quiz-status").textContent = text;
}

function showScore() {
  setStatus(`${t("scoreLabel")}: ${score.correct} / ${score.total}`);
}

function recordScore(correct) {
  score.total += 1;
  if (correct) score.correct += 1;
  showScore();
}

const api = {
  get container() {
    return byId("quiz-body");
  },
  pool,
  randomBird,
  recordScore,
  setStatus,
};

function startActiveMode({ resetScore = true } = {}) {
  if (resetScore) score = { correct: 0, total: 0 };
  lastBird = null;
  if (!activeMode.ownsStatus) showScore();
  activeMode.start(api);
}

function setMode(mode) {
  if (mode === activeMode) return;
  activeMode = mode;
  startActiveMode();
}

function openOptions() {
  openSheet({
    label: t("options"),
    build(dialog, { close }) {
      const modeSwitch = h("div", {
        class: "segmented",
        role: "group",
        "aria-label": t("gameMode"),
      });
      for (const mode of MODES) {
        modeSwitch.append(
          h(
            "button",
            {
              type: "button",
              class: mode === activeMode ? "active" : "",
              "aria-pressed": String(mode === activeMode),
              onclick: () => {
                setMode(mode);
                close();
              },
            },
            t(mode.labelKey)
          )
        );
      }

      sheetCountEl = h("p", { class: "count-line" }, matchCountText(pool().length));
      const bar = h("div");
      sheetBarEl = bar;
      // De balk stelt zichzelf samen uit het gekozen dier: bij honden verdwijnen
      // "Status in NL", "Familie" en de kleuren die geen hond heeft.
      renderFilterBar(bar, selection, onFilterChange, kindPool(selection));

      dialog.append(sheetBody(h("h2", {}, t("options")), modeSwitch, sheetCountEl, bar));
    },
    onClose() {
      sheetCountEl = null;
      sheetBarEl = null;
    },
  });
}

/**
 * De diersoortschakelaar en de filterbalk schrijven op dezelfde selectie; na een
 * wijziging in de een moet de ander opnieuw kloppen, en begint de quiz opnieuw
 * omdat de pool verandert.
 */
function onFilterChange({ rebuildBar = false } = {}) {
  renderKindSwitch(byId("quiz-kind"), selection, onFilterChange);
  if (rebuildBar && sheetBarEl) {
    renderFilterBar(sheetBarEl, selection, onFilterChange, kindPool(selection));
  }
  if (sheetCountEl) sheetCountEl.textContent = matchCountText(pool().length);
  startActiveMode();
}

function mount() {
  byId("quiz-options-btn").addEventListener("click", openOptions);
}

function render() {
  const inGame = isGameContext();
  byId("quiz-options-btn").hidden = inGame;
  // In een opgeslagen spel ligt de pool vast; dan zou de schakelaar liegen.
  byId("quiz-kind").hidden = inGame;
  if (inGame) activeMode = MODE_BY_GAME_MODE.get(gameContext().gameMode) ?? typeMode;
  else renderKindSwitch(byId("quiz-kind"), selection, onFilterChange);
  startActiveMode();
}

export function registerQuizScreen() {
  registerScreen("quiz", { mount, render });
  on(EVENTS.languageChanged, () => {
    if (currentScreenId() === "quiz") refreshScreen();
  });
}
