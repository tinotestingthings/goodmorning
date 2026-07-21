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
