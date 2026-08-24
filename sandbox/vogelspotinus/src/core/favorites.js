// ---------------------------------------------------------------------------
// Favorites, held in memory and written through to storage.
//
// The previous version re-read and re-parsed localStorage on every isFavorite()
// call -- which runs once per bird inside matchesFilters() AND once per bird in
// the card loop, i.e. over a thousand JSON.parse calls per grid render, on
// every keystroke. Loading once at boot removes that entirely.
// ---------------------------------------------------------------------------

import { KEYS, read, write } from "./storage.js";
import { EVENTS, emit } from "./events.js";

/** @type {Set<string>} soort-ids */
let favorites = new Set();

export function loadFavorites() {
  const stored = read(KEYS.favorites, []);
  favorites = new Set(Array.isArray(stored) ? stored : []);
}

export function isFavorite(bird) {
  return favorites.has(bird.id);
}

export function favoriteCount() {
  return favorites.size;
}

/** Toggle and persist. Returns the new state. */
export function toggleFavorite(bird) {
  const key = bird.id;
  const nowFavorite = !favorites.has(key);
  if (nowFavorite) favorites.add(key);
  else favorites.delete(key);
  write(KEYS.favorites, [...favorites]);
  emit(EVENTS.favoritesChanged, { bird, isFavorite: nowFavorite });
  return nowFavorite;
}
