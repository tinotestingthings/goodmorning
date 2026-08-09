(function () {
  "use strict";

  // Kangaroo auth gate + Supabase sync, with strict live/sandbox isolation.
  //
  // The gym app is a self-contained bundle that persists to localStorage under
  // logical "kangaroo-*" keys. Live (served from the repo root) and the sandbox
  // (served under /sandbox/) are the SAME origin, so they share one localStorage
  // AND one per-user Supabase row. To keep sandbox testing from ever touching
  // live gym data, this boot layer namespaces every key by environment — exactly
  // like env.js does for the main app (dd. vs sbx.):
  //   * live   physical keys -> "dd:kangaroo-*"
  //   * sandbox physical keys -> "sbx:kangaroo-*"
  // The app still uses logical "kangaroo-*"; a thin Storage shim maps logical
  // reads/writes to the environment's physical keys. In Supabase both live under
  // one row, and each environment only ever reads/merges its OWN prefix, so a
  // push from one side can never overwrite the other's keys. The bundle is
  // untouched and stays portable.
  //
  // Public URL + publishable key only (same values the main app ships). Real
  // access control is Supabase Auth + Row-Level Security, not hiding these.
  var SUPABASE_URL = "https://bobltktjohhnoqhnxslf.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_8SE7JZJrNv_wG-8SN6_NNA_K4Mc0yuR";

  var IS_SANDBOX = location.pathname.indexOf("/sandbox/") !== -1;
  var NS = IS_SANDBOX ? "sbx:" : "dd:";
  var LOGICAL = "kangaroo-";       // what the app uses
  var PHYS = NS + LOGICAL;         // what actually gets stored ("dd:kangaroo-" / "sbx:kangaroo-")
  var PUSH_DEBOUNCE_MS = 1500;

  var SB = (window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      })
    : null;

  var userId = null;
  var mounted = false;
  var lastPushed = null;
  var primed = false;   // true only once a pull has SUCCEEDED
  var pushTimer = null;

  // Original Storage methods, captured once, used by the boot layer directly so
  // it always talks in PHYSICAL keys and never recurses through the shim.
  var proto = (window.Storage && window.Storage.prototype) || Object.getPrototypeOf(localStorage);
  var oGet = proto.getItem, oSet = proto.setItem, oRem = proto.removeItem;

  // ---- tiny gate UI ----
  function gate(title, msg, showReload) {
    var root = document.getElementById("root");
    if (!root) return;
    root.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.style.cssText = "min-height:100vh;display:flex;align-items:center;justify-content:center;" +
      "font-family:Arial,Helvetica,sans-serif;background:#f3f0e7;color:#121814;padding:2rem;text-align:center";
    var card = document.createElement("div");
    card.style.cssText = "max-width:22rem;line-height:1.5";
    var h = document.createElement("div");
    h.style.cssText = "font-size:2.4rem;margin-bottom:.5rem";
    h.textContent = "🦘🔒";
    var t = document.createElement("div");
    t.style.cssText = "font-size:1.05rem;font-weight:800;margin-bottom:.4rem";
    t.textContent = title;
    var p = document.createElement("div");
    p.style.cssText = "font-size:.9rem;color:#556158";
    p.textContent = msg;
    card.appendChild(h); card.appendChild(t); card.appendChild(p);
    if (showReload) {
      var b = document.createElement("button");
      b.textContent = "Reload";
      b.style.cssText = "margin-top:1rem;padding:.6rem 1.4rem;border:0;border-radius:24px;" +
        "background:#173c2b;color:#c9f45a;font-weight:800;cursor:pointer";
      b.onclick = function () { location.reload(); };
      card.appendChild(b);
    }
    wrap.appendChild(card);
    root.appendChild(wrap);
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

  // ---- snapshot / seed operate on PHYSICAL keys for THIS environment only ----
  function snapshot() {
    var o = {};
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf(PHYS) === 0) {
        try { o[key] = JSON.parse(oGet.call(localStorage, key)); } catch (e) { o[key] = null; }
      }
    }
    return o;
  }

  function seed(remote) {
    if (!remote || typeof remote !== "object") return;
    Object.keys(remote).forEach(function (key) {
      if (key.indexOf(PHYS) !== 0) return; // only this env's keys — never the other's
      try {
        if (remote[key] === null) oRem.call(localStorage, key);
        else oSet.call(localStorage, key, JSON.stringify(remote[key]));
      } catch (e) {}
    });
  }

  // ---- push: MERGE — read the row, overwrite ONLY our PHYS keys, write back, so
  // a live push can never wipe sandbox keys and vice versa (agenda_state pattern).
  function pushNow() {
    if (!SB || !userId) return;
    if (!primed) return;   // pre-pull state is not authoritative — never push it
    var mine = snapshot();
    var cur = JSON.stringify(mine);
    if (cur === lastPushed) return;
    SB.from("kangaroo_state").select("data").eq("user_id", userId).then(function (rd) {
      if (rd && rd.error) { warn("push read", rd.error.message); return; }
      var merged = (rd && rd.data && rd.data.length && rd.data[0].data) ? rd.data[0].data : {};
      // SAFETY NET (2026-08-09): never let an empty local state delete real
      // server data. This routine deletes our keys then re-adds whatever is in
      // localStorage, which is only correct if the pull actually populated it.
      // A failed pull used to leave local empty and the first write wiped the
      // row — exactly how the live agenda was lost. Refuse that push.
      var _srvHas = Object.keys(merged).some(function (key) { return key.indexOf(PHYS) === 0 && !blankVal(merged[key]); });
      var _locHas = Object.keys(mine).some(function (key) { return !blankVal(mine[key]); });
      if (_srvHas && !_locHas) { warn("refusing to push empty local state over existing server data"); return; }
      // drop any stale keys of ours, then set current ones
      Object.keys(merged).forEach(function (key) { if (key.indexOf(PHYS) === 0) delete merged[key]; });
      Object.keys(mine).forEach(function (key) { merged[key] = mine[key]; });
      SB.from("kangaroo_state")
        .upsert({ user_id: userId, data: merged, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
        .then(function (res) {
          if (res && res.error) { warn("push", res.error.message); return; }
          lastPushed = cur;
        }, function (err) { warn("push", msg(err)); });
    }, function (err) { warn("push read", msg(err)); });
  }

  function schedulePush() {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, PUSH_DEBOUNCE_MS);
  }

  function pull(cb) {
    if (!SB || !userId) { cb && cb(); return; }
    SB.from("kangaroo_state").select("data").eq("user_id", userId).then(function (res) {
      if (res && res.error) { warn("pull", res.error.message); cb && cb(false); return; }
      var row = res && res.data && res.data.length ? res.data[0] : null;
      var cur = JSON.stringify(snapshot());
      if (row && row.data && (lastPushed === null || cur === lastPushed)) {
        seed(row.data);
        lastPushed = JSON.stringify(snapshot());
      }
      cb && cb(true);
    }, function (err) { warn("pull", msg(err)); cb && cb(false); });
  }

  function msg(e) { return (e && e.message) || String(e); }
  function warn() { try { console.warn.apply(console, ["[Kangaroo]"].concat([].slice.call(arguments))); } catch (e) {} }

  // ---- Storage shim: map the app's logical "kangaroo-*" keys to this env's
  // physical keys, and trigger a push on writes. Patched on the prototype (the
  // iframe's own realm), so it never touches the parent app. ----
  function patchStorage() {
    if (proto.__kangarooPatched) return;
    proto.__kangarooPatched = true;
    proto.getItem = function (key) {
      if (typeof key === "string" && key.indexOf(LOGICAL) === 0 && key.indexOf(NS) !== 0) {
        return oGet.call(this, NS + key);
      }
      return oGet.call(this, key);
    };
    proto.setItem = function (key, val) {
      if (typeof key === "string" && key.indexOf(LOGICAL) === 0 && key.indexOf(NS) !== 0) {
        oSet.call(this, NS + key, val);
        schedulePush();
        return;
      }
      oSet.call(this, key, val);
    };
    proto.removeItem = function (key) {
      if (typeof key === "string" && key.indexOf(LOGICAL) === 0 && key.indexOf(NS) !== 0) {
        oRem.call(this, NS + key);
        schedulePush();
        return;
      }
      oRem.call(this, key);
    };
  }

  function mountApp() {
    if (mounted) return;
    mounted = true;
    var s = document.createElement("script");
    s.src = "bundle.js";
    document.body.appendChild(s);
  }

  var GATE_TITLE = "Sign in to use Kangaroo";
  var GATE_MSG = "Open the Daily Digest app and sign in — the gym tracker unlocks with your account.";

  function onSignedIn(session) {
    userId = session.user.id;
    pull(function (ok) {
      // A failed pull must NOT mount the app: it would run on empty state and
      // the first write would push that emptiness over the server copy.
      if (!ok) { gate("Couldn't load your gym data", "You're online but the sync didn't answer. Reload to try again — nothing has been changed.", true); return; }
      primed = true;
      lastPushed = JSON.stringify(snapshot());
      patchStorage();
      mountApp();
    });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) pull(); });
    window.addEventListener("pagehide", function () { if (pushTimer) { clearTimeout(pushTimer); pushNow(); } });
    window.addEventListener("beforeunload", function () { if (pushTimer) { clearTimeout(pushTimer); pushNow(); } });
  }

  function boot() {
    if (!SB) { gate("Can't reach the login service", "Check your connection and reload.", true); return; }
    SB.auth.getSession().then(function (res) {
      var session = res && res.data && res.data.session;
      if (session) onSignedIn(session);
      else gate(GATE_TITLE, GATE_MSG, false);
    }).catch(function () { gate(GATE_TITLE, GATE_MSG, false); });

    SB.auth.onAuthStateChange(function (event, session) {
      if (event === "SIGNED_OUT" || !session) {
        if (mounted) location.reload();
        else gate(GATE_TITLE, GATE_MSG, false);
      } else if (session && !mounted) {
        onSignedIn(session);
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
