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
})(window);
