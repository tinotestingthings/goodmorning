// ---------------------------------------------------------------------------
// Custom Game Builder: pick filters (or hand-pick specific birds) via the
// shared registry, pick a game mode, save as a home-screen tile. Launching a
// tile sets `activeGameContext` which browse.js/quiz.js already restrict
// themselves to.
// ---------------------------------------------------------------------------

let builderSelection = emptyFilterSelection();
let builderEditingId = null;
let builderNameIsAuto = true;
let builderPickMode = "tags"; // 'tags' | 'specific'
let builderInitialized = false;

function openBuilder(existingGame) {
  if (existingGame) {
    builderEditingId = existingGame.id;
    builderSelection = JSON.parse(JSON.stringify(existingGame.filters));
    builderPickMode = builderSelection.specificBirds && builderSelection.specificBirds.length ? "specific" : "tags";
    document.getElementById("builder-mode-select").value = existingGame.gameMode;
    document.getElementById("builder-name-input").value = existingGame.name;
    builderNameIsAuto = false;
  } else {
    builderEditingId = null;
    builderSelection = emptyFilterSelection();
    builderPickMode = "tags";
    document.getElementById("builder-mode-select").value = "quiz-choice";
    document.getElementById("builder-name-input").value = "";
    builderNameIsAuto = true;
  }
  showScreen("builder");
}

function updateBuilderCount() {
  const n = allBirds.filter((b) => matchesFilters(b, builderSelection)).length;
  document.getElementById("builder-count").textContent = `${n} ${t("matchingBirds")}`;
  if (builderNameIsAuto) {
    const desc = describeFilterSelection(builderSelection);
    document.getElementById("builder-name-input").value = desc || t("customGame");
  }
}

function setBuilderPickMode(mode) {
  builderPickMode = mode;
  if (mode === "tags") {
    builderSelection.specificBirds = [];
  }
  renderBuilderScreen();
}

function renderSpecificBirdPicker() {
  const container = document.getElementById("builder-specific-picker");
  const search = (document.getElementById("builder-bird-search").value || "").trim().toLowerCase();
  const selected = new Set(builderSelection.specificBirds || []);

  const matches = search
    ? allBirds.filter((b) => [b.englishName, b.dutchName, b.scientificName].filter(Boolean).join(" ").toLowerCase().includes(search))
    : [];

  const list = document.getElementById("builder-bird-results");
  list.innerHTML = "";
  for (const bird of matches.slice(0, 40)) {
    const row = document.createElement("label");
    row.className = "bird-pick-row";
    const checked = selected.has(bird.scientificName);
    row.innerHTML = `
      <input type="checkbox" ${checked ? "checked" : ""} />
      <img src="${bird.imageThumbUrl || bird.imageUrl || PLACEHOLDER_IMG}" alt="" onerror="this.src='${PLACEHOLDER_IMG}'" />
      <span>${escapeHtml(primaryName(bird))} <em>(${escapeHtml(bird.scientificName)})</em></span>
    `;
    row.querySelector("input").addEventListener("change", (e) => {
      const set = new Set(builderSelection.specificBirds || []);
      if (e.target.checked) set.add(bird.scientificName);
      else set.delete(bird.scientificName);
      builderSelection.specificBirds = [...set];
      updateBuilderCount();
      renderSelectedBirdChips();
    });
    list.appendChild(row);
  }

  renderSelectedBirdChips();
}

function renderSelectedBirdChips() {
  const chipContainer = document.getElementById("builder-selected-birds");
  const selected = builderSelection.specificBirds || [];
  chipContainer.innerHTML = "";
  for (const sciName of selected) {
    const bird = allBirds.find((b) => b.scientificName === sciName);
    if (!bird) continue;
    const chip = document.createElement("button");
    chip.className = "chip active";
    chip.textContent = primaryName(bird) + " ×";
    chip.addEventListener("click", () => {
      builderSelection.specificBirds = selected.filter((s) => s !== sciName);
      updateBuilderCount();
      renderSpecificBirdPicker();
    });
    chipContainer.appendChild(chip);
  }
}

function renderBuilderScreen() {
  document.getElementById("builder-mode-tags").classList.toggle("active", builderPickMode === "tags");
  document.getElementById("builder-mode-specific").classList.toggle("active", builderPickMode === "specific");
  document.getElementById("builder-filter-bar").style.display = builderPickMode === "tags" ? "block" : "none";
  document.getElementById("builder-specific-picker").style.display = builderPickMode === "specific" ? "block" : "none";

  if (builderPickMode === "tags") {
    renderFilterBar(document.getElementById("builder-filter-bar"), builderSelection, () => updateBuilderCount());
  } else {
    renderSpecificBirdPicker();
  }
  updateBuilderCount();

  if (!builderInitialized) {
    document.getElementById("builder-mode-tags").addEventListener("click", () => setBuilderPickMode("tags"));
    document.getElementById("builder-mode-specific").addEventListener("click", () => setBuilderPickMode("specific"));
    document.getElementById("builder-bird-search").addEventListener("input", renderSpecificBirdPicker);
    document.getElementById("builder-name-input").addEventListener("input", () => {
      builderNameIsAuto = false;
    });
    document.getElementById("builder-save").addEventListener("click", () => {
      const name = document.getElementById("builder-name-input").value.trim() || t("customGame");
      const gameMode = document.getElementById("builder-mode-select").value;
      const game = {
        id: builderEditingId || `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name,
        gameMode,
        filters: JSON.parse(JSON.stringify(builderSelection)),
      };
      saveCustomGame(game);
      showScreen("home");
    });
    document.getElementById("builder-cancel").addEventListener("click", () => showScreen("home"));
    builderInitialized = true;
  }
}

function launchCustomGame(game) {
  const context = { filters: game.filters, gameMode: game.gameMode };
  if (game.gameMode === "browse") {
    showScreen("browse", context);
  } else {
    showScreen("quiz", context);
  }
}

// Stable pick (sorted by scientific name) so the tile photo doesn't change
// on every re-render -- just whenever the matching pool itself changes.
function representativeBirdForGame(game) {
  const matches = allBirds
    .filter((b) => matchesFilters(b, game.filters) && (b.imageThumbUrl || b.imageUrl))
    .sort((a, b) => a.scientificName.localeCompare(b.scientificName));
  return matches[0] || null;
}

function renderCustomGameTiles() {
  const games = getCustomGames();
  const heading = document.getElementById("custom-games-heading");
  const container = document.getElementById("custom-game-tiles");
  heading.style.display = games.length ? "block" : "none";
  container.innerHTML = "";

  for (const game of games) {
    const tile = document.createElement("div");
    tile.className = "tile custom-tile";

    const modeIconName =
      game.gameMode === "browse" ? "book" :
      game.gameMode === "quiz-choice" ? "list-check" :
      game.gameMode === "quiz-study" ? "cap" : "cursor";
    const repBird = representativeBirdForGame(game);
    const photoUrl = repBird ? repBird.imageThumbUrl || repBird.imageUrl : null;

    tile.innerHTML = `
      <button class="tile-main" style="${photoUrl ? `background-image:url('${photoUrl}')` : ""}">
        <span class="mode-badge">${icon(modeIconName)}</span>
        <span class="tile-title">${escapeHtml(game.name)}</span>
      </button>
      <div class="tile-tools">
        <button class="tile-tool-btn" data-action="edit" title="${t("edit")}">${icon("pencil")}</button>
        <button class="tile-tool-btn" data-action="delete" title="${t("deleteGame")}">${icon("trash")}</button>
      </div>
    `;
    if (photoUrl) tile.querySelector(".tile-main").classList.add("tile-main-photo");
    tile.querySelector(".tile-main").addEventListener("click", () => launchCustomGame(game));
    tile.querySelector('[data-action="edit"]').addEventListener("click", (e) => {
      e.stopPropagation();
      openBuilder(game);
    });
    tile.querySelector('[data-action="delete"]').addEventListener("click", (e) => {
      e.stopPropagation();
      deleteCustomGame(game.id);
      renderCustomGameTiles();
    });
    container.appendChild(tile);
  }
}
