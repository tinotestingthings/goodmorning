(function (global) {
  "use strict";

  var LS_STEP = "dd.loop.step";
  var LS_COMPLETED_DATE = "dd.loop.completedDate";

  function getStep() {
    return localStorage.getItem(LS_STEP) || null;
  }

  function setStep(step) {
    localStorage.setItem(LS_STEP, step);
  }

  function clearStep() {
    localStorage.removeItem(LS_STEP);
    localStorage.removeItem(LS_COMPLETED_DATE);
  }

  function markDoneToday() {
    setStep("done");
    var d = new Date();
    var iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    localStorage.setItem(LS_COMPLETED_DATE, iso);
  }

  function getCompletedDate() {
    return localStorage.getItem(LS_COMPLETED_DATE);
  }

  global.DigestLoop = {
    getStep: getStep,
    setStep: setStep,
    clearStep: clearStep,
    markDoneToday: markDoneToday,
    getCompletedDate: getCompletedDate
  };

  // ---- morning notes (home dashboard scratch notes, exported with the queue) ----

  var LS_NOTES = "dd.notes";
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
