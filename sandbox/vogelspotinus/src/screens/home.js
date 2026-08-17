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
import { collectionCounts, dueBirds, knownPool, weakPool } from "../core/progress.js";
import { currentStreak } from "../core/stats.js";
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


// ---------------------------------------------------------------------------
// Statuskaart + oefensessies. Deze hoorden bij de goodmorning-integratie en
// stonden in een los progress.js dat de module-herbouw niet meenam.
// ---------------------------------------------------------------------------

function startPool(poolFn, titleKey, gameMode) {
  const birds = poolFn();
  if (!birds.length) {
    flash(t(titleKey === "tileReviewTitle" ? "statAllCaughtUp" : "emptyPoolMsg"));
    return;
  }
  showScreen("quiz", { gameMode, birds, title: t(titleKey) });
}

let flashTimer = null;
function flash(msg) {
  let el = byId("app-toast");
  if (!el) {
    el = h("div", { id: "app-toast", class: "app-toast" });
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

function progressCard() {
  const c = collectionCounts();
  const streak = currentStreak();
  const due = dueBirds().length;
  const maxBox = Math.max(1, ...c.boxes);

  const bars = h("div", { class: "dist-bars" }, ...c.boxes.map((n, i) =>
    h("span", { class: "dist-bar", title: `box ${i + 1}: ${n}` },
      h("span", { class: `dist-fill dist-b${i + 1}`, style: { height: `${Math.round((n / maxBox) * 100)}%` } })
    )
  ));

  const fig = (num, label, extra) =>
    h("div", { class: "stat-fig" },
      h("span", { class: "stat-num" }, String(num)),
      h("span", { class: "stat-lbl" }, label, extra ?? null));

  const dueRow = due > 0
    ? h("button", { type: "button", class: "stat-due", onclick: () => startPool(dueBirds, "tileReviewTitle", "quiz-study") },
        h("span", { class: "stat-due-n" }, String(due)),
        h("span", {}, ` ${t("statDue")} `),
        h("span", { class: "stat-review-cta" }, t("statReviewNow")))
    : h("p", { class: "stat-due stat-due-empty" }, t("statAllCaughtUp"));

  return h("div", { class: "stat-card" },
    h("div", { class: "stat-figures" },
      fig(c.learned, `${t("statLearnedOf")} `, h("span", { class: "stat-total" }, `${t("statOf")} ${c.total}`)),
      fig(c.mastered, t("statMastered")),
      fig(streak, streak === 1 ? t("statStreakOne") : t("statStreak"))),
    h("div", { class: "stat-dist", "aria-hidden": "true" }, bars,
      h("div", { class: "dist-legend" }, h("span", {}, t("distNew")), h("span", {}, t("distMastered")))),
    dueRow);
}

function render() {
  byId("home-progress").replaceChildren(progressCard());

  byId("home-tiles").replaceChildren(
    tile({
      iconName: "list-check",
      title: t("tileReviewTitle"),
      description: t("tileReviewDesc"),
      onClick: () => startPool(dueBirds, "tileReviewTitle", "quiz-study"),
    }),
    tile({
      iconName: "check",
      title: t("tileMasteryTitle"),
      description: t("tileMasteryDesc"),
      onClick: () => startPool(knownPool, "tileMasteryTitle", "quiz-choice"),
    }),
    tile({
      iconName: "target",
      title: t("tileWeakTitle"),
      description: t("tileWeakDesc"),
      onClick: () => startPool(weakPool, "tileWeakTitle", "quiz-choice"),
    }),
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
