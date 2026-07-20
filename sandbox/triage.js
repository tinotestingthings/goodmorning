(function () {
  "use strict";

  var LS_DECISIONS = "sbx.decisions";
  var LS_HANDED_OFF = "sbx.handedOff";
  var LS_POINTER = "sbx.pointer";

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

  // ---- circular action buttons ----

  var ICONS = {
    dismiss: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>',
    keep: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    skip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'
  };

  function circleBtn(kind, size, label) {
    var btn = document.createElement("button");
    btn.className = "btn-circle btn-circle-" + kind + " btn-circle-" + size;
    btn.innerHTML = ICONS[kind];
    btn.setAttribute("aria-label", label);
    btn.setAttribute("type", "button");
    return btn;
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

    var nc = noteControl("triage", item.id, "Note on this card — collected with your decisions.");
    linkRow.appendChild(nc.btn);
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

    cardWrap.appendChild(card);
    deckArea.appendChild(cardWrap);

    attachSwipe(card, item, summary, keepBadge, dismissBadge);

    var actionRow = document.createElement("div");
    actionRow.className = "action-row";

    var dismissBtn = circleBtn("dismiss", "lg", "Dismiss");
    dismissBtn.addEventListener("click", function () { decide(item, "dismiss", flash); });

    var skipBtn = circleBtn("skip", "sm", "Skip");
    skipBtn.addEventListener("click", function () { skip(flash); });

    var keepBtn = circleBtn("keep", "lg", "Keep");
    keepBtn.addEventListener("click", function () { decide(item, "keep", flash); });

    actionRow.appendChild(dismissBtn);
    actionRow.appendChild(skipBtn);
    actionRow.appendChild(keepBtn);
    deckArea.appendChild(actionRow);

    var undoRow = document.createElement("div");
    undoRow.className = "undo-row";
    var undoBtn = document.createElement("button");
    undoBtn.className = "btn btn-undo";
    undoBtn.textContent = "Undo last";
    undoBtn.disabled = !lastAction;
    undoBtn.addEventListener("click", undo);
    undoRow.appendChild(undoBtn);
    deckArea.appendChild(undoRow);
  }

  function renderComplete() {
    var progress = document.createElement("div");
    progress.className = "progress";
    progress.appendChild(renderProgressDots());
    progress.appendChild(el("span", "progress-fraction", items.length + "/" + items.length));
    deckArea.appendChild(progress);

    var counts = { keep: 0, dismiss: 0, skipped: 0 };
    items.forEach(function (it) {
      var d = decisions[it.id];
      if (d === "keep") counts.keep++;
      else if (d === "dismiss") counts.dismiss++;
      else counts.skipped++;
    });

    var wrap = document.createElement("div");
    wrap.className = "complete-view";

    var h2 = document.createElement("h2");
    h2.textContent = "Deck complete";
    wrap.appendChild(h2);

    var countsEl = document.createElement("div");
    countsEl.className = "complete-counts";
    countsEl.textContent = counts.keep + " keep · " + counts.dismiss + " dismiss · " +
      counts.skipped + " skipped";
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

    var copyBtn = document.createElement("button");
    copyBtn.className = "btn btn-primary";
    copyBtn.textContent = "Copy decisions";
    copyBtn.disabled = counts.keep + counts.dismiss === 0;
    copyBtn.addEventListener("click", copyDecisions);
    actions.appendChild(copyBtn);

    var handoffBtn = document.createElement("button");
    handoffBtn.className = "btn btn-ghost";
    handoffBtn.textContent = "Mark handed off";
    handoffBtn.disabled = counts.keep + counts.dismiss === 0;
    handoffBtn.addEventListener("click", markHandedOff);
    actions.appendChild(handoffBtn);

    var continueBtn = document.createElement("button");
    continueBtn.className = "btn btn-primary";
    continueBtn.textContent = "Continue to practice →";
    continueBtn.addEventListener("click", function () {
      App.go("practice");
    });
    actions.appendChild(continueBtn);

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
      card.style.transform = "translate(" + (direction * (window.innerWidth + 120)) + "px,40px) rotate(" +
        (direction * 28) + "deg)";
      card.style.opacity = "0.3";
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
    flashEl.style.opacity = "0.92";
    setTimeout(function () { flashEl.style.opacity = "0"; }, 200);
  }

  function decide(item, action, flashEl) {
    if (flashEl) vibrate(12);
    flashDecision(flashEl, action === "keep" ? "KEPT" : "DISMISSED", action === "keep" ? "--keep" : "--dismiss");
    lastAction = { type: "decide", id: item.id, prevPointer: pointer };
    decisions[item.id] = action;
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
      if (d === "keep" || d === "dismiss") {
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
    computeItems();
    pointer = firstUndecidedIndex(0);
    savePointer();
    lastAction = null;
    setFeedStatus(items.length + (items.length === 1 ? " card" : " cards"));
    render();
  }

  function loadCommittedFeed() {
    setFeedStatus("Loading…");
    fetch("feed.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (json) { applyFeed(json); })
      .catch(function () {
        feed = null;
        items = [];
        setFeedStatus("Could not load feed");
        render();
      });
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
  }

  init();

  if (window.App && App.onShow) {
    App.onShow("triage", function () {
      DigestLoop.setStep("triage");
    });
  }
})();
