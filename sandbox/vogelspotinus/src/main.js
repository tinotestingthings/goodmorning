// ---------------------------------------------------------------------------
// Boot. The only file that knows the startup order.
//
// Layering rule enforced by eslint: screens/ may import core/ and ui/;
// core/ imports nothing from screens/ or ui/; screens do not import each
// other (home -> builder is the one allowed exception, for openBuilder).
// ---------------------------------------------------------------------------

import { byId, h } from "./core/dom.js";
import {
  applyStaticTranslations,
  assertStringTablesMatch,
  currentLanguage,
  t,
} from "./core/i18n.js";
import { EVENTS, on } from "./core/events.js";
import { applyTheme, watchSystemColorScheme } from "./core/theme.js";
import { loadBirds } from "./core/birds.js";
import { populateFamilyValues } from "./core/filters.js";
import { loadFavorites } from "./core/favorites.js";
import { applySeed, loadGames } from "./core/games.js";
import { loadLeitnerState } from "./core/leitner.js";
import { loadExtraPhotos } from "./core/photos.js";
import { currentScreenId, initNav, refreshScreen, showScreen } from "./core/nav.js";
import { buildSeed } from "./data/seed-games.js";
import { PLACEHOLDER_IMG } from "./ui/bird-media.js";
import { registerHomeScreen } from "./screens/home.js";
import { registerBrowseScreen } from "./screens/browse.js";
import { registerQuizScreen } from "./screens/quiz.js";
import { registerSessionScreen } from "./screens/session.js";
import { registerBuilderScreen } from "./screens/builder.js";
import { registerSettingsScreen } from "./screens/settings.js";

/**
 * One delegated fallback for every broken photo in the app. This replaced an
 * inline onerror="this.src='...'" attribute that was being written into HTML
 * strings in three different files.
 */
function installImageFallback() {
  document.addEventListener(
    "error",
    (e) => {
      const el = e.target;
      if (el instanceof HTMLImageElement && el.src !== PLACEHOLDER_IMG) el.src = PLACEHOLDER_IMG;
    },
    true
  );
}

function showBootState(...children) {
  byId("boot").hidden = false;
  byId("app").hidden = true;
  byId("boot").replaceChildren(...children);
}

function showBootLoading() {
  showBootState(
    h("div", { class: "spinner", role: "status", "aria-label": t("a11yLoading") }),
    h("p", {}, t("loading"))
  );
}

function showBootError(retry) {
  showBootState(
    h("h2", {}, t("loadFailedTitle")),
    h("p", { class: "count-line" }, t("loadFailedBody")),
    h("button", { type: "button", class: "primary", onclick: retry }, t("retry"))
  );
}

function hideBootState() {
  byId("boot").hidden = true;
  byId("app").hidden = false;
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.warn("[sw] registration failed", err);
    });
  });
}

async function loadData() {
  showBootLoading();
  try {
    await loadBirds();
  } catch (err) {
    console.error("[boot] could not load bird data", err);
    showBootError(loadData);
    return;
  }
  populateFamilyValues();
  // Ná loadBirds(): de seed leest de hondenlijst uit de dataset.
  applySeed(buildSeed());
  hideBootState();
  showScreen("home");
  // Verrijking, geen dependency: de extra quizfoto's mogen na de eerste
  // render binnenkomen (en mogen falen -- dan blijft de ene basisfoto).
  loadExtraPhotos();
}

function boot() {
  assertStringTablesMatch();

  document.documentElement.lang = currentLanguage();
  applyTheme();
  watchSystemColorScheme();
  applyStaticTranslations();
  installImageFallback();

  loadFavorites();
  loadGames();
  loadLeitnerState();

  initNav();
  registerHomeScreen();
  registerBrowseScreen();
  registerQuizScreen();
  registerSessionScreen();
  registerBuilderScreen();
  registerSettingsScreen();

  on(EVENTS.languageChanged, () => {
    applyStaticTranslations();
    refreshScreen();
  });

  // boot.js haalt bij terugkeer naar het tabblad de state van de server op en
  // schrijft die rechtstreeks naar localStorage. Onze modules houden hun kopie
  // in het geheugen, dus zonder dit opnieuw inlezen zou het eerstvolgende
  // antwoord de oude kopie eroverheen schrijven en pushen -- weg antwoorden van
  // je andere apparaat. Een lopende oefensessie laten we met rust: die
  // opnieuw renderen zou de wachtrij weggooien.
  window.addEventListener("vogelspotinus:state-pulled", () => {
    loadFavorites();
    loadGames();
    loadLeitnerState();
    if (currentScreenId() !== "session") refreshScreen();
  });

  registerServiceWorker();
  loadData();
}

boot();
