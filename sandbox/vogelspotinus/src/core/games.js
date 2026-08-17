// ---------------------------------------------------------------------------
// Saved custom games, held in memory and written through to storage.
// Seed content lives in src/data/seed-games.js -- this module only knows how
// to apply a seed, not what is in it.
// ---------------------------------------------------------------------------

import { KEYS, read, write } from "./storage.js";
import { EVENTS, emit } from "./events.js";

export const GAME_MODES = /** @type {const} */ ([
  "browse",
  "quiz-text",
  "quiz-choice",
  "quiz-study",
]);

/** @type {Array<{id: string, name: string, gameMode: string, filters: object}>} */
let games = [];

export function loadGames() {
  const stored = read(KEYS.customGames, []);
  games = Array.isArray(stored) ? stored : [];
}

export function allGames() {
  return games;
}

export function gameById(id) {
  return games.find((g) => g.id === id) ?? null;
}

export function newGameId() {
  return `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function saveGame(game) {
  const index = games.findIndex((g) => g.id === game.id);
  if (index >= 0) games[index] = game;
  else games.push(game);
  write(KEYS.customGames, games);
  emit(EVENTS.gamesChanged, games);
}

export function deleteGame(id) {
  games = games.filter((g) => g.id !== id);
  write(KEYS.customGames, games);
  emit(EVENTS.gamesChanged, games);
}

/**
 * Apply a versioned seed exactly once per version. Bumping the version in the
 * seed file migrates already-seeded installs instead of leaving them stale
 * forever; `retire` lists ids superseded by this version.
 */
export function applySeed({ version, games: seededGames, retire = [] }) {
  const seenVersion = read(KEYS.seededDefaults, null);
  if (seenVersion === version) return;

  if (seenVersion !== null) {
    for (const id of retire) {
      games = games.filter((g) => g.id !== id);
    }
  }
  for (const game of seededGames) {
    if (!games.some((g) => g.id === game.id)) games.push(game);
  }

  write(KEYS.customGames, games);
  write(KEYS.seededDefaults, version);
  emit(EVENTS.gamesChanged, games);
}
