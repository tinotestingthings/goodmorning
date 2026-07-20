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
  function collapsible(container, primary, rest, rowFn) {
    primary.forEach(function (item) { container.appendChild(rowFn(item)); });
    if (rest.length === 0) return;

    var restWrap = el("div", "dash-more-items hidden");
    rest.forEach(function (item) { restWrap.appendChild(rowFn(item)); });

    var moreBtn = el("button", "dash-more-btn", "+" + rest.length + " more");
    moreBtn.setAttribute("type", "button");
    var expanded = false;
    moreBtn.addEventListener("click", function () {
      expanded = !expanded;
      restWrap.classList.toggle("hidden", !expanded);
      moreBtn.textContent = expanded ? "Show less" : "+" + rest.length + " more";
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

  function tile(key, label, iconSvg, badgeText, badgeClass, onToggle) {
    var t = document.createElement("button");
    t.type = "button";
    t.className = "tile tile-" + key;
    if (badgeText) t.appendChild(el("span", "tile-badge " + badgeClass, badgeText));
    var iconWrap = el("div", "tile-icon");
    iconWrap.innerHTML = iconSvg;
    t.appendChild(iconWrap);
    t.appendChild(el("span", "tile-label", label));
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
    var grid = el("div", "tile-grid");
    var accordionBody = el("div", "accordion-body");

    var sections = [
      { key: "tasks", label: "Tasks", icon: ICON_TASKS, badge: taskBadge(today),
        build: function (c) { buildTasksBody(c, today); } },
      { key: "projects", label: "Projects", icon: ICON_PROJECTS, badge: projectBadge(today),
        build: function (c) { buildProjectsBody(c, today); } },
      { key: "radar", label: "Radar", icon: ICON_RADAR, badge: radarBadge(today),
        build: function (c) { buildRadarBody(c, today); } }
    ];

    var openKey = null;
    var tileEls = {};

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
      var t = tile(s.key, s.label, s.icon, s.badge.text, s.badge.cls, function () { setOpen(s.key); });
      tileEls[s.key] = t;
      grid.appendChild(t);
    });

    wrap.appendChild(grid);
    wrap.appendChild(accordionBody);
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
  if (window.App && App.onShow) {
    App.onShow("today", render);
  }
  render();
})();
