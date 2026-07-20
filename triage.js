(function () {
  "use strict";

  var LS_DECISIONS = "dd.decisions";
  var LS_HANDED_OFF = "dd.handedOff";
  var LS_POINTER = "dd.pointer";
  var LS_IMPORTED_FEED = "dd.importedFeed";

  var deckArea = document.getElementById("deckArea");
  var feedStatus = document.getElementById("feedStatus");
  var importPanel = document.getElementById("importPanel");
  var importText = document.getElementById("importText");
  var importError = document.getElementById("importError");
  var importToggleBtn = document.getElementById("importToggleBtn");
  var importLoadBtn = document.getElementById("importLoadBtn");
  var importCancelBtn = document.getElementById("importCancelBtn");
  var revertFeedBtn = document.getElementById("revertFeedBtn");

  var feed = null;
  var feedSource = "committed"; // "committed" | "imported"
  var items = [];
  var decisions = {};
  var handedOff = {};
  var pointer = 0;
  var lastAction = null; // { type: "decide"|"skip", id, prevPointer }

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

  function firstUndecidedIndex(fromIndex) {
    var start = fromIndex || 0;
    for (var i = start; i < items.length; i++) {
      if (!decisions[items[i].id]) return i;
    }
    return items.length;
  }

  function setFeedStatus(text) {
    feedStatus.textContent = text;
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

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function formatQueueTimestamp(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  // ---- rendering ----

  function render() {
    deckArea.innerHTML = "";

    if (!feed) {
      renderEmpty("No feed loaded. Import one below.");
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
    progress.textContent = (pointer + 1) + " of " + items.length;
    deckArea.appendChild(progress);

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

    if (item.url) {
      var link = document.createElement("a");
      link.className = "card-link";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open article ↗";
      card.appendChild(link);
    }

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

    deckArea.appendChild(card);

    attachSwipe(card, item, keepBadge, dismissBadge);

    var actionRow = document.createElement("div");
    actionRow.className = "action-row";

    var dismissBtn = document.createElement("button");
    dismissBtn.className = "btn btn-dismiss";
    dismissBtn.textContent = "✕ Dismiss";
    dismissBtn.addEventListener("click", function () { decide(item, "dismiss", flash); });

    var skipBtn = document.createElement("button");
    skipBtn.className = "btn btn-skip";
    skipBtn.textContent = "Skip";
    skipBtn.addEventListener("click", function () { skip(flash); });

    var keepBtn = document.createElement("button");
    keepBtn.className = "btn btn-keep";
    keepBtn.textContent = "✓ Keep";
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
      window.location.href = "practice.html";
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

  function attachSwipe(card, item, keepBadge, dismissBadge) {
    var startX = 0, startY = 0, dx = 0, dy = 0;
    var dragging = false, captured = false;
    var lastX = 0, lastT = 0, vx = 0;

    function setTransform() {
      card.style.transform = "translate(" + dx + "px," + (dy * 0.12) + "px) rotate(" + (dx * 0.05) + "deg)";
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
      card.classList.remove("card-dragging");
      card.classList.add("card-animating");
      (direction > 0 ? keepBadge : dismissBadge).style.opacity = 1;
      card.style.transform = "translate(" + (direction * (window.innerWidth + 120)) + "px," +
        (dy * 0.4 + 40) + "px) rotate(" + (direction * 28) + "deg)";
      card.style.opacity = "0.3";
      setTimeout(function () { decide(item, action, null); }, 230);
    }

    card.addEventListener("pointerdown", function (e) {
      if (e.target.closest("a, button, textarea")) return;
      startX = e.clientX;
      startY = e.clientY;
      lastX = e.clientX;
      lastT = e.timeStamp;
      dx = 0; dy = 0; vx = 0;
      dragging = true;
      captured = false;
    });

    card.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      dx = e.clientX - startX;
      dy = e.clientY - startY;

      if (!captured) {
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          captured = true;
          card.classList.add("card-dragging");
          try { card.setPointerCapture(e.pointerId); } catch (err) {}
        } else if (Math.abs(dy) > 16) {
          dragging = false; // vertical intent: let the summary scroll
          return;
        } else {
          return;
        }
      }

      var dt = e.timeStamp - lastT;
      if (dt > 0) vx = (e.clientX - lastX) / dt;
      lastX = e.clientX;
      lastT = e.timeStamp;
      setTransform();
    });

    function release() {
      if (!dragging) return;
      dragging = false;
      if (!captured) return;
      var threshold = Math.min(130, card.offsetWidth * 0.4);
      if (Math.abs(dx) > threshold || (Math.abs(vx) > 0.6 && Math.abs(dx) > 40)) {
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
    var keepIds = [];
    var dismissIds = [];
    items.forEach(function (it) {
      var d = decisions[it.id];
      if (d === "keep") keepIds.push(it.id);
      else if (d === "dismiss") dismissIds.push(it.id);
    });

    var noteLines = DigestNotes.noteLines();

    if (keepIds.length === 0 && dismissIds.length === 0 && noteLines.length === 0) {
      toast("Nothing to copy yet");
      return;
    }

    var lines = ["swipe queue " + formatQueueTimestamp(new Date())];
    keepIds.forEach(function (id) { lines.push("keep: " + id); });
    dismissIds.forEach(function (id) { lines.push("dismiss: " + id); });
    noteLines.forEach(function (line) { lines.push(line); });
    var text = lines.join("\n");

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        var msg = "Copied " + (keepIds.length + dismissIds.length) + " decisions";
        if (noteLines.length > 0) msg += " + " + noteLines.length + " note" + (noteLines.length === 1 ? "" : "s");
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
    setFeedStatus(items.length + " cards · " + (feedSource === "imported" ? "imported feed" : "committed feed.json"));
    toast("Handed off — " + clearedCount + " cleared");
    render();
  }

  // ---- feed loading ----

  function applyFeed(newFeed, source) {
    feed = newFeed;
    feedSource = source;
    computeItems();
    pointer = firstUndecidedIndex(0);
    savePointer();
    lastAction = null;
    setFeedStatus(items.length + " cards · " + (source === "imported" ? "imported feed" : "committed feed.json"));
    revertFeedBtn.classList.toggle("hidden", source !== "imported");
    render();
  }

  function loadCommittedFeed() {
    setFeedStatus("Loading feed.json…");
    fetch("feed.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (json) { applyFeed(json, "committed"); })
      .catch(function (err) {
        feed = null;
        items = [];
        setFeedStatus("Could not load feed.json (" + err.message + ")");
        importPanel.classList.remove("hidden");
        render();
      });
  }

  function init() {
    DigestLoop.setStep("triage");
    loadState();

    var imported = loadJSON(LS_IMPORTED_FEED, null);
    if (imported) {
      applyFeed(imported, "imported");
    } else {
      loadCommittedFeed();
    }
  }

  // ---- import panel wiring ----

  importToggleBtn.addEventListener("click", function () {
    importPanel.classList.toggle("hidden");
    importError.classList.add("hidden");
  });

  importCancelBtn.addEventListener("click", function () {
    importPanel.classList.add("hidden");
    importText.value = "";
    importError.classList.add("hidden");
  });

  importLoadBtn.addEventListener("click", function () {
    var raw = importText.value.trim();
    if (!raw) {
      importError.textContent = "Paste some JSON first.";
      importError.classList.remove("hidden");
      return;
    }
    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      importError.textContent = "Invalid JSON: " + e.message;
      importError.classList.remove("hidden");
      return;
    }
    if (!parsed || !Array.isArray(parsed.daily)) {
      importError.textContent = "JSON must have a \"daily\" array.";
      importError.classList.remove("hidden");
      return;
    }
    saveJSON(LS_IMPORTED_FEED, parsed);
    importError.classList.add("hidden");
    importText.value = "";
    importPanel.classList.add("hidden");
    applyFeed(parsed, "imported");
    toast("Imported feed loaded");
  });

  revertFeedBtn.addEventListener("click", function () {
    localStorage.removeItem(LS_IMPORTED_FEED);
    revertFeedBtn.classList.add("hidden");
    loadCommittedFeed();
  });

  init();
})();
