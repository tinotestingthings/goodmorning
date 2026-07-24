(function (global) {
  "use strict";

  // Appearance / theming. Loaded early (in <head>) so the theme applies before
  // first paint — no flash of the wrong colours. Two modes:
  //   manual    — one chosen theme, always.
  //   scheduled — time-based switch points (e.g. Orange at 06:00, Dark at
  //               21:00); the active theme is whichever switch point most
  //               recently passed, wrapping around midnight.
  // Re-evaluated every minute and whenever the app regains focus.

  var KEY = "sbx.theme";

  // Each theme is a full palette override applied via <html data-theme="...">.
  var THEMES = {
    nova:   { label: "Nova",   bg: "#111420" },
    dark:   { label: "Dark",   bg: "#0f1115" },
    light:  { label: "Light",  bg: "#f5f6f8" },
    orange: { label: "Orange", bg: "#fff6ee" },
    ocean:  { label: "Ocean",  bg: "#0b1622" },
    forest: { label: "Forest", bg: "#0e1712" }
  };

  function defaults() {
    return {
      mode: "manual",
      theme: "dark",
      schedule: [
        { time: "06:00", theme: "orange" },
        { time: "21:00", theme: "dark" }
      ]
    };
  }

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (!s || typeof s !== "object") return defaults();
      var d = defaults();
      return {
        mode: s.mode === "scheduled" ? "scheduled" : "manual",
        theme: THEMES[s.theme] ? s.theme : d.theme,
        schedule: Array.isArray(s.schedule) ? s.schedule : d.schedule
      };
    } catch (e) { return defaults(); }
  }

  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function activeTheme(s) {
    if (s.mode !== "scheduled") return THEMES[s.theme] ? s.theme : "dark";
    var sched = (s.schedule || [])
      .filter(function (e) { return e && e.time && THEMES[e.theme]; })
      .slice()
      .sort(function (a, b) { return a.time < b.time ? -1 : (a.time > b.time ? 1 : 0); });
    if (sched.length === 0) return THEMES[s.theme] ? s.theme : "dark";
    var now = new Date();
    var hhmm = pad(now.getHours()) + ":" + pad(now.getMinutes());
    // wrap-around: before the first switch point we're still in the last one
    var pick = sched[sched.length - 1].theme;
    for (var i = 0; i < sched.length; i++) {
      if (sched[i].time <= hhmm) pick = sched[i].theme;
    }
    return pick;
  }

  function apply() {
    var s = load();
    var t = activeTheme(s);
    document.documentElement.setAttribute("data-theme", t);
    var meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", (THEMES[t] && THEMES[t].bg) || "#0f1115");
    return t;
  }

  global.Theme = {
    THEMES: THEMES,
    list: function () {
      return Object.keys(THEMES).map(function (id) { return { id: id, label: THEMES[id].label }; });
    },
    get: load,
    save: function (s) { save(s); apply(); },
    apply: apply,
    activeTheme: function () { return activeTheme(load()); }
  };

  apply();
  setInterval(apply, 60000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) apply(); });
})(window);
