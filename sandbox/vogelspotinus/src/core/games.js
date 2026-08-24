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

/**
 * Opgeslagen spellen bijwerken naar de huidige vorm.
 *
 * Twee dingen, allebei uit de omslag van vogel- naar diersoortenapp:
 *
 * 1. `filters.specificBirds` heette zo toen identiteit nog `scientificName`
 *    was. Voor vogels IS de soortnaam het id, dus omhangen naar `specificIds`
 *    volstaat -- geen enkel spel raakt zijn soorten kwijt.
 *
 * 2. Een spel dat is gemaakt toen de app alleen vogels kende, heeft geen
 *    `kind`-sleutel. Zonder die sleutel matcht het filter voortaan óók honden:
 *    "Medium/small zwarte vogels" sprong van 55 naar 118 soorten, waarvan 63
 *    honden. Een ontbrekende sleutel betekent dus "vogels", niet "alles".
 *    Nieuwe spellen krijgen van emptySelection() altijd een `kind: []` mee, dus
 *    afwezig-versus-leeg onderscheidt precies oud van nieuw.
 *
 * Bewust alleen in het geheugen: bij het opstarten naar storage schrijven zou
 * meteen een push naar Supabase uitlokken voor een verandering die de gebruiker
 * niet heeft gemaakt. De nieuwe vorm belandt vanzelf op schijf zodra er een
 * spel wordt opgeslagen; tot die tijd draait deze shim gewoon elke boot opnieuw.
 */
function migrateGames(list) {
  for (const game of list) {
    const filters = game?.filters;
    if (!filters || typeof filters !== "object") continue;

    if (Array.isArray(filters.specificBirds)) {
      filters.specificIds ??= filters.specificBirds;
      delete filters.specificBirds;
    }
    if (!("kind" in filters)) filters.kind = ["bird"];
  }
  return list;
}

export function loadGames() {
  const stored = read(KEYS.customGames, []);
  games = migrateGames(Array.isArray(stored) ? stored : []);
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
