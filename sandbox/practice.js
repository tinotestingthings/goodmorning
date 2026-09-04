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
    luisterinus:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></svg>',
    attentinus:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="8" width="17" height="4"/><rect x="5.5" y="12" width="13" height="8.5"/><path d="M12 8v12.5"/><path d="M12 8c-1.8 0-4.5-.8-4.5-2.8C7.5 3.6 9 3 10 3c1.6 0 2 2.2 2 5zm0 0c1.8 0 4.5-.8 4.5-2.8C16.5 3.6 15 3 14 3c-1.6 0-2 2.2-2 5z"/></svg>',
    elpatroon:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3H8L3.5 5.8 5.4 9.6 8 8.2V21h8V8.2l2.6 1.4 1.9-3.8L16 3h-1"/><path d="M9 3a3 3 0 0 0 6 0"/></svg>',
    sandbox:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h18"/><path d="M4.5 12 6 20h12l1.5-8"/><path d="M6.5 12V9.5a5.5 5.5 0 0 1 11 0V12"/><path d="M12 4v1.5"/></svg>',
    utrechttoen:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><rect x="9" y="7.5" width="6" height="4.5" rx="1"/><path d="M10.5 7.5V6.5h3v1"/></svg>'
  };

  var APPS = [
    { key: "trainerinus", label: "Trainerinus", url: "trainerinus/index.html" },
    { key: "notesprint", label: "NoteSprint", url: "notesprint/index.html" },
    { key: "eartraining", label: "ChordSprint", url: "ear-training/index.html" },
    { key: "kangaroo", label: "Kangaroo", url: "kangaroo/index.html" },
    { key: "wine", label: "WijnWijs", url: "wine/index.html" },
    { key: "vogelspotinus", label: "Vogelspotinus", url: "vogelspotinus/index.html" },
    { key: "events", label: "Events", url: "events/index.html" },
    { key: "attentinus", label: "Attentinus", url: "attentinus/index.html" },
    { key: "luisterinus", label: "Luisterinus", url: "luisterinus/index.html" },
    { key: "elpatroon", label: "El Patroon", url: "el-patroon/index.html" },
    { key: "utrechttoen", label: "Toen", url: "utrecht-toen/index.html" },
    // Zelfde code op live en sandbox: live linkt naar de sandbox, de sandbox
    // terug naar live. Opent in een nieuw venster — de hele app in een iframe
    // (auth, sw, hash-routes) is vragen om ellende.
    window.DD_ENV && DD_ENV.sandbox
      ? { key: "sandbox", label: "Live", url: "../", external: true }
      : { key: "sandbox", label: "Sandbox", url: "sandbox/", external: true }
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
    // Uitzondering (2026-08-23): Luisterinus is juist een luister-app — die
    // moet doorspelen als je terugloopt naar de grid, dus laten we gemount.
    var keepMounted = /luisterinus\//.test(frame.src || "");
    if (frame.src && frame.src !== "about:blank" && !keepMounted) frame.src = "about:blank";
    frameWrap.hidden = true;
    launcher.hidden = false;
    frameTitle.textContent = "";
    refreshPodcastBadge();
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

  // Luisterinus-badge: aantal podcasts dat klaarstaat en nog niet gehoord is,
  // als een iOS-notificatiebolletje. Geen sessie/tabel -> geen badge.
  function refreshPodcastBadge() {
    var card = grid.querySelector('[data-app="luisterinus"]');
    if (!card || !window.SB) return;
    if (launcher.hidden) return;   // grid niet in beeld: geen query per token-refresh
    var since = new Date(Date.now() - 14 * 86400000).toISOString();
    window.SB.from("podcast_queue").select("id", { count: "exact", head: true })
      .eq("status", "ready").is("listened_at", null).gte("requested_at", since).then(function (res) {  // klaar én ongehoord (besluit 22 aug)
      if (res.error) return;               // netwerk/tabel weg: bestaande badge laten staan
      var n = res.count || 0;
      var b = card.querySelector(".tile-badge");
      if (!n) { if (b) b.remove(); return; }
      if (!b) { b = document.createElement("span"); b.className = "tile-badge tile-badge-red"; card.appendChild(b); }
      b.textContent = String(n);
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

      card.addEventListener("click", function () {
        if (app.external) window.open(app.url, "_blank", "noopener");
        else openApp(app);
      });
      grid.appendChild(card);
    });
    // INITIAL_SESSION dekt de boot, SIGNED_IN de login, SIGNED_OUT haalt de badge
    // weg (anonieme select ziet niets). Daarnaast ververst showGrid bij elk bezoek.
    if (window.SB) window.SB.auth.onAuthStateChange(function () { refreshPodcastBadge(); });
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

    // Bij binnenkomst op de grid landen doet de hashchange hierboven al: die
    // blankt de iframe zodra je de tab verlaat, dus je komt altijd op de grid
    // terug. Deze onShow-luisteraar mag dus NOOIT meer showGrid() aanroepen.
    // Waarom (bug 2026-08-31: "Kangaroo/ChordSprint sluit vanzelf af"):
    // applyRoute() vuurt de show-luisteraars bij ELKE App.go(App.getRoute()),
    // en dat is de manier waarop agendasync (60s-poll), items.js en capture.js
    // "hertekenen" — geen navigatie. Een binnenkomende sync gooide zo midden
    // in een oefening de iframe op about:blank. Alleen de badge verversen.
    if (window.App && App.onShow) App.onShow("practice", refreshPodcastBadge);
  }

  init();
})();
