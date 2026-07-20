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

  // ---- hero (loop entry) ----

  function renderHero() {
    var hero = el("div", "home-hero");
    var step = DigestLoop.getStep();

    var h1 = el("h1");
    var p = el("p");
    var actions = el("div", "home-actions");

    if (step === "done") {
      h1.textContent = "Done for today ✓";
      var completed = DigestLoop.getCompletedDate();
      p.textContent = completed ? "Completed " + completed + "." : "Completed.";
      var streak = DigestLoop.getStreak();
      if (streak > 1) {
        var streakEl = el("div", "streak-chip");
        streakEl.innerHTML = '<svg class="streak-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a6.5 6.5 0 1 1-13 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>';
        var streakLabel = document.createElement("span");
        streakLabel.textContent = streak + " day streak";
        streakEl.appendChild(streakLabel);
        actions.appendChild(streakEl);
      }
      var againBtn = el("button", "btn btn-ghost", "Do it again");
      againBtn.addEventListener("click", function () {
        DigestLoop.clearStep();
        App.go("triage");
        render();
      });
      actions.appendChild(againBtn);
    } else if (step === "triage" || step === "practice") {
      h1.textContent = "Daily Digest";
      p.textContent = "Pick up where you left off.";
      var resumeBtn = el("button", "btn btn-primary", "Resume: " + (step === "triage" ? "Triage" : "Practice"));
      resumeBtn.addEventListener("click", function () { App.go(step); });
      actions.appendChild(resumeBtn);
    } else {
      h1.textContent = "Daily Digest";
      p.textContent = "Your morning ritual, start to finish.";
      var startBtn = el("button", "btn btn-primary", "Start today's loop");
      startBtn.addEventListener("click", function () { App.go("triage"); });
      actions.appendChild(startBtn);
    }

    hero.appendChild(h1);
    hero.appendChild(p);
    hero.appendChild(actions);
    return hero;
  }

  // ---- dashboard sections ----

  function chip(status) {
    return el("span", "chip chip-" + status, status);
  }

  function section(title, buildBody) {
    var sec = el("section", "dash-section");
    var head = el("div", "dash-head");
    head.appendChild(el("h2", "dash-title", title));
    sec.appendChild(head);
    buildBody(sec);
    return sec;
  }

  function renderTasks(today) {
    return section("Tasks · suggested", function (sec) {
      var tasks = today.tasks || [];
      if (tasks.length === 0) {
        sec.appendChild(el("p", "dash-empty", "No suggestions today."));
        return;
      }
      var list = el("ul", "dash-list");
      tasks.forEach(function (t) {
        var li = el("li", "dash-item");
        var row = el("div", "dash-row");
        row.appendChild(chip(t.status));
        row.appendChild(el("span", "dash-item-title", t.title));
        var nc = noteControl("tasks", t.id, "Note on “" + t.title + "” — collected with your decisions.");
        row.appendChild(nc.btn);
        li.appendChild(row);
        if (t.detail) li.appendChild(el("div", "dash-detail", t.detail));
        if (t.hint) li.appendChild(el("div", "dash-hint", t.hint));
        li.appendChild(nc.textarea);
        list.appendChild(li);
      });
      sec.appendChild(list);
    });
  }

  function renderProjects(today) {
    return section("Projects", function (sec) {
      var projects = today.projects || [];
      if (projects.length === 0) {
        sec.appendChild(el("p", "dash-empty", "No project data in feed."));
        return;
      }
      var order = { active: 0, paused: 1, "idea-stage": 2 };
      projects.slice().sort(function (a, b) {
        return (order[a.status] || 0) - (order[b.status] || 0);
      }).forEach(function (p) {
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
        sec.appendChild(li);
      });
    });
  }

  function daysUntil(dateStr) {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var target = new Date(dateStr + "T00:00:00");
    return Math.round((target - today) / 86400000);
  }

  function renderRadar(today) {
    return section("Compliance radar", function (sec) {
      var radar = today.radar;
      if (!radar) {
        sec.appendChild(el("p", "dash-empty", "No radar data in feed."));
        return;
      }

      var meta = el("div", "dash-meta");
      var followUps = radar.follow_ups || 0;
      meta.textContent = "updated " + (radar.updated || "?") + " · " +
        followUps + " follow-up" + (followUps === 1 ? "" : "s") + " open";
      sec.appendChild(meta);

      if (radar.headline) sec.appendChild(el("p", "radar-headline", radar.headline));

      (radar.deadlines || []).forEach(function (d) {
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
        sec.appendChild(li);
      });
    });
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

  function renderDashboard(feed) {
    var today = feed && feed.today;
    var dash = el("div", "dashboard");
    if (!today) {
      dash.appendChild(el("p", "dash-empty", "No dashboard data in today's feed."));
      view.appendChild(dash);
      return;
    }
    dash.appendChild(renderTasks(today));
    dash.appendChild(renderProjects(today));
    dash.appendChild(renderRadar(today));
    dash.appendChild(renderNotesFooter());
    view.appendChild(dash);
    updateNotesFooter();
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
        renderDashboard(json);
      })
      .catch(function () {
        if (myGeneration !== renderGeneration) return;
        view.appendChild(el("p", "dash-empty", "Could not load feed.json."));
      });
  }

  // Re-render every time the Today tab becomes active, not just once at
  // boot — the hero (and streak, and note buttons reflecting notes typed
  // in the Triage tab) need to reflect state changed elsewhere in the app
  // without a page reload.
  if (window.App && App.onShow) {
    App.onShow("today", render);
  }
  render();
})();
