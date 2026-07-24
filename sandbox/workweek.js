(function (global) {
  "use strict";

  // Weekly work pattern: default hours + a location per weekday (office / home
  // / customer / unspecified / not working). Stored locally and mirrored via
  // AgendaSync so it's the same on every device. Consumed by the week grid
  // (shading + day tags) and, later, by location-aware task suggestions
  // (e.g. "you're at a customer Thursday — near the station, do X").

  var KEY = "sbx.workweek";
  var LOCS = [
    ["unspecified", "Unspecified"],
    ["office", "Office"],
    ["home", "Home"],
    ["customer", "Customer"],
    ["off", "Not working"]
  ];
  var DOW = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  function defaults() {
    return {
      start: "09:00", end: "17:00",
      days: { mon: "office", tue: "office", wed: "office", thu: "office", fri: "office", sat: "off", sun: "off" }
    };
  }

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (!s || typeof s !== "object") return defaults();
      var d = defaults();
      var days = {};
      Object.keys(d.days).forEach(function (k) { days[k] = (s.days && s.days[k]) || d.days[k]; });
      return { start: s.start || d.start, end: s.end || d.end, days: days };
    } catch (e) { return defaults(); }
  }

  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    if (global.AgendaSync) global.AgendaSync.pushNow();
  }

  function forDate(ds) {
    var d = new Date(ds + "T00:00:00");
    var loc = load().days[DOW[d.getDay()]] || "unspecified";
    var s = load();
    return { location: loc, start: s.start, end: s.end, working: loc !== "off" };
  }

  function locLabel(v) { for (var i = 0; i < LOCS.length; i++) if (LOCS[i][0] === v) return LOCS[i][1]; return v; }

  global.WorkWeek = { load: load, save: save, forDate: forDate, LOCS: LOCS, locLabel: locLabel };
})(window);
