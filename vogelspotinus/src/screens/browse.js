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
import { allBirds, primaryName, searchBirds } from "../core/birds.js";
import { emptySelection, filterBirds, kindPool } from "../core/filters.js";
import { KEYS, read, write } from "../core/storage.js";
import { openSheet, sheetBody } from "../ui/sheet.js";
import { renderFilterBar, renderKindSwitch } from "../ui/filter-bar.js";
import { birdCard, setCardFavorite } from "../ui/bird-card.js";
import { openBirdDetail } from "../ui/detail-sheet.js";

const FIRST_CHUNK = 48;
const NEXT_CHUNK = 24;

// Standaard gesorteerd op hoe vaak een soort echt wordt gezien (GBIF-
// waarnemingen). De dataset zelf staat in taxonomische volgorde, en daarin
// beginnen de Anseriformes -- dus opende Bladeren altijd met een muur van
// exotische ganzen in plaats van merel, roodborst en koolmees.
// Honden staan niet in GBIF; voor hen is het aantal Wikipedia-bezoeken over 60
// dagen de beste beschikbare maat voor "ras dat je herkent". Twee verschillende
// eenheden in één sortering klinkt fout, maar de schalen blijken goed te passen
// (mediaan 6793 waarnemingen tegen 6575 bezoeken), dus in de gemengde lijst
// staat de eerste hond gewoon op plek 89 in plaats van achter alle 566 vogels.
const SORTS = {
  common: (a, b) =>
    (b.gbifOccurrenceCount ?? b.popularity ?? 0) - (a.gbifOccurrenceCount ?? a.popularity ?? 0),
  az: (a, b) => primaryName(a).localeCompare(primaryName(b)),
  taxo: null, // datasetvolgorde
};

let sortMode = Object.hasOwn(SORTS, read(KEYS.browseSort, "common"))
  ? read(KEYS.browseSort, "common")
  : "common";

const selection = emptySelection();
/** @type {Map<string, HTMLElement>} soort-id -> card element */
const cardCache = new Map();

let matches = [];
let shown = 0;
let observer = null;
let sheetCountEl = null;
let sheetBarEl = null;

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
  const found = searchBirds(pool, byId("browse-search").value);
  const compare = SORTS[sortMode];
  return compare ? [...found].sort(compare) : found;
}

function cardFor(bird) {
  let card = cardCache.get(bird.id);
  if (!card) {
    card = birdCard(bird, { onOpen: openBirdDetail });
    cardCache.set(bird.id, card);
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

function sortSwitch() {
  const options = [
    ["common", t("sortCommon")],
    ["az", t("sortAZ")],
    ["taxo", t("sortTaxo")],
  ];
  const group = h("div", { class: "segmented", role: "group", "aria-label": t("sortLabel") });
  for (const [value, label] of options) {
    group.append(
      h(
        "button",
        {
          type: "button",
          class: value === sortMode ? "active" : "",
          "aria-pressed": String(value === sortMode),
          onclick: () => {
            sortMode = value;
            write(KEYS.browseSort, value);
            for (const btn of group.children) {
              btn.classList.toggle("active", btn.textContent === label);
              btn.setAttribute("aria-pressed", String(btn.textContent === label));
            }
            renderGrid();
          },
        },
        label
      )
    );
  }
  return group;
}

function openOptions() {
  openSheet({
    label: t("options"),
    build(dialog) {
      sheetCountEl = h("p", { class: "count-line" }, matchCountText(matches.length));
      const bar = h("div");
      sheetBarEl = bar;
      // De balk stelt zichzelf samen uit het gekozen dier: bij honden verdwijnen
      // "Status in NL", "Familie" en de kleuren die geen hond heeft.
      renderFilterBar(bar, selection, onFilterChange, kindPool(selection));
      dialog.append(
        sheetBody(
          h("h2", {}, t("options")),
          h("p", { class: "field-legend" }, t("sortLabel")),
          sortSwitch(),
          sheetCountEl,
          bar
        )
      );
    },
    onClose() {
      sheetCountEl = null;
      sheetBarEl = null;
    },
  });
}

/**
 * De diersoortschakelaar en de filterbalk schrijven op dezelfde selectie, dus
 * na een wijziging in de een moet de ander opnieuw kloppen.
 */
function onFilterChange({ rebuildBar = false } = {}) {
  renderKindSwitch(byId("browse-kind"), selection, onFilterChange);
  // Van dier wisselen verandert wélke dimensies er zijn, dus dan moet de balk
  // opnieuw opgebouwd. Bij een gewone chip niet: dat zou je zoekveld, je
  // scrollpositie en je focus weggooien -- precies wat deze balk vermijdt.
  if (rebuildBar && sheetBarEl) {
    renderFilterBar(sheetBarEl, selection, onFilterChange, kindPool(selection));
  }
  renderGrid();
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
  // In een opgeslagen spel ligt de pool vast; dan zou de schakelaar liegen.
  byId("browse-kind").hidden = isGameContext();
  if (!isGameContext()) renderKindSwitch(byId("browse-kind"), selection, onFilterChange);
  renderGrid();
}

export function registerBrowseScreen() {
  registerScreen("browse", { mount, render });

  // A favourite toggled anywhere patches the cached card in place; only a
  // "favorites only" filter needs the grid recomputed.
  on(EVENTS.favoritesChanged, ({ bird, isFavorite }) => {
    setCardFavorite(cardCache.get(bird.id), isFavorite);
    if (selection.favoritesOnly && currentScreenId() === "browse") renderGrid();
  });

  // Card contents are language-dependent, so the cache cannot survive a switch.
  on(EVENTS.languageChanged, () => {
    cardCache.clear();
    if (currentScreenId() === "browse") refreshScreen();
  });
}
