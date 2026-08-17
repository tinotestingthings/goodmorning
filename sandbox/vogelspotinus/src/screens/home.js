// ---------------------------------------------------------------------------
// Home: the two built-in tiles, the "new game" tile, and one tile per saved
// custom game.
// ---------------------------------------------------------------------------

import { byId, h, icon } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { EVENTS, on } from "../core/events.js";
import { registerScreen, showScreen, currentScreenId, refreshScreen } from "../core/nav.js";
import { allBirds, hasPhoto, photoUrl } from "../core/birds.js";
import { matchesFilters } from "../core/filters.js";
import { allGames, deleteGame } from "../core/games.js";
import { openBuilder } from "./builder.js";

const MODE_ICONS = {
  browse: "book",
  "quiz-text": "cursor",
  "quiz-choice": "list-check",
  "quiz-study": "cap",
};

function tile({ iconName, title, description, onClick, className = "" }) {
  return h(
    "button",
    { type: "button", class: `tile ${className}`.trim(), onclick: onClick },
    h("span", { class: "tile-icon" }, icon(iconName)),
    h("span", { class: "tile-title" }, title),
    description ? h("span", { class: "tile-desc" }, description) : null
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
  byId("home-tiles").replaceChildren(
    tile({
      iconName: "book",
      title: t("browseTile"),
      description: t("browseTileDesc"),
      onClick: () => showScreen("browse"),
    }),
    tile({
      iconName: "target",
      title: t("quizTile"),
      description: t("quizTileDesc"),
      onClick: () => showScreen("quiz"),
    }),
    tile({
      iconName: "plus",
      title: t("newCustomGame"),
      onClick: () => openBuilder(null),
      className: "tile-new",
    })
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
