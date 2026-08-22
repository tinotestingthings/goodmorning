// theme-sync.js — utility-apps dragen het thema dat in de hoofdapp gekozen is.
// theme.js (hoofdapp) schrijft het actieve thema weg onder <ns>themeActive;
// dit script leest het vóór de eerste paint en zet <html data-theme>. De
// paletten staan in design.css. Geen opgeslagen thema -> design.css volgt het
// systeem. Namespace komt uit het pad, net als env.js (nooit hardcoden).
(function () {
  try {
    var ns = (location.pathname.indexOf("/sandbox/") !== -1 ? "sbx" : "dd") + ".";
    var t = localStorage.getItem(ns + "themeActive");
    if (t) document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}
})();
