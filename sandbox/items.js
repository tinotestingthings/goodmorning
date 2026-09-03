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
  // "todo" items belong here too: an undated to-do IS a backlog entry (it
  // already shows under Tasks; the backlog is the same pool, orderable).
  function backlog() {
    return load()
      .filter(function (x) { return x.state === "backlog" || x.state === "todo"; })
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

  // Several patches, ONE save (= one sync push). `patches` = { id: patch }.
  function updateMany(patches) {
    var ids = Object.keys(patches);
    if (!ids.length) return;
    var list = load();
    for (var i = 0; i < list.length; i++) {
      var p = patches[list[i].id];
      if (!p) continue;
      for (var k in p) { if (Object.prototype.hasOwnProperty.call(p, k)) list[i][k] = p[k]; }
      list[i].updated = nowISO();
    }
    save(list);
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

  // ---- one-time migration seed (Supabase-primary switch) --------------------
  // Vault tasks/projects are seeded into the store once, client-side, so they
  // are written under the user's own auth (the service role can't write this
  // table). Runs AFTER the first agenda sync pull (so the server copy can't
  // clobber the seed), merges by id (never duplicates), and sets a flag so it
  // never runs again — deletes stick.
  var SEED_FLAG = k("itemsSeeded");
  function seedOnce() {
    try { if (localStorage.getItem(SEED_FLAG)) return; } catch (e) { return; }
    fetch("items-seed.json", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("no seed");
      return r.json();
    }).then(function (seed) {
      if (!Array.isArray(seed)) return;
      var list = load();
      var have = {};
      list.forEach(function (x) { have[x.id] = true; });
      var maxOrder = 0;
      list.forEach(function (x) { if ((x.order || 0) > maxOrder) maxOrder = x.order || 0; });
      var now = nowISO(), added = 0;
      seed.forEach(function (s) {
        if (have[s.id]) return;
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
      if (added > 0) save(list);
      try { localStorage.setItem(SEED_FLAG, now); } catch (e) {}
      if (added > 0 && global.App && global.App.go && global.App.getRoute) global.App.go(global.App.getRoute());
    }).catch(function () { /* offline / no seed — try again next boot */ });
  }
  // Run after the first agenda pull; fall back to a delayed run if that event
  // never fires (e.g. not signed in — local-only, nothing to clobber).
  document.addEventListener("dd-agenda-ready", seedOnce);
  // Fallback for the not-signed-in case (nothing to clobber). If a sync session
  // IS active we must WAIT for the first pull — seeding before it lands writes a
  // half-empty snapshot, and the save() below pushes it. That race wiped the live
  // agenda on 2026-08-09, so this now retries instead of firing blind.
  (function waitThenSeed(tries) {
    setTimeout(function () {
      var AS = global.AgendaSync;
      if (AS && AS.ready && AS.ready() && AS.primed && !AS.primed()) {
        if (tries < 30) return waitThenSeed(tries + 1);
        return;                      // pull never landed — do NOT seed/push
      }
      seedOnce();
    }, 8000);
  })(0);

  global.Items = {
    STATES: STATES,
    all: all,
    get: get,
    byState: byState,
    backlog: backlog,
    updateMany: updateMany,
    add: add,
    update: update,
    remove: remove,
    move: move,
    setOrder: setOrder,
    seedOnce: seedOnce
  };
})(window);
