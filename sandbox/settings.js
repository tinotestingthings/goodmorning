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
    root.appendChild(buildNotifications());
    root.appendChild(buildPushAlerts());
    root.appendChild(buildSounds());
    root.appendChild(buildIcsFeeds());
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
      del.addEventListener("click", function () { window.Cats.remove(cat.id); render(); });
      row.appendChild(color); row.appendChild(name); row.appendChild(del);
      list.appendChild(row);
    });
    sec.appendChild(list);
    var add = el("button", "btn btn-ghost", "+ Add category"); add.type = "button";
    add.addEventListener("click", function () { window.Cats.add("New", "#7f8a99"); render(); });
    sec.appendChild(add);
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
