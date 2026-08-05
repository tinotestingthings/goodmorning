(function () {
  "use strict";

  var LS_SELECTED = k("practice.selected");

  // The "Utilities" screen (internally still the "practice" route/view). Hosts
  // the two music apps plus the Kangaroo gym tracker. The morning loop only
  // ever opens the note game — see activate() below.
  var APPS = {
    notesprint: {
      label: "NoteSprint",
      url: "https://tinotestingthings.github.io/gamify-note-reading/"
    },
    eartraining: {
      label: "ChordSprint",
      url: "ear-training/index.html"
    },
    kangaroo: {
      label: "Kangaroo",
      url: "kangaroo/index.html"
    },
    wine: {
      label: "WijnWijs",
      url: "wine/index.html"
    }
  };

  var frame = document.getElementById("practiceFrame");
  var openLink = document.getElementById("openInNewTab");
  var tabs = document.querySelectorAll(".practice-tab");
  var iframeLoaded = false;

  // Show an app in the frame + highlight its tab. persist=true stores it as the
  // remembered Utilities choice; the morning-loop entry shows NoteSprint with
  // persist=false so it never overwrites the tab the user last picked here.
  function show(appKey, persist) {
    var app = APPS[appKey];
    if (!app) return;
    if (persist) localStorage.setItem(LS_SELECTED, appKey);
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
    // Deferred until the Utilities tab is actually opened — with all views
    // mounted up front, eagerly loading NoteSprint's iframe at app boot would
    // mean loading a whole second site before Tinus even sees the home screen.
    // Loading it lazily keeps first open fast.
    DigestLoop.setStep("practice");

    // Entry via the morning loop always opens the note game; a normal tap on
    // the Utilities tab restores whatever app was last selected. home.js sets
    // this transient flag right before navigating from the loop card.
    var loopEntry = window.__gmLoopPractice === true;
    window.__gmLoopPractice = false;
    var appKey = loopEntry ? "notesprint" : currentSelection();

    iframeLoaded = true;
    // Don't persist on loop entry, so the morning note game can't clobber the
    // user's remembered Utilities choice.
    show(appKey, false);
  }

  function init() {
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        show(tab.getAttribute("data-app"), true);
      });
    });

    // Highlight the default tab without loading its iframe yet (iframeLoaded
    // is still false here).
    show(currentSelection(), false);

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
