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

  // ---- progress ring (small SVG, used on the loop card) ----

  function progressRing(fraction, label) {
    var r = 18, c = Math.round(2 * Math.PI * r);
    var offset = Math.round(c * (1 - fraction));
    var wrap = document.createElement("div");
    wrap.className = "ring";
    wrap.innerHTML =
      '<svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">' +
        '<circle cx="22" cy="22" r="' + r + '" fill="none" stroke="var(--border)" stroke-width="4"/>' +
        '<circle cx="22" cy="22" r="' + r + '" fill="none" stroke="var(--keep)" stroke-width="4" ' +
          'stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + offset + '" ' +
          'transform="rotate(-90 22 22)"/>' +
      '</svg>' +
      '<span class="ring-label">' + label + '</span>';
    return wrap;
  }

  // ---- loop card (not-started / in-progress) ----

  function renderLoopCard(step) {
    var card = document.createElement("button");
    card.type = "button";
    card.className = "loop-card";

    var fraction = step === "triage" ? 1 / 3 : step === "practice" ? 2 / 3 : 0;
    var label = step === "triage" ? "1/3" : step === "practice" ? "2/3" : "0/3";
    card.appendChild(progressRing(fraction, label));

    var text = el("div", "loop-card-text");
    text.appendChild(el("div", "loop-card-title", "Morning loop"));
    var sub = step === "triage" ? "Continue: Triage →" :
      step === "practice" ? "Continue: Practice →" : "Start today's loop →";
    text.appendChild(el("div", "loop-card-sub", sub));
    card.appendChild(text);

    card.addEventListener("click", function () { App.go(step === "practice" ? "practice" : "triage"); });
    return card;
  }

  // ---- done card (celebratory, replaces the loop card once finished) ----

  function renderDoneCard() {
    var card = el("div", "done-card");

    var badge = el("div", "done-badge");
    badge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
    card.appendChild(badge);

    card.appendChild(el("div", "done-title", "Done for today"));

    var d = DigestQueue.pendingDecisions();
    var countsText = (d.keep.length + d.dismiss.length) > 0
      ? d.keep.length + " keep · " + d.dismiss.length + " dismiss"
      : (DigestLoop.getCompletedDate() ? "Completed " + DigestLoop.getCompletedDate() : "Completed");
    card.appendChild(el("div", "done-counts", countsText));

    var streak = DigestLoop.getStreak();
    if (streak > 1) {
      var streakEl = el("div", "streak-chip");
      streakEl.innerHTML = '<svg class="streak-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a6.5 6.5 0 1 1-13 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>';
      var streakLabel = document.createElement("span");
      streakLabel.textContent = streak + " day streak";
      streakEl.appendChild(streakLabel);
      card.appendChild(streakEl);
    }

    var copyBtn = el("button", "btn btn-primary done-copy-btn");
    copyBtn.type = "button";
    copyBtn.innerHTML = '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg><span>Copy queue</span>';
    copyBtn.addEventListener("click", function () {
      var queue = DigestQueue.build();
      if (!queue) { toast("Nothing to copy yet"); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(queue.text).then(function () {
          var msg = "Copied " + queue.decisionCount + " decision" + (queue.decisionCount === 1 ? "" : "s");
          if (queue.noteCount > 0) msg += " + " + queue.noteCount + " note" + (queue.noteCount === 1 ? "" : "s");
          toast(msg + " — paste to Claude");
        }, function () { toast("Copy failed — clipboard blocked"); });
      } else {
        toast("Clipboard not available");
      }
    });
    card.appendChild(copyBtn);

    var hint = el("div", "done-hint", "paste in Claude — cards get cleared up");
    card.appendChild(hint);

    var againBtn = el("button", "btn btn-undo done-again-btn", "Do it again");
    againBtn.type = "button";
    againBtn.addEventListener("click", function () {
      DigestLoop.clearStep();
      App.go("triage");
      render();
    });
    card.appendChild(againBtn);

    return card;
  }

  function renderHero() {
    var wrap = el("div", "home-hero");
    wrap.appendChild(renderHeader());
    var step = DigestLoop.getStep();
    wrap.appendChild(step === "done" ? renderDoneCard() : renderLoopCard(step));
    return wrap;
  }

  // ---- shared row helpers (used inside sheet bodies) ----

  function chip(status) {
    return el("span", "chip chip-" + status, status);
  }

  // A "+N more" disclosure: renders `primary` rows straight into `container`,
  // and tucks `rest` behind a small toggle so a long list doesn't dominate
  // the sheet by default. `rowFn` builds one row's DOM for a given item.
  // `moreLabel` lets a caller say "+6 more days" instead of the generic
  // "+6 more" (defaults to "more" so every existing call site is unchanged).
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

  function taskRow(t) {
    var li = el("li", "dash-item");
    var row = el("div", "dash-row");
    row.appendChild(chip(t.status));
    row.appendChild(el("span", "dash-item-title", t.title));
    var nc = noteControl("tasks", t.id, "Note on “" + t.title + "” — collected with your decisions.");
    row.appendChild(nc.btn);
    li.appendChild(row);
    var sub = [t.detail, t.hint].filter(Boolean).join(" · ");
    if (sub) li.appendChild(el("div", "dash-hint", sub));
    li.appendChild(nc.textarea);
    return li;
  }

  function buildTasksBody(container, today) {
    var tasks = today.tasks || [];
    if (tasks.length === 0) {
      container.appendChild(el("p", "dash-empty", "No suggestions today."));
      return;
    }
    var list = el("ul", "dash-list");
    tasks.forEach(function (t) { list.appendChild(taskRow(t)); });
    container.appendChild(list);
  }

  function projectRow(p) {
    var li = el("div", "dash-item");
    var row = el("div", "dash-row project-row" + (p.status === "active" ? "" : " project-dim"));
    row.appendChild(chip(p.status));
    row.appendChild(el("span", "dash-item-title", p.title));
    if (p.updated) row.appendChild(el("span", "dash-date", p.updated));
    var nc = noteControl("projects", p.id, "Note on “" + p.title + "” — collected with your decisions.");
    row.appendChild(nc.btn);
    li.appendChild(row);
    if (p.line && p.status === "active") li.appendChild(el("div", "dash-hint", p.line));
    li.appendChild(nc.textarea);
    return li;
  }

  function buildProjectsBody(container, today) {
    var projects = today.projects || [];
    if (projects.length === 0) {
      container.appendChild(el("p", "dash-empty", "No project data in feed."));
      return;
    }
    var order = { active: 0, paused: 1, "idea-stage": 2 };
    var sorted = projects.slice().sort(function (a, b) {
      return (order[a.status] || 0) - (order[b.status] || 0);
    });
    var primary = sorted.filter(function (p) { return p.status === "active"; });
    var rest = sorted.filter(function (p) { return p.status !== "active"; });
    if (primary.length === 0) { primary = sorted; rest = []; }
    collapsible(container, primary, rest, projectRow);
  }

  function daysUntil(dateStr) {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var target = new Date(dateStr + "T00:00:00");
    return Math.round((target - today) / 86400000);
  }

  var RADAR_VISIBLE_DEFAULT = 3;

  function deadlineRow(d) {
    var days = daysUntil(d.date);
    var itemId = d.id || slugify(d.date + "-" + d.label);
    var li = el("div", "dash-item");
    var row = el("div", "dl-row");
    var badgeClass = days <= 7 ? "dl-soon" : (days <= 30 ? "dl-near" : "dl-far");
    row.appendChild(el("span", "dl-days " + badgeClass, days < 0 ? "past" : days + "d"));
    row.appendChild(el("span", "dl-label", d.label));
    row.appendChild(el("span", "dash-date", d.date));
    var nc = noteControl("radar", itemId, "Note on “" + d.label + "” — collected with your decisions.");
    row.appendChild(nc.btn);
    li.appendChild(row);
    li.appendChild(nc.textarea);
    return li;
  }

  function buildRadarBody(container, today) {
    var radar = today.radar;
    if (!radar) {
      container.appendChild(el("p", "dash-empty", "No radar data in feed."));
      return;
    }
    var meta = el("div", "dash-meta");
    var followUps = radar.follow_ups || 0;
    meta.textContent = "updated " + (radar.updated || "?") + " · " +
      followUps + " follow-up" + (followUps === 1 ? "" : "s") + " open";
    container.appendChild(meta);

    if (radar.headline) container.appendChild(el("p", "radar-headline", radar.headline));

    var deadlines = radar.deadlines || [];
    var primary = deadlines.slice(0, RADAR_VISIBLE_DEFAULT);
    var rest = deadlines.slice(RADAR_VISIBLE_DEFAULT);
    collapsible(container, primary, rest, deadlineRow);
  }

  // ---- weather (Open-Meteo, fetched client-side — no API key, no backend) ----
  // Hardcoded to one location since this is a single-user app with no
  // settings UI. Cached in localStorage for 20 minutes so switching back to
  // the Today tab repeatedly doesn't refetch every time.

  var WEATHER_LAT = 52.10525390586172;
  var WEATHER_LON = 5.092251555678848;
  var WEATHER_CACHE_KEY = "sbx.weather.cache";
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
  // Tile identity icon (always the same, regardless of current condition —
  // matches how the Tasks/Projects/Radar tile icons work).
  var ICON_WEATHER =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="7.5" cy="7.5" r="3"/><path d="M7.5 2.5v1.4M2.5 7.5h1.4M3.9 3.9l1 1M11.1 3.9l-1 1"/>' +
    '<path d="M9.5 20h7a3.5 3.5 0 0 0 .4-6.98A5 5 0 0 0 7.6 13.9 3 3 0 0 0 9.5 20Z"/></svg>';

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
  // weather (matching today's hourly readings) and the to-dos feature
  // (due-date math). Named "day", not "dd" — the sandbox transform's sed
  // pass blindly rewrites the localStorage-key prefix pattern to "sbx"
  // wherever it appears, and a local var literally named "dd" followed by
  // a dot collides with that same pattern and gets mangled too. Learned
  // this the hard way once.
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

  // Fills the strip of 3 icon+temp readings shown directly on the tile
  // face (not hidden behind a tap) — the tile itself IS the at-a-glance
  // weather view; tapping it opens the same detail accordion as before
  // (condition labels + the "+more days" forecast).
  function fillWeatherStrip(container, weatherState) {
    container.innerHTML = "";
    if (weatherState.status === "loading") {
      container.appendChild(el("span", "tile-weather-msg", "Loading…"));
      return;
    }
    if (weatherState.status !== "ready" || !weatherState.data) {
      container.appendChild(el("span", "tile-weather-msg", "Weather unavailable"));
      return;
    }
    try {
      var any = false;
      WEATHER_SLOTS.forEach(function (slot) {
        var reading = pickHourly(weatherState.data, slot.hour);
        if (!reading) return;
        any = true;
        var info = weatherInfo(reading.code);
        var slotEl = el("div", "tile-weather-slot");
        var iconWrap = el("span", "tws-icon");
        iconWrap.innerHTML = info.icon;
        slotEl.appendChild(iconWrap);
        slotEl.appendChild(el("span", "tws-temp", Math.round(reading.temp) + "°"));
        slotEl.appendChild(el("span", "tws-label", slot.label));
        container.appendChild(slotEl);
      });
      if (!any) container.appendChild(el("span", "tile-weather-msg", "Weather unavailable"));
    } catch (e) {
      container.innerHTML = "";
      container.appendChild(el("span", "tile-weather-msg", "Weather unavailable"));
    }
  }

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

  // ---- weekly chores (local-storage only — never touches the vault) ----
  // Recurring chores with a target frequency per week/month. Progress is a
  // list of completion timestamps; how many fall inside the *current*
  // period (this week/month) is compared against the target to draw the
  // tap-to-set dot counter and to decide whether a chore is "due soon"
  // (needs another completion within 2 days to stay on pace — instances
  // are assumed evenly spaced across the period, so this is an
  // approximation, not a real scheduler).

  var CHORES_KEY = "sbx.chores";

  var ICON_CHORES =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M14 4 6 20"/><path d="M14 4c2 0 4 1 4 3.5S16.5 11 14 11"/><path d="M4.5 20.5 6 20l6.5-13"/></svg>';

  function loadChores() {
    try { return JSON.parse(localStorage.getItem(CHORES_KEY) || "[]"); } catch (e) { return []; }
  }
  function saveChores(list) {
    try { localStorage.setItem(CHORES_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function periodStart(unit) {
    var now = new Date();
    if (unit === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
    var day = now.getDay(); // 0=Sun..6=Sat
    var diffToMonday = day === 0 ? -6 : 1 - day;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
  }

  function periodLengthDays(unit, start) {
    if (unit === "month") {
      var next = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      return Math.round((next - start) / 86400000);
    }
    return 7;
  }

  function choreProgress(chore) {
    var start = periodStart(chore.unit);
    var startMs = start.getTime();
    var log = chore.log || [];
    var done = log.filter(function (iso) { return new Date(iso).getTime() >= startMs; }).length;
    var lenDays = periodLengthDays(chore.unit, start);
    var perInstance = lenDays / chore.count;
    var complete = done >= chore.count;
    var deadlineOffset = Math.min(done + 1, chore.count) * perInstance;
    var deadline = new Date(startMs + deadlineOffset * 86400000);
    var daysUntilDue = Math.ceil((deadline - new Date()) / 86400000);
    return {
      done: done, target: chore.count, complete: complete,
      dueSoon: !complete && daysUntilDue <= 2, daysUntilDue: daysUntilDue
    };
  }

  // Sets how many completions count toward THIS period (0..chore.count),
  // adding "now" timestamps or trimming the most recent ones — history
  // from earlier periods is untouched. This is what makes the dot row
  // behave like a slider: tapping dot i sets the count to i+1 (or to i, if
  // that dot was already the last one filled — a toggle-off).
  function setChoreProgress(chore, newCount) {
    var start = periodStart(chore.unit);
    var startMs = start.getTime();
    var log = chore.log || [];
    var before = log.filter(function (iso) { return new Date(iso).getTime() < startMs; });
    var within = log.filter(function (iso) { return new Date(iso).getTime() >= startMs; });
    if (newCount > within.length) {
      for (var i = within.length; i < newCount; i++) within.push(new Date().toISOString());
    } else if (newCount < within.length) {
      within = within.slice(0, newCount);
    }
    chore.log = before.concat(within);
  }

  function freqLabel(chore) {
    return chore.count + "x / " + (chore.unit === "month" ? "month" : "week");
  }

  function dueSoonChores() {
    return loadChores()
      .map(function (c) { return { chore: c, progress: choreProgress(c) }; })
      .filter(function (x) { return x.progress.dueSoon; });
  }

  function choresBadge() {
    var n = dueSoonChores().length;
    return { text: n > 0 ? String(n) : "", cls: "tile-badge-red" };
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

    var progress = choreProgress(chore);
    var metaRow = el("div", "chore-meta-row");
    metaRow.appendChild(el("span", "chore-freq", freqLabel(chore)));
    if (progress.dueSoon) {
      metaRow.appendChild(el("span", "chore-due-chip", progress.daysUntilDue <= 0 ? "due now" : "due soon"));
    }
    row.appendChild(metaRow);

    var dotsWrap = el("div", "chore-dots");
    for (var i = 0; i < chore.count; i++) {
      (function (i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "chore-dot" + (i < progress.done ? " chore-dot-done" : "");
        dot.setAttribute("aria-label", chore.name + ": set " + (i + 1) + " of " + chore.count + " done");
        dot.addEventListener("click", function () {
          var freshList = loadChores();
          var freshChore = freshList.filter(function (c) { return c.id === chore.id; })[0];
          if (!freshChore) return;
          var target = (progress.done === i + 1) ? i : (i + 1);
          setChoreProgress(freshChore, target);
          saveChores(freshList);
          refresh(null);
        });
        dotsWrap.appendChild(dot);
      })(i);
    }
    row.appendChild(dotsWrap);
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
    var countSelect = document.createElement("select");
    countSelect.className = "field-select";
    for (var n = 1; n <= 7; n++) {
      var opt = document.createElement("option");
      opt.value = String(n);
      opt.textContent = n + "x";
      countSelect.appendChild(opt);
    }
    var unitSelect = document.createElement("select");
    unitSelect.className = "field-select";
    [["week", "per week"], ["month", "per month"]].forEach(function (pair) {
      var o = document.createElement("option");
      o.value = pair[0];
      o.textContent = pair[1];
      unitSelect.appendChild(o);
    });
    if (editing) { countSelect.value = String(editing.count); unitSelect.value = editing.unit; }
    freqRow.appendChild(countSelect);
    freqRow.appendChild(unitSelect);
    form.appendChild(freqRow);

    var actionsRow = el("div", "inline-form-row");
    var saveBtn = el("button", "btn btn-primary", editing ? "Save changes" : "+ Add chore");
    saveBtn.type = "button";
    saveBtn.addEventListener("click", function () {
      var name = nameInput.value.trim();
      if (!name) { toast("Give the chore a name first"); return; }
      var count = parseInt(countSelect.value, 10);
      var unit = unitSelect.value;
      var list = loadChores();
      if (editing) {
        list = list.map(function (c) {
          return c.id === editing.id ? { id: c.id, name: name, count: count, unit: unit, log: c.log || [] } : c;
        });
      } else {
        list.push({
          id: "chore-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
          name: name, count: count, unit: unit, log: []
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
        var listWrap = el("div", "chore-list");
        list.forEach(function (chore) { listWrap.appendChild(choreRow(chore, rerender)); });
        container.appendChild(listWrap);
      }
      var editing = editingId ? list.filter(function (c) { return c.id === editingId; })[0] || null : null;
      buildChoreForm(container, function () { rerender(null); }, editing);
    }

    rerender(null);
  }

  // ---- one-off to-dos (local-storage only) ----
  // A lightweight separate notepad-with-checkboxes for "have to do this
  // today, but not worth a proper Tasks note in the wiki" — distinct from
  // the vault-backed Tasks section above; nothing here ever syncs anywhere.

  var TODOS_KEY = "sbx.todos";

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
  }

  function dueTodayTodos() {
    var today = localDateStr();
    return loadTodos().filter(function (t) { return !t.done && t.dueDate && t.dueDate <= today; });
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
      if (fresh) fresh.done = !fresh.done;
      saveTodos(list);
      refresh();
    });
    row.appendChild(checkBtn);

    var textWrap = el("div", "todo-text-wrap");
    textWrap.appendChild(el("div", "todo-text" + (t.done ? " todo-text-done" : ""), t.text));
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
        return ad < bd ? -1 : ad > bd ? 1 : 0;
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
    }
    rerender();
  }

  // ---- urgent home-screen cards (chores due soon, to-dos due today) ----
  // Both surface directly on Today — not hidden behind a tap — as a
  // two-tile-width card with a one-tap checkbox, ahead of the regular tile
  // grid. Checking one off calls the top-level render(), which is safe
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

  function appendUrgentCards(grid) {
    dueSoonChores().forEach(function (x) {
      var sub = x.progress.daysUntilDue <= 0
        ? "Due now"
        : "Due in " + x.progress.daysUntilDue + " day" + (x.progress.daysUntilDue === 1 ? "" : "s");
      grid.appendChild(urgentCard(ICON_CHORES, x.chore.name, sub, function () {
        var list = loadChores();
        var fresh = list.filter(function (c) { return c.id === x.chore.id; })[0];
        if (!fresh) return;
        setChoreProgress(fresh, choreProgress(fresh).done + 1);
        saveChores(list);
        render();
      }));
    });
    dueTodayTodos().forEach(function (t) {
      grid.appendChild(urgentCard(ICON_TODOS, t.text, todoDueLabel(t), function () {
        var list = loadTodos();
        var fresh = list.filter(function (x) { return x.id === t.id; })[0];
        if (fresh) fresh.done = true;
        saveTodos(list);
        render();
      }));
    });
  }

  // ---- icon tiles + inline accordion ----
  // The dashboard used to show Tasks/Projects/Radar fully expanded, all at
  // once. That's now three big tappable icon tiles with a count badge each
  // — the home screen stays small by default, and tapping a tile expands
  // its content directly below the tile row (only one open at a time),
  // right in the page's own scroll. No overlay, so it can never cover the
  // tab bar, and there's no height cap — scrolling it is just scrolling
  // the page.

  var ICON_TASKS =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 10h8M8 14h5"/></svg>';
  var ICON_PROJECTS =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 7.5 12 4l8 3.5-8 3.5-8-3.5Z"/><path d="M4 12l8 3.5 8-3.5"/><path d="M4 16.5 12 20l8-3.5"/></svg>';
  var ICON_RADAR =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3"/></svg>';

  // Returns { el, setBadge } so a tile's badge can be updated later — the
  // weather tile's badge isn't known synchronously (it needs its own async
  // fetch), so it starts empty and fills in once that resolves.
  // opts.wide spans both grid columns (used by the Today/weather tile so
  // its 3-reading strip has room). opts.extraEl is appended below the
  // icon+label head — the weather strip lives there.
  function tile(key, label, iconSvg, badge, onToggle, opts) {
    opts = opts || {};
    var t = document.createElement("button");
    t.type = "button";
    t.className = "tile tile-" + key + (opts.wide ? " tile-wide" : "");
    var badgeEl = el("span", "tile-badge " + badge.cls + (badge.text ? "" : " hidden"), badge.text);
    t.appendChild(badgeEl);
    var head = el("div", "tile-head");
    var iconWrap = el("div", "tile-icon");
    iconWrap.innerHTML = iconSvg;
    head.appendChild(iconWrap);
    head.appendChild(el("span", "tile-label", label));
    t.appendChild(head);
    if (opts.extraEl) t.appendChild(opts.extraEl);
    t.addEventListener("click", onToggle);
    function setBadge(newBadge) {
      badgeEl.className = "tile-badge " + newBadge.cls + (newBadge.text ? "" : " hidden");
      badgeEl.textContent = newBadge.text;
    }
    return { el: t, setBadge: setBadge };
  }

  function taskBadge(today) {
    var n = (today.tasks || []).length;
    return { text: n > 0 ? String(n) : "", cls: "tile-badge-blue" };
  }

  function projectBadge(today) {
    var projects = today.projects || [];
    var active = projects.filter(function (p) { return p.status === "active"; }).length;
    var n = active > 0 ? active : projects.length;
    return { text: n > 0 ? String(n) : "", cls: "tile-badge-green" };
  }

  function radarBadge(today) {
    var radar = today.radar;
    if (!radar) return { text: "", cls: "tile-badge-gray" };
    if (radar.follow_ups > 0) return { text: String(radar.follow_ups), cls: "tile-badge-red" };
    if (radar.deadlines && radar.deadlines.length > 0) {
      var days = daysUntil(radar.deadlines[0].date);
      var text = days < 0 ? "past" : days + "d";
      var cls = days <= 7 ? "tile-badge-red" : days <= 30 ? "tile-badge-amber" : "tile-badge-gray";
      return { text: text, cls: cls };
    }
    return { text: "", cls: "tile-badge-gray" };
  }

  function renderDashboardArea(today, myGeneration) {
    var wrap = el("div", "dashboard-area");
    var grid = el("div", "tile-grid");
    var accordionBody = el("div", "accordion-body");

    var weatherState = { status: "loading", data: null };
    var weatherStripEl = el("div", "tile-weather-strip");
    fillWeatherStrip(weatherStripEl, weatherState);

    var sections = [
      { key: "weather", label: "Today", icon: ICON_WEATHER, badge: { text: "", cls: "tile-badge-gray" },
        build: function (c) { buildWeatherBody(c, weatherState); }, wide: true, extraEl: weatherStripEl },
      { key: "tasks", label: "Tasks", icon: ICON_TASKS, badge: taskBadge(today),
        build: function (c) { buildTasksBody(c, today); } },
      { key: "projects", label: "Projects", icon: ICON_PROJECTS, badge: projectBadge(today),
        build: function (c) { buildProjectsBody(c, today); } },
      { key: "radar", label: "Radar", icon: ICON_RADAR, badge: radarBadge(today),
        build: function (c) { buildRadarBody(c, today); } },
      { key: "chores", label: "Chores", icon: ICON_CHORES, badge: choresBadge(),
        build: function (c) { buildChoresBody(c); } },
      { key: "todos", label: "To-dos", icon: ICON_TODOS, badge: todosBadge(),
        build: function (c) { buildTodosBody(c); } }
    ];

    var openKey = null;
    var tileEls = {};

    appendUrgentCards(grid);

    function renderBody() {
      accordionBody.innerHTML = "";
      if (!openKey) return;
      var sec = sections.filter(function (s) { return s.key === openKey; })[0];
      var card = el("div", "accordion-card");
      card.appendChild(el("div", "accordion-card-title", sec.label));
      sec.build(card);
      accordionBody.appendChild(card);
    }

    function setOpen(key) {
      openKey = (openKey === key) ? null : key;
      Object.keys(tileEls).forEach(function (k) {
        tileEls[k].classList.toggle("tile-active", k === openKey);
      });
      renderBody();
    }

    sections.forEach(function (s) {
      var t = tile(s.key, s.label, s.icon, s.badge, function () { setOpen(s.key); },
        { wide: s.wide, extraEl: s.extraEl });
      tileEls[s.key] = t.el;
      grid.appendChild(t.el);
    });

    wrap.appendChild(grid);
    wrap.appendChild(accordionBody);

    // Weather has its own async fetch, independent of feed.json. Guarded by
    // the same render-generation token as the feed fetch, since it can
    // resolve after the user has already switched tabs (and this whole
    // dashboard-area is a detached, replaced element by then).
    loadWeather().then(function (data) {
      if (myGeneration !== renderGeneration) return;
      weatherState.status = "ready";
      weatherState.data = data;
      fillWeatherStrip(weatherStripEl, weatherState);
      if (openKey === "weather") renderBody();
    }).catch(function () {
      if (myGeneration !== renderGeneration) return;
      weatherState.status = "error";
      fillWeatherStrip(weatherStripEl, weatherState);
      if (openKey === "weather") renderBody();
    });

    return wrap;
  }

  // ---- notes footer ----
  // One button that collects EVERYTHING pending — every item note across
  // every section, plus any swipe decisions already made in Triage — using
  // the same DigestQueue builder Triage's own "Copy decisions" button uses.
  // Shown whenever there's anything at all to copy, not just when there
  // are notes, so it works as the single always-available collection point
  // the home screen is meant to be.

  var notesFooter = null;

  function updateNotesFooter() {
    if (!notesFooter) return;
    var hasQueue = !!DigestQueue.build();
    notesFooter.classList.toggle("hidden", !hasQueue);
  }

  function renderNotesFooter() {
    notesFooter = el("div", "notes-footer hidden");

    var copyBtn = el("button", "btn btn-ghost", "Copy queue");
    copyBtn.addEventListener("click", function () {
      var queue = DigestQueue.build();
      if (!queue) { toast("Nothing to copy yet"); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(queue.text).then(function () {
          var msg = "Copied " + queue.decisionCount + " decision" + (queue.decisionCount === 1 ? "" : "s");
          if (queue.noteCount > 0) msg += " + " + queue.noteCount + " note" + (queue.noteCount === 1 ? "" : "s");
          toast(msg + " — paste to Claude");
        }, function () {
          toast("Copy failed — clipboard blocked");
        });
      } else {
        toast("Clipboard not available");
      }
    });
    notesFooter.appendChild(copyBtn);

    var clearBtn = el("button", "btn btn-undo", "Clear notes");
    clearBtn.addEventListener("click", function () {
      DigestNotes.clearNotes();
      render();
      toast("Notes cleared");
    });
    notesFooter.appendChild(clearBtn);

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


  // ---- sandbox-only: reset test data ----
  // Sandbox is for repeatedly testing the swipe deck, not for real triage —
  // so unlike the live app, decisions/hand-offs shouldn't just accumulate
  // and make cards vanish for good. This wipes every sbx.* key and reloads
  // fresh against the committed sandbox feed.json.

  function renderSandboxReset() {
    var wrap = el("div", "sandbox-reset");
    var btn = el("button", "btn btn-ghost btn-reset-sandbox", "\u21ba Reset sandbox data");
    btn.addEventListener("click", function () {
      if (!window.confirm("Reset all sandbox test data (decisions, notes, progress)? This only affects the sandbox, never the live app.")) return;
      Object.keys(localStorage).forEach(function (key) {
        if (key.indexOf("sbx.") === 0) localStorage.removeItem(key);
      });
      window.location.reload();
    });
    wrap.appendChild(btn);
    return wrap;
  }

  function render() {
    var myGeneration = ++renderGeneration;
    view.innerHTML = "";
    view.appendChild(renderHero());
    view.appendChild(renderSandboxReset());

    fetch("feed.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (json) {
        if (myGeneration !== renderGeneration) return;
        var today = json && json.today;
        if (!today) {
          view.appendChild(el("p", "dash-empty", "No dashboard data in today's feed."));
          return;
        }
        view.appendChild(renderDashboardArea(today, myGeneration));
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
  if (window.App && App.onShow) {
    App.onShow("today", render);
  }
  render();
})();
