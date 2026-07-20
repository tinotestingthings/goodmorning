(function () {
  "use strict";

  var LS_SELECTED = "sbx.practice.selected";

  var APPS = {
    notesprint: {
      label: "NoteSprint",
      url: "https://tinotestingthings.github.io/gamify-note-reading/"
    },
    eartraining: {
      label: "ChordSprint",
      url: "ear-training/index.html"
    }
  };

  var frame = document.getElementById("practiceFrame");
  var openLink = document.getElementById("openInNewTab");
  var tabs = document.querySelectorAll(".practice-tab");

  function select(appKey) {
    var app = APPS[appKey];
    if (!app) return;
    localStorage.setItem(LS_SELECTED, appKey);
    frame.src = app.url;
    openLink.href = app.url;
    tabs.forEach(function (tab) {
      tab.classList.toggle("active", tab.getAttribute("data-app") === appKey);
    });
  }

  function init() {
    DigestLoop.setStep("practice");

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        select(tab.getAttribute("data-app"));
      });
    });

    var saved = localStorage.getItem(LS_SELECTED);
    select(APPS[saved] ? saved : "notesprint");

    document.getElementById("continueBtn").addEventListener("click", function () {
      window.location.href = "done.html";
    });
  }

  init();
})();
