(function () {
  "use strict";

  // NoteSprint auth gate + Supabase sync, with strict live/sandbox isolation.
  //
  // NoteSprint is a self-contained single-file app that persists to localStorage.
  // This boot layer runs BEFORE the app's own script (which is deferred as
  // <script type="application/gm-app" id="gm-app-code">), so it can:
  //   1. Gate on a valid Daily Digest session (same Supabase Auth, same origin).
  //   2. Namespace every one of the app's keys by environment — dd:* live,
  //      sbx:* sandbox — via a Storage shim, so sandbox testing can never touch
  //      live data (locally or in Supabase).
  //   3. Pull the per-user notesprint_state row, seed localStorage, THEN run the app so
  //      it hydrates from the synced state; push (merge) on every change.
  //   4. Keep working with no network: sw.js caches the shell + the Supabase
  //      client, and a device that already holds synced data may practise
  //      offline. Offline writes set a dirty flag so the next online load
  //      pushes them up instead of seeding the (older) server copy over them.
  // Public URL + publishable key only; real access control is Auth + RLS.
  var SUPABASE_URL = "https://bobltktjohhnoqhnxslf.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_8SE7JZJrNv_wG-8SN6_NNA_K4Mc0yuR";
  var TABLE = "notesprint_state";
  var PREFIXES = ["noteSprint","noteReader"];          // logical key prefixes this app owns
  var APP_LABEL = "NoteSprint";
  var PUSH_DEBOUNCE_MS = 1500;
  var KEEPALIVE_MAX_BYTES = 60000;                     // browsers cap keepalive bodies near 64 KB
  var SERVER_ROW_FRESH_MS = 5 * 60 * 1000;             // how long a read of the row stays trustworthy

  var IS_SANDBOX = location.pathname.indexOf("/sandbox/") !== -1;
  var NS = IS_SANDBOX ? "sbx:" : "dd:";
  // Deliberately NOT under an app prefix: this flag is per-device bookkeeping
  // and must never travel to the server or to another device.
  var DIRTY_KEY = NS + "gmOfflineDirty";

  var SB = (window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      })
    : null;

  var userId = null, accessToken = null, lastPushed = null, pushTimer = null;
  var ready = false, ran = false, offline = false;
  var serverOther = {};   // keys of the *other* environment, preserved on every write
  var serverOtherAt = 0;  // when that copy was last read from the server

  var proto = (window.Storage && window.Storage.prototype) || Object.getPrototypeOf(localStorage);
  var oGet = proto.getItem, oSet = proto.setItem, oRem = proto.removeItem;

  function isLogical(key) { return typeof key === "string" && PREFIXES.some(function (p) { return key.indexOf(p) === 0; }); }
  function isPhysical(key) { return typeof key === "string" && PREFIXES.some(function (p) { return key.indexOf(NS + p) === 0; }); }

  // ---- Storage shim: map the app's logical keys to this env's physical keys
  // and schedule a push on writes. Scoped to this document's realm. ----
  function patch() {
    if (proto.__gmSyncPatched) return;
    proto.__gmSyncPatched = true;
    proto.getItem = function (key) {
      if (isLogical(key) && key.indexOf(NS) !== 0) return oGet.call(this, NS + key);
      return oGet.call(this, key);
    };
    proto.setItem = function (key, val) {
      if (isLogical(key) && key.indexOf(NS) !== 0) { oSet.call(this, NS + key, val); schedulePush(); return; }
      oSet.call(this, key, val);
    };
    proto.removeItem = function (key) {
      if (isLogical(key) && key.indexOf(NS) !== 0) { oRem.call(this, NS + key); schedulePush(); return; }
      oRem.call(this, key);
    };
  }

  // Raw-string snapshot of this env's physical keys (values kept as stored, so
  // non-JSON values like a plain theme string round-trip losslessly).
  function snapshot() {
    var o = {};
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (isPhysical(key)) o[key] = oGet.call(localStorage, key);
    }
    return o;
  }
  function seed(remote) {
    if (!remote || typeof remote !== "object") return;
    Object.keys(remote).forEach(function (key) {
      if (!isPhysical(key)) return;
      try { if (remote[key] == null) oRem.call(localStorage, key); else oSet.call(localStorage, key, String(remote[key])); } catch (e) {}
    });
  }
  // Everything in the row that isn't ours (the other environment's copy) has to
  // survive our writes — both envs share one row per user.
  function rememberServer(data) {
    if (!data || typeof data !== "object") return;
    var keep = {};
    Object.keys(data).forEach(function (key) { if (!isPhysical(key)) keep[key] = data[key]; });
    serverOther = keep;
    serverOtherAt = Date.now();
  }
  function mergedPayload() {
    var out = {};
    Object.keys(serverOther).forEach(function (key) { out[key] = serverOther[key]; });
    var mine = snapshot();
    Object.keys(mine).forEach(function (key) { out[key] = mine[key]; });
    return out;
  }

  // Is this value effectively "no data"? Covers JSON values (wine/kangaroo) and
  // the raw localStorage strings the note/chord apps store.
  function blankVal(v) {
    if (v === null || v === undefined) return true;
    if (typeof v === "string") { var s = v.trim(); return s === "" || s === "null" || s === "[]" || s === "{}"; }
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === "object") return Object.keys(v).length === 0;
    return false;
  }
  function localHasData() {
    var mine = snapshot();
    return Object.keys(mine).some(function (key) { return !blankVal(mine[key]); });
  }
  // supabase-js persists the session itself; its presence is enough to know this
  // device was signed in, which is all we can check with no network.
  function hasStoredSession() {
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf("sb-") === 0 && key.indexOf("-auth-token") !== -1) {
        var v = oGet.call(localStorage, key);
        if (v && v.length > 20) return true;
      }
    }
    return false;
  }

  function isDirty() { try { return oGet.call(localStorage, DIRTY_KEY) === "1"; } catch (e) { return false; } }
  function markDirty() { try { oSet.call(localStorage, DIRTY_KEY, "1"); } catch (e) {} }
  function clearDirty() { try { oRem.call(localStorage, DIRTY_KEY); } catch (e) {} }

  function warn() { try { console.warn.apply(console, ["[" + APP_LABEL + "]"].concat([].slice.call(arguments))); } catch (e) {} }

  function pushNow() {
    if (!SB || !userId || !ready || offline) return;
    var mine = snapshot();
    var cur = JSON.stringify(mine);
    if (cur === lastPushed) return;
    SB.from(TABLE).select("data").eq("user_id", userId).then(function (rd) {
      if (rd && rd.error) { warn("push read", rd.error.message); markDirty(); return; }
      var merged = (rd && rd.data && rd.data.length && rd.data[0].data) ? rd.data[0].data : {};
      rememberServer(merged);
      // SAFETY NET (2026-08-09): never let an empty local state delete real
      // server data. This routine deletes our keys then re-adds whatever is in
      // localStorage, which is only correct if the pull actually populated it.
      // A failed pull used to leave local empty and the first write wiped the
      // row — exactly how the live agenda was lost. Refuse that push.
      var _srvHas = Object.keys(merged).some(function (key) { return isPhysical(key) && !blankVal(merged[key]); });
      var _locHas = Object.keys(mine).some(function (key) { return !blankVal(mine[key]); });
      if (_srvHas && !_locHas) { warn("refusing to push empty local state over existing server data"); return; }
      Object.keys(merged).forEach(function (key) { if (isPhysical(key)) delete merged[key]; });
      Object.keys(mine).forEach(function (key) { merged[key] = mine[key]; });
      SB.from(TABLE).upsert({ user_id: userId, data: merged, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
        .then(function (res) { if (res && res.error) { warn("push", res.error.message); markDirty(); return; } lastPushed = cur; clearDirty(); },
              function (err) { warn("push", (err && err.message) || err); markDirty(); });
    }, function (err) { warn("push read", (err && err.message) || err); markDirty(); });
  }
  function schedulePush() {
    if (!ready) return;
    // Offline: keep the work locally and remember that the server is behind.
    if (offline) { markDirty(); return; }
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, PUSH_DEBOUNCE_MS);
  }

  // Unload flush. pushNow()'s read-then-upsert is two round trips and the
  // browser kills in-flight requests on unload, so the last debounced changes
  // (a fresh highscore, new mistakes) could silently never arrive. A single
  // keepalive POST is allowed to outlive the page; it merges against the last
  // known server row instead of reading first.
  //
  // Three things make that shortcut safe to take:
  //   - the row holds BOTH environments' keys, so an upsert without a fresh
  //     read would replay a stale copy of the other environment over its newer
  //     data. We only take the shortcut while that copy is recent.
  //   - the body must fit the browser's keepalive budget.
  //   - success is never assumed: lastPushed only moves once the POST answers,
  //     and a failure marks the device dirty so the next load pushes instead of
  //     seeding the older server copy over this work.
  // When any of that doesn't hold we fall back to pushNow() (correct, but it
  // dies on a hard unload) and mark dirty first, so nothing is silently lost.
  function flush() {
    if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
    if (!ready || !userId || offline) return;
    var cur = JSON.stringify(snapshot());
    if (cur === lastPushed) return;
    var otherFresh = !Object.keys(serverOther).length || (Date.now() - serverOtherAt) <= SERVER_ROW_FRESH_MS;
    var body = JSON.stringify({ user_id: userId, data: mergedPayload(), updated_at: new Date().toISOString() });
    if (accessToken && typeof fetch === "function" && otherFresh && body.length <= KEEPALIVE_MAX_BYTES) {
      try {
        fetch(SUPABASE_URL + "/rest/v1/" + TABLE + "?on_conflict=user_id", {
          method: "POST",
          keepalive: true,
          headers: {
            "apikey": SUPABASE_PUBLISHABLE_KEY,
            "Authorization": "Bearer " + accessToken,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal"
          },
          body: body
        }).then(function (res) {
          // On a hard unload this never runs and the POST still completes --
          // that's what keepalive is for. On visibilitychange (the usual case
          // on iOS) the page is alive, so a failure is caught here.
          if (res && (res.ok || res.status === 204)) { lastPushed = cur; clearDirty(); }
          else { warn("flush", res && res.status); markDirty(); }
        }, function (err) { warn("flush", (err && err.message) || err); markDirty(); });
        return;
      } catch (e) { warn("flush", (e && e.message) || e); }
    }
    markDirty();
    pushNow();
  }

  function pull(cb) {
    if (!SB || !userId) { cb && cb(false); return; }
    SB.from(TABLE).select("data").eq("user_id", userId).then(function (res) {
      if (res && res.error) { warn("pull", res.error.message); cb && cb(false); return; }
      var row = res && res.data && res.data.length ? res.data[0] : null;
      if (row && row.data) rememberServer(row.data);
      var cur = JSON.stringify(snapshot());
      // Local wins while it holds work that never reached the server (an
      // offline session); otherwise the server copy is authoritative.
      if (row && row.data && !isDirty() && (lastPushed === null || cur === lastPushed)) {
        seed(row.data);
        lastPushed = JSON.stringify(snapshot());
      }
      cb && cb(true);
    }, function (err) { warn("pull", (err && err.message) || err); cb && cb(false); });
  }

  function gate(title, msg, showReload) {
    var o = document.createElement("div");
    o.id = "gm-gate";
    o.style.cssText = "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;" +
      "font-family:-apple-system,Arial,sans-serif;background:#0f1115;color:#e7e9ee;padding:2rem;text-align:center";
    var inner = "<div style='max-width:22rem;line-height:1.5'><div style='font-size:2.4rem'>🎵🔒</div>" +
      "<div style='font-size:1.05rem;font-weight:800;margin:.5rem 0 .3rem'>" + title + "</div>" +
      "<div style='font-size:.9rem;color:#9aa0ac'>" + msg + "</div>" +
      (showReload ? "<div><button onclick='location.reload()' style='margin-top:1rem;padding:.6rem 1.4rem;border:0;border-radius:24px;background:#3b82f6;color:#fff;font-weight:800;cursor:pointer'>Reload</button></div>" : "") +
      "</div>";
    o.innerHTML = inner;
    if (document.body) document.body.appendChild(o); else document.addEventListener("DOMContentLoaded", function () { document.body.appendChild(o); });
  }
  function ungate() { var o = document.getElementById("gm-gate"); if (o && o.parentNode) o.parentNode.removeChild(o); }

  function notice(text) {
    var bar = document.getElementById("gm-offline-note");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "gm-offline-note";
      bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:99998;padding:.55rem .9rem;" +
        "font-family:-apple-system,Arial,sans-serif;font-size:.78rem;font-weight:700;text-align:center;" +
        "background:rgba(17,24,39,0.94);color:#e7e9ee";
      bar.addEventListener("click", function () { bar.style.display = "none"; });
      if (document.body) document.body.appendChild(bar);
      else document.addEventListener("DOMContentLoaded", function () { document.body.appendChild(bar); });
    }
    bar.textContent = text;
    bar.style.display = "";
  }
  function hideNotice() { var bar = document.getElementById("gm-offline-note"); if (bar) bar.style.display = "none"; }

  function runApp() {
    if (ran) return; ran = true;
    var code = document.getElementById("gm-app-code");
    if (!code) { warn("app code element missing"); return; }
    var s = document.createElement("script");
    s.textContent = code.textContent;
    document.body.appendChild(s);
  }

  // Run from the last synced copy on this device. Only ever reached when that
  // copy actually holds data, so the empty-state wipe of 2026-08-09 can't recur.
  function startOffline(message) {
    offline = true;
    ready = true;
    lastPushed = JSON.stringify(snapshot());
    ungate();
    runApp();
    notice(message);
  }
  function backOnline() {
    if (!offline) return;
    if (!SB || !userId) { notice("Back online — reload to sync your progress."); return; }
    pull(function (ok) {
      if (!ok) return;
      offline = false;
      hideNotice();
      schedulePush();   // dirty flag is still set, so this sends the offline work up
    });
  }

  var GT = "Sign in to use " + APP_LABEL;
  var GM_ = "Open the Daily Digest app and sign in — this unlocks with your account.";

  function onSignedIn(session) {
    userId = session.user.id;
    accessToken = session.access_token || null;
    ungate();
    pull(function (ok) {
      // Never run the app on a failed pull with nothing local: it would start
      // from empty state and the first write would wipe the server copy
      // (2026-08-09 agenda incident). With a local copy it's safe to continue.
      if (!ok) {
        if (localHasData()) { startOffline("Offline — progress is saved on this device and syncs when you're back online."); return; }
        gate("Couldn't load your progress", "You're online but the sync didn't answer. Reload to try again — nothing has been changed.", true);
        return;
      }
      // With offline work pending, lastPushed must NOT match the current
      // snapshot — otherwise pushNow() sees "nothing changed" and that work
      // never leaves the device.
      var pending = isDirty();
      lastPushed = pending ? null : JSON.stringify(snapshot());
      ready = true;
      if (pending) schedulePush();   // work from an earlier offline session
      runApp();
    });
    // Op iOS vuren pagehide/beforeunload vaak niet: wegswipen of het scherm
    // vergrendelen geeft alleen visibilitychange, waarna het tabblad bevriest
    // en later wordt weggegooid. Dit is het enige moment waarop werk binnen de
    // debounce nog weg kan.
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) flush();
      else if (offline) backOnline();
      else pull();
    });
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || location.protocol.indexOf("http") !== 0) return;
    // Relative path -> scope is this app's folder, so live and sandbox keep
    // separate caches and can never serve each other's shell.
    try { navigator.serviceWorker.register("sw.js").catch(function () {}); } catch (e) {}
  }

  function boot() {
    patch();
    registerServiceWorker();
    window.addEventListener("online", backOnline);
    if (!SB) {
      // The Supabase client itself didn't load (offline before sw.js had cached
      // it, or the CDN is blocked). A device that was signed in and already
      // holds synced data may still practise.
      if (hasStoredSession() && localHasData()) {
        startOffline("Offline — progress is saved on this device. Reload once you're back online to sync.");
        return;
      }
      gate("Can't reach the login service", "Check your connection and reload.", true);
      return;
    }
    SB.auth.getSession().then(function (res) {
      var s = res && res.data && res.data.session;
      if (s) onSignedIn(s); else gate(GT, GM_, false);
    }).catch(function () { gate(GT, GM_, false); });
    SB.auth.onAuthStateChange(function (event, session) {
      if (event === "SIGNED_OUT" || !session) { if (ran) location.reload(); else gate(GT, GM_, false); }
      else if (session && !ran) onSignedIn(session);
      else if (session && session.access_token) accessToken = session.access_token;
    });
  }

  patch(); // ensure the shim is active before the deferred app script runs
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
