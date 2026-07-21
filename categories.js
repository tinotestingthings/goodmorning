(function (global) {
  "use strict";
  // Shared category store (color-coding). Used by the calendar and settings.
  var KEY = "dd.categories";
  var DEFAULTS = [
    { id: "home",   name: "Home",   color: "#4a90d9" },
    { id: "work",   name: "Work",   color: "#e8730c" },
    { id: "health", name: "Health", color: "#2fae66" },
    { id: "errand", name: "Errand", color: "#a774d9" }
  ];
  function load() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(v) ? v : DEFAULTS.slice();
    } catch (e) { return DEFAULTS.slice(); }
  }
  function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} }
  function byId(id) {
    if (!id) return null;
    var found = load().filter(function (c) { return c.id === id; })[0];
    return found || null;
  }
  function color(id) { var c = byId(id); return c ? c.color : "var(--text-dim)"; }
  global.Cats = {
    load: load, save: save, byId: byId, color: color,
    add: function (name, col) {
      var list = load();
      list.push({ id: "cat-" + Date.now().toString(36), name: name, color: col });
      save(list); return list;
    },
    remove: function (id) { save(load().filter(function (c) { return c.id !== id; })); },
    update: function (id, name, col) {
      var list = load().map(function (c) { return c.id === id ? { id: id, name: name, color: col } : c; });
      save(list);
    }
  };
})(window);
