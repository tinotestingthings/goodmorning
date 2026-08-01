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

  var KEY = "sbx.items";
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
    setOrder: setOrder
  };
})(window);
