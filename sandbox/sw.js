"use strict";

// Bump this on any shell-file change so old installs pick up the update.
// De cachenaam is per omgeving (2026-08-23): live en sandbox draaien op
// dezelfde origin en Cache Storage is origin-scoped, dus met één gedeelde naam
// wiste de activate van de één de offline-shell van de ander bij elke bump.
var IS_SANDBOX = self.registration.scope.indexOf("/sandbox/") !== -1;
var CACHE_PREFIX = (IS_SANDBOX ? "sbx" : "dd") + "-shell-";
var CACHE_NAME = CACHE_PREFIX + "v71";
var LEGACY_PREFIX = "dd-sandbox-shell-";   // de oude gedeelde naam; alleen live ruimt hem op

var SHELL_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./design.css",
  "./theme-sync.js",
  "./app.js",
  "./theme.js",
  "./fx.js",
  "./sheet.js",
  "./categories.js",
  "./ics.js",
  "./itemui.js",
  "./reminders.js",
  "./workweek.js",
  "./push.js",
  "./supabase.js",
  "./settings.js",
  "./auth.js",
  "./loop.js",
  "./itemdetail.js",
  "./items.js",
  "./items-seed.json",
  "./home.js",
  "./attentinus/dates.js",
  "./vogelspotinus/data/bird-tiles.json",
  "./calendar.js",
  "./triage.js",
  "./practice.js",
  "./capture.js",
  "./agendasync.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // Per bestand, niet addAll: die is atomair, dus één ontbrekend bestand
      // (bijv. na een gerichte promote) liet de hele install falen en dan
      // updatete de app nooit meer. Nu ontbreekt hooguit één cache-entry —
      // de fetch-handler haalt hem alsnog van het netwerk.
      return Promise.all(SHELL_FILES.map(function (f) {
        return cache.add(f).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      // Alleen onze eigen shell-caches opruimen. Een blinde "alles wat niet
      // CACHE_NAME heet" wist ook de caches van de utility-apps eronder
      // (notesprint/sw.js), waardoor hun offline-modus stilletjes stukging.
      return Promise.all(
        names.filter(function (n) {
          if (n === CACHE_NAME) return false;
          if (n.indexOf(CACHE_PREFIX) === 0) return true;
          // De oude gedeelde cache alleen door live laten opruimen, anders
          // wist de sandbox alsnog de shell van de ander.
          return !IS_SANDBOX && n.indexOf(LEGACY_PREFIX) === 0;
        }).map(function (n) { return caches.delete(n); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

// ---- push notifications ----
// The daily scheduled task sends a push (VAPID) when new triage cards land.
self.addEventListener("push", function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (e) { data = { body: event.data && event.data.text() }; }
  var title = data.title || "Daily Digest";
  var options = {
    body: data.body || "New items to triage.",
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    tag: data.tag || "dd-news",
    renotify: true,
    data: { url: data.url || "./#/triage" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var target = (event.notification.data && event.notification.data.url) || "./#/triage";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (c.url.indexOf(self.registration.scope) === 0 && "focus" in c) {
          if (c.navigate) { try { c.navigate(target); } catch (e) {} }
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});

self.addEventListener("fetch", function (event) {
  var url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  // feed.json changes daily and must never go stale offline-first: try the
  // network, fall back to the last cached copy only if the network fails.
  if (url.pathname.endsWith("feed.json")) {
    event.respondWith(
      fetch(event.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
        return res;
      }).catch(function () {
        return caches.match(event.request);
      })
    );
    return;
  }

  // App-shell bestanden (de HTML/JS/CSS direct onder de scope) en navigaties
  // gaan network-first met cache-fallback. Cache-first was hier fout: elke
  // deploy werd pas bij de TWEEDE keer openen zichtbaar, en index.html kon uit
  // de pas lopen met een nog gecachete practice.js — dat leverde precies één
  // leeg element op waar het script zijn inhoud in had moeten zetten.
  // Offline blijft werken via de fallback.
  var scopePath = new URL(self.registration.scope).pathname;
  var rel = url.pathname.indexOf(scopePath) === 0 ? url.pathname.slice(scopePath.length) : null;
  // 2026-08-17 (2): dit gold eerst alleen voor bestanden DIRECT onder de scope,
  // dus submappen als vogelspotinus/ en events/ bleven cache-first. Gevolg: na
  // een deploy draaide je daar nog de oude build, zonder enig zichtbaar teken.
  // Nu geldt network-first voor alle HTML/JS/CSS onder de scope, ongeacht diepte.
  // Afbeeldingen, iconen en de statische data-JSON blijven cache-first, want die
  // zijn groot en veranderen niet per deploy.
  var isShellFile = rel !== null && /\.(html|js|css)$/.test(rel);

  if (event.request.mode === "navigate" || isShellFile) {
    event.respondWith(
      fetch(event.request).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(event.request).then(function (cached) {
          return cached || caches.match("./index.html");
        });
      })
    );
    return;
  }

  // De rest (iframe-apps, iconen, bundles) blijft cache-first
  // with a background revalidate, so the app opens instantly even offline
  // and quietly updates itself for next time.
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      var network = fetch(event.request).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
