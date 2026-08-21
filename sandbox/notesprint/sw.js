/* NoteSprint offline shell.
 *
 * Network-first with a cache fallback: a promote is always picked up on the
 * next load (no stale-app footgun), but with no network the app shell and the
 * Supabase client still come from cache, which is what makes "works offline"
 * true. Scope is this app's folder, so live and sandbox never share a cache.
 */
var SCOPE = new URL(self.registration.scope).pathname;
var CACHE = "notesprint" + SCOPE.replace(/\//g, "-") + "v1";
var LIB = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
var SHELL = ["./", "./index.html", "./boot.js", LIB];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) {
        // One failure (offline install, CDN hiccup) must not abort the rest.
        return Promise.all(SHELL.map(function (url) {
          return fetch(url, { cache: "reload" })
            .then(function (res) { if (res && res.ok) return cache.put(url, res); })
            .catch(function () {});
        }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (names) {
        return Promise.all(names.map(function (name) {
          var mine = name.indexOf("notesprint" + SCOPE.replace(/\//g, "-")) === 0;
          return (mine && name !== CACHE) ? caches.delete(name) : null;
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);
  var isShell = (url.origin === self.location.origin && url.pathname.indexOf(SCOPE) === 0) || req.url.indexOf(LIB) === 0;
  if (!isShell) return;

  event.respondWith(
    fetch(req)
      .then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (cache) { cache.put(req, copy); }).catch(function () {});
        }
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (hit) {
          if (hit) return hit;
          // A deep link with no cached match still deserves the app shell.
          if (req.mode === "navigate") return caches.match(SCOPE + "index.html");
          return Response.error();
        });
      })
  );
});
