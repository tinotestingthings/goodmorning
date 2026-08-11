// ---------------------------------------------------------------------------
// Browse screen: search + generic filter bar (tucked behind an Options
// sheet, same pattern as Quiz), card grid, detail sheet.
// ---------------------------------------------------------------------------

let browseFilterSelection = emptyFilterSelection();
let browseInitialized = false;

function browsePool() {
  // When launched from a saved custom game in "browse" mode, start from that
  // game's fixed filter set instead of the freely-editable browse filters.
  if (activeGameContext && activeGameContext.gameMode === "browse") {
    return allBirds.filter((b) => matchesFilters(b, activeGameContext.filters));
  }
  return allBirds;
}

function filteredBrowseBirds() {
  const query = document.getElementById("search-input").value.trim().toLowerCase();
  const pool = browsePool();
  const usesOwnFilters = !(activeGameContext && activeGameContext.gameMode === "browse");

  return pool.filter((b) => {
    if (usesOwnFilters && !matchesFilters(b, browseFilterSelection)) return false;
    if (!query) return true;
    const haystack = [b.englishName, b.dutchName, b.scientificName].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

function birdBadgeHtml(bird) {
  if (typeof getBoxInfo !== "function") return "";
  const info = getBoxInfo(bird);
  if (!info.started) return `<span class="bird-badge tier-fresh">${t("badgeFresh")}</span>`;
  const tier = info.box >= MASTERED_BOX ? "mastered" : info.box >= LEARNED_BOX ? "learned" : "learning";
  const label = tier === "mastered" ? t("badgeMastered") : tier === "learned" ? t("badgeLearned") : t("badgeLearning");
  const due = info.dueAt && info.dueAt <= Date.now() ? `<span class="bird-badge tier-due">${t("badgeDue")}</span>` : "";
  return `<span class="bird-badge tier-${tier}">${label} <span class="badge-box">${info.box}/${MASTERED_BOX}</span></span>${due}`;
}

function renderBrowseGrid() {
  const birds = filteredBrowseBirds();
  const countText = `${birds.length} ${t("matchingBirds")}`;
  document.getElementById("browse-count").textContent = countText;
  const optionsCount = document.getElementById("browse-options-count");
  if (optionsCount) optionsCount.textContent = countText;

  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  document.getElementById("empty-state").style.display = birds.length === 0 ? "block" : "none";

  const frag = document.createDocumentFragment();
  for (const bird of birds) {
    const card = document.createElement("div");
    card.className = "card";
    const fav = isFavorite(bird);
    card.innerHTML = `
      <div class="card-image-wrap">
        <img src="${bird.imageThumbUrl || bird.imageUrl || PLACEHOLDER_IMG}" alt="${escapeHtml(primaryName(bird))}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMG}'" />
        ${fav ? `<span class="fav-badge">${icon("star", "icon-fill")}</span>` : ""}
      </div>
      <div class="body">
        <p class="dutch-name">${escapeHtml(primaryName(bird))}</p>
        <p class="sub-names">${secondaryNames(bird).map(escapeHtml).join(" · ")}${secondaryNames(bird).length ? " · " : ""}<em>${escapeHtml(bird.scientificName)}</em></p>
        <p class="bird-badges">${birdBadgeHtml(bird)}</p>
      </div>
    `;
    card.addEventListener("click", () => openDetail(bird));
    frag.appendChild(card);
  }
  grid.appendChild(frag);
}

function openBrowseOptions() {
  document.getElementById("browse-options-overlay").classList.remove("hidden");
}

function closeBrowseOptions() {
  document.getElementById("browse-options-overlay").classList.add("hidden");
}

function renderBrowseScreen() {
  const showOwnFilters = !(activeGameContext && activeGameContext.gameMode === "browse");
  document.getElementById("browse-filters-btn").style.display = showOwnFilters ? "inline-flex" : "none";

  if (showOwnFilters) {
    renderFilterBar(document.getElementById("browse-filter-bar"), browseFilterSelection, () => renderBrowseGrid());
  }

  if (!browseInitialized) {
    document.getElementById("search-input").addEventListener("input", renderBrowseGrid);
    document.getElementById("browse-filters-btn").addEventListener("click", openBrowseOptions);
    document.getElementById("browse-options-close").addEventListener("click", closeBrowseOptions);
    document.getElementById("browse-options-overlay").addEventListener("click", (e) => {
      if (e.target === document.getElementById("browse-options-overlay")) closeBrowseOptions();
    });
    browseInitialized = true;
  }

  renderBrowseGrid();
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

// ---------------------------------------------------------------------------
// Detail sheet
// ---------------------------------------------------------------------------

function field(label, valueHtml) {
  return `<div class="field"><p class="label">${label}</p><p class="value">${valueHtml}</p></div>`;
}

function birdInfoRows(bird) {
  const rows = [];
  const originText = bf(bird, "origin");
  const statusLabel = filterValueLabel(
    FILTER_DEFINITIONS.find((d) => d.key === "nlStatus"),
    bird.tags.nlStatus
  );
  const originParts = [];
  if (originText) originParts.push(`${t("origin")}: ${escapeHtml(originText)}`);
  originParts.push(`${t("statusInNl")}: ${escapeHtml(statusLabel)}`);
  rows.push(field(t("origin"), originParts.join(" · ")));

  const habitatText = bf(bird, "habitat");
  if (habitatText) rows.push(field(t("habitat"), escapeHtml(habitatText)));
  if (bird.lengthCm) rows.push(field(t("length"), `${bird.lengthCm} cm`));
  const conservation = bf(bird, "conservationStatus");
  if (conservation) rows.push(field(t("conservationStatus"), escapeHtml(conservation)));
  const fact = bf(bird, "fact");
  if (fact) rows.push(field(t("fact"), escapeHtml(fact)));
  return rows.join("");
}

// Wikipedia / Xeno-canto links rendered as small icon links, so they survive
// wherever we show bird info (Browse detail AND the quiz/study reveal).
function birdLinkIcons(bird) {
  const links = [];
  if (bird.wikipediaUrl) links.push(`<a class="bird-link" href="${bird.wikipediaUrl}" target="_blank" rel="noopener">${icon("wiki")} <span>${t("wikipediaEn")}</span></a>`);
  if (bird.dutchWikipediaUrl) links.push(`<a class="bird-link" href="${bird.dutchWikipediaUrl}" target="_blank" rel="noopener">${icon("wiki")} <span>${t("wikipediaNl")}</span></a>`);
  if (bird.xenoCantoUrl) links.push(`<a class="bird-link" href="${bird.xenoCantoUrl}" target="_blank" rel="noopener">${icon("speaker")} <span>${t("listenXenoCanto")}</span></a>`);
  if (!links.length) return "";
  return `<div class="bird-links">${links.join("")}</div>`;
}

function buildDetailHtml(bird) {
  const rowsHtml = birdInfoRows(bird);
  const linksHtml = birdLinkIcons(bird);
  const fav = isFavorite(bird);
  const imgUrl = bird.imageUrl || bird.imageThumbUrl || PLACEHOLDER_IMG;

  return `
    <button class="detail-close" id="detail-close-btn">${icon("close")}</button>
    <button class="detail-fav" id="detail-fav-btn">${icon("star", fav ? "icon-fill" : "")}</button>
    <div class="detail-image-wrap" id="detail-image-wrap">
      <img src="${imgUrl}" alt="${escapeHtml(primaryName(bird))}" onerror="this.src='${PLACEHOLDER_IMG}'" />
    </div>
    <div class="detail-body">
      <h2>${escapeHtml(primaryName(bird))}</h2>
      <p class="names">${secondaryNames(bird).map(escapeHtml).join(" &middot; ")}${secondaryNames(bird).length ? " &middot; " : ""}<em>${escapeHtml(bird.scientificName)}</em></p>
      ${rowsHtml}
      ${linksHtml}
    </div>
    ${bird.soundUrl ? `<button class="detail-sound" id="detail-sound-btn">${icon("speaker")}</button>` : ""}
  `;
}

function openDetail(bird) {
  const sheet = document.getElementById("detail-sheet");
  sheet.innerHTML = buildDetailHtml(bird);
  document.getElementById("detail-overlay").classList.remove("hidden");
  document.getElementById("detail-close-btn").addEventListener("click", closeDetail);
  document.getElementById("detail-fav-btn").addEventListener("click", () => {
    toggleFavorite(bird);
    openDetail(bird); // re-render to flip the star
  });
  document.getElementById("detail-image-wrap").addEventListener("click", () => {
    openFullscreenImage(bird.imageUrl || bird.imageThumbUrl);
  });
  const soundBtn = document.getElementById("detail-sound-btn");
  if (soundBtn) {
    soundBtn.addEventListener("click", () => {
      toggleBirdSound(bird, (isPlaying) => {
        soundBtn.classList.toggle("playing", isPlaying);
        soundBtn.innerHTML = isPlaying ? icon("stop") : icon("speaker");
        soundBtn.title = isPlaying ? t("stopSound") : t("playCall");
      });
    });
  }
}

function closeDetail() {
  stopBirdSound();
  document.getElementById("detail-overlay").classList.add("hidden");
}
