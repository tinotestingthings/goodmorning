(function () {
  "use strict";

  // Trainerinus auth gate + Supabase sync, with strict live/sandbox isolation.
  //
  // Same boot pattern as NoteSprint: gate on a valid Daily Digest session,
  // namespace every app key by environment (dd:* live, sbx:* sandbox) via a
  // Storage shim, pull the per-user trainerinus_state row, seed localStorage,
  // THEN run the app; push (merge) on every change.
  //
  // One deliberate difference: Trainerinus is a read-mostly dashboard whose
  // own state is just observation history. If the trainerinus_state table does
  // not exist yet (it must be created once in the Supabase dashboard — see
  // README.md next to this file), the app still runs, local-only, with pushes
  // disabled, and says so in its settings panel. Any OTHER pull failure keeps
  // the hard gate: never run on a failed pull (2026-08-09 agenda incident).
  var SUPABASE_URL = "https://bobltktjohhnoqhnxslf.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_8SE7JZJrNv_wG-8SN6_NNA_K4Mc0yuR";
  var TABLE = "trainerinus_state";
  var PREFIXES = ["trainerinus."];     // logical key prefixes this app owns
  var APP_LABEL = "Trainerinus";
  var PUSH_DEBOUNCE_MS = 1500;

  var IS_SANDBOX = location.pathname.indexOf("/sandbox/") !== -1;

  // Demo-modus: ALLEEN op localhost, met ?demo in de URL. Geen login nodig,
  // nep-Supabase met vaste voorbeeldrijen, en een eigen "demo:"-namespace
  // zodat echte dd:/sbx:-state nooit wordt gelezen of beschreven. Handig om
  // lokaal te testen zonder Daily Digest-sessie.
  var DEMO = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && /[?&]demo\b/.test(location.search);
  var NS = DEMO ? "demo:" : (IS_SANDBOX ? "sbx:" : "dd:");

  var SB = (window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      })
    : null;

  var userId = null, lastPushed = null, pushTimer = null, ready = false, ran = false;
  var syncOff = false;      // true when trainerinus_state is unusable: run local-only
  var syncReason = null;    // "missing" (table absent) | "grant" (no privileges)

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

  function blankVal(v) {
    if (v === null || v === undefined) return true;
    if (typeof v === "string") { var s = v.trim(); return s === "" || s === "null" || s === "[]" || s === "{}"; }
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === "object") return Object.keys(v).length === 0;
    return false;
  }

  function warn() { try { console.warn.apply(console, ["[" + APP_LABEL + "]"].concat([].slice.call(arguments))); } catch (e) {} }

  // PostgREST meldt een onbruikbare tabel op twee manieren: hij bestaat niet
  // (PGRST205 / relation does not exist), of de rol mist rechten (42501
  // "permission denied" — wat je krijgt na een kale `create table` zonder
  // GRANT). Beide zijn eenmalige setup-problemen, geen transiënte storing:
  // de app draait dan lokaal door met sync uit (en dus zonder ooit te pushen).
  function tableProblem(err) {
    var m = ((err && err.message) || "") + " " + ((err && err.code) || "");
    if (/permission denied|42501/i.test(m)) return "grant";
    if (/could not find the table|does not exist|schema cache|PGRST205/i.test(m)) return "missing";
    return null;
  }

  function pushNow() {
    if (!SB || !userId || !ready || syncOff) return;
    var mine = snapshot();
    var cur = JSON.stringify(mine);
    if (cur === lastPushed) return;
    SB.from(TABLE).select("data").eq("user_id", userId).then(function (rd) {
      if (rd && rd.error) { warn("push read", rd.error.message); return; }
      var merged = (rd && rd.data && rd.data.length && rd.data[0].data) ? rd.data[0].data : {};
      // SAFETY NET: never let an empty local state delete real server data.
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
      if (res && res.error) {
        var prob = tableProblem(res.error);
        if (prob) { syncOff = true; syncReason = prob; warn("tabel onbruikbaar (" + prob + ") — lokaal draaien:", res.error.message); cb && cb(true); return; }
        warn("pull", res.error.message); cb && cb(false); return;
      }
      var row = res && res.data && res.data.length ? res.data[0] : null;
      var cur = JSON.stringify(snapshot());
      if (row && row.data && (lastPushed === null || cur === lastPushed)) { seed(row.data); lastPushed = JSON.stringify(snapshot()); }
      cb && cb(true);
    }, function (err) { warn("pull", (err && err.message) || err); cb && cb(false); });
  }

  function gate(title, msg, showReload) {
    if (window.Launch) Launch.done();
    var o = document.getElementById("gm-gate");
    if (o && o.parentNode) o.parentNode.removeChild(o);
    o = document.createElement("div");
    o.id = "gm-gate";
    o.style.cssText = "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;" +
      "font-family:-apple-system,Arial,sans-serif;background:#0f1115;color:#e7e9ee;padding:2rem;text-align:center";
    var inner = "<div style='max-width:22rem;line-height:1.5'><div style='font-size:2.4rem'>🎯🔒</div>" +
      "<div style='font-size:1.05rem;font-weight:800;margin:.5rem 0 .3rem'>" + title + "</div>" +
      "<div style='font-size:.9rem;color:#9aa0ac'>" + msg + "</div>" +
      (showReload ? "<div><button onclick='location.reload()' style='margin-top:1rem;padding:.6rem 1.4rem;border:0;border-radius:24px;background:#3b82f6;color:#fff;font-weight:800;cursor:pointer'>Opnieuw laden</button></div>" : "") +
      "</div>";
    o.innerHTML = inner;
    if (document.body) document.body.appendChild(o); else document.addEventListener("DOMContentLoaded", function () { document.body.appendChild(o); });
  }
  function ungate() { var o = document.getElementById("gm-gate"); if (o && o.parentNode) o.parentNode.removeChild(o); }

  function runApp() {
    if (ran) return; ran = true;
    // Handles the app uses to talk to Supabase (read-only peeks at the other
    // trainer apps' state tables) without creating a second client.
    window.__gmTrainer = { sb: SB, userId: userId, ns: NS, isSandbox: IS_SANDBOX, syncOff: syncOff, syncReason: syncReason, demo: DEMO };
    var code = document.getElementById("gm-app-code");
    if (!code) { warn("app code element missing"); return; }
    var s = document.createElement("script");
    s.textContent = code.textContent;
    document.body.appendChild(s);
    if (window.Launch) Launch.done();
  }

  var GT = "Log in om " + APP_LABEL + " te gebruiken";
  var GM_ = "Open de Daily Digest-app en log in — dit scherm ontgrendelt met je account.";

  function onSignedIn(session) {
    userId = session.user.id;
    ungate();
    pull(function (ok) {
      // Never run the app on a failed pull: it would start from empty state and
      // the first write would wipe the server copy. (Missing table is the one
      // tolerated case; pull() reports that as ok with syncOff set.)
      if (!ok) { gate("Kon je gegevens niet laden", "Je bent online maar de sync gaf geen antwoord. Laad opnieuw — er is niets veranderd.", true); return; }
      lastPushed = JSON.stringify(snapshot()); ready = !syncOff; runApp();
    });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) pull(); });
    window.addEventListener("pagehide", function () { if (pushTimer) { clearTimeout(pushTimer); pushNow(); } });
    window.addEventListener("beforeunload", function () { if (pushTimer) { clearTimeout(pushTimer); pushNow(); } });
  }

  // Vaste voorbeeldrijen voor de demo-modus, in de echte state-shapes van de
  // vier apps. Gevarieerd beeld: vogels + gym groen vandaag, chords wordt bij
  // de eerste meting groen (marker-mismatch, push van vandaag), notes oefende
  // gisteren. Plus een voorgezaaid logje zodat streak en weekgrid iets tonen.
  function demoBoot() {
    var dk = function (offset) {
      var d = new Date(); d.setDate(d.getDate() + (offset || 0));
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    };
    var iso = function (offset) { var d = new Date(); d.setDate(d.getDate() + (offset || 0)); d.setHours(18, 0, 0, 0); return d.toISOString(); };
    var rows = {
      vogelspotinus_state: { data: { "dd:vogelspotinus.stats": JSON.stringify({
        streak: 3, longest: 5, lastPracticeDate: dk(0),
        today: { date: dk(0), count: 12, newCount: 2 }, dailyGoal: 10 }) }, updated_at: iso(0) },
      chordsprint_state: { data: { "dd:cpt_stats": '{"score":18,"streak":4,"best":52,"attempts":180,"correct":151}' }, updated_at: iso(0) },
      notesprint_state: { data: { "dd:noteSprintMistakesV1": '{"e4":2,"a3":1}' }, updated_at: iso(-1) },
      kangaroo_state: { data: {
        "dd:kangaroo-workout-history": JSON.stringify([{ id: "d1", workoutId: "w1", workoutName: "Upper A", date: iso(-1), completed: 6, skipped: 1 }]),
        "dd:kangaroo-cardio": JSON.stringify([{ id: "d2", activity: "Biking", minutes: 45, date: dk(-4) }]),
        "dd:kangaroo-history": JSON.stringify({ Knees: dk(-1) })
      }, updated_at: iso(-1) }
    };
    // Voorgezaaide eigen state (alleen als die er nog niet is): markers met een
    // bewust afwijkende hash zodat chords/notes bij de eerste meting een credit
    // krijgen, en wat groene dagen voor een streak van 2.
    if (!oGet.call(localStorage, NS + "trainerinus.markers")) {
      oSet.call(localStorage, NS + "trainerinus.markers", JSON.stringify({
        chords: { hash: "demo-seed", seenAt: iso(-1) },
        notes: { hash: "demo-seed", seenAt: iso(-1) }
      }));
    }
    if (!oGet.call(localStorage, NS + "trainerinus.log")) {
      var log = {};
      log[dk(-1)] = { chords: 1, notes: 1 };
      log[dk(-2)] = { chords: 1, notes: 1 };
      oSet.call(localStorage, NS + "trainerinus.log", JSON.stringify(log));
    }
    userId = "demo";
    syncOff = true;   // ready blijft false: er wordt nooit gepusht
    SB = { from: function (table) { return { select: function () { return { eq: function () {
      return Promise.resolve({ data: [rows[table]], error: null });
    } }; } }; } };
    runApp();
  }

  function boot() {
    patch();
    if (DEMO) { demoBoot(); return; }
    if (!SB) { gate("Kan de loginservice niet bereiken", "Controleer je verbinding en laad opnieuw.", true); return; }
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
