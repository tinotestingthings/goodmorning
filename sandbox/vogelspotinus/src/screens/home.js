// ---------------------------------------------------------------------------
// Home, in de "Inkt"-richting: de vogel van vandaag opent het scherm, daaronder
// één getal, één zin en één knop.
//
// De volgorde is bewust: je ziet eerst een vogel (waarom je de app opent), dan
// pas je administratie. De oude statuskaart deed het omgekeerd -- drie cijfers,
// een Leitner-boxhistogram en zes tegels waarvan er drie hetzelfde deden.
//
// Alles wat kan wachten -- bladeren, vrij oefenen, eigen spellen -- staat als
// tekstregel onderaan, niet als tegel.
// ---------------------------------------------------------------------------

import { byId, h, icon } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { EVENTS, on } from "../core/events.js";
import { registerScreen, showScreen, currentScreenId, refreshScreen } from "../core/nav.js";
import { allBirds, bilingual, hasPhoto, photoUrl, primaryName } from "../core/birds.js";
import { matchesFilters } from "../core/filters.js";
import { allGames, deleteGame } from "../core/games.js";
import { courseDetections, courseProgress } from "../core/course.js";
import { birdOfTheDay } from "../core/daily.js";
import { photoAttribution } from "../core/photos.js";
import { plannedSessionSize } from "../core/session.js";
import { currentStreak } from "../core/stats.js";
import { openBirdDetail } from "../ui/detail-sheet.js";
import { openBuilder } from "./builder.js";

const MODE_ICONS = {
  browse: "book",
  "quiz-text": "cursor",
  "quiz-choice": "list-check",
  "quiz-study": "cap",
};

// --- Vogel van vandaag ------------------------------------------------------

function dailyBirdBlock() {
  const bird = birdOfTheDay();
  if (!bird) return null;

  const heard = courseDetections(bird);
  const fact = bilingual(bird, "fact");
  const photo = photoUrl(bird);
  const credit = photo ? photoAttribution(bird, photo) : null;

  const hero = h(
    "button",
    {
      type: "button",
      class: "daily-hero",
      style: photo ? { backgroundImage: `url('${photo}')` } : {},
      "aria-label": `${t("birdOfTheDay")}: ${primaryName(bird)}`,
      onclick: () => openBirdDetail(bird),
    },
    h("span", { class: "daily-badge" }, t("birdOfTheDay"))
  );

  return h(
    "section",
    { class: "daily" },
    hero,
    h(
      "div",
      { class: "daily-text" },
      h(
        "h2",
        { class: "daily-name" },
        primaryName(bird),
        h("span", { class: "daily-latin", lang: "la" }, bird.scientificName)
      ),
      h(
        "p",
        { class: "daily-fact" },
        heard ? `${heard.toLocaleString(t("localeTag"))}× ${t("heardInGriftpark")}. ` : null,
        fact
      ),
      // De iNaturalist-foto's staan onder een CC-licentie die naamsvermelding
      // eist. Als tooltip alleen is dat op een telefoon onzichtbaar, dus hier
      // staat hij gewoon in beeld.
      credit ? h("p", { class: "daily-credit" }, credit) : null
    )
  );
}

// --- Voortgang + de ene knop ------------------------------------------------

function progressBlock() {
  const c = courseProgress();
  const streak = currentStreak();
  const inProgress = c.started - c.learned;
  const rest = c.total - c.started;
  const planned = plannedSessionSize();

  const bar = h(
    "div",
    { class: "ink-bar", "aria-hidden": "true" },
    h("span", { class: "ink-seg ink-seg-mastered", style: { flexGrow: String(c.mastered) } }),
    h("span", { class: "ink-seg ink-seg-learned", style: { flexGrow: String(c.learned - c.mastered) } }),
    h("span", { class: "ink-seg ink-seg-started", style: { flexGrow: String(inProgress) } }),
    h("span", { class: "ink-seg ink-seg-rest", style: { flexGrow: String(rest) } })
  );

  // Alles op één regel onder het getal. Een aparte streak-kolom ernaast paste
  // niet op 375px: het label brak dan over twee regels.
  const detail = [
    c.mastered > 0 ? `${c.mastered} ${t("statMastered")}` : null,
    inProgress > 0 ? `${inProgress} ${t("statInProgress")}` : null,
    streak > 0 ? `${streak} ${streak === 1 ? t("statStreakOne") : t("statStreak")}` : null,
  ].filter(Boolean);

  // De knop belooft precies wat de sessie straks deelt -- session.js rekent dat
  // uit, zodat home en sessie niet uit elkaar kunnen lopen.
  const cta = h(
    "button",
    { type: "button", class: "primary ink-cta", onclick: () => showScreen("session") },
    planned.total > 0 ? t("startSession") : t("statAllCaughtUp")
  );

  return h(
    "section",
    { class: "ink-progress" },
    h(
      "div",
      { class: "ink-figure" },
      h("span", { class: "ink-num" }, String(c.learned)),
      h(
        "span",
        { class: "ink-figure-text" },
        h("span", { class: "ink-of" }, `${t("statOf")} ${c.total} ${t("statLearnedOf")}`),
        detail.length ? h("span", { class: "ink-detail" }, detail.join(" · ")) : null
      )
    ),
    bar,
    h("p", { class: "ink-plan" }, plannedLine(planned)),
    cta
  );
}

/** "9 kaarten vandaag — 4 herhalingen en 5 nieuwe vogels." */
function plannedLine({ reviews, fresh, total }) {
  if (total === 0) return t("sessionEmptyBody");
  const parts = [];
  if (reviews > 0) parts.push(`${reviews} ${t("plannedReviews")}`);
  if (fresh > 0) parts.push(`${fresh} ${t("plannedNew")}`);
  return `${total} ${t("plannedCards")} — ${parts.join(` ${t("and")} `)}.`;
}

// --- Snelkoppelingen en eigen spellen ---------------------------------------

function quietLink(labelKey, onClick) {
  return h("button", { type: "button", class: "quiet-link", onclick: onClick }, t(labelKey));
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
  byId("home-daily").replaceChildren(dailyBirdBlock() ?? "");
  byId("home-progress").replaceChildren(progressBlock());

  byId("home-tiles").replaceChildren(
    quietLink("browseTile", () => showScreen("browse")),
    quietLink("freePractice", () => showScreen("quiz")),
    quietLink("newCustomGame", () => openBuilder(null))
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
