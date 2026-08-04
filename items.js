(function (global) {
  "use strict";

  // ---- unified task/project store (phase 1: Backlog) ------------------------
  // One shape for a task or a project, moving through a single lifecycle:
  //   backlog -> idea -> todo -> active (optionally scheduled) -> done
  //   (+ cancelled). Transitions are FREE — any state can jump to any other;
  //   the order above is just the common path, never a required sequence.
  //
  // Phase 1 uses this store for the Backlog surface only (items that live on
  // the backlog list). Scheduling and vault-filing reuse the app's existing,
  // proven paths (sbx.todos for the calendar; Supabase `captures` for the
  // vault), so this module never touches or migrates scheduled to-dos — a
  // scheduled task can't be lost because sbx.todos is never rewritten here.
  //
  // Rides the existing agenda sync: sbx.items is added to AgendaSync's KEYS,
  // so it mirrors to Supabase agenda_state alongside todos/chores. The
  // sandbox->live promote transforms sbx. -> dd., giving dd.items on live.

  var KEY = k("items");
  var STATES = ["backlog", "idea", "todo", "active", "done", "cancelled"];

  function load() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }

  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
    if (global.AgendaSync && global.AgendaSync.pushNow) global.AgendaSync.pushNow();
  }

  function uid() {
    return "it-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }
  function nowISO() { return new Date().toISOString(); }

  function all() { return load(); }

  function get(id) {
    var list = load();
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; }
    return null;
  }

  function byState(state) {
    return load().filter(function (x) { return x.state === state; });
  }

  // Backlog items, ordered by the manual `order` field (lower = higher up).
  function backlog() {
    return load()
      .filter(function (x) { return x.state === "backlog"; })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }

  function add(attrs) {
    attrs = attrs || {};
    var list = load();
    var maxOrder = 0;
    for (var i = 0; i < list.length; i++) {
      if ((list[i].order || 0) > maxOrder) maxOrder = list[i].order || 0;
    }
    var item = {
      id: uid(),
      type: attrs.type === "project" ? "project" : "task",
      state: STATES.indexOf(attrs.state) !== -1 ? attrs.state : "backlog",
      title: (attrs.title || "").trim(),
      note: attrs.note || "",
      subtasks: attrs.subtasks || [],
      recurrence: attrs.recurrence || null,
      order: maxOrder + 1,
      created: nowISO(),
      updated: nowISO()
    };
    list.push(item);
    save(list);
    return item;
  }

  function update(id, patch) {
    var list = load();
    var found = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        for (var k in patch) {
          if (Object.prototype.hasOwnProperty.call(patch, k)) list[i][k] = patch[k];
        }
        list[i].updated = nowISO();
        found = list[i];
        break;
      }
    }
    save(list);
    return found;
  }

  function remove(id) {
    save(load().filter(function (x) { return x.id !== id; }));
  }

  // Swap this item with its neighbour in the backlog ordering. dir < 0 = up.
  function move(id, dir) {
    var items = backlog();
    var i = -1;
    for (var k = 0; k < items.length; k++) { if (items[k].id === id) { i = k; break; } }
    if (i === -1) return;
    var j = dir < 0 ? i - 1 : i + 1;
    if (j < 0 || j >= items.length) return;
    // Reassign sequential order across the whole backlog, with i and j swapped,
    // so the ordering is always dense and unambiguous.
    var swapped = items.slice();
    var tmp = swapped[i]; swapped[i] = swapped[j]; swapped[j] = tmp;
    var ids = swapped.map(function (x) { return x.id; });
    setOrder(ids);
  }

  // Apply an explicit top-to-bottom ordering (used by move + drag reorder).
  function setOrder(orderedIds) {
    var list = load();
    var rank = {};
    for (var i = 0; i < orderedIds.length; i++) rank[orderedIds[i]] = i + 1;
    for (var j = 0; j < list.length; j++) {
      if (Object.prototype.hasOwnProperty.call(rank, list[j].id)) {
        list[j].order = rank[list[j].id];
        list[j].updated = nowISO();
      }
    }
    save(list);
  }

  // ---- vault -> app reconcile (runs every load, client-side) ----------------
  // The service role CANNOT write agenda_state, so the ONLY place dd.items can
  // be refreshed from the vault is here, in the app, under the user's own auth.
  // Each load we fetch items-seed.json (kept current from the vault by the daily
  // digest) and ADD any vault item we have not seen before. A per-id "known" set
  // means a NEW vault task appears automatically, while an item the user deleted
  // in the app is never resurrected. We only ADD -- never delete or overwrite --
  // so app-side edits (state, subtasks, backlog items) are always preserved.
  var KNOWN_KEY = k("itemsKnown");
  function loadKnown() {
    try { var v = JSON.parse(localStorage.getItem(KNOWN_KEY)); return (v && typeof v === "object") ? v : null; }
    catch (e) { return null; }
  }
  function reconcileFromVault() {
    fetch("items-seed.json", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("no seed");
      return r.json();
    }).then(function (seed) {
      if (!Array.isArray(seed)) return;
      var list = load();
      var have = {};
      list.forEach(function (x) { have[x.id] = true; });
      var known = loadKnown();
      if (known === null) {
        // First run migrating off seed-once: treat what's already stored as
        // "known" so we never touch it, then the pass below pulls in anything
        // the one-time seed missed.
        known = {};
        list.forEach(function (x) { known[x.id] = true; });
      }
      var maxOrder = 0;
      list.forEach(function (x) { if ((x.order || 0) > maxOrder) maxOrder = x.order || 0; });
      var now = nowISO(), added = 0;
      seed.forEach(function (s) {
        if (have[s.id] || known[s.id]) return;   // present already, or seen before (respect deletions)
        maxOrder += 1;
        list.push({
          id: s.id, type: s.type === "project" ? "project" : "task",
          state: STATES.indexOf(s.state) !== -1 ? s.state : "todo",
          title: s.title || s.id, note: s.note || "", subtasks: s.subtasks || [],
          recurrence: s.recurrence || null, source: s.source || "vault",
          order: maxOrder, created: now, updated: now
        });
        added += 1;
      });
      // Everything currently in the seed is now "known", so a later user
      // deletion of any of these sticks instead of coming back next load.
      seed.forEach(function (s) { known[s.id] = true; });
      try { localStorage.setItem(KNOWN_KEY, JSON.stringify(known)); } catch (e) {}
      if (added > 0) {
        save(list);
        if (global.App && global.App.go && global.App.getRoute) global.App.go(global.App.getRoute());
      }
    }).catch(function () { /* offline / no seed -- retry next load */ });
  }
  // Run after the first agenda pull; fall back to a delayed run if that event
  // never fires (e.g. not signed in -- local-only, nothing to clobber).
  document.addEventListener("dd-agenda-ready", reconcileFromVault);
  setTimeout(reconcileFromVault, 8000);

  global.Items = {
    STATES: STATES,
    all: all,
    get: get,
    byState: byState,
    backlog: backlog,
    add: add,
    update: update,
    remove: remove,
    move: move,
    setOrder: setOrder,
    seedOnce: reconcileFromVault, reconcile: reconcileFromVault
  };
})(window);
