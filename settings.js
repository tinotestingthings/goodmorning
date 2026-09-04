(function () {
  "use strict";

  var root = document.getElementById("settingsView");
  if (!root) return;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function render() {
    if (!window.Theme) { root.innerHTML = ""; root.appendChild(el("p", "settings-sub", "Loading…")); return; }
    root.innerHTML = "";
    root.appendChild(el("h1", "settings-title", "Settings"));
    root.appendChild(el("p", "settings-sub", "Personalise how the app looks."));
    root.appendChild(buildAppearance());
    root.appendChild(buildCategories());
    root.appendChild(buildRadarThresholds());
    root.appendChild(buildNotifications());
    root.appendChild(buildPushAlerts());
    root.appendChild(buildSounds());
    root.appendChild(buildIcsFeeds());
    root.appendChild(buildAgendaTools());
    root.appendChild(buildReset());
    var ver = buildVersion();
    if (ver) root.appendChild(ver);
  }

  function toast(message) {
    var t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.textContent = message;
    t.classList.add("show");
    clearTimeout(t._hideTimer);
    t._hideTimer = setTimeout(function () { t.classList.remove("show"); }, 1900);
  }

  // ---- Agenda tools: share the gym plan ----
  // Scans the next 14 days of the agenda (to-dos + recurring chores) for
  // gym-ish items — by category name or item text — and copies a paste-ready
  // list of days/times, e.g. to plan sessions with friends.
  var GYM_RE = /(gym|fitness|sportschool|krachttraining|work\s?-?\s?out)/i;

  function gymScheduleText() {
    var M = window.DayModel;
    if (!M) return null;
    var catName = {};
    (window.Cats ? window.Cats.load() : []).forEach(function (c) { catName[c.id] = c.name || ""; });
    function isGym(text, catId) { return GYM_RE.test(text || "") || GYM_RE.test(catName[catId] || ""); }

    var todos = M.loadTodos(), chores = M.loadChores();
    var DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var now = new Date();
    var lines = [];
    for (var i = 0; i < 14; i++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      var ds = M.localDateStr(d);
      var times = [];
      todos.forEach(function (t) {
        if (t.done) return;
        var onDay = t.dueDate === ds || (t.endDate && t.dueDate && t.dueDate <= ds && ds <= t.endDate);
        if (!onDay || !isGym(t.text, t.category)) return;
        times.push(t.startTime ? t.startTime + (t.endTime ? "–" + t.endTime : "") : "");
      });
      chores.forEach(function (c) {
        if (!isGym(c.name, c.category)) return;
        // pattern chores answer choreOccursOn; legacy interval chores (no
        // startDate) always return false there — use their rolling next due
        if (c.startDate || c.pattern === "weekdays" || c.pattern === "monthly-nth") {
          if (M.choreOccursOn && M.choreOccursOn(c, d)) times.push("");
        } else if (M.choreProgress) {
          var nd = M.choreProgress(c).nextDue;
          if (nd && M.localDateStr(nd) === ds) times.push("");
        }
      });
      if (!times.length) continue;
      var when = times.filter(Boolean).join(", ");
      lines.push(DOW[(d.getDay() + 6) % 7] + " " + d.getDate() + " " + MON[d.getMonth()] + (when ? " — " + when : ""));
    }
    if (!lines.length) return null;
    return "My gym days (next 14 days):\n" + lines.join("\n");
  }

  function buildAgendaTools() {
    var sec = el("section", "settings-section");
    sec.appendChild(el("h2", null, "Agenda"));
    sec.appendChild(el("p", "settings-sub", "Copies the gym days and times found in the next 14 days of your agenda — paste it to whoever you train with."));
    var b = el("button", "btn btn-ghost", "Copy gym schedule (next 14 days)");
    b.type = "button";
    b.addEventListener("click", function () {
      var text = gymScheduleText();
      if (!text) { toast("No gym items found in the next 14 days"); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          toast("Copied " + (text.split("\n").length - 1) + " gym day(s)");
        }, function () { toast("Copy failed — clipboard blocked"); });
      } else toast("Clipboard not available");
    });
    sec.appendChild(b);
    return sec;
  }

  // Reset this device (2026-09-03): wipes every key in this environment's
  // namespace plus its offline shell cache + service worker, then reloads — a
  // fresh install. Synced data comes back on the next pull; agendasync's
  // shrink guard refuses to push the emptied state, so the server copy is
  // safe. Device-only settings are gone for real, hence the explicit text.
  // Only when signed in: without a session the local agenda IS the only copy.
  function buildReset() {
    var sec = el("section", "settings-section");
    sec.appendChild(el("h2", null, "Reset"));
    sec.appendChild(el("p", "settings-sub", "Clears this device's app data and cached app files, then reloads — like a fresh install. Your agenda, tasks, notes and theme come back from the server. Device-only settings (categories, subscribed calendars, reminders, push alerts) have to be set again."));
    var b = el("button", "btn btn-danger", "Reset this device\u2026");
    b.type = "button";
    function wipe() {
      if (!window.confirm("Reset this device? Local app data and cached files are cleared; synced data returns after the reload.")) return;
      Object.keys(localStorage).forEach(function (key) { if (key.indexOf(DD_ENV.ns) === 0) localStorage.removeItem(key); });
      var shell = DD_ENV.ns.slice(0, -1) + "-shell-";   // sw.js: "dd-shell-" / "sbx-shell-"
      var p = Promise.resolve();
      if (window.caches && caches.keys) {
        p = caches.keys().then(function (names) {
          return Promise.all(names.filter(function (n) { return n.indexOf(shell) === 0; }).map(function (n) { return caches.delete(n); }));
        });
      }
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
        p = p.then(function () { return navigator.serviceWorker.getRegistration(); })
          .then(function (reg) { return reg ? reg.unregister() : null; });
      }
      var reload = function () { window.location.reload(); };
      p.then(reload, reload);
    }
    b.addEventListener("click", function () {
      if (!window.SB || !window.SB.auth) { wipe(); return; }
      window.SB.auth.getSession().then(function (res) {
        if (res && res.data && res.data.session) wipe();
        else toast("Sign in first \u2014 otherwise this device's agenda is gone for good.");
      }, wipe);
    });
    sec.appendChild(b);
    return sec;
  }

  // Build stamp, only shown when env.js actually sets one.
  function buildVersion() {
    var v = window.DD_ENV && window.DD_ENV.version;
    if (!v) return null;
    var p = el("p", "settings-sub", "Version " + v);
    p.style.fontSize = "0.72rem";
    p.style.textAlign = "center";
    p.style.marginTop = "24px";
    p.style.marginBottom = "0";
    return p;
  }

  function buildIcsFeeds() {
    var sec = el("section", "settings-section");
    sec.appendChild(el("h2", null, "Subscribed calendars (.ics)"));
    sec.appendChild(el("p", "settings-sub", "Show a read-only calendar (holidays, another agenda). The calendar host must allow cross-origin access, or the browser will block it."));
    if (!window.Ics) { sec.appendChild(el("p", "settings-sub", "Not available.")); return sec; }
    var feeds = window.Ics.loadFeeds();
    feeds.forEach(function (url) {
      var row = el("div", "sched-row");
      var span = el("div", "ics-url", url);
      var del = el("button", "sched-del", "\u00d7"); del.type = "button";
      del.addEventListener("click", function () { window.Ics.removeFeed(url); render(); });
      row.appendChild(span); row.appendChild(del);
      sec.appendChild(row);
    });
    var addRow = el("div", "sched-row");
    var input = document.createElement("input");
    input.type = "url"; input.className = "field-input"; input.placeholder = "https://…/basic.ics or webcal://…";
    addRow.appendChild(input);
    var add = el("button", "btn btn-ghost", "Add"); add.type = "button";
    add.addEventListener("click", function () {
      var u = input.value.trim(); if (!u) return;
      window.Ics.addFeed(u);
      add.textContent = "Fetching…";
      window.Ics.refresh(function (res) {
        if (!res.ok) window.DayModel && window.DayModel.toast && window.DayModel.toast("Feed blocked or invalid — see note");
        render();
      });
    });
    addRow.appendChild(add);
    sec.appendChild(addRow);
    var refresh2 = el("button", "btn btn-ghost", "Refresh feeds"); refresh2.type = "button";
    refresh2.addEventListener("click", function () { refresh2.textContent = "Refreshing…"; window.Ics.refresh(function () { render(); }); });
    if (feeds.length) sec.appendChild(refresh2);
    return sec;
  }

  function buildSounds() {
    var sec = el("section", "settings-section");
    sec.appendChild(el("h2", null, "Sounds"));
    sec.appendChild(el("p", "settings-sub", "Play a little chime when you complete a task."));
    var on = window.FX ? window.FX.soundOn() : true;
    var seg = el("div", "seg");
    [["on", "On"], ["off", "Off"]].forEach(function (pair) {
      var active = (pair[0] === "on") === on;
      var b = el("button", "seg-btn" + (active ? " active" : ""), pair[1]);
      b.type = "button";
      b.addEventListener("click", function () {
        if (window.FX) { window.FX.setSound(pair[0] === "on"); if (pair[0] === "on") window.FX.ding(); }
        render();
      });
      seg.appendChild(b);
    });
    sec.appendChild(seg);
    return sec;
  }

  function buildCategories() {
    var sec = el("section", "settings-section");
    sec.appendChild(el("h2", null, "Categories"));
    var list = el("div", null);
    window.Cats.load().forEach(function (cat) {
      var row = el("div", "sched-row");
      var color = document.createElement("input");
      color.type = "color"; color.value = cat.color; color.className = "cat-color";
      color.addEventListener("change", function () { window.Cats.update(cat.id, name.value, color.value); });
      var name = document.createElement("input");
      name.type = "text"; name.value = cat.name; name.className = "field-input";
      name.addEventListener("change", function () { window.Cats.update(cat.id, name.value, color.value); });
      var del = el("button", "sched-del", "\u00d7"); del.type = "button";
      del.addEventListener("click", function () {
        // Safety: don't lose a category (and every item's colour) on a mis-tap.
        var used = 0;
        try {
          if (window.DayModel) {
            used = window.DayModel.loadTodos().filter(function (t) { return t.category === cat.id; }).length
                 + window.DayModel.loadChores().filter(function (c) { return c.category === cat.id; }).length;
          }
        } catch (e) {}
        var msg = 'Delete the category "' + cat.name + '"?'
          + (used > 0 ? "\n\n" + used + " item" + (used === 1 ? "" : "s") + " use it \u2014 they'll keep their data but lose this colour." : "")
          + "\n\nThis can't be undone.";
        if (typeof confirm === "function" && !confirm(msg)) return;
        window.Cats.remove(cat.id); render();
      });
      row.appendChild(color); row.appendChild(name); row.appendChild(del);
      list.appendChild(row);
    });
    sec.appendChild(list);
    var add = el("button", "btn btn-ghost", "+ Add category"); add.type = "button";
    add.addEventListener("click", function () { window.Cats.add("New", "#7f8a99"); render(); });
    sec.appendChild(add);
    return sec;
  }

  // Compliance-radar urgency thresholds. Mirrors home.js's radarCfg():
  // deadlines within "red" days paint red and make the strip urgent; within
  // "amber" days they paint amber. Stored in k("radar.cfg"), rides the sync.
  function buildRadarThresholds() {
    var sec = el("section", "settings-section");
    sec.appendChild(el("h2", null, "Compliance radar"));
    sec.appendChild(el("p", "settings-sub", "When a deadline counts as urgent. Synced across your devices."));
    var cfg = { soon: 7, near: 30 };
    try {
      var c = JSON.parse(localStorage.getItem(k("radar.cfg"))) || {};
      if (c.soon >= 1 && c.soon <= 365) cfg.soon = Math.round(c.soon);
      if (c.near >= 1 && c.near <= 365) cfg.near = Math.round(c.near);
    } catch (e) {}
    function save() {
      if (cfg.near < cfg.soon) cfg.near = cfg.soon;
      try { localStorage.setItem(k("radar.cfg"), JSON.stringify(cfg)); } catch (e) {}
      try { if (window.AgendaSync && window.AgendaSync.pushNow) window.AgendaSync.pushNow(); } catch (e) {}
      render();
    }
    function row(label, key) {
      var r = el("div", "sched-row");
      r.appendChild(el("span", "sched-at", label));
      var input = document.createElement("input");
      input.type = "number"; input.min = "1"; input.max = "365";
      input.className = "field-input field-input-narrow";
      input.value = String(cfg[key]);
      input.addEventListener("change", function () {
        var v = parseInt(input.value, 10);
        cfg[key] = (v >= 1 && v <= 365) ? v : cfg[key];
        save();
      });
      r.appendChild(input);
      r.appendChild(el("span", "sched-at", "days"));
      return r;
    }
    sec.appendChild(row("Red within", "soon"));
    sec.appendChild(row("Amber within", "near"));
    return sec;
  }

  function buildNotifications() {
    var sec = el("section", "settings-section");
    sec.appendChild(el("h2", null, "Reminders"));
    var supported = ("Notification" in window);
    var state = supported ? Notification.permission : "unsupported";
    var p = el("p", "settings-sub",
      state === "granted" ? "Reminders are on. A to-do with a reminder time will notify you while the app is open." :
      state === "denied" ? "Notifications are blocked in your browser settings — enable them there to use reminders." :
      state === "unsupported" ? "This browser doesn't support notifications." :
      "Turn on notifications to get reminders for timed to-dos (works while the app is open).");
    sec.appendChild(p);
    if (state === "default") {
      var btn = el("button", "btn btn-primary", "Enable reminders"); btn.type = "button";
      btn.addEventListener("click", function () {
        window.Reminders.requestPermission(function () { render(); });
      });
      sec.appendChild(btn);
    }
    return sec;
  }

  function buildPushAlerts() {
    var sec = el("section", "settings-section");
    sec.appendChild(el("h2", null, "New-news alerts"));
    if (!window.Push || !window.Push.supported()) {
      sec.appendChild(el("p", "settings-sub",
        "This browser can't do background push alerts. Add the app to your home screen (Install) and open it from there, then try again."));
      return sec;
    }
    sec.appendChild(el("p", "settings-sub",
      "Get a phone notification when new cards land in Triage — even when the app is closed."));

    var body = el("div", "push-body");
    sec.appendChild(body);

    function showSubscribed(subJson) {
      body.innerHTML = "";
      body.appendChild(el("p", "settings-sub",
        "Alerts are on. One-time setup: send this to Claude so it knows where to reach you — tap Copy, then paste it into a Claude chat."));
      var ta = document.createElement("textarea");
      ta.className = "note-input push-sub";
      ta.rows = 3;
      ta.readOnly = true;
      ta.value = JSON.stringify(subJson);
      body.appendChild(ta);
      var copy = el("button", "btn btn-primary", "Copy for Claude");
      copy.type = "button";
      copy.addEventListener("click", function () {
        var payload = "register my push subscription: " + JSON.stringify(subJson);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(payload).then(function () {
            copy.textContent = "Copied ✓";
            setTimeout(function () { copy.textContent = "Copy for Claude"; }, 1600);
          });
        }
      });
      body.appendChild(copy);
      var off = el("button", "btn btn-ghost", "Turn off alerts");
      off.type = "button";
      off.addEventListener("click", function () {
        off.textContent = "Turning off…";
        window.Push.unsubscribe(function () { render(); });
      });
      body.appendChild(off);
    }

    window.Push.getSubscription(function (existing) {
      if (existing) { showSubscribed(existing.toJSON ? existing.toJSON() : existing); return; }
      var btn = el("button", "btn btn-primary", "Turn on alerts");
      btn.type = "button";
      btn.addEventListener("click", function () {
        btn.textContent = "Enabling…";
        window.Push.subscribe(function (res) {
          if (res.subscription) {
            var sub = res.subscription.toJSON ? res.subscription.toJSON() : res.subscription;
            showSubscribed(sub);
          } else {
            btn.textContent = "Turn on alerts";
            body.appendChild(el("p", "settings-sub",
              res.error === "denied"
                ? "Permission denied — enable notifications for this app in your browser settings, then try again."
                : res.error === "unsupported"
                ? "Not supported here — install the app to your home screen first."
                : "Couldn't enable alerts (" + res.error + ")."));
          }
        });
      });
      body.appendChild(btn);
    });

    return sec;
  }

  function buildAppearance() {
    var s = window.Theme.get();
    var sec = el("section", "settings-section");
    sec.appendChild(el("h2", null, "Appearance"));

    // mode segmented control
    var seg = el("div", "seg");
    [["manual", "Single theme"], ["scheduled", "By time of day"]].forEach(function (pair) {
      var b = el("button", "seg-btn" + (s.mode === pair[0] ? " active" : ""), pair[1]);
      b.type = "button";
      b.addEventListener("click", function () {
        s.mode = pair[0];
        window.Theme.save(s);
        render();
      });
      seg.appendChild(b);
    });
    sec.appendChild(seg);

    if (s.mode === "manual") sec.appendChild(buildThemeGrid(s, s.theme, function (id) {
      s.theme = id; window.Theme.save(s); render();
    }));
    else sec.appendChild(buildSchedule(s));

    return sec;
  }

  function swatch(id, label, selected, onPick) {
    var b = el("button", "theme-swatch" + (selected ? " active" : ""));
    b.type = "button";
    b.setAttribute("data-theme", id); // scope theme vars to preview the palette
    var chip = el("div", "theme-chip");
    chip.style.background = "var(--bg)";
    chip.style.borderColor = "var(--border)";
    ["--accent", "--keep", "--skip"].forEach(function (v) {
      var dot = el("span", "theme-dot");
      dot.style.background = "var(" + v + ")";
      chip.appendChild(dot);
    });
    b.appendChild(chip);
    b.appendChild(el("div", "theme-swatch-label", label));
    b.addEventListener("click", function () { onPick(id); });
    return b;
  }

  function buildThemeGrid(s, current, onPick) {
    var grid = el("div", "theme-grid");
    window.Theme.list().forEach(function (t) {
      grid.appendChild(swatch(t.id, t.label, current === t.id, onPick));
    });
    return grid;
  }

  function buildSchedule(s) {
    var wrap = el("div", null);
    wrap.appendChild(el("p", "settings-sub", "Set switch points — the app uses whichever one most recently passed (wraps past midnight)."));

    (s.schedule || []).slice()
      .sort(function (a, b) { return a.time < b.time ? -1 : 1; })
      .forEach(function (entry, idx) {
        wrap.appendChild(scheduleRow(s, entry));
      });

    var addBtn = el("button", "btn btn-ghost", "+ Add switch point");
    addBtn.type = "button";
    addBtn.addEventListener("click", function () {
      s.schedule = (s.schedule || []).concat([{ time: "12:00", theme: "light" }]);
      window.Theme.save(s);
      render();
    });
    wrap.appendChild(addBtn);

    var active = window.Theme.activeTheme();
    var label = (window.Theme.THEMES[active] || {}).label || active;
    var note = el("p", "sched-active");
    note.innerHTML = "Active now: <b>" + label + "</b>";
    wrap.appendChild(note);
    return wrap;
  }

  function scheduleRow(s, entry) {
    var row = el("div", "sched-row");
    row.appendChild(el("span", "sched-at", "At"));

    var time = document.createElement("input");
    time.type = "time";
    time.className = "field-input";
    time.value = entry.time;
    time.addEventListener("change", function () { entry.time = time.value || "00:00"; window.Theme.save(s); render(); });
    row.appendChild(time);

    row.appendChild(el("span", "sched-at", "use"));

    var sel = document.createElement("select");
    sel.className = "field-select";
    window.Theme.list().forEach(function (t) {
      var o = document.createElement("option");
      o.value = t.id; o.textContent = t.label;
      sel.appendChild(o);
    });
    sel.value = entry.theme;
    sel.addEventListener("change", function () { entry.theme = sel.value; window.Theme.save(s); render(); });
    row.appendChild(sel);

    var del = el("button", "sched-del", "×");
    del.type = "button";
    del.setAttribute("aria-label", "Remove switch point");
    del.addEventListener("click", function () {
      s.schedule = s.schedule.filter(function (e) { return e !== entry; });
      window.Theme.save(s);
      render();
    });
    row.appendChild(del);
    return row;
  }

  if (window.App && window.App.onShow) {
    window.App.onShow("settings", render);
  }
})();
