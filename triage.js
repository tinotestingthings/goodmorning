(function () {
  "use strict";

  var LS_DECISIONS = k("decisions");
  var LS_HANDED_OFF = k("handedOff");
  var LS_POINTER = k("pointer");

  var deckArea = document.getElementById("deckArea");
  var feedStatus = document.getElementById("feedStatus");

  var feed = null;
  var items = [];
  var decisions = {};
  var handedOff = {};
  var pointer = 0;
  var lastAction = null; // { type: "decide"|"skip", id, prevPointer }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function vibrate(ms) {
    if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} }
  }

  function loadJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function loadState() {
    decisions = loadJSON(LS_DECISIONS, {});
    handedOff = loadJSON(LS_HANDED_OFF, {});
    pointer = loadJSON(LS_POINTER, 0);
  }

  function saveDecisions() { saveJSON(LS_DECISIONS, decisions); }
  function saveHandedOff() { saveJSON(LS_HANDED_OFF, handedOff); }
  function savePointer() { saveJSON(LS_POINTER, pointer); }

  function computeItems() {
    var daily = (feed && Array.isArray(feed.daily)) ? feed.daily : [];
    items = daily.filter(function (it) { return !handedOff[it.id]; });
  }

  function pendingCount() {
    var n = 0;
    for (var i = 0; i < items.length; i++) {
      if (!decisions[items[i].id]) n++;
    }
    return n;
  }

  function updateBadge() {
    if (window.App && App.setTriageBadge) App.setTriageBadge(pendingCount());
  }

  function firstUndecidedIndex(fromIndex) {
    var start = fromIndex || 0;
    for (var i = start; i < items.length; i++) {
      if (!decisions[items[i].id]) return i;
    }
    return items.length;
  }

  function setFeedStatus(text) {
    if (feedStatus) feedStatus.textContent = text;
  }

  function toast(message) {
    var el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(function () {
      el.classList.remove("show");
    }, 1800);
  }

  // ---- per-item note control (mirrors home.js's — each inbox card gets
  // its own note, collected into the same store as task/project/radar
  // notes so one "copy" picks up everything) ----

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
    });

    btn.addEventListener("click", function () {
      ta.classList.toggle("hidden");
      if (!ta.classList.contains("hidden")) ta.focus();
    });

    return { btn: btn, textarea: ta };
  }

  // ---- action bar ----
  // Swiping the card decides keep/dismiss, so the bar below the card carries
  // the OTHER choices (they used to hide behind a ⋯ menu): defer, note, and
  // the promotions into a real task/project, plus undo. Icons + tiny labels.

  var TRI_ICONS = {
    later: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    task: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>',
    project: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 7a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z"/></svg>',
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h10a6 6 0 0 1 0 12H8"/><path d="M7 4 3 8l4 4"/></svg>',
    history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>'
  };

  var DECISION_LABELS = { keep: "KEPT", dismiss: "NOPE", task: "→ TASK", project: "→ PROJECT" };
  var DECISION_COLORS = { keep: "--keep", dismiss: "--dismiss", task: "--skip", project: "--accent" };

  function barBtn(kind, label, aria, handler) {
    var btn = document.createElement("button");
    btn.className = "tri-act tri-act-" + kind;
    btn.type = "button";
    btn.setAttribute("aria-label", aria || label);
    btn.innerHTML = TRI_ICONS[kind] + '<span class="tri-act-label">' + label + "</span>";
    btn.addEventListener("click", handler);
    return btn;
  }

  // ---- local log of decisions, so a History view exists after hand-off ----
  // (mirrors capture.js's capture.log; capped, device-local)
  function logTriage(item, action) {
    try {
      var list = JSON.parse(localStorage.getItem(k("triage.log")) || "[]");
      list.push({ id: item.id, title: item.title || "(untitled)", action: action, at: new Date().toISOString() });
      if (list.length > 80) list = list.slice(list.length - 80);
      localStorage.setItem(k("triage.log"), JSON.stringify(list));
    } catch (e) {}
  }

  // Bottom sheet listing past decisions, newest first (also shown under
  // Calendar → History alongside captures and completed to-dos).
  function openTriageHistory() {
    var backdrop = document.createElement("div");
    backdrop.className = "card-menu-backdrop";
    var menu = document.createElement("div");
    menu.className = "card-menu";
    function close() {
      backdrop.classList.remove("show");
      setTimeout(function () { if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop); }, 180);
    }
    menu.appendChild(el("div", "capture-heading", "Triage history"));
    var log = [];
    try { log = JSON.parse(localStorage.getItem(k("triage.log")) || "[]"); } catch (e) {}
    log = log.slice().sort(function (a, b) { return new Date(b.at) - new Date(a.at); }).slice(0, 40);
    if (!log.length) {
      menu.appendChild(el("p", "tri-hist-empty", "No decisions yet — they show up here as you swipe."));
    } else {
      var list = el("div", "tri-hist-list");
      log.forEach(function (e) {
        var row = el("div", "tri-hist-row");
        row.appendChild(el("span", "tri-hist-action tri-hist-" + (e.action || "keep"), DECISION_LABELS[e.action] || (e.action || "").toUpperCase()));
        row.appendChild(el("span", "tri-hist-title", e.title || "(untitled)"));
        row.appendChild(el("span", "tri-hist-date", (e.at || "").slice(0, 10)));
        list.appendChild(row);
      });
      menu.appendChild(list);
    }
    var cancel = document.createElement("button");
    cancel.className = "card-menu-cancel";
    cancel.type = "button";
    cancel.textContent = "Close";
    cancel.addEventListener("click", close);
    menu.appendChild(cancel);
    if (window.Sheet) window.Sheet.swipeClose(menu, close);
    backdrop.appendChild(menu);
    backdrop.addEventListener("click", function (e) { if (e.target === backdrop) close(); });
    document.body.appendChild(backdrop);
    requestAnimationFrame ? requestAnimationFrame(function () { backdrop.classList.add("show"); })
                          : backdrop.classList.add("show");
  }

  // ---- progress dots (replaces the old "3 of 6" text) ----

  function renderProgressDots() {
    var wrap = document.createElement("div");
    wrap.className = "progress-dots";
    items.forEach(function (it, i) {
      var dot = document.createElement("span");
      dot.className = "dot" + (i < pointer ? " dot-done" : i === pointer ? " dot-current" : "");
      wrap.appendChild(dot);
    });
    return wrap;
  }

  // ---- rendering ----

  function render() {
    deckArea.innerHTML = "";
    updateBadge();

    if (!feed) {
      renderEmpty("No cards right now.");
      return;
    }

    if (items.length === 0) {
      renderEmpty("No cards in this feed.");
      return;
    }

    if (pointer >= items.length) {
      renderComplete();
      return;
    }

    renderCard(items[pointer]);
  }

  function renderEmpty(message) {
    var div = document.createElement("div");
    div.className = "empty-state";
    div.textContent = message;
    deckArea.appendChild(div);
  }

  function renderCard(item) {
    var progress = document.createElement("div");
    progress.className = "progress";
    progress.appendChild(renderProgressDots());
    progress.appendChild(el("span", "progress-fraction", (pointer + 1) + "/" + items.length));
    deckArea.appendChild(progress);

    var cardWrap = document.createElement("div");
    cardWrap.className = "card-wrap";

    // Decorative sliver of the "next" card peeking out behind the current
    // one, so the deck reads as a physical stack rather than a single flat
    // panel — purely visual, carries no state.
    var stackShadow = document.createElement("div");
    stackShadow.className = "card-stack-shadow";
    cardWrap.appendChild(stackShadow);

    var card = document.createElement("div");
    card.className = "card";
    card.style.position = "relative";

    var header = document.createElement("div");
    header.className = "card-header";

    var title = document.createElement("h2");
    title.className = "card-title";
    title.textContent = item.title || "(untitled)";
    header.appendChild(title);

    var meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent = (item.source || "unknown source") + " · " + (item.date || "");
    header.appendChild(meta);

    card.appendChild(header);

    var summary = document.createElement("div");
    summary.className = "card-summary";
    summary.textContent = item.summary || "";
    card.appendChild(summary);

    var linkRow = document.createElement("div");
    linkRow.className = "card-link-row";

    if (item.url) {
      var link = document.createElement("a");
      link.className = "card-link";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open article ↗";
      linkRow.appendChild(link);
    }

    // Note control still exists per card; its textarea lives in the card and
    // is toggled from the middle "More" menu ("Add note") rather than an
    // inline pencil, keeping the card face clean.
    var nc = noteControl("triage", item.id, "Note on this card — collected with your decisions.");
    card.appendChild(linkRow);
    card.appendChild(nc.textarea);

    var flash = document.createElement("div");
    flash.className = "decision-flash";
    card.appendChild(flash);

    var keepBadge = document.createElement("div");
    keepBadge.className = "swipe-badge swipe-badge-keep";
    keepBadge.textContent = "KEEP";
    card.appendChild(keepBadge);

    var dismissBadge = document.createElement("div");
    dismissBadge.className = "swipe-badge swipe-badge-dismiss";
    dismissBadge.textContent = "NOPE";
    card.appendChild(dismissBadge);

    card.classList.add("card-enter");
    card.addEventListener("animationend", function () { card.classList.remove("card-enter"); });
    cardWrap.appendChild(card);
    deckArea.appendChild(cardWrap);

    attachSwipe(card, item, summary, keepBadge, dismissBadge);

    // deciding happens by swiping; the bar carries everything else
    deckArea.appendChild(el("div", "tri-swipe-hint", "← nope · swipe · keep →"));

    var bar = document.createElement("div");
    bar.className = "tri-bar";
    bar.appendChild(barBtn("later", "Later", "Review later — stays for next time", function () { skip(flash); }));
    bar.appendChild(barBtn("note", "Note", "Add a note to this card", function () {
      nc.textarea.classList.toggle("hidden");
      if (!nc.textarea.classList.contains("hidden")) nc.textarea.focus();
    }));
    bar.appendChild(barBtn("task", "Task", "Make into a task (files to 30 Tasks)", function () { decide(item, "task", flash); }));
    bar.appendChild(barBtn("project", "Project", "Make into a project (files to 40 Projects)", function () { decide(item, "project", flash); }));
    var undoBtn = barBtn("undo", "Undo", "Undo last decision", undo);
    undoBtn.disabled = !lastAction;
    bar.appendChild(undoBtn);
    deckArea.appendChild(bar);
  }

  function renderComplete() {
    var progress = document.createElement("div");
    progress.className = "progress";
    progress.appendChild(renderProgressDots());
    progress.appendChild(el("span", "progress-fraction", items.length + "/" + items.length));
    deckArea.appendChild(progress);

    var counts = { keep: 0, dismiss: 0, task: 0, project: 0, skipped: 0 };
    items.forEach(function (it) {
      var d = decisions[it.id];
      if (d === "keep") counts.keep++;
      else if (d === "dismiss") counts.dismiss++;
      else if (d === "task") counts.task++;
      else if (d === "project") counts.project++;
      else counts.skipped++;
    });
    var decided = counts.keep + counts.dismiss + counts.task + counts.project;

    var wrap = document.createElement("div");
    wrap.className = "complete-view";

    var h2 = document.createElement("h2");
    h2.textContent = "Deck complete";
    wrap.appendChild(h2);

    var parts = [counts.keep + " keep", counts.dismiss + " dismiss"];
    if (counts.task) parts.push(counts.task + " →task");
    if (counts.project) parts.push(counts.project + " →project");
    parts.push(counts.skipped + " skipped");
    var countsEl = document.createElement("div");
    countsEl.className = "complete-counts";
    countsEl.textContent = parts.join(" · ");
    wrap.appendChild(countsEl);

    var actions = document.createElement("div");
    actions.className = "complete-actions";

    if (counts.skipped > 0) {
      var reviewBtn = document.createElement("button");
      reviewBtn.className = "btn btn-ghost";
      reviewBtn.textContent = "Review skipped (" + counts.skipped + ")";
      reviewBtn.addEventListener("click", reviewSkipped);
      actions.appendChild(reviewBtn);
    }

    // Decisions + notes sync to Supabase automatically on deck completion —
    // no buttons needed anymore (the bridge files them into the vault).
    var syncStatus = el("div", "sync-status", "");
    actions.appendChild(syncStatus);
    if (decided > 0 || DigestNotes.hasNotes()) {
      syncStatus.textContent = "Syncing…";
      DigestSync.push(function (res) {
        if (res.empty) { syncStatus.textContent = ""; return; }
        if (res.error) { syncStatus.textContent = "Sync pending — will retry (offline?)"; return; }
        syncStatus.textContent = "✓ Synced — filing to your vault";
        computeItems(); pointer = firstUndecidedIndex(0); savePointer(); lastAction = null;
      });
    }

    // Was "Continue to practice →", the middle step of the old morning loop.
    // With the loop gone this is just the way out of a finished deck.
    var doneBtn = document.createElement("button");
    doneBtn.className = "btn btn-primary";
    doneBtn.textContent = "Back to Today";
    doneBtn.addEventListener("click", function () {
      App.go("today");
    });
    actions.appendChild(doneBtn);

    var startOverBtn = document.createElement("button");
    startOverBtn.className = "btn btn-ghost";
    startOverBtn.textContent = "Start over";
    startOverBtn.addEventListener("click", startOver);
    actions.appendChild(startOverBtn);

    var undoBtn = document.createElement("button");
    undoBtn.className = "btn btn-undo";
    undoBtn.textContent = "Undo last";
    undoBtn.disabled = !lastAction;
    undoBtn.style.alignSelf = "center";
    undoBtn.addEventListener("click", undo);
    actions.appendChild(undoBtn);

    wrap.appendChild(actions);
    deckArea.appendChild(wrap);
  }

  // ---- tinder swipe ----

  function attachSwipe(card, item, summary, keepBadge, dismissBadge) {
    // touch-action: pan-y (set in CSS on the card AND the summary) lets the
    // browser do all vertical scrolling natively — smooth momentum, no JS
    // in the loop. The browser only hands US the horizontal component, so we
    // never fight the scroll. We commit to a swipe as soon as horizontal
    // clearly dominates; otherwise we stay out of the way and let it scroll.
    var DEADZONE = 6;      // px before we judge direction
    var startX = 0, startY = 0, dx = 0, dy = 0;
    var lastX = 0, lastT = 0, vx = 0;
    var tracking = false;  // pointer is down, still watching
    var swiping = false;   // committed to a horizontal swipe

    function setTransform() {
      card.style.transform = "translate(" + dx + "px,0) rotate(" + (dx * 0.05) + "deg)";
      var strength = Math.min(1, Math.abs(dx) / 90);
      keepBadge.style.opacity = dx > 0 ? strength : 0;
      dismissBadge.style.opacity = dx < 0 ? strength : 0;
    }

    function reset() {
      card.classList.remove("card-dragging");
      card.classList.add("card-restoring");
      card.style.transform = "";
      keepBadge.style.opacity = 0;
      dismissBadge.style.opacity = 0;
      setTimeout(function () { card.classList.remove("card-restoring"); }, 220);
    }

    function flyOut(direction) {
      var action = direction > 0 ? "keep" : "dismiss";
      vibrate(12);
      card.classList.remove("card-dragging");
      card.classList.add("card-animating");
      (direction > 0 ? keepBadge : dismissBadge).style.opacity = 1;
      card.style.transform = "translate(" + (direction * (window.innerWidth + 120)) + "px,-24px) rotate(" +
        (direction * 22) + "deg)";
      card.style.opacity = "0";
      // the peeking next-card sliver rises to full size while this one leaves
      var shadow = card.parentNode && card.parentNode.querySelector(".card-stack-shadow");
      if (shadow) shadow.classList.add("stack-promote");
      setTimeout(function () { decide(item, action, null); }, 230);
    }

    card.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.target.closest("a, button, textarea")) return;
      startX = e.clientX;
      startY = e.clientY;
      lastX = e.clientX;
      lastT = e.timeStamp;
      dx = 0; dy = 0; vx = 0;
      tracking = true;
      swiping = false;
    });

    card.addEventListener("pointermove", function (e) {
      if (!tracking) return;
      dx = e.clientX - startX;
      dy = e.clientY - startY;

      if (!swiping) {
        if (Math.abs(dx) < DEADZONE && Math.abs(dy) < DEADZONE) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          // horizontal wins -> take over as a swipe
          swiping = true;
          card.classList.add("card-dragging");
          try { card.setPointerCapture(e.pointerId); } catch (err) {}
        } else {
          // vertical wins -> hands off; the browser is scrolling natively
          tracking = false;
          return;
        }
      }

      // once swiping, keep the card glued to the finger
      if (e.cancelable) e.preventDefault();
      var dt = e.timeStamp - lastT;
      if (dt > 0) vx = (e.clientX - lastX) / dt;
      lastX = e.clientX;
      lastT = e.timeStamp;
      setTransform();
    });

    function release() {
      if (!tracking && !swiping) return;
      tracking = false;
      if (!swiping) return;
      swiping = false;
      var threshold = Math.min(120, card.offsetWidth * 0.35);
      if (Math.abs(dx) > threshold || (Math.abs(vx) > 0.5 && Math.abs(dx) > 30)) {
        flyOut(dx > 0 ? 1 : -1);
      } else {
        reset();
      }
    }

    card.addEventListener("pointerup", release);
    card.addEventListener("pointercancel", release);
  }

  // ---- actions ----

  function flashDecision(flashEl, label, colorVar) {
    if (!flashEl) return;
    flashEl.textContent = label;
    flashEl.style.background = "var(" + colorVar + ")";
    flashEl.classList.add("show");
    setTimeout(function () { flashEl.classList.remove("show"); }, 260);
  }

  function decide(item, action, flashEl) {
    if (flashEl) vibrate(12);
    // "Make into task" also drops a schedulable to-do onto the calendar (dated
    // today) so it can be scheduled immediately — alongside the vault task the
    // bridge files from this decision.
    if (action === "task" && window.DayModel) {
      try {
        var d = new Date(), p = function (n) { return n < 10 ? "0" + n : "" + n; };
        var ymd = d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
        var list = window.DayModel.loadTodos();
        list.push({ id: "todo-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7), text: item.title || "(task)", dueDate: ymd, startTime: null, endTime: null, done: false, snoozes: 0 });
        window.DayModel.saveTodos(list);
      } catch (e) {}
    }
    flashDecision(flashEl, DECISION_LABELS[action] || action.toUpperCase(), DECISION_COLORS[action] || "--skip");
    lastAction = { type: "decide", id: item.id, prevPointer: pointer };
    decisions[item.id] = action;
    logTriage(item, action);
    pointer++;
    saveDecisions();
    savePointer();
    setTimeout(render, 160);
  }

  function skip(flashEl) {
    flashDecision(flashEl, "SKIPPED", "--skip");
    lastAction = { type: "skip", prevPointer: pointer };
    pointer++;
    savePointer();
    setTimeout(render, 160);
  }

  function undo() {
    if (!lastAction) return;
    pointer = lastAction.prevPointer;
    if (lastAction.type === "decide") {
      delete decisions[lastAction.id];
      saveDecisions();
    }
    savePointer();
    lastAction = null;
    render();
  }

  function reviewSkipped() {
    pointer = firstUndecidedIndex(0);
    savePointer();
    render();
  }

  function copyDecisions() {
    // Built by the shared DigestQueue helper (loop.js) — same source the
    // home screen's copy button uses, so the two can never disagree about
    // what's pending.
    var queue = DigestQueue.build();
    if (!queue) {
      toast("Nothing to copy yet");
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(queue.text).then(function () {
        var msg = "Copied " + queue.decisionCount + " decision" + (queue.decisionCount === 1 ? "" : "s");
        if (queue.noteCount > 0) msg += " + " + queue.noteCount + " note" + (queue.noteCount === 1 ? "" : "s");
        toast(msg);
      }, function () {
        toast("Copy failed — clipboard blocked");
      });
    } else {
      toast("Clipboard not available");
    }
  }

  function markHandedOff() {
    var clearedCount = 0;
    items.forEach(function (it) {
      var d = decisions[it.id];
      if (d === "keep" || d === "dismiss" || d === "task" || d === "project") {
        handedOff[it.id] = true;
        delete decisions[it.id];
        clearedCount++;
      }
    });
    if (clearedCount === 0) {
      toast("Nothing to hand off yet");
      return;
    }
    saveHandedOff();
    saveDecisions();
    DigestNotes.clearNotes();
    computeItems();
    pointer = firstUndecidedIndex(0);
    savePointer();
    lastAction = null;
    setFeedStatus(items.length + (items.length === 1 ? " card" : " cards"));
    toast("Handed off — " + clearedCount + " cleared");
    render();
  }

  // ---- feed loading ----

  function applyFeed(newFeed) {
    feed = newFeed;
    // Prune decisions/hand-offs for ids no longer in the feed — every day
    // brings fresh ids, so without this the (now synced) maps grow forever.
    var live = {};
    ((newFeed && newFeed.daily) || []).forEach(function (it) { live[it.id] = true; });
    [ [decisions, saveDecisions], [handedOff, saveHandedOff] ].forEach(function (pair) {
      var changed = false;
      Object.keys(pair[0]).forEach(function (id) {
        if (!live[id]) { delete pair[0][id]; changed = true; }
      });
      if (changed) pair[1]();  // only touch keys that really had stale entries
    });
    computeItems();
    pointer = firstUndecidedIndex(0);
    savePointer();
    lastAction = null;
    setFeedStatus(items.length + (items.length === 1 ? " card" : " cards"));
    render();
  }

  function loadCommittedFeed(cb) {
    setFeedStatus("Loading…");
    // Cache-bust the URL as well as sending no-store: the service worker's
    // feed.json handler is network-first, but a stale intermediary/CDN copy
    // can still slip through, and this is the explicit "give me the latest"
    // path — so we force a unique request every time.
    fetch("feed.json?_=" + Date.now(), { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (json) { applyFeed(json); if (cb) cb(true); })
      .catch(function () {
        feed = null;
        items = [];
        setFeedStatus("Could not load feed");
        render();
        if (cb) cb(false);
      });
  }

  // Manual refresh — the page can't be pulled-to-refresh (the shell is
  // overflow:hidden so the tab bar stays put), so this is the way to pull a
  // fresh feed.json without reinstalling the app.
  function refreshFeed() {
    setFeedStatus("Refreshing…");
    loadCommittedFeed(function (ok) {
      toast(ok ? "Feed refreshed" : "Refresh failed — offline?");
    });
  }

  // Start the triage over: wipe keep/dismiss/skip choices on the cards
  // currently in the deck and return to the first card. Handed-off cards
  // (already copied out to Claude) stay gone — this only redoes what's still
  // in front of you.
  function startOver() {
    if (items.length === 0) { toast("No cards to redo"); return; }
    var ok = (typeof confirm === "function")
      ? confirm("Start the triage over? This clears your keep/dismiss choices on the current cards.")
      : true;
    if (!ok) return;
    items.forEach(function (it) { delete decisions[it.id]; });
    saveDecisions();
    pointer = 0;
    savePointer();
    lastAction = null;
    toast("Triage reset");
    render();
  }

  function init() {
    // Prefetch the feed and pre-render the deck at boot (so the Triage tab
    // badge is accurate immediately and switching tabs feels instant) — but
    // do NOT mark the loop step as "triage" here. All three views now load
    // up front in one shell, so that has to happen only when the user
    // actually opens this tab, or every reload would silently overwrite a
    // "done" step back to "triage".
    loadState();
    loadCommittedFeed();

    var backBtn = document.getElementById("triageBackBtn");
    if (backBtn && window.App) backBtn.addEventListener("click", function () { App.go("today"); });

    // Header actions: refresh (re-fetch feed) + start over (redo checks).
    var header = document.querySelector("#view-triage .mini-header");
    if (header && !header.querySelector(".triage-actions")) {
      var REFRESH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>';
      var REDO_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 2.64-6.36"/><path d="M3 3v6h6"/></svg>';
      var actions = document.createElement("div");
      actions.className = "triage-actions";
      var refreshBtn = document.createElement("button");
      refreshBtn.className = "hdr-btn";
      refreshBtn.type = "button";
      refreshBtn.setAttribute("aria-label", "Refresh feed");
      refreshBtn.innerHTML = REFRESH_ICON;
      refreshBtn.addEventListener("click", refreshFeed);
      var startBtn = document.createElement("button");
      startBtn.className = "hdr-btn";
      startBtn.type = "button";
      startBtn.setAttribute("aria-label", "Start triage over");
      startBtn.innerHTML = REDO_ICON;
      startBtn.addEventListener("click", startOver);
      var histBtn = document.createElement("button");
      histBtn.className = "hdr-btn";
      histBtn.type = "button";
      histBtn.setAttribute("aria-label", "Triage history");
      histBtn.innerHTML = TRI_ICONS.history;
      histBtn.addEventListener("click", openTriageHistory);
      actions.appendChild(histBtn);
      actions.appendChild(refreshBtn);
      actions.appendChild(startBtn);
      header.appendChild(actions);
    }
  }

  init();

  // Triage state (decisions/handedOff) now rides the agenda sync. When a pull
  // lands a new snapshot — e.g. the deck was completed on another device —
  // reload our in-memory copies so the same cards don't come back here.
  document.addEventListener("dd-agenda-applied", function () {
    loadState();
    computeItems();
    pointer = firstUndecidedIndex(0);
    updateBadge();
    var v = document.getElementById("view-triage");
    if (v && !v.hidden) render();
  });

})();
