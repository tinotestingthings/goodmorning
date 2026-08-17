// ---------------------------------------------------------------------------
// Custom Game Builder: pick filters (or hand-pick species), pick a game mode,
// save it as a home-screen tile.
// ---------------------------------------------------------------------------

import { byId, debounce, h } from "../core/dom.js";
import { matchCountText, t } from "../core/i18n.js";
import { registerScreen, showScreen } from "../core/nav.js";
import { allBirds, birdByScientificName, primaryName, searchBirds } from "../core/birds.js";
import { cloneSelection, describeSelection, emptySelection, filterBirds } from "../core/filters.js";
import { newGameId, saveGame } from "../core/games.js";
import { renderFilterBar } from "../ui/filter-bar.js";
import { birdPhoto } from "../ui/bird-media.js";

const MAX_SEARCH_RESULTS = 40;

let selection = emptySelection();
let editingId = null;
let nameIsAuto = true;
let pickMode = "tags"; // 'tags' | 'specific'

/** Open the builder for a new game (null) or to edit an existing one. */
export function openBuilder(existingGame) {
  if (existingGame) {
    editingId = existingGame.id;
    selection = cloneSelection(existingGame.filters);
    pickMode = selection.specificBirds?.length ? "specific" : "tags";
    byId("builder-mode-select").value = existingGame.gameMode;
    byId("builder-name").value = existingGame.name;
    nameIsAuto = false;
  } else {
    editingId = null;
    selection = emptySelection();
    pickMode = "tags";
    byId("builder-mode-select").value = "quiz-choice";
    byId("builder-name").value = "";
    nameIsAuto = true;
  }
  showScreen("builder");
}

function updateCount() {
  byId("builder-count").textContent = matchCountText(filterBirds(allBirds(), selection).length);
  if (nameIsAuto) {
    byId("builder-name").value = describeSelection(selection) || t("customGame");
  }
}

function setPickMode(mode) {
  pickMode = mode;
  if (mode === "tags") selection.specificBirds = [];
  render();
}

function renderPickModeSwitch() {
  const options = [
    { mode: "tags", labelKey: "filterByTags" },
    { mode: "specific", labelKey: "pickSpecificBirds" },
  ];
  byId("builder-pick-mode").replaceChildren(
    ...options.map(({ mode, labelKey }) =>
      h(
        "button",
        {
          type: "button",
          class: pickMode === mode ? "active" : "",
          "aria-pressed": String(pickMode === mode),
          onclick: () => setPickMode(mode),
        },
        t(labelKey)
      )
    )
  );
}

function renderSelectedChips() {
  const chips = (selection.specificBirds ?? [])
    .map((name) => birdByScientificName(name))
    .filter(Boolean)
    .map((bird) =>
      h(
        "button",
        {
          type: "button",
          class: "chip active",
          "aria-label": `${t("deleteGame")}: ${primaryName(bird)}`,
          onclick: () => {
            selection.specificBirds = selection.specificBirds.filter(
              (n) => n !== bird.scientificName
            );
            updateCount();
            renderSpecificPicker();
          },
        },
        `${primaryName(bird)} ×`
      )
    );
  byId("builder-selected").replaceChildren(...chips);
}

function renderSpecificPicker() {
  const query = byId("builder-bird-search").value.trim();
  const selected = new Set(selection.specificBirds ?? []);
  const matches = query ? searchBirds(allBirds(), query).slice(0, MAX_SEARCH_RESULTS) : [];

  byId("builder-bird-results").replaceChildren(
    ...matches.map((bird) => {
      const box = h("input", { type: "checkbox", checked: selected.has(bird.scientificName) });
      box.addEventListener("change", () => {
        const set = new Set(selection.specificBirds ?? []);
        if (box.checked) set.add(bird.scientificName);
        else set.delete(bird.scientificName);
        selection.specificBirds = [...set];
        updateCount();
        renderSelectedChips();
      });
      return h(
        "label",
        { class: "pick-row" },
        box,
        birdPhoto(bird, { zoomable: false, fit: "cover" }),
        h("span", {}, primaryName(bird), " ", h("em", { lang: "la" }, bird.scientificName))
      );
    })
  );
  renderSelectedChips();
}

function save() {
  const name = byId("builder-name").value.trim() || t("customGame");
  saveGame({
    id: editingId ?? newGameId(),
    name,
    gameMode: byId("builder-mode-select").value,
    filters: cloneSelection(selection),
  });
  showScreen("home");
}

function mount() {
  byId("builder-bird-search").addEventListener("input", debounce(renderSpecificPicker, 120));
  byId("builder-name").addEventListener("input", () => {
    nameIsAuto = false;
  });
  byId("builder-save").addEventListener("click", save);
  byId("builder-cancel").addEventListener("click", () => showScreen("home"));
}

function render() {
  renderPickModeSwitch();
  const byTags = pickMode === "tags";
  byId("builder-filter-bar").hidden = !byTags;
  byId("builder-specific-picker").hidden = byTags;

  if (byTags) renderFilterBar(byId("builder-filter-bar"), selection, updateCount);
  else renderSpecificPicker();

  updateCount();
}

export function registerBuilderScreen() {
  registerScreen("builder", { mount, render });
}
