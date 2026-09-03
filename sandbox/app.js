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
      // A quick double navigation aborts the first transition; that's fine —
      // swallow the rejection so it doesn't spam the console.
      var vt = document.startViewTransition(doApply);
      if (vt && vt.finished && vt.finished.catch) vt.finished.catch(function () {});
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
      var vt = document.startViewTransition(function () { applyRoute(route); });
      if (vt && vt.finished && vt.finished.catch) vt.finished.catch(function () {});
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

  // ---- sandbox-only marker (path-based → never appears on the live app) ----
  // Shows the build stamp from env.js, so you always know WHICH sandbox you're
  // looking at. Tap = check the server for a newer stamp and reload if so; the
  // same check also runs once per load, silently (reload at most once per
  // served version, so a half-deployed Pages build can't loop us).
  if (global.location && global.location.pathname.indexOf("/sandbox/") !== -1) {
    var sbxVersion = function () { return (global.DD_ENV && global.DD_ENV.version) || "?"; };
    // Bypasses the HTTP cache (Pages: max-age=600) — the one gap the SW's
    // network-first can't close by itself.
    var servedVersion = function () {
      return fetch("env.js", { cache: "no-store" }).then(function (r) { return r.text(); })
        .then(function (t) { var m = t.match(/version: "([^"]*)"/); return m ? m[1] : null; });
    };
    // Newer build on the server: refresh the HTTP-cache entry of every shell
    // file (cache:"reload" re-fetches and overwrites it — a plain reload would
    // keep serving the max-age=600 copies), then reload. No SW needed, so it
    // also heals a page whose home.js failed to run.
    var refreshShell = function () {
      var urls = ["index.html"];
      var nodes = document.querySelectorAll("script[src], link[rel=stylesheet]");
      for (var i = 0; i < nodes.length; i++) {
        var u = nodes[i].src || nodes[i].href;
        if (u && u.indexOf(global.location.origin) === 0) urls.push(u);
      }
      return Promise.all(urls.map(function (u) { return fetch(u, { cache: "reload" }).catch(function () {}); }))
        .then(function () { global.location.reload(); });
    };
    var addSbx = function () {
      if (document.querySelector(".sbx-badge")) return;
      var b = document.createElement("div"); b.className = "sbx-badge";
      var label = function (suffix) { b.textContent = "SANDBOX · " + sbxVersion() + (suffix || ""); };
      label();
      b.setAttribute("role", "button");
      b.setAttribute("aria-label", "Sandbox " + sbxVersion() + " — tap to check for a newer build");
      b.addEventListener("click", function () {
        label(" …");
        servedVersion().then(function (v) {
          if (v && v !== sbxVersion()) { refreshShell(); return; }
          label(" ✓");
          setTimeout(function () { label(); }, 1500);
        }).catch(function () { label(); });
      });
      document.body.appendChild(b);
    };
    if (document.body) addSbx(); else document.addEventListener("DOMContentLoaded", addSbx);
    servedVersion().then(function (v) {
      if (!v || v === sbxVersion()) return;
      var key = k("reloadedFor");
      try { if (sessionStorage.getItem(key) === v) return; sessionStorage.setItem(key, v); } catch (e) {}
      refreshShell();
    }).catch(function () {});
  }

  // ---- service worker (installability + offline shell) ----
  // Auto-update: check for a new service worker on every load, and when one
  // takes control (the SW calls skipWaiting + clients.claim), reload once so
  // the new shell is used immediately — no more manually clearing the cache
  // after a deploy.
  if ("serviceWorker" in navigator) {
    var swReloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (swReloaded) return; swReloaded = true;
      // A new shell wants to take over, but never yank the app away while the
      // user is typing or has a sheet open — wait for an idle moment.
      var tryReload = function () {
        var ae = document.activeElement;
        var typing = ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.tagName === "SELECT" || ae.isContentEditable);
        // #utilFrameWrap:not([hidden]) = er staat een utility-app open in de
        // iframe. Een reload zou die midden in een oefening dichtgooien.
        if (typing || document.querySelector(".inline-form, .capture-sheet, .item-menu-overlay, .cal-editor-overlay, .detail-overlay, .card-menu-backdrop, #utilFrameWrap:not([hidden])")) {
          setTimeout(tryReload, 3000);
          return;
        }
        global.location.reload();
      };
      tryReload();
    });
    global.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").then(function (reg) {
        try { reg.update(); } catch (e) {}
        setInterval(function () { try { reg.update(); } catch (e) {} }, 60 * 60 * 1000);
      }).catch(function () {});
    });
  }
})(window);
