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

    var hint = el("div", "done-hint", "everything syncs to your vault automatically");
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

  // ---- hero (greeting + loop/done card + mini weather tile) ----

  function renderHero(myGeneration) {
    var wrap = el("div", "home-hero");
    wrap.appendChild(renderHeader());

    var heroRow = el("div", "hero-row");
    var mwt = renderMiniWeatherTile();
    heroRow.appendChild(mwt.el);
    var step = DigestLoop.getStep();
    heroRow.appendChild(step === "done" ? renderDoneCard() : renderLoopCard(step));
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
    try { return !!(JSON.parse(localStorage.getItem("sbx.removed")) || {})[id]; }
    catch (e) { return false; }
  }

  function buildTasksBody(container, today) {
    var tasks = (today.tasks || []).filter(function (t) { return !isRemoved(t.id); });
    if (tasks.length === 0) {
      container.appendChild(el("p", "dash-empty", "No suggestions today."));
      return;
    }
    var list = el("ul", "dash-list");
    tasks.forEach(function (t) { list.appendChild(taskRow(t)); });
    container.appendChild(list);
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
    var projects = (today.projects || []).filter(function (p) { return !isRemoved(p.id); });
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
    var li = el("div", "dash-item dash-item-tap");
    var row = el("div", "dl-row");
    var badgeClass = days <= 7 ? "dl-soon" : (days <= 30 ? "dl-near" : "dl-far");
    row.appendChild(el("span", "dl-days " + badgeClass, days < 0 ? "past" : days + "d"));
    row.appendChild(el("span", "dl-label", d.label));
    row.appendChild(el("span", "dash-date", d.date));
    row.appendChild(el("span", "dash-chev", "›"));
    li.appendChild(row);
    li.addEventListener("click", function () {
      if (window.ItemDetail) {
        ItemDetail.open({ id: itemId, title: d.label, hint: d.date, status: localStatus("radar", itemId, "open") }, "radar");
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

  var CHORES_KEY = "sbx.chores";
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
      dueToday: dueToday, overdue: overdue, notStarted: notStarted, expired: expired
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
      dueSoon: dueSoon, notStarted: notStarted, expired: expired
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

  var TODOS_KEY = "sbx.todos";
  var TODO_HISTORY_KEY = "sbx.todos.history";

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
  function logTodoHistory(text) {
    var list = loadTodoHistory();
    list.push({ text: text, date: new Date().toISOString() });
    saveTodoHistory(list);
  }
  function todoHistoryEntries() {
    return loadTodoHistory()
      .slice()
      .sort(function (a, b) { return new Date(b.date) - new Date(a.date); })
      .slice(0, 30);
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
      var nowDone = false;
      if (fresh) {
        fresh.done = !fresh.done;
        nowDone = fresh.done;
        if (fresh.done) logTodoHistory(fresh.text);
      }
      saveTodos(list);
      if (nowDone && window.FX) { window.FX.celebrate(checkBtn); window.FX.ding(); }
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
  function appendUrgentCards(container) {
    if (!window.ItemUI || !window.DayModel) return;
    var chores = dueSoonChores();
    var todos = dueTodayTodos();
    if (!chores.length && !todos.length) return;
    container.appendChild(el("div", "home-today-head", "Needs doing"));
    var list = el("div", "cal-item-list home-today-list");
    var today = localDateStr();
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

  function renderDashboardArea(today) {
    var wrap = el("div", "dashboard-area");
    var rowsWrap = el("div", "tile-rows");

    // Radar moved out of the main tile grid (was too prominent) — it now
    // lives in a compact strip below, quiet unless something is urgent.
    var sections = [
      { key: "tasks", label: "Tasks", icon: ICON_TASKS, badge: taskBadge(today),
        build: function (c) { buildTasksBody(c, today); } },
      { key: "projects", label: "Projects", icon: ICON_PROJECTS, badge: projectBadge(today),
        build: function (c) { buildProjectsBody(c, today); } }
    ];

    // Remember which tile is open across re-renders (a detail-sheet edit
    // re-renders Today; the open tile must not snap shut).
    var openKey = sessionStorage.getItem("sbx.dashOpen") || null;
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
        if (openKey) sessionStorage.setItem("sbx.dashOpen", openKey);
        else sessionStorage.removeItem("sbx.dashOpen");
      } catch (e) {}
      Object.keys(tileEls).forEach(function (k) {
        tileEls[k].classList.toggle("tile-active", k === openKey);
      });
      renderAccordionContent();
      placeAccordion();
    }

    appendUrgentCards(rowsWrap); // static cards, own row each, no accordion

    var pendingTile = null;
    function flushPending() {
      if (!pendingTile) return;
      rowsWrap.appendChild(pendingTile.el);
      anchorEls[pendingTile.key] = pendingTile.el;
      pendingTile = null;
    }

    sections.forEach(function (s) {
      var t = tile(s.key, s.label, s.icon, s.badge, function () { setOpen(s.key); });
      tileEls[s.key] = t;
      if (pendingTile) {
        var row = el("div", "tile-row");
        row.appendChild(pendingTile.el);
        row.appendChild(t);
        rowsWrap.appendChild(row);
        anchorEls[pendingTile.key] = row;
        anchorEls[s.key] = row;
        pendingTile = null;
      } else {
        pendingTile = { key: s.key, el: t };
      }
    });
    flushPending();

    // Restore a previously-open tile (survives detail-sheet re-renders).
    if (openKey && tileEls[openKey]) {
      tileEls[openKey].classList.add("tile-active");
      renderAccordionContent();
      placeAccordion();
    }

    wrap.appendChild(rowsWrap);
    appendRadarStrip(wrap, today);
    return wrap;
  }

  // Compact, de-emphasized radar: a single quiet line unless there's an open
  // follow-up or a deadline within 7 days, in which case it turns urgent
  // (red) and can be expanded inline.
  function appendRadarStrip(wrap, today) {
    var radar = today.radar;
    if (!radar) return;
    var soonDays = (radar.deadlines && radar.deadlines.length) ? daysUntil(radar.deadlines[0].date) : null;
    var urgent = (radar.follow_ups > 0) || (soonDays !== null && soonDays <= 7);

    var strip = el("div", "radar-strip" + (urgent ? " radar-strip-urgent" : ""));
    var head = el("button", "radar-strip-head");
    head.type = "button";
    var dot = el("span", "radar-dot" + (urgent ? " radar-dot-urgent" : ""));
    head.appendChild(dot);
    head.appendChild(el("span", "radar-strip-label", "Compliance radar"));
    var status = urgent
      ? (radar.follow_ups > 0
          ? radar.follow_ups + " follow-up" + (radar.follow_ups === 1 ? "" : "s")
          : soonDays + "d to a deadline")
      : "nothing urgent";
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
      var m = JSON.parse(localStorage.getItem("sbx.itemstatus")) || {};
      return m[section + ":" + id] || fallback;
    } catch (e) { return fallback; }
  }

  function subtaskProgress(id) {
    try {
      var m = JSON.parse(localStorage.getItem("sbx.subtasks")) || {};
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

  function render() {
    var myGeneration = ++renderGeneration;
    view.innerHTML = "";
    view.appendChild(renderHero(myGeneration));

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
        if (key.indexOf("sbx.") === 0) localStorage.removeItem(key);
      });
      window.location.reload();
    });
    return btn;
  }
  document.body.appendChild(renderSandboxReset());

  // Expose the shared task model + helpers so the Calendar tab can read and
  // edit the exact same chores/to-dos (single source of truth — the calendar
  // must not fork the data model or the recurrence math).
  window.DayModel = {
    loadTodos: loadTodos,
    saveTodos: saveTodos,
    logTodoHistory: logTodoHistory,
    loadChores: loadChores,
    saveChores: saveChores,
    choreProgress: choreProgress,
    choreNextDue: choreNextDue,
    choreOccursOn: choreOccursOn,
    setChoreDoneToday: setChoreDoneToday,
    addInterval: addInterval,
    nudgeToWeekday: nudgeToWeekday,
    freqLabel: freqLabel,
    localDateStr: localDateStr,
    WEEKDAY_NAMES: WEEKDAY_NAMES,
    toast: toast
  };

  if (window.App && App.onShow) {
    App.onShow("today", render);
  }
  render();
})();
