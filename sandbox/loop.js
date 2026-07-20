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

  // ---- morning notes (home dashboard scratch notes, exported with the queue) ----

  var LS_NOTES = "sbx.notes";
  var NOTE_KEYS = ["tasks", "projects", "radar"];

  function getNotes() {
    try {
      return JSON.parse(localStorage.getItem(LS_NOTES)) || {};
    } catch (e) {
      return {};
    }
  }

  function setNote(key, text) {
    var notes = getNotes();
    if (text && text.trim()) notes[key] = text;
    else delete notes[key];
    localStorage.setItem(LS_NOTES, JSON.stringify(notes));
  }

  function noteLines() {
    var notes = getNotes();
    var lines = [];
    NOTE_KEYS.forEach(function (key) {
      var t = (notes[key] || "").trim();
      if (t) lines.push("note [" + key + "]: " + t.replace(/\s*\n+\s*/g, "; "));
    });
    return lines;
  }

  function clearNotes() {
    localStorage.removeItem(LS_NOTES);
  }

  global.DigestNotes = {
    getNotes: getNotes,
    setNote: setNote,
    noteLines: noteLines,
    clearNotes: clearNotes
  };
})(window);
