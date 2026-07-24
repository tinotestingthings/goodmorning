"use strict";

// Bump this on any shell-file change so old installs pick up the update.
var CACHE_NAME = "dd-sandbox-shell-v20";

var SHELL_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./theme.js",
  "./fx.js",
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
  "./home.js",
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
