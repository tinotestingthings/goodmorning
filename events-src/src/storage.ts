// Logical localStorage key for this app. boot.js's Storage shim namespaces
// every key that starts with "eventtracker" into "dd:eventtracker-v1" (live)
// or "sbx:eventtracker-v1" (sandbox), and mirrors it to the per-user
// `eventtracker_state` Supabase row — same pattern as WijnWijs/Kangaroo/etc.
import type { EventRecord, EventState } from "./types";

const KEY = "eventtracker-v1";

export type PersistedEventState = { state: EventState; notes?: string };

export type PersistedState = {
  eventStates: Record<string, PersistedEventState>;
  // Mirror of the "unseen" inbox count, so the goodmorning home screen can
  // decide whether to show its Events tile without shipping the whole event
  // catalogue into the shell. Written by EventTracker on every count change.
  unseenCount: number;
  manualEvents: EventRecord[];
  sourceOverrides: Record<string, boolean>;
  preferences: string[];
  regions: string[];
};

function emptyState(): PersistedState {
  return { eventStates: {}, manualEvents: [], sourceOverrides: {}, preferences: [], regions: [], unseenCount: 0 };
}

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      eventStates: parsed.eventStates && typeof parsed.eventStates === "object" ? parsed.eventStates : {},
      manualEvents: Array.isArray(parsed.manualEvents) ? parsed.manualEvents : [],
      sourceOverrides: parsed.sourceOverrides && typeof parsed.sourceOverrides === "object" ? parsed.sourceOverrides : {},
      preferences: Array.isArray(parsed.preferences) ? parsed.preferences : [],
      regions: Array.isArray(parsed.regions) ? parsed.regions : [],
      unseenCount: typeof parsed.unseenCount === "number" ? parsed.unseenCount : 0,
    };
  } catch {
    return emptyState();
  }
}

export function saveState(partial: Partial<PersistedState>) {
  try {
    const current = loadState();
    const next: PersistedState = { ...current, ...partial };
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // best-effort — offline/storage-full shouldn't crash the app
  }
}

export function setEventState(eventId: string, patch: Partial<PersistedEventState>) {
  const current = loadState();
  const existing = current.eventStates[eventId] || { state: "unseen" as EventState };
  const nextEventStates = { ...current.eventStates, [eventId]: { ...existing, ...patch } };
  saveState({ eventStates: nextEventStates });
}

export function addManualEvent(event: EventRecord) {
  const current = loadState();
  saveState({ manualEvents: [event, ...current.manualEvents] });
}

export function setSourceOverride(sourceId: string, enabled: boolean) {
  const current = loadState();
  saveState({ sourceOverrides: { ...current.sourceOverrides, [sourceId]: enabled } });
}

export function addPreference(value: string) {
  const current = loadState();
  if (current.preferences.includes(value)) return;
  saveState({ preferences: [...current.preferences, value] });
}

export function addRegion(value: string) {
  const current = loadState();
  if (current.regions.includes(value)) return;
  saveState({ regions: [...current.regions, value] });
}

export function removePreference(value: string) {
  const current = loadState();
  saveState({ preferences: current.preferences.filter((item) => item !== value) });
}

export function removeRegion(value: string) {
  const current = loadState();
  saveState({ regions: current.regions.filter((item) => item !== value) });
}

// Only writes when the number actually changed — this runs on every render
// pass of the tracker, and a write would otherwise re-sync to Supabase each
// time for no reason.
export function saveUnseenCount(n: number) {
  const current = loadState();
  if (current.unseenCount === n) return;
  saveState({ unseenCount: n });
}
