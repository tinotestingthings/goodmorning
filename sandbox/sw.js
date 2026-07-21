"use strict";

// Bump this on any shell-file change so old installs pick up the update.
var CACHE_NAME = "dd-sandbox-shell-v3";

var SHELL_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./theme.js",
  "./settings.js",
  "./auth.js",
  "./loop.js",
  "./home.js",
  "./calendar.js",
  "./triage.js",
  "./practice.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(SHELL_FILES);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (n) { return n !== CACHE_NAME; })
             .map(function (n) { return caches.delete(n); })
      );
    }).then(function () { return self.clients.claim(); })
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

  // Everything else (app shell, iframe practice apps, icons) is cache-first
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
