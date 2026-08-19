(function () {
  "use strict";

  // The "Utilities" screen (internally still the "practice" route/view).
  // Rewritten 2026-08-17: was a single horizontal row of tabs that ran off the
  // edge of a phone screen, plus a "Finish →" button belonging to the old
  // morning loop. Now it opens on a launcher grid showing every utility app;
  // tapping one loads it in the same iframe, with a back button to the grid.

  var ICON = {
    notesprint:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l10-2v13"/><circle cx="6.5" cy="18" r="2.6"/><circle cx="16.5" cy="16" r="2.6"/></svg>',
    eartraining:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6.5 9H3.5v6h3L11 19z"/><path d="M15.5 9.2a4 4 0 0 1 0 5.6"/><path d="M18.2 6.4a8 8 0 0 1 0 11.2"/></svg>',
    kangaroo:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/></svg>',
    wine:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.5 3h9l-.7 6a3.8 3.8 0 0 1-7.6 0z"/><path d="M12 12.8V19"/><path d="M8.5 21h7"/></svg>',
    vogelspotinus:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.2 12.2a6 6 0 0 0-8.4-8.4L5 10.5V19h8.5z"/><path d="M16 8 2.5 21.5"/><path d="M17.5 15H9"/></svg>',
    events:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 2.5v4M16 2.5v4"/><path d="m12 12 1.2 2.4 2.6.4-1.9 1.8.5 2.6L12 18l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z"/></svg>',
    trainerinus:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
    attentinus:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="8" width="17" height="4"/><rect x="5.5" y="12" width="13" height="8.5"/><path d="M12 8v12.5"/><path d="M12 8c-1.8 0-4.5-.8-4.5-2.8C7.5 3.6 9 3 10 3c1.6 0 2 2.2 2 5zm0 0c1.8 0 4.5-.8 4.5-2.8C16.5 3.6 15 3 14 3c-1.6 0-2 2.2-2 5z"/></svg>'
  };

  var APPS = [
    { key: "trainerinus", label: "Trainerinus", url: "trainerinus/index.html" },
    { key: "notesprint", label: "NoteSprint", url: "notesprint/index.html" },
    { key: "eartraining", label: "ChordSprint", url: "ear-training/index.html" },
    { key: "kangaroo", label: "Kangaroo", url: "kangaroo/index.html" },
    { key: "wine", label: "WijnWijs", url: "wine/index.html" },
    { key: "vogelspotinus", label: "Vogelspotinus", url: "vogelspotinus/index.html" },
    { key: "events", label: "Events", url: "events/index.html" },
    { key: "attentinus", label: "Attentinus", url: "attentinus/index.html" }
  ];

  // Tegelformaat: vrij schaalbaar via een slider, bewaard per omgeving via k()
  // zodat sandbox en live elkaars voorkeur niet overschrijven. De waarde is de
  // minimale kolombreedte in px; alles in de kaart (icoon, label, padding)
  // schaalt in CSS mee via de --tile custom property.
  var LS_SIZE = k("utilTileSize");
  var SIZE_MIN = 60, SIZE_MAX = 240, SIZE_DEFAULT = 96;

  // Eerdere versie bewaarde "s"/"m"/"l" — die blijven werken.
  var LEGACY = { s: 74, m: 96, l: 128 };

  function currentSize() {
    var raw = localStorage.getItem(LS_SIZE);
    if (raw && LEGACY[raw]) return LEGACY[raw];
    var n = parseInt(raw, 10);
    if (!n || isNaN(n)) return SIZE_DEFAULT;
    return Math.min(SIZE_MAX, Math.max(SIZE_MIN, n));
  }

  var launcher = document.getElementById("utilLauncher");
  var frameWrap = document.getElementById("utilFrameWrap");
  var frame = document.getElementById("practiceFrame");
  var frameTitle = document.getElementById("utilFrameTitle");
  var backBtn = document.getElementById("utilBackBtn");
  var openLink = document.getElementById("openInNewTab");
  var grid = document.getElementById("utilGrid");
  var sizeRange = document.getElementById("utilSizeRange");

  function showGrid() {
    // Blank the iframe on the way out. ChordSprint and NoteSprint play audio,
    // and an iframe left mounted keeps playing behind the grid.
    if (frame.src && frame.src !== "about:blank") frame.src = "about:blank";
    frameWrap.hidden = true;
    launcher.hidden = false;
    frameTitle.textContent = "";
  }

  function openApp(app) {
    launcher.hidden = true;
    frameWrap.hidden = false;
    frameTitle.textContent = app.label;
    openLink.href = app.url;
    frame.src = app.url;
  }

  function applySize(px) {
    grid.style.setProperty("--tile", px + "px");
  }

  function initSize() {
    var size = currentSize();
    sizeRange.min = String(SIZE_MIN);
    sizeRange.max = String(SIZE_MAX);
    sizeRange.value = String(size);
    applySize(size);

    // "input" volgt de vinger tijdens het slepen; pas op "change" (los laten)
    // schrijven we weg, zodat slepen niet tientallen keren naar localStorage
    // schrijft.
    sizeRange.addEventListener("input", function () {
      applySize(parseInt(sizeRange.value, 10) || SIZE_DEFAULT);
    });
    sizeRange.addEventListener("change", function () {
      localStorage.setItem(LS_SIZE, String(parseInt(sizeRange.value, 10) || SIZE_DEFAULT));
    });
  }

  function buildGrid() {
    APPS.forEach(function (app) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "util-card";
      card.setAttribute("data-app", app.key);
      card.setAttribute("aria-label", "Open " + app.label);

      var ic = document.createElement("span");
      ic.className = "util-card-icon";
      ic.innerHTML = ICON[app.key] || "";
      card.appendChild(ic);

      var label = document.createElement("span");
      label.className = "util-card-label";
      label.textContent = app.label;
      card.appendChild(label);

      card.addEventListener("click", function () { openApp(app); });
      grid.appendChild(card);
    });
  }

  function init() {
    buildGrid();
    initSize();
    backBtn.addEventListener("click", showGrid);

    // Leaving the Utilities tab altogether also unloads the frame, so audio
    // from a practice app doesn't follow you to the home screen.
    window.addEventListener("hashchange", function () {
      var hash = (window.location.hash || "").replace(/^#\/?/, "");
      if (hash !== "practice" && !frameWrap.hidden) showGrid();
    });

    // Always land on the grid — that is the point of the launcher.
    if (window.App && App.onShow) App.onShow("practice", showGrid);
  }

  init();
})();
