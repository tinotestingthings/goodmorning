// ---------------------------------------------------------------------------
// Browse: search + filters + a card grid over all 566 species.
//
// The grid is incremental. Cards are built once per bird and cached, then
// re-parented in chunks as you scroll -- the previous version rebuilt every
// matching card's DOM on every un-debounced keystroke, which is what made
// searching feel heavy on a phone.
// ---------------------------------------------------------------------------

import { byId, debounce, h } from "../core/dom.js";
import { matchCountText, t } from "../core/i18n.js";
import { EVENTS, on } from "../core/events.js";
import { registerScreen, gameContext, currentScreenId, refreshScreen } from "../core/nav.js";
import { allBirds, searchBirds } from "../core/birds.js";
import { emptySelection, filterBirds } from "../core/filters.js";
import { openSheet, sheetBody } from "../ui/sheet.js";
import { renderFilterBar } from "../ui/filter-bar.js";
import { birdCard, setCardFavorite } from "../ui/bird-card.js";
import { openBirdDetail } from "../ui/detail-sheet.js";

const FIRST_CHUNK = 48;
const NEXT_CHUNK = 24;

const selection = emptySelection();
/** @type {Map<string, HTMLElement>} scientific name -> card element */
const cardCache = new Map();

let matches = [];
let shown = 0;
let observer = null;
let sheetCountEl = null;

/** In a saved "browse" game the pool is fixed by the game, not by the filter bar. */
function isGameContext() {
  return gameContext()?.gameMode === "browse";
}

function currentPool() {
  const context = gameContext();
  return isGameContext() ? filterBirds(allBirds(), context.filters) : allBirds();
}

function computeMatches() {
  const pool = isGameContext() ? currentPool() : filterBirds(currentPool(), selection);
  return searchBirds(pool, byId("browse-search").value);
}

function cardFor(bird) {
  let card = cardCache.get(bird.scientificName);
  if (!card) {
    card = birdCard(bird, { onOpen: openBirdDetail });
    cardCache.set(bird.scientificName, card);
  }
  return card;
}

function appendChunk(size) {
  const slice = matches.slice(shown, shown + size);
  byId("browse-grid").append(...slice.map(cardFor));
  shown += slice.length;
  byId("browse-sentinel").hidden = shown >= matches.length;
}

function renderGrid() {
  matches = computeMatches();
  shown = 0;

  const countText = matchCountText(matches.length);
  byId("browse-count").textContent = countText;
  if (sheetCountEl) sheetCountEl.textContent = countText;

  byId("browse-grid").replaceChildren();
  byId("browse-empty").hidden = matches.length > 0;
  appendChunk(FIRST_CHUNK);
}

function openOptions() {
  openSheet({
    label: t("options"),
    build(dialog) {
      sheetCountEl = h("p", { class: "count-line" }, matchCountText(matches.length));
      const bar = h("div");
      renderFilterBar(bar, selection, renderGrid);
      dialog.append(sheetBody(h("h2", {}, t("options")), sheetCountEl, bar));
    },
    onClose() {
      sheetCountEl = null;
    },
  });
}

function mount() {
  byId("browse-search").addEventListener("input", debounce(renderGrid, 120));
  byId("browse-options-btn").addEventListener("click", openOptions);

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting) && shown < matches.length) appendChunk(NEXT_CHUNK);
    },
    { rootMargin: "400px" }
  );
  observer.observe(byId("browse-sentinel"));
}

function render() {
  byId("browse-options-btn").hidden = isGameContext();
  byId("browse-search-row").hidden = false;
  renderGrid();
}

export function registerBrowseScreen() {
  registerScreen("browse", { mount, render });

  // A favourite toggled anywhere patches the cached card in place; only a
  // "favorites only" filter needs the grid recomputed.
  on(EVENTS.favoritesChanged, ({ bird, isFavorite }) => {
    setCardFavorite(cardCache.get(bird.scientificName), isFavorite);
    if (selection.favoritesOnly && currentScreenId() === "browse") renderGrid();
  });

  // Card contents are language-dependent, so the cache cannot survive a switch.
  on(EVENTS.languageChanged, () => {
    cardCache.clear();
    if (currentScreenId() === "browse") refreshScreen();
  });
}
