(function () {
  "use strict";

  var view = document.getElementById("homeView");

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function slugify(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function toast(message) {
    var t = document.querySelector(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = message;
    t.classList.add("show");
    clearTimeout(t._hideTimer);
    t._hideTimer = setTimeout(function () { t.classList.remove("show"); }, 1800);
  }

  // ---- per-item note control ----
  // A small toggle button + inline textarea, bound to one specific item
  // (a task, a project, a radar deadline). Every item gets its own note
  // instead of one note covering a whole section.

  var NOTE_ICON =
    '<svg class="note-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/>' +
    '<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';

  function noteControl(section, itemId, placeholder) {
    var existing = DigestNotes.getItemNote(section, itemId);

    var btn = document.createElement("button");
    btn.className = "note-btn" + (existing ? " has-note" : "");
    btn.innerHTML = NOTE_ICON;
    btn.setAttribute("aria-label", existing ? "Edit note" : "Add note");
    btn.setAttribute("type", "button");

    var ta = document.createElement("textarea");
    ta.className = "note-input" + (existing ? "" : " hidden");
    ta.rows = 2;
    ta.placeholder = placeholder || "Note for later — collected with your decisions.";
    ta.value = existing;

    ta.addEventListener("input", function () {
      DigestNotes.setItemNote(section, itemId, ta.value);
      btn.classList.toggle("has-note", !!ta.value.trim());
      updateNotesFooter();
    });

    btn.addEventListener("click", function () {
      ta.classList.toggle("hidden");
      if (!ta.classList.contains("hidden")) ta.focus();
    });

    return { btn: btn, textarea: ta };
  }

  // ---- header: date + personalized greeting ----

  function greetingWord() {
    var h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }

  function formattedDate() {
    try {
      return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    } catch (e) {
      return "";
    }
  }

  function renderHeader() {
    var header = el("div", "home-header");
    header.appendChild(el("div", "home-date", formattedDate()));
    header.appendChild(el("h1", "home-greeting", greetingWord() + ", Tinus"));
    return header;
  }

  // ---- weather (Open-Meteo, fetched client-side — no API key, no backend) ----
  // Hardcoded to one location since this is a single-user app with no
  // settings UI. Cached in localStorage for 20 minutes so switching back to
  // the Today tab repeatedly doesn't refetch every time.

  var WEATHER_LAT = 52.10525390586172;
  var WEATHER_LON = 5.092251555678848;
  var WEATHER_CACHE_KEY = k("weather.cache");
  var WEATHER_CACHE_TTL_MS = 20 * 60 * 1000;

  var ICON_W_SUN =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.1 5.1l2.1 2.1M16.8 16.8l2.1 2.1M5.1 18.9l2.1-2.1M16.8 7.2l2.1-2.1"/></svg>';
  var ICON_W_CLOUD_SUN =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="8.5" cy="8" r="3.2"/><path d="M8.5 3v1.4M8.5 12.6v.8M3.5 8h1.2M4.9 4.4l1 1M13.1 4.4l-1 1"/>' +
    '<path d="M10 20h7.5a3.5 3.5 0 0 0 .4-6.98A5 5 0 0 0 8.4 13.6 3 3 0 0 0 10 20Z"/></svg>';
  var ICON_W_CLOUD =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M7 19h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.9 12.6 3.5 3.5 0 0 0 7 19Z"/></svg>';
  var ICON_W_RAIN =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M7 15h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.9 8.6 3.5 3.5 0 0 0 7 15Z"/><path d="M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5"/></svg>';
  var ICON_W_SNOW =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M7 14h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.9 7.6 3.5 3.5 0 0 0 7 14Z"/>' +
    '<circle cx="8" cy="19" r="0.8" fill="currentColor" stroke="none"/><circle cx="12" cy="20.5" r="0.8" fill="currentColor" stroke="none"/><circle cx="16" cy="19" r="0.8" fill="currentColor" stroke="none"/></svg>';
  var ICON_W_STORM =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M7 13h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.9 6.6 3.5 3.5 0 0 0 7 13Z"/><path d="M13 13l-3 5h3l-2 4"/></svg>';

  // WMO weather codes (used by Open-Meteo) collapsed down to a handful of
  // icon+label buckets — plenty of detail for a glanceable morning card.
  function weatherInfo(code) {
    if (code === 0) return { icon: ICON_W_SUN, label: "Clear" };
    if (code === 1 || code === 2) return { icon: ICON_W_CLOUD_SUN, label: "Partly cloudy" };
    if (code === 3 || code === 45 || code === 48) return { icon: ICON_W_CLOUD, label: code === 3 ? "Cloudy" : "Fog" };
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { icon: ICON_W_RAIN, label: code >= 80 ? "Showers" : "Rain" };
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { icon: ICON_W_SNOW, label: "Snow" };
    if (code >= 95) return { icon: ICON_W_STORM, label: "Thunderstorm" };
    return { icon: ICON_W_CLOUD, label: "—" };
  }

  // "YYYY-MM-DD" for any date (defaults to now), local time. Shared by
  // weather (matching today's hourly readings), to-dos (due-date math),
  // and chores (last-done/next-due math). Named "day", not "dd" — the
  // sandbox transform's sed pass blindly rewrites the localStorage-key
  // prefix pattern to "sbx" wherever it appears, and a local var literally
  // named "dd" followed by a dot collides with that same pattern and gets
  // mangled too. Learned this the hard way once.
  function localDateStr(d) {
    d = d || new Date();
    var mm = String(d.getMonth() + 1);
    var day = String(d.getDate());
    if (mm.length < 2) mm = "0" + mm;
    if (day.length < 2) day = "0" + day;
    return d.getFullYear() + "-" + mm + "-" + day;
  }

  // Finds the hourly reading closest to `targetHour` (0-23) on today's date.
  function pickHourly(json, targetHour) {
    var todayStr = localDateStr();
    var times = json.hourly.time, temps = json.hourly.temperature_2m, codes = json.hourly.weathercode;
    var bestIdx = -1, bestDiff = Infinity;
    for (var i = 0; i < times.length; i++) {
      if (times[i].indexOf(todayStr) !== 0) continue;
      var hour = parseInt(times[i].slice(11, 13), 10);
      var diff = Math.abs(hour - targetHour);
      if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
    }
    if (bestIdx === -1) return null;
    return { temp: temps[bestIdx], code: codes[bestIdx] };
  }

  // Every day after today from the daily block (index 0 is today).
  function dailyList(json) {
    var out = [];
    var times = json.daily.time, codes = json.daily.weathercode,
      hi = json.daily.temperature_2m_max, lo = json.daily.temperature_2m_min;
    for (var i = 1; i < times.length; i++) {
      out.push({ date: times[i], code: codes[i], hi: hi[i], lo: lo[i] });
    }
    return out;
  }

  function loadWeather() {
    try {
      var cached = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || "null");
      if (cached && cached.fetchedAt && (Date.now() - cached.fetchedAt) < WEATHER_CACHE_TTL_MS) {
        return Promise.resolve(cached.data);
      }
    } catch (e) {}

    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + WEATHER_LAT +
      "&longitude=" + WEATHER_LON +
      "&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min" +
      "&timezone=auto&forecast_days=7";

    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    }).then(function (json) {
      if (!json || !json.hourly || !json.daily) throw new Error("Unexpected weather response");
      try { localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), data: json })); } catch (e) {}
      return json;
    });
  }

  var WEATHER_SLOTS = [
    { label: "Morning", hour: 8 },
    { label: "Midday", hour: 13 },
    { label: "Evening", hour: 19 }
  ];

  function weatherDayRow(d) {
    var info = weatherInfo(d.code);
    var row = el("div", "weather-day-row");
    var iconWrap = el("span", "weather-day-icon");
    iconWrap.innerHTML = info.icon;
    row.appendChild(iconWrap);
    var label = "";
    try { label = new Date(d.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" }); } catch (e) {}
    row.appendChild(el("span", "weather-day-label", label));
    row.appendChild(el("span", "weather-day-cond", info.label));
    row.appendChild(el("span", "weather-day-temp", Math.round(d.lo) + "° / " + Math.round(d.hi) + "°"));
    return row;
  }

  // Detail view — shown in the accordion under the mini weather tile when
  // tapped. Unchanged from before: 3 time-of-day rows + "+more days".
  function buildWeatherBody(container, weatherState) {
    if (weatherState.status === "loading") {
      container.appendChild(el("p", "dash-empty", "Loading weather…"));
      return;
    }
    if (weatherState.status !== "ready" || !weatherState.data) {
      container.appendChild(el("p", "dash-empty", "Could not load weather."));
      return;
    }
    try {
      var json = weatherState.data;
      var rows = el("div", "weather-rows");
      WEATHER_SLOTS.forEach(function (slot) {
        var reading = pickHourly(json, slot.hour);
        if (!reading) return;
        var info = weatherInfo(reading.code);
        var row = el("div", "weather-row");
        var iconWrap = el("span", "weather-row-icon");
        iconWrap.innerHTML = info.icon;
        row.appendChild(iconWrap);
        row.appendChild(el("span", "weather-row-label", slot.label));
        row.appendChild(el("span", "weather-row-cond", info.label));
        row.appendChild(el("span", "weather-row-temp", Math.round(reading.temp) + "°"));
        rows.appendChild(row);
      });
      container.appendChild(rows);

      var days = dailyList(json);
      if (days.length > 0) collapsible(container, [], days, weatherDayRow, "more days");
    } catch (e) {
      container.appendChild(el("p", "dash-empty", "Could not load weather."));
    }
  }

  // Small tile shown beside the hero card — just today's day name + one
  // "right now" temperature. Everything else (condition labels, the
  // 3-time-of-day breakdown, the extended forecast) lives behind a tap, in
  // the same accordion content as before.
  function renderMiniWeatherTile() {
    var weatherState = { status: "loading", data: null };

    var t = document.createElement("button");
    t.type = "button";
    t.className = "mini-weather-tile";

    var top = el("div", "mwt-top");
    top.appendChild(el("span", "mwt-caption", "Today"));
    var dayName = "";
    try { dayName = new Date().toLocaleDateString(undefined, { weekday: "long" }); } catch (e) {}
    top.appendChild(el("span", "mwt-day", dayName));
    t.appendChild(top);

    var bottom = el("div", "mwt-bottom");
    var iconWrap = el("span", "mwt-icon");
    bottom.appendChild(iconWrap);
    var tempEl = el("span", "mwt-temp", "…");
    bottom.appendChild(tempEl);
    t.appendChild(bottom);

    function updateFace() {
      if (weatherState.status === "ready" && weatherState.data) {
        try {
          var now = pickHourly(weatherState.data, new Date().getHours());
          if (now) {
            iconWrap.innerHTML = weatherInfo(now.code).icon;
            tempEl.textContent = Math.round(now.temp) + "°";
            return;
          }
        } catch (e) {}
      }
      iconWrap.innerHTML = "";
      tempEl.textContent = weatherState.status === "error" ? "—" : "…";
    }
    updateFace();

    return { el: t, weatherState: weatherState, updateFace: updateFace };
  }

  // ---- icons + tiles for the utility apps (added 2026-08-17) --------------
  // Replaced the Morning loop card in the hero row. These are plain links:
  // they leave the shell and open the utility app itself, same as the Gym
  // tile's arrow does, so the arrow glyph is shared.

  var ICON_ARROW_OUT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>';
  var ICON_MUSIC_NOTE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.6"/><circle cx="16.5" cy="16" r="2.6"/></svg>';
  var ICON_CALENDAR_STAR =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 2.5v4M16 2.5v4"/><path d="m12 12 1.2 2.4 2.6.4-1.9 1.8.5 2.6L12 18l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z"/></svg>';

  var ICON_GIFT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="8" width="17" height="4"/><rect x="5.5" y="12" width="13" height="8.5"/><path d="M12 8v12.5"/><path d="M12 8c-1.8 0-4.5-.8-4.5-2.8C7.5 3.6 9 3 10 3c1.6 0 2 2.2 2 5zm0 0c1.8 0 4.5-.8 4.5-2.8C16.5 3.6 15 3 14 3c-1.6 0-2 2.2-2 5z"/></svg>';

  // 2026-08-22: de Attentinus-tegel en de podcast-tegel zijn uit de hero-rij gehaald (UX-plan):
  // de verjaardagskaart (renderAttentTile) en de Utilities-tegel met badge zijn genoeg.
  // renderAppTile ging daarmee mee; fitTileLabel blijft voor de vogel-tegel.

  // Shrink an app-tile label until it fits the tile on one line. The tile is a
  // fixed 92px, so a longer name than "NoteSprint" (e.g. "ChordSprint") used to
  // break mid-word onto a second line. Runs after layout via rAF, because the
  // element isn't in the document yet when renderBirdTile returns.
  var TILE_LABEL_MAX = 0.78;   // rem, matches the CSS default
  var TILE_LABEL_MIN = 0.6;    // rem, below this we wrap instead of shrinking
  function fitTileLabel(label) {
    requestAnimationFrame(function () {
      if (!label.isConnected) return;
      var size = TILE_LABEL_MAX;
      label.classList.remove("is-wrapped");
      label.style.fontSize = "";
      var guard = 0;
      while (label.scrollWidth > label.clientWidth + 0.5 &&
             size > TILE_LABEL_MIN && guard++ < 16) {
        size = Math.round((size - 0.02) * 100) / 100;
        label.style.fontSize = size + "rem";
      }
      // Still too wide even at the floor size: let it wrap rather than clip.
      if (label.scrollWidth > label.clientWidth + 0.5) {
        label.classList.add("is-wrapped");
      }
    });
  }

  // ---- bird of the day tile (added 2026-08-18) --------------------------
  // Same 92px footprint as the app tiles beside it, but the photo IS the tile.
  // Data comes from `vogelspotinus/data/bird-tiles.json` (built by
  // tools/build-bird-tiles.mjs) rather than the 1 MB birds.json, and the chosen
  // bird is cached in localStorage so a second visit on the same day costs
  // nothing.

  var ICON_BIRD =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V5l-2 2h-3a4 4 0 0 0-4 4v1a4 4 0 0 1-4 4H4.5"/><path d="m14 9-3 3"/></svg>';

  var BIRD_TILE_SRC = "vogelspotinus/data/bird-tiles.json";
  // Coprime with 561 (= 3 x 11 x 17), so consecutive days land far apart in the
  // list and every bird comes round once before any repeats.
  var BIRD_STRIDE = 269;

  // v3: v1 kon een kapotte thumb-URL bevatten, v2 nog de 240px-variant.
  function birdCacheKey() { return eventsPrefix() + "home-bird-v3"; }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  function birdForToday(list) {
    if (!list || !list.length) return null;
    var days = Math.floor(new Date(todayKey() + "T00:00:00Z").getTime() / 86400000);
    return list[((days * BIRD_STRIDE) % list.length + list.length) % list.length];
  }

  function readBirdCache() {
    try {
      var raw = localStorage.getItem(birdCacheKey());
      if (!raw) return null;
      var v = JSON.parse(raw);
      return (v && v.date === todayKey() && v.n && v.u) ? v : null;
    } catch (e) { return null; }
  }

  function writeBirdCache(bird) {
    try {
      localStorage.setItem(birdCacheKey(), JSON.stringify({
        date: todayKey(), n: bird.n, u: bird.u, o: bird.o
      }));
    } catch (e) {}
  }

  function renderBirdTile() {
    // BELANGRIJK: we geven hier direct het <a class="app-tile"> terug en vullen
    // dat later, precies zoals renderAppTile doet. De eerste versie zat in een
    // extra <div class="bird-tile-slot"> wrapper, en dat was fout: die wrapper
    // is zelf het flex-item in .hero-row, zonder `width: 92px` en zonder
    // `flex-shrink: 0` (die staan op .app-tile, dus op het KIND). In een rij die
    // al vol is kreeg de wrapper daardoor vrijwel geen ruimte toebedeeld.
    // (2026-08-18)
    var a = document.createElement("a");
    a.href = "vogelspotinus/";

    function arrowNode() {
      var arrow = el("span", "app-tile-arrow");
      arrow.innerHTML = ICON_ARROW_OUT;
      return arrow;
    }

    // Valt terug op een gewone icoontegel: bij het opstarten, en zodra data of
    // afbeelding het laat afweten. Zo staat er altijd iets klikbaars.
    function showIcon() {
      a.className = "app-tile";
      a.setAttribute("aria-label", "Open Vogelspotinus");
      a.innerHTML = "";
      a.appendChild(arrowNode());
      var ic = el("span", "app-tile-icon");
      ic.innerHTML = ICON_BIRD;
      a.appendChild(ic);
      var label = el("div", "app-tile-label", "Vogels");
      a.appendChild(label);
      fitTileLabel(label);
    }

    function showBird(bird) {
      a.className = "app-tile app-tile-photo";
      a.setAttribute("aria-label", "Open Vogelspotinus. Vogel van vandaag: " + bird.n);
      a.innerHTML = "";

      var img = document.createElement("img");
      img.className = "app-tile-photo-img";
      img.alt = "";
      // Bewust "eager": de tegel staat boven de vouw, en bij lazy stelt de
      // browser het laden uit zolang het element nog in een losgekoppelde boom
      // zit - precies wat hier gebeurt.
      img.loading = "eager";
      img.decoding = "async";
      // Faalt de verkleinde variant, probeer dan eenmalig de originele URL uit
      // birds.json - die gebruikt de Vogelspotinus-app zelf ook, dus die werkt.
      // Pas als ook die faalt vallen we terug op het icoon.
      var triedOriginal = false;
      img.addEventListener("error", function () {
        if (!triedOriginal && bird.o) {
          triedOriginal = true;
          img.src = bird.o;
          return;
        }
        showIcon();
      });
      img.src = bird.u;
      a.appendChild(img);

      a.appendChild(arrowNode());
      a.appendChild(el("div", "app-tile-photo-name", bird.n));
    }

    showIcon();

    var cached = readBirdCache();
    if (cached) {
      showBird(cached);
      return a;
    }

    fetch(BIRD_TILE_SRC)
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)); })
      .then(function (list) {
        var bird = birdForToday(list);
        if (!bird) return;
        writeBirdCache(bird);
        showBird(bird);
      })
      .catch(function (e) {
        console.warn("[bird tile] geen vogel geladen:", e);
      });

    return a;
  }
  // Events tile — only rendered when the Event Tracker reports unseen events.
  // Returns an empty placeholder immediately and fills it in async, so the
  // rest of the home screen never waits on Supabase.
  function eventsPrefix() { return (window.DD_ENV && DD_ENV.sandbox) ? "sbx:" : "dd:"; }

  function unseenEventCount(data) {
    if (!data) return 0;
    var raw = data[eventsPrefix() + "eventtracker"];
    if (!raw) return 0;
    var v;
    try { v = (typeof raw === "string") ? JSON.parse(raw) : raw; } catch (e) { return 0; }
    var n = v && v.unseenCount;
    return (typeof n === "number" && n > 0) ? n : 0;
  }

  function renderEventsTile() {
    var slot = el("div", "events-tile-slot");
    fetchAppState("eventtracker_state", function (data) {
      var n = unseenEventCount(data);
      if (!n) return;                       // niets nieuws -> tile blijft weg
      var a = document.createElement("a");
      a.className = "events-tile";
      a.href = "events/";
      a.setAttribute("aria-label", "Open Event Tracker, " + n + " nieuwe events");

      var ic = el("span", "events-tile-icon");
      ic.innerHTML = ICON_CALENDAR_STAR;
      a.appendChild(ic);

      var text = el("div", "events-tile-text");
      text.appendChild(el("div", "events-tile-title",
        n === 1 ? "1 nieuw event" : n + " nieuwe events"));
      text.appendChild(el("div", "events-tile-sub", "Klaar om te reviewen"));
      a.appendChild(text);

      var arrow = el("span", "events-tile-arrow");
      arrow.innerHTML = ICON_ARROW_OUT;
      a.appendChild(arrow);

      slot.appendChild(a);
    });
    return slot;
  }

  // Trainerinus tile — same slot pattern as the events tile: only rendered
  // while at least one trainer app is still grey today, so a fully green day
  // leaves the home screen quiet. All reads, no writes: the authoritative
  // status lives in the Trainerinus app itself (sandbox/trainerinus/); this
  // tile recomputes the same signals read-only and never touches the
  // trainerinus.* keys (writing them here could be clobbered by that app's
  // boot seed).
  var ICON_TARGET =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>';

  // Practice data is deliberately read from the LIVE namespace ("dd:") in both
  // environments: real practising happens in the live apps, the sandbox copies
  // are dev playgrounds. Trainerinus' own settings/log follow the environment.
  var TRAINER_SRC = "dd:";
  var TRAINER_APPS = [
    { id: "vogels", short: "Vogels", table: "vogelspotinus_state" },
    { id: "chords", short: "Chords", table: "chordsprint_state", prefixes: [TRAINER_SRC + "cpt_"] },
    { id: "notes",  short: "Notes",  table: "notesprint_state",  prefixes: [TRAINER_SRC + "noteSprint", TRAINER_SRC + "noteReader"] },
    { id: "gym",    short: "Gym",    table: "kangaroo_state" }
  ];

  function trainerLocal(name, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(eventsPrefix() + "trainerinus." + name));
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function trainerParse(raw, fallback) {
    if (raw == null) return fallback;
    try { var v = JSON.parse(raw); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function trainerDayKey(iso) {
    if (!iso) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    var d = new Date(iso);
    if (isNaN(d)) return null;
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  // Must stay identical to the hash in sandbox/trainerinus/index.html, so the
  // tile agrees with the app about "state changed since the last marker".
  function trainerHash(data, prefixes) {
    var keys = Object.keys(data || {}).filter(function (key) {
      return prefixes.some(function (p) { return key.indexOf(p) === 0; });
    }).sort();
    var h = 5381;
    keys.forEach(function (key) {
      var s = key + "=" + String(data[key]);
      for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    });
    return keys.length ? String(h) : null;
  }

  function trainerGreen(app, row, today, log, markers, restDays) {
    var data = (row && row.data) || {};
    if (app.id === "vogels") {
      var st = trainerParse(data[TRAINER_SRC + "vogelspotinus.stats"], null);
      if (!st) return { known: false, green: false };
      return { known: true, green: !!(st.today && st.today.date === today && (st.today.count || 0) > 0) };
    }
    if (app.id === "gym") {
      var days = {};
      trainerParse(data[TRAINER_SRC + "kangaroo-workout-history"], []).forEach(function (s) { var d = trainerDayKey(s && s.date); if (d) days[d] = 1; });
      trainerParse(data[TRAINER_SRC + "kangaroo-cardio"], []).forEach(function (c) { var d = trainerDayKey(c && c.date); if (d) days[d] = 1; });
      var mus = trainerParse(data[TRAINER_SRC + "kangaroo-history"], {});
      Object.keys(mus).forEach(function (m) { var d = trainerDayKey(mus[m]); if (d) days[d] = 1; });
      var list = Object.keys(days).sort();
      if (!list.length) return { known: false, green: false };
      var last = new Date(list[list.length - 1] + "T12:00:00");
      var now = new Date(today + "T12:00:00");
      return { known: true, green: Math.round((now - last) / 86400000) <= restDays };
    }
    // ChordSprint / NoteSprint: green when the Trainerinus log says so, or when
    // the state hash moved since the app's last marker AND the row was pushed
    // today (i.e. there was activity today the app hasn't logged yet).
    if (log[today] && log[today][app.id]) return { known: true, green: true };
    var hash = trainerHash(data, app.prefixes);
    if (hash === null) return { known: false, green: false };
    var m = markers[app.id];
    var fresh = !!(m && m.hash !== hash && trainerDayKey(row && row.updated_at) === today);
    return { known: true, green: fresh };
  }

  // ---- Wake-up tile (added 2026-09-03) ----------------------------------
  // Opens the start-the-day flow in wakeup.js. Stays after it's done today
  // (dimmed, ticked) so the backlog step can be reused on an empty afternoon.
  var ICON_SUNRISE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v3"/><path d="M5.6 7.6l2.1 2.1"/><path d="M18.4 7.6l-2.1 2.1"/><path d="M3 16h18"/><path d="M7 16a5 5 0 0 1 10 0"/><path d="M6 20h12"/></svg>';

  function renderWakeupTile() {
    var done = window.Wakeup.doneToday();
    var b = document.createElement("button");
    b.type = "button";
    b.className = "app-tile wakeup-tile" + (done ? " wakeup-tile-done" : "");
    b.setAttribute("aria-label", done ? "Wake-up done for today — open again" : "Start the day: wake-up");
    var ic = el("span", "app-tile-icon");
    ic.innerHTML = done ? CHECK_ICON : ICON_SUNRISE;
    b.appendChild(ic);
    var label = el("div", "app-tile-label", "Wake-up");
    b.appendChild(label);
    fitTileLabel(label);
    b.addEventListener("click", function () { window.Wakeup.open(); });
    return b;
  }

  function renderTrainerTile() {
    // De <a> is zelf het flex-item in .hero-row (met width:92px en
    // flex-shrink:0 uit .app-tile). Een wrapper eromheen zou het flex-item
    // worden zónder die maten — precies de fout die renderBirdTile hierboven
    // beschrijft. Hij begint verborgen en verschijnt pas als er iets te
    // oefenen valt.
    var a = document.createElement("a");
    a.className = "app-tile trainer-tile";
    a.href = "trainerinus/";
    a.style.display = "none";
    if (!window.SB) return a;
    window.SB.auth.getSession().then(function (res) {
      var s = res && res.data && res.data.session;
      if (!s || !s.user) return;
      Promise.all(TRAINER_APPS.map(function (app) {
        return window.SB.from(app.table).select("data,updated_at").eq("user_id", s.user.id).then(function (r) {
          if (r && r.error) return null;
          return (r && r.data && r.data.length) ? r.data[0] : null;
        }, function () { return null; });
      })).then(function (rows) {
        if (!rows.some(function (r) { return !!r; })) return;   // niets geladen -> stil blijven
        var settings = trainerLocal("settings", {});
        var enabledMap = (settings && settings.apps) || {};
        var restDays = (settings && typeof settings.gymRestDays === "number") ? settings.gymRestDays : 2;
        var log = trainerLocal("log", {});
        var markers = trainerLocal("markers", {});
        var today = todayKey();
        var enabled = TRAINER_APPS.filter(function (app) { return enabledMap[app.id] !== false; });
        if (!enabled.length) return;
        var statuses = enabled.map(function (app, i) {
          return trainerGreen(app, rows[TRAINER_APPS.indexOf(app)], today, log, markers, restDays);
        });
        if (!statuses.some(function (st) { return st.known; })) return;  // nog nooit data -> stil
        var todo = enabled.filter(function (app, i) { return !statuses[i].green; });
        if (!todo.length) return;               // alles groen -> tile blijft weg

        // 2026-08-22 (UX-plan): kleine hero-tegel, zelfde maat als de weer-tegel;
        // geen "nog te gaan"-regel meer — de stippen zeggen genoeg.
        a.setAttribute("aria-label", "Open Trainerinus, nog te oefenen: " + todo.map(function (t) { return t.short; }).join(", "));

        var arrow = el("span", "app-tile-arrow");
        arrow.innerHTML = ICON_ARROW_OUT;
        a.appendChild(arrow);

        var ic = el("span", "app-tile-icon");
        ic.innerHTML = ICON_TARGET;
        a.appendChild(ic);

        var label = el("div", "app-tile-label", "Trainerinus");
        a.appendChild(label);

        var dots = el("span", "trainer-dots");
        enabled.forEach(function (app, i) {
          var d = document.createElement("i");
          if (statuses[i].green) d.className = "on";
          d.title = app.short;
          dots.appendChild(d);
        });
        a.appendChild(dots);

        a.style.display = "";     // nu pas tonen: leeg blijft hij uit de rij
        fitTileLabel(label);
      });
    }, function () {});
    return a;
  }

  // Attentinus tile — zelfde slot-patroon: alleen zichtbaar als er binnen 21
  // dagen iemand "jarig" is (of een andere jaarlijkse datum uit Attentinus).
  // Leest attentinus.people read-only uit attentinus_state; de app zelf is de
  // plek waar je beheert en ideeën bijhoudt.

  var ATTENT_SOON_DAYS = window.AttentDates ? window.AttentDates.SOON_DAYS : 21;   // zelfde venster als in de app

  // Datumlogica, feestdagen en categorie-migratie: attentinus/dates.js
  // (window.AttentDates), gedeeld met de app en calendar.js.

  function renderAttentTile() {
    var slot = el("div", "events-tile-slot");
    fetchAppState("attentinus_state", function (data) {
      if (!data) return;
      var people;
      // Geen lijst in deze rij (andere namespace, oude vorm): niets afleiden
      // uit "leeg" — tile én cache met rust laten.
      var raw = data[eventsPrefix() + "attentinus.people"];
      if (raw == null) return;
      try { people = JSON.parse(raw); } catch (e) { return; }
      if (!Array.isArray(people)) return;
      // Leescache voor de agenda: calendar.js toont deze datums als all-day
      // chips. Staat niet in de agendasync-KEYS en gaat dus nooit de server
      // op; alleen Attentinus zelf schrijft attentinus_state. Bij een
      // wijziging krijgt de agenda een seintje, want die was vaak al getekend.
      try {
        var ckey = k("attentCache"), cjson = JSON.stringify(people);
        if (localStorage.getItem(ckey) !== cjson) { localStorage.setItem(ckey, cjson); document.dispatchEvent(new Event("dd-attent-cache")); }
      } catch (e) {}
      var D = window.AttentDates;
      if (!people.length || !D) return;
      var soon = people.map(function (p) {
        var nx = p ? D.next(p) : null;
        return { p: p, days: nx ? nx.days : null };
      }).filter(function (x) {
        return x.days !== null && x.days <= ATTENT_SOON_DAYS;
      }).sort(function (a, b) { return a.days - b.days; });
      if (!soon.length) return;               // niets binnen het venster -> stil

      var first = soon[0];
      var cat = D.cat(first.p);
      var catWord = D.word(first.p);
      var overStr = D.until(first.days);
      var title = cat === "verjaardag"
        ? (first.days === 0 ? first.p.name + " is vandaag jarig!" : first.p.name + " is " + overStr + " jarig")
        : first.p.name + ": " + catWord + " " + overStr;
      var sub;
      if (cat === "sterfdag") {
        sub = first.p.year ? (new Date().getFullYear() - first.p.year) + " jaar geleden" : "Herdenking";
      } else {
        var ideas = (first.p.ideas || []).filter(function (i) { return i && !i.done; }).length;
        sub = ideas === 0 ? "Nog geen cadeau-idee" : ideas === 1 ? "1 cadeau-idee klaar" : ideas + " cadeau-ideeën klaar";
      }
      if (soon.length > 1) sub += " · ook: " + soon[1].p.name + " (" + soon[1].days + "d)";

      var a = document.createElement("a");
      a.className = "events-tile";
      a.href = "attentinus/";
      a.setAttribute("aria-label", "Open Attentinus: " + title);
      var ic = el("span", "events-tile-icon");
      ic.innerHTML = ICON_GIFT;
      a.appendChild(ic);
      var text = el("div", "events-tile-text");
      text.appendChild(el("div", "events-tile-title", title));
      text.appendChild(el("div", "events-tile-sub", sub));
      a.appendChild(text);
      var arrow = el("span", "events-tile-arrow");
      arrow.innerHTML = ICON_ARROW_OUT;
      a.appendChild(arrow);
      slot.appendChild(a);
    });
    return slot;
  }

  // Opduikinus — één oude vault-notitie per dag, aangeleverd door de
  // daily-digest-taak in feed.json als:
  //   "vaultNote": { "title": "...", "excerpt": "...", "path": "Mijn Wiki/...",
  //                  "noteDate": "2024-03-12" }
  // De taak blijft de enige schrijver van feed.json; deze kaart is alleen
  // weergave + twee acties: er een taak van maken (via de bestaande captures-
  // route naar de vault-bridge) of wegtikken voor vandaag (lokaal).
  function vaultNoteSeenKey() { return k("vaultNoteSeen"); }

  function renderVaultNote(json) {
    var note = json && json.vaultNote;
    if (!note || !note.title || !note.excerpt) return null;
    var stamp = todayKey() + "|" + (note.path || note.title);
    try { if (localStorage.getItem(vaultNoteSeenKey()) === stamp) return null; } catch (e) {}
    function markSeen() { try { localStorage.setItem(vaultNoteSeenKey(), stamp); } catch (e) {} }

    var card = el("div", "vault-note");
    var when = "";
    if (note.noteDate && /^\d{4}-\d{2}/.test(note.noteDate)) {
      var m = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"][+note.noteDate.slice(5, 7) - 1];
      when = " · " + (m || "") + " " + note.noteDate.slice(0, 4);
    }
    card.appendChild(el("div", "vault-note-label", "Uit je vault" + when));
    card.appendChild(el("div", "vault-note-title", note.title));
    card.appendChild(el("div", "vault-note-excerpt", note.excerpt));
    // De excerpt is standaard op 4 regels geklemd; bij langere teksten kan de
    // kaart open ("lees meer") zodat alle context leesbaar is.
    if ((note.excerpt || "").length > 180) {
      var more = el("button", "vault-note-more", "lees meer");
      more.type = "button";
      more.addEventListener("click", function () {
        var open = card.classList.toggle("open");
        more.textContent = open ? "minder" : "lees meer";
      });
      card.appendChild(more);
    }
    if (note.path) card.appendChild(el("div", "vault-note-path", note.path));

    var actions = el("div", "vault-note-actions");
    var act = el("button", "btn btn-primary btn-sm", "Maak er een actie van");
    act.type = "button";
    act.addEventListener("click", function () {
      if (!global.SB) { toast("Not connected — try again"); return; }
      var body = note.excerpt + "\n\nUit Opduikinus, vault-notitie: " + (note.path || note.title);
      global.SB.from("captures").insert({ kind: "task", title: ("Vault: " + note.title).slice(0, 120), body: body, status: "new" })
        .then(function (res) {
          if (res && res.error) { toast("Failed: " + res.error.message); return; }
          toast("Actie aangemaakt → inbox");
          markSeen();
          if (card.parentNode) card.parentNode.removeChild(card);
        }, function (err) { toast("Failed: " + ((err && err.message) || "unknown")); });
    });
    actions.appendChild(act);
    var seen = el("button", "btn btn-sm", "Gezien");
    seen.type = "button";
    seen.addEventListener("click", function () {
      markSeen();
      if (card.parentNode) card.parentNode.removeChild(card);
    });
    actions.appendChild(seen);
    card.appendChild(actions);
    return card;
  }

  // ---- hero (greeting + loop/done card + mini weather tile) ----

  function renderHero(myGeneration) {
    var wrap = el("div", "home-hero");
    wrap.appendChild(renderHeader());

    var heroRow = el("div", "hero-row");
    var mwt = renderMiniWeatherTile();
    heroRow.appendChild(mwt.el);
    if (window.Wakeup) heroRow.appendChild(renderWakeupTile());
    heroRow.appendChild(renderTrainerTile());   // kleine tegel; blijft weg als alles groen is
    heroRow.appendChild(renderBirdTile());
    wrap.appendChild(heroRow);

    var weatherAccordion = el("div", "accordion-body");
    wrap.appendChild(weatherAccordion);

    var weatherOpen = false;
    function renderWeatherAccordion() {
      weatherAccordion.innerHTML = "";
      if (!weatherOpen) return;
      var card = el("div", "accordion-card");
      card.appendChild(el("div", "accordion-card-title", "Today"));
      buildWeatherBody(card, mwt.weatherState);
      weatherAccordion.appendChild(card);
    }
    mwt.el.addEventListener("click", function () {
      weatherOpen = !weatherOpen;
      mwt.el.classList.toggle("tile-active", weatherOpen);
      renderWeatherAccordion();
    });

    loadWeather().then(function (data) {
      if (myGeneration !== renderGeneration) return;
      mwt.weatherState.status = "ready";
      mwt.weatherState.data = data;
      mwt.updateFace();
      renderWeatherAccordion();
    }).catch(function () {
      if (myGeneration !== renderGeneration) return;
      mwt.weatherState.status = "error";
      mwt.updateFace();
      renderWeatherAccordion();
    });

    return wrap;
  }

  // ---- shared row helpers ----

  function chip(status) {
    return el("span", "chip chip-" + status, status);
  }

  // A "+N more" disclosure: renders `primary` rows straight into `container`,
  // and tucks `rest` behind a small toggle so a long list doesn't dominate
  // by default. `rowFn` builds one row's DOM for a given item. `moreLabel`
  // lets a caller say "+6 more days" instead of the generic "+6 more"
  // (defaults to "more").
  function collapsible(container, primary, rest, rowFn, moreLabel) {
    moreLabel = moreLabel || "more";
    primary.forEach(function (item) { container.appendChild(rowFn(item)); });
    if (rest.length === 0) return;

    var restWrap = el("div", "dash-more-items hidden");
    rest.forEach(function (item) { restWrap.appendChild(rowFn(item)); });

    var moreBtn = el("button", "dash-more-btn", "+" + rest.length + " " + moreLabel);
    moreBtn.setAttribute("type", "button");
    var expanded = false;
    moreBtn.addEventListener("click", function () {
      expanded = !expanded;
      restWrap.classList.toggle("hidden", !expanded);
      moreBtn.textContent = expanded ? "Show less" : "+" + rest.length + " " + moreLabel;
    });

    container.appendChild(moreBtn);
    container.appendChild(restWrap);
  }

  // A show/hide toggle for a whole block (used for History sections) —
  // simpler than collapsible(): no primary/rest split, just one hidden
  // block that a button reveals.
  function toggleSection(container, label, entries, emptyMessage, rowFn) {
    var btn = el("button", "dash-more-btn", label);
    btn.type = "button";
    var body = el("div", "history-list hidden");
    if (entries.length === 0) {
      body.appendChild(el("p", "dash-empty", emptyMessage));
    } else {
      entries.forEach(function (e) { body.appendChild(rowFn(e)); });
    }
    var open = false;
    btn.addEventListener("click", function () {
      open = !open;
      body.classList.toggle("hidden", !open);
      btn.textContent = open ? "Hide " + label.toLowerCase() : label;
    });
    container.appendChild(btn);
    container.appendChild(body);
  }

  function taskRow(t) {
    var li = el("li", "dash-item dash-item-tap");
    var row = el("div", "dash-row");
    row.appendChild(chip(localStatus("tasks", t.id, t.status)));
    row.appendChild(el("span", "dash-item-title", t.title));
    var prog = subtaskProgress(t.id);
    if (prog) row.appendChild(el("span", "dash-subprog", prog));
    row.appendChild(el("span", "dash-chev", "›"));
    li.appendChild(row);
    var sub = [t.detail, t.hint].filter(Boolean).join(" · ");
    if (sub) li.appendChild(el("div", "dash-hint", sub));
    li.addEventListener("click", function () {
      if (window.ItemDetail) window.ItemDetail.open(t, "task");
    });
    return li;
  }

  function isRemoved(id) {
    try { return !!(JSON.parse(localStorage.getItem(k("removed"))) || {})[id]; }
    catch (e) { return false; }
  }

  // Supabase-primary: tasks live in the sbx.items store (instant, cross-device),
  // not the daily vault feed. The vault is a generated backup mirror.
  function buildTasksBody(container, today) {
    var appCount = buildAppItemsSection(container, "task");
    if (appCount === 0) {
      container.appendChild(el("p", "dash-empty", "No open tasks. Add one from the Backlog or promote something."));
    }
  }

  function projectRow(p) {
    var st = localStatus("projects", p.id, p.status);
    var li = el("div", "dash-item dash-item-tap");
    var row = el("div", "dash-row project-row" + (st === "active" ? "" : " project-dim"));
    row.appendChild(chip(st));
    row.appendChild(el("span", "dash-item-title", p.title));
    var prog = subtaskProgress(p.id);
    if (prog) row.appendChild(el("span", "dash-subprog", prog));
    if (p.updated) row.appendChild(el("span", "dash-date", p.updated));
    row.appendChild(el("span", "dash-chev", "›"));
    li.appendChild(row);
    if (p.line) li.appendChild(el("div", "dash-hint", p.line));
    li.addEventListener("click", function () {
      if (window.ItemDetail) window.ItemDetail.open(p, "project");
    });
    return li;
  }

  function buildProjectsBody(container, today) {
    var appCount = buildAppItemsSection(container, "project");
    if (appCount === 0) {
      container.appendChild(el("p", "dash-empty", "No open projects. Add one from the Backlog."));
    }
  }

  // ---- Backlog (unified items store) --------------------------------------
  // The Backlog is every unified item in the "backlog" state: things you don't
  // want to forget but that aren't a dated to-do yet. Manually reorderable;
  // each item can be promoted up the spectrum — Scheduled task / Task / Project
  // / Note — reusing the app's existing calendar + capture paths. Promotion
  // removes the item from the backlog so each thing lives in exactly one place.
  var ICON_BACKLOG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 6h9M4 12h9M4 18h5"/><path d="M16 15l2.4 2.4L23 13"/></svg>';

  function backlogBadge() {
    var n = window.Items ? window.Items.backlog().length : 0;
    return { text: n > 0 ? String(n) : "", cls: "tile-badge-gray" };
  }

  function newTodoId() {
    return "td-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
  }

  // Promote a backlog item into the vault via the existing Supabase `captures`
  // path (files to 10 Notes / 30 Tasks / 40 Projects on the next sync), then
  // drop it from the backlog.
  function backlogCapture(kind, item, doneMsg, refresh) {
    if (!global.SB) { toast("Not connected — try again"); return; }
    var body = item.title + (item.note ? "\n\n" + item.note : "") + "\n\n(promoted from Backlog)";
    global.SB.from("captures").insert({ kind: kind, title: item.title.slice(0, 120), body: body, status: "new" }).then(function (res) {
      if (res && res.error) { toast("Failed: " + res.error.message); return; }
      window.Items.remove(item.id);
      toast(doneMsg);
      refresh();
    }, function (err) { toast("Failed: " + ((err && err.message) || "unknown")); });
  }

  // Inline date picker → creates a calendar to-do (sbx.todos, the exact store
  // the Calendar reads) and drops the backlog item. Existing to-dos untouched.
  function backlogScheduleForm(item, refresh) {
    var form = el("div", "backlog-schedule");
    var d = document.createElement("input");
    d.type = "date"; d.className = "field-input"; d.value = localDateStr();
    form.appendChild(d);
    var go = el("button", "btn btn-primary btn-sm", "Schedule");
    go.type = "button";
    go.addEventListener("click", function () {
      var todos = loadTodos();
      todos.push({ id: newTodoId(), text: item.title, dueDate: d.value || localDateStr(), startTime: null, endTime: null, category: null, note: item.note || null, done: false });
      saveTodos(todos);
      window.Items.remove(item.id);
      toast("Scheduled → Calendar");
      refresh();
    });
    form.appendChild(go);
    return form;
  }

  // Hold (~300ms), then drag vertically to reorder the backlog. A fixed
  // clone rides under the finger; the original row travels through the list
  // as the drop slot; on release the DOM order is written via Items.setOrder.
  // Listeners live on document during the drag (NOT pointer capture — moving
  // a captured element in the DOM drops the capture, see calendar.js), and a
  // non-passive touchmove keeps the page from scrolling underneath.
  function wireBacklogDrag(li, refresh) {
    var HOLD_MS = 300;
    var timer = null, dragging = false, lastY = 0, downY = 0, clone = null, offY = 0, pid = null;

    function begin() {
      timer = null; dragging = true;
      var r = li.getBoundingClientRect();
      offY = lastY - r.top;
      clone = li.cloneNode(true);
      clone.classList.add("backlog-drag-clone");
      clone.style.width = r.width + "px";
      clone.style.left = r.left + "px";
      clone.style.top = (lastY - offY) + "px";
      document.body.appendChild(clone);
      li.classList.add("backlog-drag-slot");
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onCancel);
      if (navigator.vibrate) { try { navigator.vibrate(10); } catch (e) {} }
    }

    function onMove(e) {
      if (e.pointerId !== pid) return;   // ignore a second finger
      lastY = e.clientY;
      if (e.cancelable) e.preventDefault();
      if (!clone) return;
      clone.style.top = (e.clientY - offY) + "px";
      var wrap = li.parentNode; if (!wrap) return;
      var sibs = [].slice.call(wrap.children).filter(function (n) { return n !== li && n.classList && n.classList.contains("backlog-item"); });
      for (var i = 0; i < sibs.length; i++) {
        var r = sibs[i].getBoundingClientRect();
        if (e.clientY < r.top + r.height / 2) { if (li.nextSibling !== sibs[i]) wrap.insertBefore(li, sibs[i]); return; }
      }
      if (wrap.lastChild !== li) wrap.appendChild(li);
    }

    function finish(commit) {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onCancel);
      if (!dragging) return;
      dragging = false;
      if (clone && clone.parentNode) clone.parentNode.removeChild(clone);
      clone = null;
      li.classList.remove("backlog-drag-slot");
      var wrap = li.parentNode;
      if (commit && wrap && window.Items) {
        var ids = [];
        [].slice.call(wrap.children).forEach(function (n) { if (n.dataset && n.dataset.id) ids.push(n.dataset.id); });
        window.Items.setOrder(ids);
      }
      refresh();
    }
    function onUp(e) { if (e.pointerId !== pid) return; finish(true); }
    function onCancel(e) { if (e.pointerId !== pid) return; finish(false); }

    li.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button, input, .backlog-actions")) return;
      pid = e.pointerId;
      lastY = downY = e.clientY;
      timer = setTimeout(begin, HOLD_MS);
    });
    li.addEventListener("pointermove", function (e) {
      if (timer && Math.abs(e.clientY - downY) > 8) { clearTimeout(timer); timer = null; }
    });
    li.addEventListener("pointerup", function () { if (timer) { clearTimeout(timer); timer = null; } });
    // the browser taking the gesture (scroll) fires pointercancel, often
    // without any >8px pointermove being delivered first — kill the hold
    // timer too or begin() still fires for a touch that already ended
    li.addEventListener("pointercancel", function () { if (timer) { clearTimeout(timer); timer = null; } });
    li.addEventListener("touchmove", function (e) { if (dragging) e.preventDefault(); }, { passive: false });
  }

  function backlogRow(item, idx, count, refresh) {
    var li = el("div", "backlog-item");
    li.dataset.id = item.id;
    wireBacklogDrag(li, refresh);

    var row = el("div", "backlog-row");
    var ord = el("div", "backlog-ord");
    var up = el("button", "backlog-ord-btn", "▲"); up.type = "button"; up.disabled = idx === 0;
    up.addEventListener("click", function (e) { e.stopPropagation(); window.Items.move(item.id, -1); refresh(); });
    var dn = el("button", "backlog-ord-btn", "▼"); dn.type = "button"; dn.disabled = idx === count - 1;
    dn.addEventListener("click", function (e) { e.stopPropagation(); window.Items.move(item.id, 1); refresh(); });
    ord.appendChild(up); ord.appendChild(dn);
    row.appendChild(ord);

    row.appendChild(el("span", "backlog-type backlog-type-" + item.type,
      item.state === "todo" ? "To-do" : (item.type === "project" ? "Project" : "Task")));
    row.appendChild(el("span", "backlog-title", item.title));
    var menuBtn = el("button", "backlog-menu-btn", "⋯"); menuBtn.type = "button";
    row.appendChild(menuBtn);
    li.appendChild(row);

    var panel = el("div", "backlog-actions hidden");
    menuBtn.addEventListener("click", function () { panel.classList.toggle("hidden"); });

    function actBtn(label, cls, fn) {
      var b = el("button", "backlog-act" + (cls ? " " + cls : ""), label); b.type = "button";
      b.addEventListener("click", fn); return b;
    }

    var schedWrap = el("div", "backlog-sched-wrap hidden");
    panel.appendChild(actBtn("📅  Schedule…", "", function () {
      schedWrap.classList.toggle("hidden");
      if (!schedWrap.firstChild) schedWrap.appendChild(backlogScheduleForm(item, refresh));
    }));
    panel.appendChild(schedWrap);

    if (item.state !== "todo")
      panel.appendChild(actBtn("→  Make a task", "", function () { window.Items.update(item.id, { state: "todo", type: "task" }); toast("It's a to-do now (stays here too)"); refresh(); }));
    panel.appendChild(actBtn("◈  Make a project", "", function () { window.Items.update(item.id, { state: "active", type: "project" }); toast("Moved to Projects"); refresh(); }));
    panel.appendChild(actBtn("📝  Save as note", "", function () { backlogCapture("note", item, "Saved as note (files on next sync)", refresh); }));
    panel.appendChild(actBtn(item.type === "project" ? "Switch to task" : "Switch to project", "", function () {
      window.Items.update(item.id, { type: item.type === "project" ? "task" : "project" }); refresh();
    }));
    panel.appendChild(actBtn("Rename", "", function () {
      var name = window.prompt("Rename backlog item", item.title);
      if (name && name.trim()) { window.Items.update(item.id, { title: name.trim() }); refresh(); }
    }));
    panel.appendChild(actBtn("🗑  Delete", "backlog-act-danger", function () {
      if (window.confirm("Delete \"" + item.title + "\" from the backlog?")) { window.Items.remove(item.id); refresh(); }
    }));

    li.appendChild(panel);
    return li;
  }

  function buildBacklogBody(container) {
    if (!window.Items) { container.appendChild(el("p", "dash-empty", "Backlog unavailable.")); return; }

    var add = el("div", "backlog-add");
    var input = document.createElement("input");
    input.type = "text"; input.className = "field-input backlog-add-input"; input.placeholder = "Add to backlog…";
    var typeSeg = el("div", "backlog-seg");
    var addType = "task";
    [["task", "Task"], ["project", "Project"]].forEach(function (pair) {
      var b = el("button", "backlog-seg-btn" + (pair[0] === addType ? " active" : ""), pair[1]); b.type = "button";
      b.addEventListener("click", function () {
        addType = pair[0];
        typeSeg.querySelectorAll(".backlog-seg-btn").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
      });
      typeSeg.appendChild(b);
    });
    var addBtn = el("button", "btn btn-primary btn-sm", "Add"); addBtn.type = "button";
    function doAdd() {
      var v = (input.value || "").trim();
      if (!v) { toast("Type something first"); return; }
      window.Items.add({ title: v, type: addType, state: "backlog" });
      input.value = "";
      refresh();
    }
    addBtn.addEventListener("click", doAdd);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") doAdd(); });
    add.appendChild(input); add.appendChild(typeSeg); add.appendChild(addBtn);
    container.appendChild(add);

    var listWrap = el("div", "backlog-list");
    container.appendChild(listWrap);

    function refresh() {
      listWrap.innerHTML = "";
      var items = window.Items.backlog();
      if (items.length === 0) {
        listWrap.appendChild(el("p", "dash-empty", "Backlog is empty. Add something you don't want to forget."));
        return;
      }
      items.forEach(function (it, i) { listWrap.appendChild(backlogRow(it, i, items.length, refresh)); });
    }
    refresh();
  }

  // App-side (sbx.items) tasks/projects that are open (not backlog/done/
  // cancelled). These render right inside the Tasks / Projects tiles alongside
  // the vault-fed rows, so a promoted or app-created item shows up instantly.
  function openAppItems(type) {
    if (!window.Items) return [];
    var rank = { active: 0, todo: 1, idea: 2 };
    return window.Items.all().filter(function (x) {
      return x.type === type && (x.state === "idea" || x.state === "todo" || x.state === "active");
    }).sort(function (a, b) { return (isPrio(b) - isPrio(a)) || (rank[a.state] || 0) - (rank[b.state] || 0); });
  }

  var ITEM_STATES = [["backlog", "Backlog"], ["idea", "Idea"], ["todo", "To-do"], ["active", "Active"], ["done", "Done"]];

  // Instant state change (writes straight to the sbx.items store → Supabase).
  function itemStateControl(item, refresh) {
    var seg = el("div", "item-state-seg");
    ITEM_STATES.forEach(function (pair) {
      var b = el("button", "item-state-btn" + (item.state === pair[0] ? " active" : ""), pair[1]);
      b.type = "button";
      b.addEventListener("click", function () {
        window.Items.update(item.id, { state: pair[0] });
        toast(pair[1]);
        refresh();
      });
      seg.appendChild(b);
    });
    return seg;
  }

  function itemSubtasksEditor(item, refresh) {
    var wrap = el("div", "item-subs");
    (item.subtasks || []).map(function (s, i) { return { s: s, i: i }; }).sort(function (a, b) { return (a.s.done ? 1 : 0) - (b.s.done ? 1 : 0); }).forEach(function (ent) { var s = ent.s, i = ent.i;
      var rowEl = el("div", "item-sub" + (s.done ? " done" : ""));
      var box = el("button", "item-sub-check" + (s.done ? " checked" : ""), s.done ? "✓" : "");
      box.type = "button";
      box.addEventListener("click", function () {
        var cur = window.Items.get(item.id); if (!cur) return;
        var arr = (cur.subtasks || []).slice();
        arr[i] = { text: arr[i].text, done: !arr[i].done };
        window.Items.update(item.id, { subtasks: arr });
        refresh();
      });
      rowEl.appendChild(box);
      rowEl.appendChild(el("span", "item-sub-text", s.text));
      var del = el("button", "item-sub-del", "×"); del.type = "button";
      del.addEventListener("click", function () {
        var cur = window.Items.get(item.id); if (!cur) return;
        var arr = (cur.subtasks || []).slice(); arr.splice(i, 1);
        window.Items.update(item.id, { subtasks: arr });
        refresh();
      });
      rowEl.appendChild(del);
      wrap.appendChild(rowEl);
    });
    var addRow = el("div", "item-sub-add");
    var inp = document.createElement("input");
    inp.type = "text"; inp.className = "field-input"; inp.placeholder = "Add a subtask…";
    function addSub() {
      var v = (inp.value || "").trim(); if (!v) return;
      var cur = window.Items.get(item.id); if (!cur) return;
      var arr = (cur.subtasks || []).slice(); arr.push({ text: v, done: false });
      window.Items.update(item.id, { subtasks: arr });
      refresh();
    }
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") addSub(); });
    var addB = el("button", "btn btn-primary btn-sm", "Add"); addB.type = "button";
    addB.addEventListener("click", addSub);
    addRow.appendChild(inp); addRow.appendChild(addB);
    wrap.appendChild(addRow);
    return wrap;
  }

  function appItemRow(item, refresh, openState) {
    var li = el("div", "backlog-item app-item");
    var row = el("div", "backlog-row");
    row.appendChild(chip(item.state));
    if (isPrio(item)) row.appendChild(el("span", "cal-badge-prio", "\u2605"));
    row.appendChild(el("span", "backlog-title", item.title));
    if (item.subtasks && item.subtasks.length) {
      var done = item.subtasks.filter(function (s) { return s.done; }).length;
      row.appendChild(el("span", "dash-subprog", done + "/" + item.subtasks.length));
    }
    var menuBtn = el("button", "backlog-menu-btn", "⋯"); menuBtn.type = "button";
    row.appendChild(menuBtn);
    li.appendChild(row);

    var panel = el("div", "backlog-actions" + (openState && openState[item.id] ? "" : " hidden"));
    menuBtn.addEventListener("click", function () { var h = panel.classList.toggle("hidden"); if (openState) openState[item.id] = !h; });
    function actBtn(label, cls, fn) {
      var b = el("button", "backlog-act" + (cls ? " " + cls : ""), label); b.type = "button";
      b.addEventListener("click", fn); return b;
    }

    panel.appendChild(el("div", "item-panel-label", "State"));
    panel.appendChild(itemStateControl(item, refresh));
    panel.appendChild(el("div", "item-panel-label", "Subtasks"));
    panel.appendChild(itemSubtasksEditor(item, refresh));
    panel.appendChild(actBtn(item.type === "project" ? "Switch to task" : "Switch to project", "", function () {
      window.Items.update(item.id, { type: item.type === "project" ? "task" : "project" });
      toast(item.type === "project" ? "Now a task" : "Now a project"); refresh();
    }));
    panel.appendChild(actBtn("Rename", "", function () {
      var name = window.prompt("Rename", item.title);
      if (name && name.trim()) { window.Items.update(item.id, { title: name.trim() }); refresh(); }
    }));
    panel.appendChild(actBtn("🗑  Delete", "backlog-act-danger", function () {
      if (window.confirm("Delete \"" + item.title + "\"?")) { window.Items.remove(item.id); refresh(); }
    }));

    li.appendChild(panel);
    return li;
  }

  // Renders the app-side items for a tile and returns how many there were, so
  // the caller can decide whether to show an "empty" message.
  function buildAppItemsSection(container, type) {
    var wrap = el("div", "app-items");
    container.appendChild(wrap);
    var openState = {};
    function refresh() {
      wrap.innerHTML = "";
      openAppItems(type).forEach(function (it) { wrap.appendChild(appItemRow(it, refresh, openState)); });
    }
    refresh();
    return openAppItems(type).length;
  }

  function daysUntil(dateStr) {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var target = new Date(dateStr + "T00:00:00");
    return Math.round((target - today) / 86400000);
  }

  var RADAR_VISIBLE_DEFAULT = 3;

  // Urgency thresholds (days) for radar deadlines: <= soon paints red and
  // makes the strip urgent, <= near paints amber. Editable in Settings and
  // synced across devices via the agenda sync (k("radar.cfg") is in KEYS).
  function radarCfg() {
    var soon = 7, near = 30;
    try {
      var c = JSON.parse(localStorage.getItem(k("radar.cfg"))) || {};
      if (c.soon >= 1 && c.soon <= 365) soon = Math.round(c.soon);
      if (c.near >= 1 && c.near <= 365) near = Math.round(c.near);
    } catch (e) {}
    if (near < soon) near = soon;
    return { soon: soon, near: near };
  }

  // ---- radar items (deadlines + flagged items) + tasks made from them ----
  function radarItemsList(radar) {
    var arr = (radar && radar.items && radar.items.length)
      ? radar.items
      : ((radar && radar.deadlines) || []).map(function (d) { return { id: d.id, title: d.label, date: d.date }; });
    var out = arr.map(function (x) {
      var title = x.title || x.label || "";
      var date = x.date || null;
      return { id: x.id || slugify((date || "") + "-" + title), title: title, date: date };
    });
    out.sort(function (a, b) {
      if (a.date && b.date) return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0);
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;
      return 0;
    });
    return out;
  }
  function radarOpenTasks() {
    try { return loadTodos().filter(function (t) { return t.radarId && !t.done; }); }
    catch (e) { return []; }
  }
  function radarOpenTaskMap() {
    var m = {}; radarOpenTasks().forEach(function (t) { m[t.radarId] = t; }); return m;
  }
  function radarNearestDays(radar) {
    var days = null;
    radarItemsList(radar).forEach(function (it) {
      if (it.date) { var d = daysUntil(it.date); if (d >= 0 && (days === null || d < days)) days = d; }
    });
    return days;
  }
  function radarRow(it) {
    var openMap = radarOpenTaskMap();
    var cfg = radarCfg();
    var days = it.date ? daysUntil(it.date) : null;
    var li = el("div", "dash-item dash-item-tap");
    var row = el("div", "dl-row");
    if (days === null) {
      row.appendChild(el("span", "dl-days dl-item", "•"));
    } else {
      var badgeClass = days <= cfg.soon ? "dl-soon" : (days <= cfg.near ? "dl-near" : "dl-far");
      row.appendChild(el("span", "dl-days " + badgeClass, days < 0 ? "past" : days + "d"));
    }
    row.appendChild(el("span", "dl-label", it.title));
    if (it.date) row.appendChild(el("span", "dash-date", it.date));
    if (openMap[it.id]) {
      row.appendChild(el("span", "dl-task-pill", "task"));
    } else {
      // One tap puts a radar-tagged to-do on today's calendar — no detail
      // sheet needed. The tag makes the row show "task" and count as open.
      var addBtn = el("button", "dl-add", "+ task");
      addBtn.type = "button";
      addBtn.setAttribute("aria-label", "Make a task for " + it.title);
      addBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var list = loadTodos();
        list.push({ id: "todo-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
          text: it.title, dueDate: localDateStr(), startTime: null, endTime: null,
          done: false, snoozes: 0, radarId: it.id, source: "radar" });
        saveTodos(list);
        toast("Task added for today");
        render();
      });
      row.appendChild(addBtn);
    }
    row.appendChild(el("span", "dash-chev", "›"));
    li.appendChild(row);
    li.addEventListener("click", function () {
      if (window.ItemDetail) {
        ItemDetail.open({ id: it.id, title: it.title, hint: it.date || "" }, "radar");
      }
    });
    return li;
  }

  function buildRadarBody(container, today) {
    var radar = today.radar;
    if (!radar) {
      container.appendChild(el("p", "dash-empty", "No radar data in feed."));
      return;
    }
    var openCount = radarOpenTasks().length;
    var meta = el("div", "dash-meta");
    meta.textContent = "updated " + (radar.updated || "?") +
      (openCount ? " · " + openCount + " open task" + (openCount === 1 ? "" : "s") : "");
    container.appendChild(meta);

    // Weekly digest of the radar meta-review, written into the feed by the
    // daily-digest task (today.radar.weekly = { date, lines[] }). Purely
    // read-only; hidden when absent or when the summary is over 10 days old
    // (a stalled task shouldn't leave a stale "week in review" hanging).
    var wk = radar.weekly;
    if (wk && Array.isArray(wk.lines) && wk.lines.length && wk.date && daysUntil(wk.date) >= -10) {
      var wkBox = el("div", "radar-weekly");
      wkBox.appendChild(el("div", "radar-weekly-head", "Week in review · " + wk.date));
      wk.lines.slice(0, 5).forEach(function (ln) {
        wkBox.appendChild(el("div", "radar-weekly-line", String(ln)));
      });
      container.appendChild(wkBox);
    }

    var items = radarItemsList(radar);
    if (!items.length) { container.appendChild(el("p", "dash-empty", "No radar items.")); return; }
    var primary = items.slice(0, RADAR_VISIBLE_DEFAULT);
    var rest = items.slice(RADAR_VISIBLE_DEFAULT);
    collapsible(container, primary, rest, radarRow);
  }

  // ---- weekly chores (local-storage only — never touches the vault) ----
  //
  // Second design of this feature. The first cut modeled a chore as
  // "N times per week/month" with a dot-slider counter — that turned out
  // too rigid (no days/years, no way to say "every 3 days", and the
  // due-soon math had a real bug: frequent chores always looked due, even
  // right after being checked off, since the *next* instance was always
  // within the lookahead window by construction).
  //
  // This version drops the count-per-period idea entirely. A chore now has
  // a plain interval — every N days/weeks/months/years — plus an optional
  // pinned weekday (e.g. "every 1 week, on Tuesdays"). Progress is a single
  // done-today checkbox, not dots. lastDone + the interval gives an exact
  // next-due date, so "due soon" is just "that date has arrived" — no more
  // fuzzy pace math, and checking a chore off always pushes the next due
  // date a full interval forward, so the "always due" bug can't recur.
  //
  // `log` keeps the full completion history (used by the chores history
  // view); `lastDone` is just its most recent entry, cached for quick
  // access.

  var CHORES_KEY = k("chores");
  var WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  var ICON_CHORES =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M14 4 6 20"/><path d="M14 4c2 0 4 1 4 3.5S16.5 11 14 11"/><path d="M4.5 20.5 6 20l6.5-13"/></svg>';

  function loadChores() {
    try { return JSON.parse(localStorage.getItem(CHORES_KEY) || "[]"); } catch (e) { return []; }
  }
  function saveChores(list) {
    try { localStorage.setItem(CHORES_KEY, JSON.stringify(list)); } catch (e) {}
    if (window.AgendaSync) window.AgendaSync.pushNow();
  }

  function addInterval(date, every, unit) {
    var d = new Date(date.getTime());
    if (unit === "day") d.setDate(d.getDate() + every);
    else if (unit === "month") d.setMonth(d.getMonth() + every);
    else if (unit === "year") d.setFullYear(d.getFullYear() + every);
    else d.setDate(d.getDate() + every * 7); // week
    return d;
  }

  // Moves a date forward (never backward) to the next occurrence of
  // `weekday` (0=Sunday..6=Saturday). Landing exactly on that weekday
  // already is a no-op.
  function nudgeToWeekday(date, weekday) {
    if (weekday === null || weekday === undefined || weekday === "") return date;
    var d = new Date(date.getTime());
    var diff = (Number(weekday) - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + diff);
    return d;
  }

  // ---- richer recurrence engine (added 2026-07-21) --------------------------
  // A chore with a startDate (or a weekdays/monthly-nth pattern) is placed on
  // fixed dates by its pattern; legacy interval chores (no startDate) keep the
  // original rolling next-due logic untouched. choreOccursOn() ignores whether
  // it was completed — completion is tracked separately in `log`.
  function diffDays(a, b) {
    return Math.round((new Date(localDateStr(b) + "T00:00:00") - new Date(localDateStr(a) + "T00:00:00")) / 86400000);
  }
  function monthDiff(a, b) { return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()); }
  function ordinalWord(n) { return ({1:"1st",2:"2nd",3:"3rd",4:"4th",5:"5th"})[Number(n)] || (n + "th"); }
  function choreDoneOn(chore, d) {
    var ds = localDateStr(d);
    return (chore.log || []).some(function (iso) { return localDateStr(new Date(iso)) === ds; });
  }
  function withinPeriod(chore, ds) {
    if (chore.startDate && ds < chore.startDate) return false;
    if (chore.endDate && ds > chore.endDate) return false;
    return true;
  }
  function isNthWeekdayOfMonth(d, nth, weekday) {
    if (d.getDay() !== Number(weekday)) return false;
    if (Number(nth) === -1) {
      var probe = new Date(d); probe.setDate(d.getDate() + 7);
      return probe.getMonth() !== d.getMonth();
    }
    return Math.floor((d.getDate() - 1) / 7) + 1 === Number(nth);
  }
  function choreOccursOn(chore, d) {
    var ds = localDateStr(d);
    // Per-occurrence overrides (single-occurrence postpone). exceptions maps an
    // original date -> the date it was moved to (or null to skip). A moved
    // occurrence disappears from its original day and appears on the target.
    var ex = chore.exceptions || null;
    if (ex) {
      if (Object.prototype.hasOwnProperty.call(ex, ds)) return false; // this day's occurrence was moved/skipped
      for (var k in ex) { if (ex[k] === ds) return true; }            // this day is a move target
    }
    if (!withinPeriod(chore, ds)) return false;
    var pat = chore.pattern || "interval";
    if (pat === "weekdays") { var wd = d.getDay(); return wd >= 1 && wd <= 5; }
    if (pat === "monthly-nth") { return isNthWeekdayOfMonth(d, chore.nth, chore.weekday2); }
    if (!chore.startDate) return false; // legacy interval handled by rolling path
    var a = new Date(chore.startDate + "T00:00:00");
    if (d < a) return false;
    var every = Math.max(1, chore.every || 1);
    var unit = chore.unit || "week";
    if (unit === "day") return diffDays(a, d) % every === 0;
    if (unit === "week") return d.getDay() === a.getDay() && (diffDays(a, d) / 7) % every === 0;
    if (unit === "month") return d.getDate() === a.getDate() && monthDiff(a, d) % every === 0;
    if (unit === "year") return d.getDate() === a.getDate() && d.getMonth() === a.getMonth() && (d.getFullYear() - a.getFullYear()) % every === 0;
    return false;
  }
  function scanChoreNext(chore, fromD, inclusive) {
    var d = new Date(fromD.getTime());
    if (!inclusive) d.setDate(d.getDate() + 1);
    for (var i = 0; i < 800; i++) {
      var ds = localDateStr(d);
      if (chore.endDate && ds > chore.endDate) return null;
      if (choreOccursOn(chore, d) && !choreDoneOn(chore, d)) return new Date(d.getTime());
      d.setDate(d.getDate() + 1);
    }
    return null;
  }
  function choreProgressPattern(chore) {
    var today = localDateStr();
    var todayD = new Date(today + "T00:00:00");
    var start = chore.startDate || null, end = chore.endDate || null;
    var notStarted = !!(start && start > today);
    var expired = !!(end && end < today);
    var doneToday = choreDoneOn(chore, todayD);
    var neverDone = !chore.lastDone;
    var dueToday = !expired && !notStarted && choreOccursOn(chore, todayD) && !doneToday;
    var nextDue = scanChoreNext(chore, todayD, true);
    var prev = null, pd = new Date(todayD.getTime());
    for (var i = 0; i < 420; i++) {
      pd.setDate(pd.getDate() - 1);
      if (start && localDateStr(pd) < start) break;
      if (choreOccursOn(chore, pd)) { prev = new Date(pd.getTime()); break; }
    }
    var overdue = !!(prev && !choreDoneOn(chore, prev) && !expired);
    var daysUntilNext = nextDue ? diffDays(todayD, nextDue) : null;
    var dueSoon = !doneToday && !expired && !notStarted && (dueToday || overdue || (daysUntilNext !== null && daysUntilNext <= 1));
    return {
      doneToday: doneToday, neverDone: neverDone, lastDone: chore.lastDone,
      nextDue: nextDue, daysUntilNext: daysUntilNext, dueSoon: dueSoon,
      dueToday: dueToday, overdue: overdue, notStarted: notStarted, expired: expired,
      // the missed occurrence driving `overdue` — postpone acts on THIS day
      prevDue: prev ? localDateStr(prev) : null
    };
  }

  function choreNextDue(chore) {
    if (!chore.lastDone) return null; // never done — due immediately, handled in choreProgress
    var base = addInterval(new Date(chore.lastDone), chore.every, chore.unit);
    return nudgeToWeekday(base, chore.weekday);
  }

  // "Due soon" = due today, overdue, due tomorrow, or never done at all.
  // A precise next-due *date* (not a fuzzy lookahead window) means this
  // can't get stuck "always due" the way the old count-per-period model
  // could — checking a chore off moves lastDone to today, which pushes
  // nextDue a full interval into the future.
  function choreProgress(chore) {
    // Pattern chores (fixed dates) go through the richer engine; legacy interval
    // chores (no startDate/pattern) keep the original rolling logic below.
    if (chore.startDate || chore.pattern === "weekdays" || chore.pattern === "monthly-nth") {
      return choreProgressPattern(chore);
    }
    var today = localDateStr();
    // Optional recurrence range (added 2026-07-21). Legacy chores have neither
    // field -> notStarted/expired both false, so behaviour is unchanged.
    var start = chore.startDate || null;
    var end = chore.endDate || null;
    var notStarted = !!(start && start > today);
    var expired = !!(end && end < today);
    var doneToday = chore.lastDone ? localDateStr(new Date(chore.lastDone)) === today : false;
    var neverDone = !chore.lastDone;
    var nextDue = choreNextDue(chore);
    if (neverDone) {
      // first occurrence is the start date (or "due today" if start is null/past)
      nextDue = notStarted ? new Date(start + "T00:00:00") : null;
    }
    // Honour "postpone this day" for legacy chores too: follow the exception
    // chain from the rolling due date, exactly like choreOccursOn does for
    // pattern chores. Without this a postponed legacy chore never moved.
    if (nextDue && chore.exceptions) {
      var exm = chore.exceptions, xds = localDateStr(nextDue), hops = 0;
      while (Object.prototype.hasOwnProperty.call(exm, xds) && exm[xds] && hops++ < 30) xds = exm[xds];
      nextDue = new Date(xds + "T00:00:00");
    }
    var daysUntilNext = null;
    if (nextDue) {
      daysUntilNext = Math.round(
        (new Date(localDateStr(nextDue) + "T00:00:00") - new Date(today + "T00:00:00")) / 86400000
      );
    }
    // series finished once the next occurrence would fall past the end date
    if (end && nextDue && localDateStr(nextDue) > end) expired = true;
    var dueSoon = !doneToday && !expired && !notStarted && (neverDone || daysUntilNext <= 1);
    return {
      doneToday: doneToday, neverDone: neverDone,
      lastDone: chore.lastDone, nextDue: nextDue, daysUntilNext: daysUntilNext,
      dueSoon: dueSoon, notStarted: notStarted, expired: expired,
      // an overdue legacy chore's missed day IS its (past) rolling due date
      prevDue: (daysUntilNext !== null && daysUntilNext < 0) ? localDateStr(nextDue) : null
    };
  }

  // Toggles today's completion. Marking done appends (once) to `log` and
  // updates `lastDone`; un-marking removes today's entry and falls back to
  // the previous one (or null).
  function setChoreDoneToday(chore, done) {
    var today = localDateStr();
    chore.log = chore.log || [];
    if (done) {
      if (!chore.log.some(function (iso) { return localDateStr(new Date(iso)) === today; })) {
        chore.log.push(new Date().toISOString());
      }
    } else {
      chore.log = chore.log.filter(function (iso) { return localDateStr(new Date(iso)) !== today; });
    }
    chore.lastDone = chore.log.length > 0 ? chore.log[chore.log.length - 1] : null;
  }

  // Removes ONE completion, whatever day it was on (History → undo).
  // `lastDone` is recomputed as the newest remaining stamp instead of the last
  // array slot, so taking back an older entry can't leave `lastDone` pointing
  // at a completion that is no longer the most recent one.
  function removeChoreLogEntry(choreId, iso) {
    var list = loadChores();
    var hit = false;
    list.forEach(function (c) {
      if (c.id !== choreId) return;
      var log = c.log || [];
      var next = log.filter(function (x) { return x !== iso; });
      if (next.length === log.length) return;
      hit = true;
      c.log = next;
      var sorted = next.slice().sort();
      c.lastDone = sorted.length ? sorted[sorted.length - 1] : null;
    });
    if (hit) saveChores(list);
    return hit;
  }

  function freqLabel(chore) {
    var pat = chore.pattern || "interval";
    var s;
    if (pat === "weekdays") {
      s = "Every weekday";
    } else if (pat === "monthly-nth") {
      var nthWord = Number(chore.nth) === -1 ? "last" : ordinalWord(chore.nth);
      s = "Monthly · " + nthWord + " " + WEEKDAY_NAMES[Number(chore.weekday2)];
    } else {
      var unitWord = chore.every === 1 ? chore.unit : chore.unit + "s";
      s = "Every " + chore.every + " " + unitWord;
      if (chore.weekday !== null && chore.weekday !== undefined && chore.weekday !== "") {
        s += ", on " + WEEKDAY_NAMES[Number(chore.weekday)] + "s";
      }
    }
    if (chore.startDate && chore.startDate > localDateStr()) s += " · from " + chore.startDate;
    if (chore.endDate) s += " · until " + chore.endDate;
    return s;
  }

  function formatLastDone(progress) {
    if (!progress.lastDone) return "Never";
    return localDateStr(new Date(progress.lastDone));
  }

  function formatNextDue(progress) {
    if (progress.expired) return "Ended";
    if (progress.notStarted) return "Starts " + localDateStr(progress.nextDue);
    if (progress.neverDone) return "Due today";
    if (progress.daysUntilNext === 0) return "Due today";
    if (progress.daysUntilNext < 0) {
      var overdue = Math.abs(progress.daysUntilNext);
      return "Overdue by " + overdue + " day" + (overdue === 1 ? "" : "s");
    }
    return "in " + progress.daysUntilNext + " day" + (progress.daysUntilNext === 1 ? "" : "s");
  }

  function choreUrgentSub(progress) {
    if (progress.neverDone) return "Never done — due today";
    if (progress.daysUntilNext < 0) {
      var overdue = Math.abs(progress.daysUntilNext);
      return "Overdue by " + overdue + " day" + (overdue === 1 ? "" : "s");
    }
    if (progress.daysUntilNext === 0) return "Due today";
    return "Due tomorrow";
  }

  function dueSoonChores() {
    return loadChores()
      .map(function (c) { return { chore: c, progress: choreProgress(c) }; })
      .filter(function (x) { return x.progress.dueSoon; });
  }

  // Today section only: chores actually due TODAY (not overdue, not due-soon).
  // Pattern chores expose progress.dueToday; legacy interval chores don't, so
  // fall back to "next occurrence is today" / never-done-with-no-future-start.
  function dueTodayChores() {
    return loadChores()
      .map(function (c) { return { chore: c, progress: choreProgress(c) }; })
      .filter(function (x) {
        var p = x.progress;
        if (p.doneToday || p.expired || p.notStarted) return false;
        if (typeof p.dueToday === "boolean") return p.dueToday;
        return p.daysUntilNext === 0 || (p.neverDone && p.nextDue == null);
      });
  }

  // Overdue section: chores/to-dos whose due day is in the PAST and not done.
  // Kept mutually exclusive with the Today lists (Today uses "=== today" /
  // dueToday; Overdue uses strictly-before-today), so nothing shows twice.
  function overdueChores() {
    return loadChores()
      .map(function (c) { return { chore: c, progress: choreProgress(c) }; })
      .filter(function (x) {
        var p = x.progress;
        if (p.doneToday || p.expired || p.notStarted) return false;
        if (typeof p.overdue === "boolean") return p.overdue && !p.dueToday;
        return p.daysUntilNext !== null && p.daysUntilNext < 0;
      });
  }
  function overdueTodos() {
    var today = localDateStr();
    return loadTodos().filter(function (t) { return !t.done && t.dueDate && t.dueDate < today; });
  }

  function choresBadge() {
    var n = dueSoonChores().length;
    return { text: n > 0 ? String(n) : "", cls: "tile-badge-red" };
  }

  function choreHistoryEntries() {
    var entries = [];
    loadChores().forEach(function (c) {
      (c.log || []).forEach(function (iso) { entries.push({ name: c.name, date: iso }); });
    });
    entries.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    return entries.slice(0, 30);
  }

  function historyRow(e) {
    var row = el("div", "history-row");
    row.appendChild(el("span", "history-row-name", e.name));
    row.appendChild(el("span", "history-row-date", localDateStr(new Date(e.date))));
    return row;
  }

  function choreRow(chore, refresh) {
    var row = el("div", "chore-row");
    var head = el("div", "chore-row-head");
    var nameBtn = document.createElement("button");
    nameBtn.type = "button";
    nameBtn.className = "chore-name-btn";
    nameBtn.textContent = chore.name;
    nameBtn.addEventListener("click", function () { refresh(chore.id); });
    head.appendChild(nameBtn);
    var delBtn = el("button", "chore-del-btn", "×");
    delBtn.type = "button";
    delBtn.setAttribute("aria-label", "Delete " + chore.name);
    delBtn.addEventListener("click", function () {
      if (!window.confirm("Delete \"" + chore.name + "\"? This can't be undone.")) return;
      saveChores(loadChores().filter(function (c) { return c.id !== chore.id; }));
      refresh(null);
    });
    head.appendChild(delBtn);
    row.appendChild(head);

    row.appendChild(el("div", "chore-freq", freqLabel(chore)));

    var progress = choreProgress(chore);
    var metaRow = el("div", "chore-meta-row");
    metaRow.appendChild(el("span", "chore-meta", "Last done: " + formatLastDone(progress)));
    metaRow.appendChild(el("span", "chore-meta", "Next: " + formatNextDue(progress)));
    row.appendChild(metaRow);
    if (progress.dueSoon) {
      row.appendChild(el("span", "chore-due-chip", progress.daysUntilNext > 0 ? "due soon" : "due"));
    }

    var checkRow = el("div", "chore-check-row");
    var checkBtn = document.createElement("button");
    checkBtn.type = "button";
    checkBtn.className = "todo-check" + (progress.doneToday ? " todo-check-done" : "");
    checkBtn.innerHTML = CHECK_ICON;
    checkBtn.setAttribute("aria-label", (progress.doneToday ? "Mark not done today: " : "Mark done today: ") + chore.name);
    checkBtn.addEventListener("click", function () {
      var freshList = loadChores();
      var freshChore = freshList.filter(function (c) { return c.id === chore.id; })[0];
      if (!freshChore) return;
      var willBeDone = !progress.doneToday;
      setChoreDoneToday(freshChore, willBeDone);
      saveChores(freshList);
      if (willBeDone && window.FX) { window.FX.celebrate(checkBtn); window.FX.ding(); }
      refresh(null);
    });
    checkRow.appendChild(checkBtn);
    checkRow.appendChild(el("span", "chore-check-label", "Done today"));
    row.appendChild(checkRow);

    return row;
  }

  function buildChoreForm(container, onDone, editing) {
    var form = el("div", "inline-form");
    var nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "field-input";
    nameInput.placeholder = "Chore name";
    nameInput.value = editing ? editing.name : "";
    form.appendChild(nameInput);

    var freqRow = el("div", "inline-form-row");
    var everyLabel = el("span", "inline-form-label", "Every");
    freqRow.appendChild(everyLabel);
    var everyInput = document.createElement("input");
    everyInput.type = "number";
    everyInput.min = "1";
    everyInput.max = "365";
    everyInput.className = "field-input field-input-narrow";
    everyInput.value = editing ? String(editing.every) : "1";
    freqRow.appendChild(everyInput);
    var unitSelect = document.createElement("select");
    unitSelect.className = "field-select";
    [["day", "days"], ["week", "weeks"], ["month", "months"], ["year", "years"]].forEach(function (pair) {
      var o = document.createElement("option");
      o.value = pair[0];
      o.textContent = pair[1];
      unitSelect.appendChild(o);
    });
    if (editing) unitSelect.value = editing.unit; else unitSelect.value = "week";
    freqRow.appendChild(unitSelect);
    form.appendChild(freqRow);

    var weekdayRow = el("div", "inline-form-row");
    var weekdaySelect = document.createElement("select");
    weekdaySelect.className = "field-select field-select-wide";
    var noneOpt = document.createElement("option");
    noneOpt.value = "";
    noneOpt.textContent = "Any day";
    weekdaySelect.appendChild(noneOpt);
    WEEKDAY_NAMES.forEach(function (name, i) {
      var o = document.createElement("option");
      o.value = String(i);
      o.textContent = "On " + name + "s";
      weekdaySelect.appendChild(o);
    });
    if (editing && editing.weekday !== null && editing.weekday !== undefined && editing.weekday !== "") {
      weekdaySelect.value = String(editing.weekday);
    }
    weekdayRow.appendChild(weekdaySelect);
    form.appendChild(weekdayRow);

    var actionsRow = el("div", "inline-form-row");
    var saveBtn = el("button", "btn btn-primary", editing ? "Save changes" : "+ Add chore");
    saveBtn.type = "button";
    saveBtn.addEventListener("click", function () {
      var name = nameInput.value.trim();
      if (!name) { toast("Give the chore a name first"); return; }
      var every = Math.max(1, parseInt(everyInput.value, 10) || 1);
      var unit = unitSelect.value;
      var weekday = weekdaySelect.value === "" ? null : parseInt(weekdaySelect.value, 10);
      var list = loadChores();
      if (editing) {
        list = list.map(function (c) {
          if (c.id !== editing.id) return c;
          return { id: c.id, name: name, every: every, unit: unit, weekday: weekday,
            lastDone: c.lastDone || null, log: c.log || [],
            startDate: c.startDate || null, endDate: c.endDate || null };
        });
      } else {
        list.push({
          id: "chore-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
          name: name, every: every, unit: unit, weekday: weekday, lastDone: null, log: [],
          startDate: null, endDate: null
        });
      }
      saveChores(list);
      onDone();
    });
    actionsRow.appendChild(saveBtn);
    if (editing) {
      var cancelBtn = el("button", "btn btn-ghost", "Cancel");
      cancelBtn.type = "button";
      cancelBtn.addEventListener("click", onDone);
      actionsRow.appendChild(cancelBtn);
    }
    form.appendChild(actionsRow);
    container.appendChild(form);
  }

  function buildChoresBody(container) {
    var editingId = null;

    function rerender(nextEditingId) {
      if (nextEditingId !== undefined) editingId = nextEditingId;
      container.innerHTML = "";
      var list = loadChores();
      if (list.length === 0) {
        container.appendChild(el("p", "dash-empty", "No chores yet — add one below."));
      } else {
        // Filter/relevance: due-soon chores first (soonest/most overdue at
        // the top), everything else tucked behind "+N more chores" — same
        // pattern as Projects/Radar, so the list stays short by default as
        // it grows instead of showing everything flat every time.
        var sorted = list.slice().sort(function (a, b) {
          var pa = choreProgress(a), pb = choreProgress(b);
          var da = pa.neverDone ? -9999 : pa.daysUntilNext;
          var db = pb.neverDone ? -9999 : pb.daysUntilNext;
          return da - db;
        });
        var primary = sorted.filter(function (c) { return choreProgress(c).dueSoon; });
        var rest = sorted.filter(function (c) { return !choreProgress(c).dueSoon; });
        if (primary.length === 0) { primary = sorted.slice(0, 3); rest = sorted.slice(3); }
        var listWrap = el("div", "chore-list");
        collapsible(listWrap, primary, rest, function (c) { return choreRow(c, rerender); }, "more chores");
        container.appendChild(listWrap);
      }
      var editing = editingId ? list.filter(function (c) { return c.id === editingId; })[0] || null : null;
      buildChoreForm(container, function () { rerender(null); }, editing);
      toggleSection(container, "History", choreHistoryEntries(), "No history yet.", historyRow);
    }

    rerender(null);
  }

  // ---- one-off to-dos (local-storage only) ----
  // A lightweight separate notepad-with-checkboxes for "have to do this
  // today, but not worth a proper Tasks note in the wiki" — distinct from
  // the vault-backed Tasks section above; nothing here ever syncs anywhere.

  var TODOS_KEY = k("todos");
  var TODO_HISTORY_KEY = k("todos.history");

  var ICON_TODOS =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>';

  var TODO_DUE_PRESETS = [
    { value: "0", label: "Today" },
    { value: "1", label: "Tomorrow" },
    { value: "2", label: "In 2 days" },
    { value: "3", label: "In 3 days" },
    { value: "7", label: "In a week" },
    { value: "", label: "Someday (no date)" }
  ];

  function loadTodos() {
    try { return JSON.parse(localStorage.getItem(TODOS_KEY) || "[]"); } catch (e) { return []; }
  }
  function saveTodos(list) {
    try { localStorage.setItem(TODOS_KEY, JSON.stringify(list)); } catch (e) {}
    if (window.AgendaSync) window.AgendaSync.pushNow();
  }

  // A separate history log, independent of the active to-dos list, so
  // deleting a completed item to tidy the list doesn't erase its record —
  // it just stops appearing under "+N completed."
  function loadTodoHistory() {
    try { return JSON.parse(localStorage.getItem(TODO_HISTORY_KEY) || "[]"); } catch (e) { return []; }
  }
  function saveTodoHistory(list) {
    try { localStorage.setItem(TODO_HISTORY_KEY, JSON.stringify(list)); } catch (e) {}
  }
  // `id` ties the entry back to the to-do it came from, so History can
  // un-complete exactly that one. Entries written before this existed carry
  // no id — History then falls back to matching on text, and hides the undo
  // button when nothing matches any more.
  function logTodoHistory(text, id) {
    var list = loadTodoHistory();
    list.push({ text: text, date: new Date().toISOString(), id: id || null });
    saveTodoHistory(list);
  }
  // Drops one entry again (History → undo). Matches on the exact timestamp,
  // which is unique per completion, so completing the same to-do again later
  // keeps its own separate line in the log.
  function unlogTodoHistory(entry) {
    if (!entry) return;
    var list = loadTodoHistory();
    for (var i = list.length - 1; i >= 0; i--) {
      if (list[i].date === entry.date && list[i].text === entry.text) { list.splice(i, 1); break; }
    }
    saveTodoHistory(list);
  }
  function todoHistoryEntries() {
    return loadTodoHistory()
      .slice()
      .sort(function (a, b) { return new Date(b.date) - new Date(a.date); })
      .slice(0, 30);
  }

  // Wake-up priority: `prio` holds the date it was starred for (to-dos AND
  // items), so it expires by itself. Set in wakeup.js / the ItemUI menu.
  function isPrio(x) { return !!x && x.prio === localDateStr(); }

  function dueTodayTodos() {
    var today = localDateStr();
    return loadTodos().filter(function (t) { return !t.done && t.dueDate && t.dueDate === today; });
  }

  function todoDueLabel(t) {
    if (!t.dueDate) return "";
    var today = localDateStr();
    if (t.dueDate === today) return "Today";
    if (t.dueDate < today) return "Overdue · " + t.dueDate;
    return "Due " + t.dueDate;
  }

  function todosBadge() {
    var open = loadTodos().filter(function (t) { return !t.done; });
    var today = localDateStr();
    var dueCount = open.filter(function (t) { return t.dueDate && t.dueDate <= today; }).length;
    if (dueCount > 0) return { text: String(dueCount), cls: "tile-badge-red" };
    if (open.length > 0) return { text: String(open.length), cls: "tile-badge-gray" };
    return { text: "", cls: "tile-badge-gray" };
  }

  var CHECK_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

  function todoRow(t, refresh) {
    var row = el("div", "todo-row");
    var checkBtn = document.createElement("button");
    checkBtn.type = "button";
    checkBtn.className = "todo-check" + (t.done ? " todo-check-done" : "");
    checkBtn.innerHTML = CHECK_ICON;
    checkBtn.setAttribute("aria-label", (t.done ? "Mark not done: " : "Mark done: ") + t.text);
    checkBtn.addEventListener("click", function () {
      var list = loadTodos();
      var fresh = list.filter(function (x) { return x.id === t.id; })[0];
      var nowDone = false;
      if (fresh) {
        fresh.done = !fresh.done;
        nowDone = fresh.done;
        if (fresh.done) logTodoHistory(fresh.text, fresh.id);
      }
      saveTodos(list);
      if (nowDone && window.FX) { window.FX.celebrate(checkBtn); window.FX.ding(); }
      refresh();
    });
    row.appendChild(checkBtn);

    var textWrap = el("div", "todo-text-wrap");
    textWrap.appendChild(el("div", "todo-text" + (t.done ? " todo-text-done" : ""), (isPrio(t) ? "\u2605 " : "") + t.text));
    var dueLabel = todoDueLabel(t);
    if (dueLabel) textWrap.appendChild(el("div", "todo-due", dueLabel));
    row.appendChild(textWrap);

    var delBtn = el("button", "todo-del-btn", "×");
    delBtn.type = "button";
    delBtn.setAttribute("aria-label", "Delete " + t.text);
    delBtn.addEventListener("click", function () {
      saveTodos(loadTodos().filter(function (x) { return x.id !== t.id; }));
      refresh();
    });
    row.appendChild(delBtn);
    return row;
  }

  function buildTodoForm(container, onDone) {
    var form = el("div", "inline-form");
    var textInput = document.createElement("input");
    textInput.type = "text";
    textInput.className = "field-input";
    textInput.placeholder = "What needs doing?";
    form.appendChild(textInput);

    var dueSelect = document.createElement("select");
    dueSelect.className = "field-select field-select-wide";
    TODO_DUE_PRESETS.forEach(function (p) {
      var o = document.createElement("option");
      o.value = p.value;
      o.textContent = p.label;
      dueSelect.appendChild(o);
    });
    form.appendChild(dueSelect);

    var addBtn = el("button", "btn btn-primary", "+ Add to-do");
    addBtn.type = "button";
    addBtn.addEventListener("click", function () {
      var text = textInput.value.trim();
      if (!text) { toast("Type something first"); return; }
      var dueDate = null;
      if (dueSelect.value !== "") {
        var d = new Date();
        d.setDate(d.getDate() + parseInt(dueSelect.value, 10));
        dueDate = localDateStr(d);
      }
      var list = loadTodos();
      list.push({
        id: "todo-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        text: text, dueDate: dueDate, done: false
      });
      saveTodos(list);
      onDone();
    });
    form.appendChild(addBtn);
    container.appendChild(form);
  }

  function buildTodosBody(container) {
    function rerender() {
      container.innerHTML = "";
      var list = loadTodos();
      var open = list.filter(function (t) { return !t.done; }).sort(function (a, b) {
        var ad = a.dueDate || "9999-99-99", bd = b.dueDate || "9999-99-99";
        return (isPrio(b) - isPrio(a)) || (ad < bd ? -1 : ad > bd ? 1 : 0);
      });
      var done = list.filter(function (t) { return t.done; });
      if (open.length === 0 && done.length === 0) {
        container.appendChild(el("p", "dash-empty", "Nothing on the list — add one below."));
      } else {
        var listWrap = el("div", "todo-list");
        open.forEach(function (t) { listWrap.appendChild(todoRow(t, rerender)); });
        container.appendChild(listWrap);
        if (done.length > 0) {
          collapsible(container, [], done, function (t) { return todoRow(t, rerender); }, "completed");
        }
      }
      buildTodoForm(container, rerender);
      toggleSection(container, "History", todoHistoryEntries(), "No history yet.",
        function (e) { return historyRow({ name: e.text, date: e.date }); });
    }
    rerender();
  }

  // ---- urgent home-screen cards (chores due soon, to-dos due today) ----
  // Both surface directly on Today — not hidden behind a tap — as a
  // two-tile-width card with a one-tap checkbox, ahead of the regular tile
  // rows. Checking one off calls the top-level render(), which is safe
  // here (unlike inside an accordion) since these cards aren't nested in
  // any collapsible section that would otherwise lose its open state.

  function urgentCard(iconSvg, text, subText, onCheck) {
    var card = el("div", "tile tile-wide tile-urgent");
    var head = el("div", "tile-head");
    var iconWrap = el("div", "tile-icon");
    iconWrap.innerHTML = iconSvg;
    head.appendChild(iconWrap);
    var textWrap = el("div", "urgent-text-wrap");
    textWrap.appendChild(el("div", "urgent-text", text));
    if (subText) textWrap.appendChild(el("div", "urgent-sub", subText));
    head.appendChild(textWrap);
    var checkBtn = document.createElement("button");
    checkBtn.type = "button";
    checkBtn.className = "urgent-check";
    checkBtn.innerHTML = CHECK_ICON;
    checkBtn.setAttribute("aria-label", "Mark done: " + text);
    checkBtn.addEventListener("click", onCheck);
    head.appendChild(checkBtn);
    card.appendChild(head);
    return card;
  }

  // Surfaced "Today" items — the due chores and due-today/overdue to-dos —
  // rendered with the shared ItemUI so they behave exactly like calendar
  // items: tap the box to complete, swipe (right complete / left postpone),
  // or hold / tap ⋯ for the full menu. Editing jumps to the Calendar tab.
  function homeItemOpts() {
    return {
      refresh: render,
      editTodo: function (t) { if (window.App) App.go("calendar"); setTimeout(function () { if (window.CalEditors) window.CalEditors.editTodo(t); }, 60); },
      editChore: function (chore) { if (window.App) App.go("calendar"); setTimeout(function () { if (window.CalEditors) window.CalEditors.editChore(chore); }, 60); },
      swipe: true
    };
  }
  // ---- today overload: offer to bulk-move to-dos when the day is stacked ----
  // Only to-dos count and only to-dos are movable — chores are rhythm, not
  // backlog, and shifting an occurrence is a per-item decision (ItemUI menu).
  // The banner asks at most once per day; the answer lives in localStorage,
  // per device, like a snooze — not synced state.
  var OVERLOAD_MIN = 8; // ponytail: fixed threshold, make it a setting if it nags
  var overloadPicking = false;
  var overloadPickDay = null;   // the day picking started — a new day drops the mode
  var overloadSel = {};

  function overloadReset() { overloadPicking = false; overloadPickDay = null; overloadSel = {}; }

  // Tomorrow / the coming Saturday / the coming Monday, deduped by date and
  // sorted, so the buttons are always chronological and never offer the same
  // day twice (on a Sunday "next Monday" IS tomorrow; on a Friday so is
  // "Saturday"). nudgeToWeekday lands on the first matching weekday from a
  // date onwards, counting from tomorrow so a target is never today.
  // Exported on DayModel — the calendar's "All" view offers the same targets.
  function moveTargets() {
    var tom = new Date();
    tom.setDate(tom.getDate() + 1);
    var cands = [
      { label: "Tomorrow", d: tom },
      { label: "Saturday", d: nudgeToWeekday(tom, 6) },
      { label: "Next week", d: nudgeToWeekday(tom, 1) }
    ];
    var seen = {}, out = [];
    cands.forEach(function (c) {
      var ds = localDateStr(c.d);
      if (seen[ds]) return;            // first label wins — "Tomorrow" outranks the rest
      seen[ds] = true;
      out.push({ label: c.label, ymd: ds });
    });
    out.sort(function (a, b) { return a.ymd < b.ymd ? -1 : a.ymd > b.ymd ? 1 : 0; });
    return out;
  }

  // Same move semantics as itemui's snoozeTodo, but to an absolute date: a
  // multi-day to-do keeps its span (endDate shifts along) and snoozes ticks up.
  // Only still-open to-dos move — a selected row the user completed on another
  // device in the meantime must not be resurrected on the target day.
  // Pure data operation, exported on DayModel and shared with the calendar's
  // "All" view; returns how many to-dos actually moved.
  // In-place on `list` (no load/save) so a caller can combine it with other
  // edits in ONE save = one sync push; moveTodosTo wraps it.
  function moveTodosIn(list, ids, ymdStr) {
    var byId = {};
    ids.forEach(function (id) { byId[id] = true; });
    var moved = 0;
    list.forEach(function (t) {
      if (!byId[t.id] || t.done) return;
      if (t.endDate && t.dueDate) {
        var span = Math.round((new Date(t.endDate + "T00:00:00") - new Date(t.dueDate + "T00:00:00")) / 86400000);
        if (!(span >= 0)) span = 0;
        var e = new Date(ymdStr + "T00:00:00");
        e.setDate(e.getDate() + span);
        t.endDate = localDateStr(e);
      }
      t.dueDate = ymdStr;
      t.snoozes = (t.snoozes || 0) + 1;
      t.prio = null;   // moved off today = not today's priority any more
      moved++;
    });
    return moved;
  }
  function moveTodosTo(ids, ymdStr) {
    var list = loadTodos();
    var moved = moveTodosIn(list, ids, ymdStr);
    saveTodos(list);
    return moved;
  }

  function markOverloadAsked() {
    try { localStorage.setItem(k("today.overloadAsked"), localDateStr()); } catch (e) {}
  }

  function overloadBanner(count) {
    var card = el("div", "overload-banner");
    card.appendChild(el("div", "overload-banner-text", count + " tasks stacked up — move a few?"));
    var pick = el("button", "btn btn-primary", "Pick tasks"); pick.type = "button";
    pick.addEventListener("click", function () {
      overloadPicking = true; overloadPickDay = localDateStr(); overloadSel = {};
      render();
    });
    var no = el("button", "btn btn-ghost", "Not now"); no.type = "button";
    no.addEventListener("click", function () { markOverloadAsked(); card.remove(); });
    card.appendChild(pick); card.appendChild(no);
    return card;
  }

  // Selection is toggled in place: a full render() would refetch feed.json and
  // rebuild the whole view (losing scroll position, and the picker itself
  // until the network answers) for what is a pure in-memory flag.
  function overloadPickerCard(todos) {
    var wrap = el("div", "bulk-pick");
    wrap.appendChild(el("div", "home-today-head", "Tap the tasks to move"));

    // Drop ids that are no longer on the list (completed or moved elsewhere),
    // so the counter and the move can never act on a row that isn't shown.
    var live = {};
    todos.forEach(function (t) { live[t.id] = true; });
    Object.keys(overloadSel).forEach(function (id) { if (!live[id]) delete overloadSel[id]; });

    var bar = el("div", "bulk-bar");
    var barLabel = el("span", "bulk-bar-label", "");
    var targetBtns = [];

    function syncBar() {
      var n = Object.keys(overloadSel).length;
      barLabel.textContent = n ? "Move " + n + " to:" : "Nothing picked yet";
      targetBtns.forEach(function (b) { b.disabled = n === 0; });
    }

    var list = el("div", "todo-list");
    todos.forEach(function (t) {
      var row = el("div", "todo-row bulk-row");
      var chk = document.createElement("button");
      chk.type = "button";
      chk.className = "todo-check bulk-check";
      chk.innerHTML = CHECK_ICON;
      chk.tabIndex = -1;              // the row itself is the control
      chk.setAttribute("aria-hidden", "true");
      row.appendChild(chk);
      var tw = el("div", "todo-text-wrap");
      tw.appendChild(el("div", "todo-text", t.text));
      var dueLabel = todoDueLabel(t);
      if (dueLabel) tw.appendChild(el("div", "todo-due", dueLabel));
      row.appendChild(tw);

      row.setAttribute("role", "checkbox");
      row.tabIndex = 0;
      function paint() {
        var sel = !!overloadSel[t.id];
        row.classList.toggle("bulk-row-sel", sel);
        chk.classList.toggle("bulk-check-sel", sel);
        row.setAttribute("aria-checked", sel ? "true" : "false");
        row.setAttribute("aria-label", (sel ? "Deselect: " : "Select: ") + t.text);
      }
      function toggle() {
        if (overloadSel[t.id]) delete overloadSel[t.id]; else overloadSel[t.id] = true;
        paint(); syncBar();
      }
      row.addEventListener("click", toggle);
      row.addEventListener("keydown", function (e) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); }
      });
      paint();
      list.appendChild(row);
    });
    wrap.appendChild(list);

    bar.appendChild(barLabel);
    moveTargets().forEach(function (tgt) {
      var b = el("button", "btn btn-primary", tgt.label); b.type = "button";
      b.addEventListener("click", function () {
        var moved = moveTodosTo(Object.keys(overloadSel), tgt.ymd);
        overloadReset();
        markOverloadAsked();
        toast("Pushed " + moved + " to " + tgt.label.toLowerCase());
        render();
      });
      targetBtns.push(b);
      bar.appendChild(b);
    });
    var cancel = el("button", "btn btn-ghost", "Cancel"); cancel.type = "button";
    cancel.addEventListener("click", function () { overloadReset(); render(); });
    bar.appendChild(cancel);
    syncBar();
    wrap.appendChild(bar);
    return wrap;
  }

  var prioOpenState = {};   // ⋯-panel open/closed per priority item, kept across re-renders

  function appendUrgentCards(container) {
    if (!window.ItemUI || !window.DayModel) return;
    var today = localDateStr();

    var oChores = overdueChores();
    var oTodos = overdueTodos();
    var chores = dueTodayChores();
    var todos = dueTodayTodos();

    // A new day ends picking mode: yesterday's selection means nothing now,
    // and Today must never open straight into the picker without the banner.
    if (overloadPicking && overloadPickDay !== today) overloadReset();

    if (overloadPicking) {
      var movable = oTodos.concat(todos);
      if (movable.length) {
        container.appendChild(overloadPickerCard(movable));
        oTodos = []; todos = [];   // the to-dos live in the picker; chores render as usual below
      } else {
        overloadReset();           // nothing left to move (completed elsewhere)
      }
    } else if (oTodos.length + todos.length >= OVERLOAD_MIN &&
               localStorage.getItem(k("today.overloadAsked")) !== today) {
      container.appendChild(overloadBanner(oTodos.length + todos.length));
    }

    // Priority (wake-up stars) first: to-dos pulled out of the lists below,
    // plus starred tasks/projects from the items store. `prio` is a date, so
    // yesterday's stars are simply not today's.
    var prioTodos = loadTodos().filter(function (t) { return !t.done && isPrio(t); });
    var prioItems = window.Items ? window.Items.all().filter(function (x) {
      return isPrio(x) && (x.state === "idea" || x.state === "todo" || x.state === "active");
    }) : [];
    if (prioTodos.length || prioItems.length) {
      oTodos = oTodos.filter(function (t) { return !isPrio(t); });
      todos = todos.filter(function (t) { return !isPrio(t); });
      container.appendChild(el("div", "home-today-head home-prio-head", "\u2605 Priority"));
      var pList = el("div", "cal-item-list home-today-list");
      prioTodos.forEach(function (t) { pList.appendChild(window.ItemUI.todoRow(t, homeItemOpts())); });
      prioItems.forEach(function (it) { pList.appendChild(appItemRow(it, render, prioOpenState)); });
      container.appendChild(pList);
    }

    // Overdue first — most pressing. The row carries the MISSED occurrence
    // (progress.prevDue) so "Postpone this day" moves that occurrence instead
    // of writing an exception on today; ticking still marks it done today
    // (the itemui tick guard only refuses FUTURE days).
    if (oChores.length || oTodos.length) {
      container.appendChild(el("div", "home-today-head home-overdue-head", "Overdue"));
      var oList = el("div", "cal-item-list home-today-list");
      oChores.forEach(function (x) { oList.appendChild(window.ItemUI.choreRow(x.chore, "due", x.progress.prevDue || today, homeItemOpts())); });
      oTodos.forEach(function (t) { oList.appendChild(window.ItemUI.todoRow(t, homeItemOpts())); });
      container.appendChild(oList);
    }

    if (!chores.length && !todos.length) return;
    container.appendChild(el("div", "home-today-head", "Today"));
    var list = el("div", "cal-item-list home-today-list");
    chores.forEach(function (x) { list.appendChild(window.ItemUI.choreRow(x.chore, x.progress.doneToday ? "done" : "due", today, homeItemOpts())); });
    todos.forEach(function (t) { list.appendChild(window.ItemUI.todoRow(t, homeItemOpts())); });
    container.appendChild(list);
  }

    // ---- icon tiles + inline accordion ----
  // Tiles render in rows (wide tiles/urgent cards get their own row;
  // regular tiles pair up 2-per-row) instead of one CSS grid, so that
  // tapping any tile inserts its expanded content directly below that
  // tile's own row — not at the bottom of the whole tile area.

  var ICON_TASKS =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 10h8M8 14h5"/></svg>';
  var ICON_PROJECTS =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 7.5 12 4l8 3.5-8 3.5-8-3.5Z"/><path d="M4 12l8 3.5 8-3.5"/><path d="M4 16.5 12 20l8-3.5"/></svg>';
  var ICON_RADAR =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3"/></svg>';

  function tile(key, label, iconSvg, badge, onToggle) {
    var t = document.createElement("button");
    t.type = "button";
    t.className = "tile tile-" + key;
    var badgeEl = el("span", "tile-badge " + badge.cls + (badge.text ? "" : " hidden"), badge.text);
    t.appendChild(badgeEl);
    var head = el("div", "tile-head");
    var iconWrap = el("div", "tile-icon");
    iconWrap.innerHTML = iconSvg;
    head.appendChild(iconWrap);
    head.appendChild(el("span", "tile-label", label));
    t.appendChild(head);
    t.addEventListener("click", onToggle);
    return t;
  }

  // Badges must mirror the live set the tile bodies show — exclude removed
  // items and reflect local status changes (a finished/removed item drops the
  // count on the next render) so the number never goes stale vs. the list.
  function taskBadge(today) {
    var n = openAppItems("task").length;
    return { text: n > 0 ? String(n) : "", cls: "tile-badge-blue" };
  }

  function projectBadge(today) {
    var n = openAppItems("project").length;
    return { text: n > 0 ? String(n) : "", cls: "tile-badge-green" };
  }

  function calQuickLink(label, view, iconSvg) {
    var b = el("button", "cal-quick");
    b.type = "button";
    b.innerHTML = '<span class="cal-quick-icon">' + iconSvg + '</span><span class="cal-quick-label">' + label + '</span>';
    b.addEventListener("click", function () {
      if (window.CalNav) window.CalNav.setView(view);
      if (window.App && window.App.go) window.App.go("calendar");
    });
    return b;
  }

  function renderDashboardArea(today) {
    var wrap = el("div", "dashboard-area");

    // Quick jumps into the calendar (My Day / Week).
    var quick = el("div", "cal-quicklinks");
    quick.appendChild(calQuickLink("All", "agenda",
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>'));
    quick.appendChild(calQuickLink("Week", "week",
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4M8.5 13h0M12 13h0M15.5 13h0"/></svg>'));
    quick.appendChild(calQuickLink("History", "history",
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 4v4h4"/><path d="M12 8v4l3 2"/></svg>'));
    wrap.appendChild(quick);

    var rowsWrap = el("div", "tile-rows");

    // Radar moved out of the main tile grid (was too prominent) — it now
    // lives in a compact strip below, quiet unless something is urgent.
    var sections = [
      { key: "tasks", label: "Tasks", icon: ICON_TASKS, badge: taskBadge(today),
        build: function (c) { buildTasksBody(c, today); } },
      { key: "projects", label: "Projects", icon: ICON_PROJECTS, badge: projectBadge(today),
        build: function (c) { buildProjectsBody(c, today); } },
      { key: "backlog", label: "Backlog", icon: ICON_BACKLOG, badge: backlogBadge(),
        build: function (c) { buildBacklogBody(c); } }
    ];

    // Remember which tile is open across re-renders (a detail-sheet edit
    // re-renders Today; the open tile must not snap shut).
    var openKey = sessionStorage.getItem(k("dashOpen")) || null;
    if (openKey && !sections.some(function (s) { return s.key === openKey; })) openKey = null;
    var tileEls = {};
    var anchorEls = {}; // key -> element after which the accordion should sit
    var accordionEl = el("div", "accordion-body");

    function renderAccordionContent() {
      accordionEl.innerHTML = "";
      if (!openKey) return;
      var sec = sections.filter(function (s) { return s.key === openKey; })[0];
      var card = el("div", "accordion-card");
      card.appendChild(el("div", "accordion-card-title", sec.label));
      sec.build(card);
      accordionEl.appendChild(card);
    }

    function placeAccordion() {
      if (accordionEl.parentNode) accordionEl.parentNode.removeChild(accordionEl);
      if (!openKey) return;
      var anchor = anchorEls[openKey];
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(accordionEl, anchor.nextSibling);
    }

    function setOpen(key) {
      openKey = (openKey === key) ? null : key;
      try {
        if (openKey) sessionStorage.setItem(k("dashOpen"), openKey);
        else sessionStorage.removeItem(k("dashOpen"));
      } catch (e) {}
      Object.keys(tileEls).forEach(function (k) {
        tileEls[k].classList.toggle("tile-active", k === openKey);
      });
      renderAccordionContent();
      placeAccordion();
    }

    appendUrgentCards(rowsWrap); // static cards, own row each, no accordion

    // Tasks · Projects · Backlog sit three-across in one row; the accordion
    // for whichever tile is open drops in below the whole row.
    var PER_ROW = 3;
    var rowBuf = [];
    function flushRow() {
      if (rowBuf.length === 0) return;
      var row = el("div", "tile-row tile-row-" + rowBuf.length);
      rowBuf.forEach(function (b) { row.appendChild(b.el); });
      rowsWrap.appendChild(row);
      rowBuf.forEach(function (b) { anchorEls[b.key] = row; });
      rowBuf = [];
    }
    sections.forEach(function (s) {
      var t = tile(s.key, s.label, s.icon, s.badge, function () { setOpen(s.key); });
      tileEls[s.key] = t;
      rowBuf.push({ key: s.key, el: t });
      if (rowBuf.length === PER_ROW) flushRow();
    });
    flushRow();

    // Restore a previously-open tile (survives detail-sheet re-renders).
    if (openKey && tileEls[openKey]) {
      tileEls[openKey].classList.add("tile-active");
      renderAccordionContent();
      placeAccordion();
    }

    wrap.appendChild(rowsWrap);
    wrap.appendChild(renderGymStatus());
    appendRadarStrip(wrap, today);
    return wrap;
  }

  // Compact, de-emphasized radar: a single quiet line unless there's an open
  // follow-up or a deadline within 7 days, in which case it turns urgent
  // (red) and can be expanded inline.
  function appendRadarStrip(wrap, today) {
    var radar = today.radar;
    if (!radar) return;
    var openTasks = radarOpenTasks().length;
    var soonDays = radarNearestDays(radar);
    var urgent = (openTasks > 0) || (soonDays !== null && soonDays <= radarCfg().soon);

    // Name the nearest deadline instead of the bare "77d to nearest deadline"
    // — "77d · AI Act" tells you at a glance whether that number matters.
    var nearest = null;
    radarItemsList(radar).some(function (it) {
      if (!it.date) return false;
      var d = daysUntil(it.date);
      if (d >= 0) { nearest = { title: it.title, days: d }; return true; }
      return false;
    });

    var strip = el("div", "radar-strip" + (urgent ? " radar-strip-urgent" : ""));
    var head = el("button", "radar-strip-head");
    head.type = "button";
    var dot = el("span", "radar-dot" + (urgent ? " radar-dot-urgent" : ""));
    head.appendChild(dot);
    head.appendChild(el("span", "radar-strip-label", "Compliance radar"));
    var parts = [];
    if (openTasks > 0) parts.push(openTasks + " open task" + (openTasks === 1 ? "" : "s"));
    if (nearest) parts.push(nearest.days + "d · " + (nearest.title.length > 30 ? nearest.title.slice(0, 29) + "…" : nearest.title));
    var status = parts.length ? parts.join(" · ") : "nothing urgent";
    head.appendChild(el("span", "radar-strip-status", status));
    var chev = el("span", "radar-strip-chev", "›");
    head.appendChild(chev);
    strip.appendChild(head);

    var body = el("div", "radar-strip-body hidden");
    var built = false;
    var open = false;
    head.addEventListener("click", function () {
      open = !open;
      if (open && !built) { buildRadarBody(body, today); built = true; }
      body.classList.toggle("hidden", !open);
      strip.classList.toggle("radar-strip-open", open);
    });
    strip.appendChild(body);
    wrap.appendChild(strip);
  }

  // Optimistic status override (a status change made in the detail sheet shows
  // immediately, before the bridge writes it back to the vault).
  function localStatus(section, id, fallback) {
    try {
      var m = JSON.parse(localStorage.getItem(k("itemstatus"))) || {};
      return m[section + ":" + id] || fallback;
    } catch (e) { return fallback; }
  }

  function subtaskProgress(id) {
    try {
      var m = JSON.parse(localStorage.getItem(k("subtasks"))) || {};
      var list = m[id] || [];
      if (!list.length) return null;
      var done = list.filter(function (s) { return s.done; }).length;
      return done + "/" + list.length;
    } catch (e) { return null; }
  }

  // ---- notes footer ----
  // One button that collects EVERYTHING pending — every item note across
  // every section, plus any swipe decisions already made in Triage — using
  // the same DigestQueue builder Triage's own "Copy decisions" button uses.
  // Shown whenever there's anything at all to copy, not just when there
  // are notes, so it works as the single always-available collection point
  // the home screen is meant to be.

  var notesFooter = null;

  // Auto-sync: whenever Today renders with anything pending (decisions made
  // in Triage, or stray notes), quietly push it to Supabase — the bridge
  // files it into the vault. No buttons; the footer is just a status line.
  var autoSyncBusy = false;

  function updateNotesFooter() {
    if (!notesFooter) return;
    var pending = !!DigestQueue.build();
    if (pending && !autoSyncBusy && window.SB) {
      autoSyncBusy = true;
      notesFooter.classList.remove("hidden");
      notesFooter.textContent = "Syncing changes…";
      DigestSync.push(function (res) {
        autoSyncBusy = false;
        if (res && res.count) {
          notesFooter.textContent = "✓ Synced " + res.count + " to your vault";
          setTimeout(function () { notesFooter.classList.add("hidden"); }, 2500);
        } else if (res && res.error) {
          notesFooter.textContent = "Sync pending — will retry";
        } else {
          notesFooter.classList.add("hidden");
        }
      });
    } else if (!pending) {
      notesFooter.classList.add("hidden");
    }
  }

  function renderNotesFooter() {
    notesFooter = el("div", "notes-footer sync-status hidden");
    return notesFooter;
  }

  // render() can legitimately fire more than once in quick succession (App
  // re-runs it every time the Today tab is shown, so a fast tab-switch or a
  // slow network can leave an older call's fetch still in flight when a
  // newer one starts). Each call stamps its own generation and the async
  // continuation checks it's still current before touching the DOM — an
  // older call's late-arriving fetch is discarded instead of duplicating
  // or clobbering whatever the newest render() already drew.
  var renderGeneration = 0;




  // ---- Gym status tile (Kangaroo) — added 2026-08-12; Supabase-backed --------
  // Shows each muscle coloured by how long since it was trained. DATA comes from
  // the shared kangaroo_state Supabase row (fetchAppState), so a change made in
  // the Kangaroo app shows here automatically — on any device — with a warm
  // localStorage cache for instant paint. The COLOURS/THRESHOLDS/LABELS below are
  // copied verbatim from the Kangaroo bundle's recovery scale and live in this
  // one GYM_RECOVERY constant; keep them in sync if the app's scale ever changes.
  // fetchAppState is generic on purpose — future home tiles for the other utility
  // apps (wine, notesprint, chord, birds) reuse it with their own *_state table.
  var GYM_RECOVERY = {
    buckets: [
      { max: 2, cls: "recent", color: "#8ccf48", label: "0–2 days" },
      { max: 4, cls: "warning", color: "#f1b84a", label: "3–4 days" },
      { max: Infinity, cls: "overdue", color: "#f26f54", label: "5+ days" }
    ],
    never: { cls: "never", color: "#c4c8c2", label: "No history" }
  };

  function gymKangarooPrefix() { return (window.DD_ENV && DD_ENV.sandbox) ? "sbx:" : "dd:"; }
  function gymHistoryKey() { return gymKangarooPrefix() + "kangaroo-history"; }

  // Same day math the app uses: local Y/M/D pinned to a UTC midnight index.
  function gymDayIndex(d) { return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); }
  function gymDaysSince(iso) {
    if (!iso) return null;
    var d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return gymDayIndex(new Date()) - gymDayIndex(d);
  }
  function gymBucket(days) {
    if (days === null) return GYM_RECOVERY.never;
    for (var i = 0; i < GYM_RECOVERY.buckets.length; i++) {
      if (days <= GYM_RECOVERY.buckets[i].max) return GYM_RECOVERY.buckets[i];
    }
    return GYM_RECOVERY.buckets[GYM_RECOVERY.buckets.length - 1];
  }

  // Generic: read the current user's row from any "<app>_state" table, hand back
  // its `data` object (or null). Reused by every future home tile.
  function fetchAppState(table, cb) {
    if (!window.SB) { cb(null); return; }
    try {
      window.SB.auth.getSession().then(function (res) {
        var s = res && res.data && res.data.session;
        if (!s || !s.user) { cb(null); return; }
        window.SB.from(table).select("data").eq("user_id", s.user.id).then(function (r) {
          if (r && r.error) { cb(null); return; }
          var row = r && r.data && r.data.length ? r.data[0] : null;
          cb(row && row.data ? row.data : null);
        }, function () { cb(null); });
      }, function () { cb(null); });
    } catch (e) { cb(null); }
  }

  function readGymCache() {
    try { return JSON.parse(localStorage.getItem(gymHistoryKey()) || "null"); } catch (e) { return null; }
  }
  function writeGymCache(hist) {
    try { localStorage.setItem(gymHistoryKey(), JSON.stringify(hist)); } catch (e) {}
  }

  function gymLegend() {
    var lg = el("div", "gym-legend");
    var order = GYM_RECOVERY.buckets.concat([GYM_RECOVERY.never]);
    order.forEach(function (b) {
      var span = document.createElement("span");
      var dot = document.createElement("i");
      dot.style.background = b.color;
      span.appendChild(dot);
      span.appendChild(document.createTextNode(b.label));
      lg.appendChild(span);
    });
    return lg;
  }

  function paintGym(body, hist) {
    body.innerHTML = "";
    if (!hist || typeof hist !== "object" || !Object.keys(hist).length) {
      body.appendChild(el("div", "gym-empty", "No workouts logged yet. Open the tracker to start."));
      body.appendChild(gymLegend());
      return;
    }
    var items = Object.keys(hist).map(function (m) {
      var days = gymDaysSince(hist[m]);
      return { m: m, days: days, sort: days === null ? Infinity : days };
    }).sort(function (a, b) { return b.sort - a.sort; });

    var chips = el("div", "gym-chips");
    items.forEach(function (it) {
      var b = gymBucket(it.days);
      var chip = el("span", "gym-chip", it.m);
      chip.style.background = b.color;
      chip.title = it.days === null ? "No history" : (it.days + "d since trained");
      chips.appendChild(chip);
    });
    body.appendChild(chips);
    body.appendChild(gymLegend());
  }

  function renderGymStatus() {
    var wrap = el("section", "gym-tile");
    var head = el("div", "gym-tile-head");
    head.appendChild(el("div", "gym-tile-title", "Gym status"));
    var open = document.createElement("a");
    open.className = "gym-open";
    open.href = "kangaroo/";
    open.title = "Open Kangaroo";
    open.setAttribute("aria-label", "Open Kangaroo gym");
    open.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>';
    head.appendChild(open);
    wrap.appendChild(head);

    var body = el("div", "gym-body");
    wrap.appendChild(body);

    var cached = readGymCache();
    if (cached) paintGym(body, cached);
    else body.appendChild(el("div", "gym-loading", "Loading gym status…"));

    fetchAppState("kangaroo_state", function (data) {
      var hist = data ? (data[gymHistoryKey()] || null) : null;
      if (hist) { writeGymCache(hist); paintGym(body, hist); }
      else if (!cached) paintGym(body, null);
    });
    return wrap;
  }

  function render() {
    var myGeneration = ++renderGeneration;
    view.innerHTML = "";
    view.appendChild(renderHero(myGeneration));
    view.appendChild(renderEventsTile());
    view.appendChild(renderAttentTile());

    fetch("feed.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (json) {
        if (myGeneration !== renderGeneration) return;
        var vaultCard = renderVaultNote(json);
        if (vaultCard) view.appendChild(vaultCard);
        var today = json && json.today;
        if (!today) {
          view.appendChild(el("p", "dash-empty", "No dashboard data in today's feed."));
          return;
        }
        view.appendChild(renderDashboardArea(today));
        view.appendChild(renderNotesFooter());
        updateNotesFooter();
      })
      .catch(function () {
        if (myGeneration !== renderGeneration) return;
        view.appendChild(el("p", "dash-empty", "Could not load feed.json."));
      });
  }

  // Re-render every time the Today tab becomes active, not just once at
  // boot — the hero (and streak, and note buttons reflecting notes typed
  // in the Triage tab) need to reflect state changed elsewhere in the app
  // without a page reload. The accordion's open/closed state is local to
  // this render pass and simply resets to closed each time, which is fine
  // — there's no overlay to worry about leaving stuck open on another tab.
  // ---- sandbox-only: reset test data ----
  // Sandbox is for repeatedly testing the swipe deck, not for real triage —
  // so unlike the live app, decisions/hand-offs shouldn't just accumulate
  // and make cards vanish for good. This wipes every sbx.* key and reloads
  // fresh against the committed sandbox feed.json.
  //
  // Mounted once directly on document.body (not re-appended inside render())
  // so it sits fixed in the top-right corner across every tab and survives
  // scrolling — it used to live inside the scrollable Today view and would
  // scroll out of sight.
  function renderSandboxReset() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sandbox-reset-btn";
    btn.innerHTML = "\u21ba";
    btn.setAttribute("aria-label", "Reset sandbox data");
    btn.addEventListener("click", function () {
      if (!window.confirm("Reset all sandbox test data (decisions, notes, progress)? This only affects the sandbox, never the live app.")) return;
      Object.keys(localStorage).forEach(function (key) {
        if (key.indexOf(DD_ENV.ns) === 0) localStorage.removeItem(key);
      });
      window.location.reload();
    });
    return btn;
  }
  if (window.location && window.location.pathname.indexOf("/sandbox/") !== -1) document.body.appendChild(renderSandboxReset());

  // Expose the shared task model + helpers so the Calendar tab can read and
  // edit the exact same chores/to-dos (single source of truth — the calendar
  // must not fork the data model or the recurrence math).
  window.DayModel = {
    moveTodosTo: moveTodosTo,
    moveTargets: moveTargets,
    loadTodos: loadTodos,
    saveTodos: saveTodos,
    logTodoHistory: logTodoHistory,
    unlogTodoHistory: unlogTodoHistory,
    loadChores: loadChores,
    saveChores: saveChores,
    removeChoreLogEntry: removeChoreLogEntry,
    choreProgress: choreProgress,
    choreNextDue: choreNextDue,
    choreOccursOn: choreOccursOn,
    setChoreDoneToday: setChoreDoneToday,
    addInterval: addInterval,
    nudgeToWeekday: nudgeToWeekday,
    freqLabel: freqLabel,
    localDateStr: localDateStr,
    WEEKDAY_NAMES: WEEKDAY_NAMES,
    toast: toast,
    // for wakeup.js (+ ItemUI): priority predicate, due lists, greeting, and
    // the same weather fetch/cache as the mini weather tile
    isPrio: isPrio,
    overdueTodos: overdueTodos,
    dueTodayTodos: dueTodayTodos,
    moveTodosIn: moveTodosIn,
    newTodoId: newTodoId,
    greetingWord: greetingWord,
    weather: loadWeather,
    pickHourly: pickHourly,
    weatherInfo: weatherInfo,
    WEATHER_SLOTS: WEATHER_SLOTS
  };

  if (window.App && App.onShow) {
    App.onShow("today", render);
  }
  render();
})();
