(function (global) {
  "use strict";

  var LS_STEP = "dd.loop.step";
  var LS_COMPLETED_DATE = "dd.loop.completedDate";
  var LS_STREAK = "dd.loop.streak";

  function getStep() {
    return localStorage.getItem(LS_STEP) || null;
  }

  function setStep(step) {
    localStorage.setItem(LS_STEP, step);
  }

  function clearStep() {
    localStorage.removeItem(LS_STEP);
    localStorage.removeItem(LS_COMPLETED_DATE);
    // streak is deliberately kept across "do it again" / clearStep — it
    // tracks calendar-day completion, not loop resets.
  }

  function isoDate(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  function markDoneToday() {
    var today = isoDate(new Date());
    var prevCompleted = localStorage.getItem(LS_COMPLETED_DATE);
    if (prevCompleted !== today) {
      var yesterday = isoDate(new Date(Date.now() - 86400000));
      var prevStreak = parseInt(localStorage.getItem(LS_STREAK), 10) || 0;
      var streak = (prevCompleted === yesterday) ? prevStreak + 1 : 1;
      localStorage.setItem(LS_STREAK, String(streak));
    }
    setStep("done");
    localStorage.setItem(LS_COMPLETED_DATE, today);
  }

  function getCompletedDate() {
    return localStorage.getItem(LS_COMPLETED_DATE);
  }

  function getStreak() {
    return parseInt(localStorage.getItem(LS_STREAK), 10) || 0;
  }

  global.DigestLoop = {
    getStep: getStep,
    setStep: setStep,
    clearStep: clearStep,
    markDoneToday: markDoneToday,
    getCompletedDate: getCompletedDate,
    getStreak: getStreak
  };

  // ---- per-item notes ----
  // One note per individual item (a task, a project, a radar deadline, a
  // triage/inbox card) instead of one note for a whole section. Stored as
  // { section: { itemId: "text" } }. All sections share this single store
  // so any "collect notes" button (Today's Copy notes, Triage's Copy
  // decisions) picks up everything — including inbox notes — in one pass.
  var LS_NOTES = "dd.notes";
  var SECTION_ORDER = ["triage", "tasks", "projects", "radar"];

  function getNotes() {
    try {
      return JSON.parse(localStorage.getItem(LS_NOTES)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveNotes(notes) {
    localStorage.setItem(LS_NOTES, JSON.stringify(notes));
  }

  function setItemNote(section, itemId, text) {
    var notes = getNotes();
    var t = (text || "").trim();
    if (t) {
      if (!notes[section]) notes[section] = {};
      notes[section][itemId] = t;
    } else if (notes[section]) {
      delete notes[section][itemId];
      if (Object.keys(notes[section]).length === 0) delete notes[section];
    }
    saveNotes(notes);
  }

  function getItemNote(section, itemId) {
    var notes = getNotes();
    return (notes[section] && notes[section][itemId]) || "";
  }

  function noteLines() {
    var notes = getNotes();
    var lines = [];
    var sections = SECTION_ORDER.concat(Object.keys(notes).filter(function (s) {
      return SECTION_ORDER.indexOf(s) === -1;
    }));
    sections.forEach(function (section) {
      var items = notes[section];
      if (!items) return;
      Object.keys(items).forEach(function (itemId) {
        var t = items[itemId];
        if (t) lines.push("note [" + section + ":" + itemId + "]: " + t.replace(/\s*\n+\s*/g, "; "));
      });
    });
    return lines;
  }

  function hasNotes() {
    return noteLines().length > 0;
  }

  function clearNotes() {
    localStorage.removeItem(LS_NOTES);
  }

  global.DigestNotes = {
    getNotes: getNotes,
    setItemNote: setItemNote,
    getItemNote: getItemNote,
    noteLines: noteLines,
    hasNotes: hasNotes,
    clearNotes: clearNotes
  };

  // ---- shared queue builder ----
  // Both "Copy decisions" (Triage) and the home screen's copy button need
  // to produce the exact same text — decisions plus every note, wherever
  // it was typed. Reading straight from localStorage here (instead of each
  // view keeping its own copy of the swipe state) is what guarantees that:
  // there is only one place that assembles the queue, so the two buttons
  // can never drift out of sync with each other again.
  var LS_DECISIONS = "dd.decisions";
  var LS_HANDED_OFF = "dd.handedOff";

  function loadJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  function formatTimestamp(d) {
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) +
      " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
  }

  function pendingDecisions() {
    var decisions = loadJSON(LS_DECISIONS, {});
    var handedOff = loadJSON(LS_HANDED_OFF, {});
    var keep = [], dismiss = [], task = [], project = [];
    Object.keys(decisions).forEach(function (id) {
      if (handedOff[id]) return; // already handed off, not pending anymore
      var d = decisions[id];
      if (d === "keep") keep.push(id);
      else if (d === "dismiss") dismiss.push(id);
      else if (d === "task") task.push(id);
      else if (d === "project") project.push(id);
    });
    return { keep: keep, dismiss: dismiss, task: task, project: project };
  }

  function buildQueue() {
    var d = pendingDecisions();
    var notes = noteLines();
    var decisionCount = d.keep.length + d.dismiss.length + d.task.length + d.project.length;
    if (decisionCount === 0 && notes.length === 0) return null;

    var lines = ["swipe queue " + formatTimestamp(new Date())];
    d.keep.forEach(function (id) { lines.push("keep: " + id); });
    d.dismiss.forEach(function (id) { lines.push("dismiss: " + id); });
    d.task.forEach(function (id) { lines.push("task: " + id); });
    d.project.forEach(function (id) { lines.push("project: " + id); });
    notes.forEach(function (line) { lines.push(line); });

    return { text: lines.join("\n"), decisionCount: decisionCount, noteCount: notes.length };
  }

  global.DigestQueue = {
    pendingDecisions: pendingDecisions,
    build: buildQueue
  };

  // ---- Supabase sync (replaces copy-to-clipboard) ----
  // Pushes the same pending decisions + notes the queue text contains, but as
  // structured rows into the `actions` table. The bridge task then applies
  // each to the vault (keep/dismiss/task/project on 00 Inbox items, note onto
  // its target item) — no more paste-in-chat step.
  function buildActionRows() {
    var d = pendingDecisions();
    var rows = [];
    ["keep", "dismiss", "task", "project"].forEach(function (type) {
      d[type].forEach(function (id) { rows.push({ type: type, target_id: id }); });
    });
    var notes = getNotes();
    Object.keys(notes).forEach(function (section) {
      Object.keys(notes[section]).forEach(function (itemId) {
        var t = notes[section][itemId];
        if (t) rows.push({ type: "note", section: section, target_id: itemId, body: t });
      });
    });
    return rows;
  }

  function markAllHandedOff() {
    var decisions = loadJSON(LS_DECISIONS, {});
    var handedOff = loadJSON(LS_HANDED_OFF, {});
    Object.keys(decisions).forEach(function (id) { handedOff[id] = true; });
    localStorage.setItem(LS_HANDED_OFF, JSON.stringify(handedOff));
    localStorage.setItem(LS_DECISIONS, JSON.stringify({}));
  }

  function pushSync(cb) {
    cb = cb || function () {};
    if (!global.SB) { cb({ error: "Not signed in / offline" }); return; }
    var rows = buildActionRows();
    if (!rows.length) { cb({ empty: true }); return; }
    global.SB.from("actions").insert(rows).then(function (res) {
      if (res && res.error) { cb({ error: res.error.message }); return; }
      markAllHandedOff();
      clearNotes();
      cb({ count: rows.length });
    }, function (err) {
      cb({ error: (err && err.message) || "failed" });
    });
  }

  // Insert a single action immediately (used by the item detail sheet so an
  // edit auto-syncs to the vault without the batch "Sync now" step). Optimistic
  // callers keep their own local copy for instant display regardless of result.
  function pushOne(row, cb) {
    cb = cb || function () {};
    if (!global.SB) { cb({ error: "offline" }); return; }
    global.SB.from("actions").insert([row]).then(function (res) {
      if (res && res.error) { cb({ error: res.error.message }); return; }
      cb({ ok: true });
    }, function (err) { cb({ error: (err && err.message) || "failed" }); });
  }

  global.DigestSync = { push: pushSync, pushOne: pushOne, buildRows: buildActionRows };
})(window);
