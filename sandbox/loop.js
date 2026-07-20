(function (global) {
  "use strict";

  var LS_STEP = "sbx.loop.step";
  var LS_COMPLETED_DATE = "sbx.loop.completedDate";
  var LS_STREAK = "sbx.loop.streak";

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
  var LS_NOTES = "sbx.notes";
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
})(window);
