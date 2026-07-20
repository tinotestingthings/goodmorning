(function () {
  "use strict";

  var LS_SELECTED = "dd.practice.selected";

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
  var iframeLoaded = false;

  function select(appKey) {
    var app = APPS[appKey];
    if (!app) return;
    localStorage.setItem(LS_SELECTED, appKey);
    if (iframeLoaded) frame.src = app.url; // only actually swap once shown
    openLink.href = app.url;
    tabs.forEach(function (tab) {
      tab.classList.toggle("active", tab.getAttribute("data-app") === appKey);
    });
  }

  function currentSelection() {
    var saved = localStorage.getItem(LS_SELECTED);
    return APPS[saved] ? saved : "notesprint";
  }

  function activate() {
    // Deferred until the Practice tab is actually opened — with all three
    // views mounted up front, eagerly loading NoteSprint's iframe at app
    // boot would mean loading a whole second site before Tinus even sees
    // the home screen. Loading it lazily keeps first open fast.
    DigestLoop.setStep("practice");
    if (!iframeLoaded) {
      iframeLoaded = true;
      frame.src = APPS[currentSelection()].url;
    }
  }

  function init() {
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        select(tab.getAttribute("data-app"));
      });
    });

    select(currentSelection());

    document.getElementById("continueBtn").addEventListener("click", function () {
      DigestLoop.markDoneToday();
      App.go("today");
    });

    if (window.App && App.onShow) {
      App.onShow("practice", activate);
    }
  }

  init();
})();
