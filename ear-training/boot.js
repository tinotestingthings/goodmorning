(function () {
  "use strict";

  // ChordSprint auth gate + Supabase sync, with strict live/sandbox isolation.
  //
  // ChordSprint is a self-contained single-file app that persists to localStorage.
  // This boot layer runs BEFORE the app's own script (which is deferred as
  // <script type="application/gm-app" id="gm-app-code">), so it can:
  //   1. Gate on a valid Daily Digest session (same Supabase Auth, same origin).
  //   2. Namespace every one of the app's keys by environment — dd:* live,
  //      sbx:* sandbox — via a Storage shim, so sandbox testing can never touch
  //      live data (locally or in Supabase).
  //   3. Pull the per-user chordsprint_state row, seed localStorage, THEN run the app so
  //      it hydrates from the synced state; push (merge) on every change.
  // Public URL + publishable key only; real access control is Auth + RLS.
  var SUPABASE_URL = "https://bobltktjohhnoqhnxslf.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_8SE7JZJrNv_wG-8SN6_NNA_K4Mc0yuR";
  var TABLE = "chordsprint_state";
  var PREFIXES = ["cpt_"];          // logical key prefixes this app owns
  var APP_LABEL = "ChordSprint";
  var PUSH_DEBOUNCE_MS = 1500;

  var IS_SANDBOX = location.pathname.indexOf("/sandbox/") !== -1;
  var NS = IS_SANDBOX ? "sbx:" : "dd:";

  var SB = (window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      })
    : null;

  var userId = null, lastPushed = null, pushTimer = null, ready = false, ran = false;

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


  // Is this value effectively "no data"? Covers JSON values (wine/kangaroo) and
  // the raw localStorage strings the note/chord apps store.
  function blankVal(v) {
    if (v === null || v === undefined) return true;
    if (typeof v === "string") { var s = v.trim(); return s === "" || s === "null" || s === "[]" || s === "{}"; }
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === "object") return Object.keys(v).length === 0;
    return false;
  }

  function warn() { try { console.warn.apply(console, ["[" + APP_LABEL + "]"].concat([].slice.call(arguments))); } catch (e) {} }

  function pushNow() {
    if (!SB || !userId || !ready) return;
    var mine = snapshot();
    var cur = JSON.stringify(mine);
    if (cur === lastPushed) return;
    SB.from(TABLE).select("data").eq("user_id", userId).then(function (rd) {
      if (rd && rd.error) { warn("push read", rd.error.message); return; }
      var merged = (rd && rd.data && rd.data.length && rd.data[0].data) ? rd.data[0].data : {};
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
        .then(function (res) { if (res && res.error) { warn("push", res.error.message); return; } lastPushed = cur; },
              function (err) { warn("push", (err && err.message) || err); });
    }, function (err) { warn("push read", (err && err.message) || err); });
  }
  function schedulePush() { if (!ready) return; if (pushTimer) clearTimeout(pushTimer); pushTimer = setTimeout(pushNow, PUSH_DEBOUNCE_MS); }

  function pull(cb) {
    if (!SB || !userId) { cb && cb(); return; }
    SB.from(TABLE).select("data").eq("user_id", userId).then(function (res) {
      if (res && res.error) { warn("pull", res.error.message); cb && cb(false); return; }
      var row = res && res.data && res.data.length ? res.data[0] : null;
      var cur = JSON.stringify(snapshot());
      if (row && row.data && (lastPushed === null || cur === lastPushed)) { seed(row.data); lastPushed = JSON.stringify(snapshot()); }
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

  function runApp() {
    if (ran) return; ran = true;
    var code = document.getElementById("gm-app-code");
    if (!code) { warn("app code element missing"); return; }
    var s = document.createElement("script");
    s.textContent = code.textContent;
    document.body.appendChild(s);
  }

  var GT = "Sign in to use " + APP_LABEL;
  var GM_ = "Open the Daily Digest app and sign in — this unlocks with your account.";

  function onSignedIn(session) {
    userId = session.user.id;
    ungate();
    pull(function (ok) {
      // Never run the app on a failed pull: it would start from empty state and
      // the first write would wipe the server copy (2026-08-09 agenda incident).
      if (!ok) { gate("Couldn't load your progress", "You're online but the sync didn't answer. Reload to try again — nothing has been changed.", true); return; }
      lastPushed = JSON.stringify(snapshot()); ready = true; runApp();
    });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) pull(); });
    window.addEventListener("pagehide", function () { if (pushTimer) { clearTimeout(pushTimer); pushNow(); } });
    window.addEventListener("beforeunload", function () { if (pushTimer) { clearTimeout(pushTimer); pushNow(); } });
  }

  function boot() {
    patch();
    if (!SB) { gate("Can't reach the login service", "Check your connection and reload.", true); return; }
    SB.auth.getSession().then(function (res) {
      var s = res && res.data && res.data.session;
      if (s) onSignedIn(s); else gate(GT, GM_, false);
    }).catch(function () { gate(GT, GM_, false); });
    SB.auth.onAuthStateChange(function (event, session) {
      if (event === "SIGNED_OUT" || !session) { if (ran) location.reload(); else gate(GT, GM_, false); }
      else if (session && !ran) onSignedIn(session);
    });
  }

  patch(); // ensure the shim is active before the deferred app script runs
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
