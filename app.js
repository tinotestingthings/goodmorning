(function (global) {
  "use strict";

  // ---- single-shell router ----
  // Three views live in the same document (today / triage / practice) and
  // are shown/hidden in place instead of separate page loads. Route state
  // lives in location.hash so back/forward and deep links still work.

  var ROUTES = ["today", "calendar", "triage", "practice", "settings"];
  var DEFAULT_ROUTE = "today";
  var current = null;
  var showListeners = { today: [], calendar: [], triage: [], practice: [], settings: [] };

  function parseRoute() {
    var hash = (global.location.hash || "").replace(/^#\/?/, "");
    return ROUTES.indexOf(hash) !== -1 ? hash : DEFAULT_ROUTE;
  }

  function applyRoute(route) {
    ROUTES.forEach(function (r) {
      var section = document.getElementById("view-" + r);
      if (section) section.hidden = r !== route;
    });
    var buttons = document.querySelectorAll(".tab-btn");
    for (var i = 0; i < buttons.length; i++) {
      var active = buttons[i].getAttribute("data-route") === route;
      buttons[i].classList.toggle("active", active);
      buttons[i].setAttribute("aria-current", active ? "page" : "false");
    }
    current = route;
    showListeners[route].forEach(function (fn) { fn(); });
  }

  function navigate(route) {
    if (ROUTES.indexOf(route) === -1) route = DEFAULT_ROUTE;
    if (route === current) { applyRoute(route); return; }
    var doApply = function () { applyRoute(route); };
    if (global.location.hash !== "#/" + route) {
      global.location.hash = "/" + route;
      // hashchange listener below will call applyRoute; but also apply
      // immediately (with transition) so the UI doesn't wait a tick.
    }
    if (document.startViewTransition) {
      document.startViewTransition(doApply);
    } else {
      doApply();
    }
  }

  function onShow(route, fn) {
    if (showListeners[route]) showListeners[route].push(fn);
  }

  function setTriageBadge(count) {
    var badge = document.getElementById("triageBadge");
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }

  global.addEventListener("hashchange", function () {
    var route = parseRoute();
    if (route === current) return;
    if (document.startViewTransition) {
      document.startViewTransition(function () { applyRoute(route); });
    } else {
      applyRoute(route);
    }
  });

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".tab-btn");
    if (!btn) return;
    navigate(btn.getAttribute("data-route"));
  });

  global.App = {
    go: navigate,
    onShow: onShow,
    setTriageBadge: setTriageBadge,
    getRoute: function () { return current; }
  };

  function boot() {
    applyRoute(parseRoute());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // ---- service worker (installability + offline shell) ----
  if ("serviceWorker" in navigator) {
    global.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})(window);
