(function () {
  "use strict";

  // Kangaroo auth gate + Supabase sync.
  //
  // The gym app is a self-contained bundle that persists to localStorage under
  // "kangaroo-*" keys. This boot script wraps it so that:
  //   1. It only mounts for a signed-in Daily Digest user (same Supabase Auth
  //      session as the main app — this page is same-origin, so it reads the
  //      persisted session directly). No session -> no app, no data.
  //   2. Its data is mirrored to a per-user `kangaroo_state` row in Supabase
  //      (behind Row-Level Security), so it's the same everywhere and can be
  //      backed up to the vault. Local edits are pushed on change; the server
  //      copy is pulled on open + when the tab regains focus.
  //
  // Public URL + publishable key only (same values the main app ships). Real
  // access control is Supabase Auth + RLS, not hiding these.
  var SUPABASE_URL = "https://bobltktjohhnoqhnxslf.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_8SE7JZJrNv_wG-8SN6_NNA_K4Mc0yuR";
  var PREFIX = "kangaroo-";
  var PUSH_DEBOUNCE_MS = 1500;

  var SB = (window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      })
    : null;

  var userId = null;
  var mounted = false;
  var lastPushed = null;
  var pushTimer = null;

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

  // ---- localStorage snapshot of all kangaroo-* keys ----
  function snapshot() {
    var o = {};
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf(PREFIX) === 0) {
        try { o[key] = JSON.parse(localStorage.getItem(key)); } catch (e) { o[key] = null; }
      }
    }
    return o;
  }

  function seed(remote) {
    if (!remote || typeof remote !== "object") return;
    Object.keys(remote).forEach(function (key) {
      if (key.indexOf(PREFIX) !== 0) return;
      try {
        if (remote[key] === null) localStorage.removeItem(key);
        else localStorage.setItem(key, JSON.stringify(remote[key]));
      } catch (e) {}
    });
  }

  // ---- push (full upsert of this user's kangaroo keys; dedicated table) ----
  function pushNow() {
    if (!SB || !userId) return;
    var cur = JSON.stringify(snapshot());
    if (cur === lastPushed) return;
    var data;
    try { data = JSON.parse(cur); } catch (e) { return; }
    SB.from("kangaroo_state")
      .upsert({ user_id: userId, data: data, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
      .then(function (res) {
        if (res && res.error) { try { console.warn("[Kangaroo] push", res.error.message); } catch (e) {} return; }
        lastPushed = cur;
      }, function (err) { try { console.warn("[Kangaroo] push", (err && err.message) || err); } catch (e) {} });
  }

  function schedulePush() {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, PUSH_DEBOUNCE_MS);
  }

  function pull(cb) {
    if (!SB || !userId) { cb && cb(); return; }
    SB.from("kangaroo_state").select("data").eq("user_id", userId).then(function (res) {
      if (res && res.error) { try { console.warn("[Kangaroo] pull", res.error.message); } catch (e) {} cb && cb(); return; }
      var row = res && res.data && res.data.length ? res.data[0] : null;
      // Only overwrite local when we have nothing unpushed (local edits win).
      var cur = JSON.stringify(snapshot());
      if (row && row.data && (lastPushed === null || cur === lastPushed)) {
        seed(row.data);
        lastPushed = JSON.stringify(snapshot());
      }
      cb && cb();
    }, function (err) { try { console.warn("[Kangaroo] pull", (err && err.message) || err); } catch (e) {} cb && cb(); });
  }

  // ---- capture the app's own writes (storage events don't fire in the same
  // document, so patch setItem before the bundle loads) ----
  function patchStorage() {
    // Patch the prototype, not the instance: assigning localStorage.setItem
    // directly is treated as a stored item (not a method override) by the
    // Storage named-property setter. This iframe has its own Storage.prototype,
    // so the patch is scoped to the gym app and never touches the parent app.
    var proto = window.Storage && window.Storage.prototype
      ? window.Storage.prototype
      : Object.getPrototypeOf(localStorage);
    if (proto.__kangarooPatched) return;
    proto.__kangarooPatched = true;
    var origSet = proto.setItem;
    proto.setItem = function (key, val) {
      origSet.call(this, key, val);
      if (typeof key === "string" && key.indexOf(PREFIX) === 0) schedulePush();
    };
    var origRemove = proto.removeItem;
    proto.removeItem = function (key) {
      origRemove.call(this, key);
      if (typeof key === "string" && key.indexOf(PREFIX) === 0) schedulePush();
    };
  }

  function mountApp() {
    if (mounted) return;
    mounted = true;
    var s = document.createElement("script");
    s.src = "bundle.js";
    document.body.appendChild(s);
  }

  function onSignedIn(session) {
    userId = session.user.id;
    // pull first so the app hydrates from the server copy, THEN patch + mount.
    pull(function () {
      lastPushed = JSON.stringify(snapshot());
      patchStorage();
      mountApp();
    });
    // keep fresh when returning to the tab
    document.addEventListener("visibilitychange", function () { if (!document.hidden) pull(); });
    window.addEventListener("pagehide", function () { if (pushTimer) { clearTimeout(pushTimer); pushNow(); } });
    window.addEventListener("beforeunload", function () { if (pushTimer) { clearTimeout(pushTimer); pushNow(); } });
  }

  function boot() {
    if (!SB) {
      gate("Can't reach the login service", "Check your connection and reload.", true);
      return;
    }
    SB.auth.getSession().then(function (res) {
      var session = res && res.data && res.data.session;
      if (session) onSignedIn(session);
      else gate("Sign in to use Kangaroo", "Open the Daily Digest app and sign in — the gym tracker unlocks with your account.", false);
    }).catch(function () {
      gate("Sign in to use Kangaroo", "Open the Daily Digest app and sign in — the gym tracker unlocks with your account.", false);
    });

    SB.auth.onAuthStateChange(function (event, session) {
      if (event === "SIGNED_OUT" || !session) {
        if (mounted) location.reload(); // drop the app UI on sign-out
        else gate("Sign in to use Kangaroo", "Open the Daily Digest app and sign in — the gym tracker unlocks with your account.", false);
      } else if (session && !mounted) {
        onSignedIn(session);
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
