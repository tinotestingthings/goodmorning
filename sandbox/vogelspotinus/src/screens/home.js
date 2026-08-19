// ---------------------------------------------------------------------------
// Home: de cursuskaart met EEN duidelijke actie ("Start oefensessie"), een
// rij compacte snelkoppelingen en de opgeslagen eigen spellen.
//
// De oude statuskaart (drie cijfers, een Leitner-boxhistogram, zes tegels
// waarvan drie bijna hetzelfde deden) is bewust weg: hij beschreef de
// administratie van het systeem in plaats van de voortgang naar het doel --
// de honderd Griftpark-vogels kennen.
// ---------------------------------------------------------------------------

import { byId, h, icon } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { EVENTS, on } from "../core/events.js";
import { registerScreen, showScreen, currentScreenId, refreshScreen } from "../core/nav.js";
import { allBirds, hasPhoto, photoUrl } from "../core/birds.js";
import { matchesFilters } from "../core/filters.js";
import { allGames, deleteGame } from "../core/games.js";
import { dueBirds } from "../core/progress.js";
import { nextNewBirds } from "../core/course.js";
import { NEW_PER_DAY } from "../core/session.js";
import { currentStreak, newTodayCount } from "../core/stats.js";
import { courseTrackAndLine } from "../ui/course-progress.js";
import { openBuilder } from "./builder.js";

const MODE_ICONS = {
  browse: "book",
  "quiz-text": "cursor",
  "quiz-choice": "list-check",
  "quiz-study": "cap",
};

// --- Cursuskaart ------------------------------------------------------------

function courseCard() {
  const streak = currentStreak();
  const due = dueBirds().length;
  const newBudget = Math.max(0, NEW_PER_DAY - newTodayCount());
  const freshAvailable = Math.min(newBudget, nextNewBirds(newBudget).length);

  // "12 herhalen · 5 nieuw" -- wat de sessieknop je zo dadelijk gaat geven.
  const parts = [];
  if (due > 0) parts.push(`${due} ${t("sessionPreviewReview")}`);
  if (freshAvailable > 0) parts.push(`${freshAvailable} ${t("sessionPreviewNew")}`);
  const preview = parts.join(" · ");
  const nothingLeft = parts.length === 0;

  return h(
    "div",
    { class: "course-card" },
    h(
      "div",
      { class: "course-head" },
      h("h2", { class: "course-title" }, t("courseGriftpark")),
      streak > 0
        ? h("span", { class: "course-streak" }, `${streak} ${streak === 1 ? t("statStreakOne") : t("statStreak")}`)
        : null
    ),
    ...courseTrackAndLine(),
    h(
      "button",
      { type: "button", class: "primary course-cta", onclick: () => showScreen("session") },
      icon("target"),
      h("span", {}, nothingLeft ? t("statAllCaughtUp") : t("startSession")),
      preview ? h("span", { class: "course-preview" }, preview) : null
    )
  );
}

// --- Snelkoppelingen en eigen spellen ----------------------------------------

function shortcut(iconName, label, onClick) {
  return h(
    "button",
    { type: "button", class: "shortcut", onclick: onClick },
    icon(iconName),
    h("span", {}, label)
  );
}

/**
 * Stable pick (first by scientific name) so a tile's photo only changes when
 * the matching pool itself changes, not on every re-render.
 */
function representativeBird(game) {
  let best = null;
  for (const bird of allBirds()) {
    if (!hasPhoto(bird) || !matchesFilters(bird, game.filters)) continue;
    if (!best || bird.scientificName.localeCompare(best.scientificName) < 0) best = bird;
  }
  return best;
}

function customGameTile(game) {
  const bird = representativeBird(game);
  const photo = bird ? photoUrl(bird) : null;

  const main = h(
    "button",
    {
      type: "button",
      class: photo ? "tile-main tile-main-photo" : "tile-main",
      style: photo ? { backgroundImage: `url('${photo}')` } : {},
      onclick: () => launchGame(game),
    },
    h("span", { class: "mode-badge" }, icon(MODE_ICONS[game.gameMode] ?? "cursor")),
    h("span", { class: "tile-title" }, game.name)
  );

  const tools = h(
    "div",
    { class: "tile-tools" },
    h(
      "button",
      {
        type: "button",
        class: "tile-tool-btn",
        "aria-label": `${t("edit")}: ${game.name}`,
        onclick: (e) => {
          e.stopPropagation();
          openBuilder(game);
        },
      },
      icon("pencil")
    ),
    h(
      "button",
      {
        type: "button",
        class: "tile-tool-btn",
        "aria-label": `${t("deleteGame")}: ${game.name}`,
        onclick: (e) => {
          e.stopPropagation();
          deleteGame(game.id);
        },
      },
      icon("trash")
    )
  );

  return h("div", { class: "tile custom-tile" }, main, tools);
}

function launchGame(game) {
  const context = { filters: game.filters, gameMode: game.gameMode };
  showScreen(game.gameMode === "browse" ? "browse" : "quiz", context);
}

function render() {
  byId("home-progress").replaceChildren(courseCard());

  byId("home-tiles").replaceChildren(
    shortcut("book", t("browseTile"), () => showScreen("browse")),
    shortcut("target", t("freePractice"), () => showScreen("quiz")),
    shortcut("plus", t("newCustomGame"), () => openBuilder(null))
  );

  const games = allGames();
  byId("custom-games-heading").hidden = games.length === 0;
  byId("custom-game-tiles").replaceChildren(...games.map(customGameTile));
}

export function registerHomeScreen() {
  registerScreen("home", { render });
  on(EVENTS.gamesChanged, () => {
    if (currentScreenId() === "home") refreshScreen();
  });
}
