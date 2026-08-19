(function () {
  "use strict";

  // Attentinus auth gate + Supabase sync, met strikte live/sandbox-isolatie.
  //
  // Zelfde boot-patroon als Trainerinus/NoteSprint: gate op een geldige Daily
  // Digest-sessie, alle app-keys per omgeving genamespaced (dd:* live,
  // sbx:* sandbox) via een Storage-shim, pull van de per-user
  // attentinus_state-rij, seed localStorage, DAN de app draaien; push (merge)
  // bij elke wijziging. Ontbreekt de tabel nog, dan draait de app lokaal
  // verder met sync uit (melding onderaan de app; SQL in README.md).
  //
  // Demo-modus: ALLEEN op localhost, met ?demo in de URL. Geen login nodig,
  // eigen "demo:"-namespace met vooraf gezaaide voorbeeldpersonen — raakt
  // nooit echte dd:/sbx:-state. Attentinus leest geen andere tabellen, dus
  // de demo heeft geen nep-Supabase nodig.
  var SUPABASE_URL = "https://bobltktjohhnoqhnxslf.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_8SE7JZJrNv_wG-8SN6_NNA_K4Mc0yuR";
  var TABLE = "attentinus_state";
  var PREFIXES = ["attentinus."];      // logical key prefixes this app owns
  var APP_LABEL = "Attentinus";
  var PUSH_DEBOUNCE_MS = 1500;

  var IS_SANDBOX = location.pathname.indexOf("/sandbox/") !== -1;
  var DEMO = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && /[?&]demo\b/.test(location.search);
  var NS = DEMO ? "demo:" : (IS_SANDBOX ? "sbx:" : "dd:");

  var SB = (window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      })
    : null;

  var userId = null, lastPushed = null, pushTimer = null, ready = false, ran = false;
  var syncOff = false;   // true zolang attentinus_state ontbreekt: lokaal draaien

  var proto = (window.Storage && window.Storage.prototype) || Object.getPrototypeOf(localStorage);
  var oGet = proto.getItem, oSet = proto.setItem, oRem = proto.removeItem;

  function isLogical(key) { return typeof key === "string" && PREFIXES.some(function (p) { return key.indexOf(p) === 0; }); }
  function isPhysical(key) { return typeof key === "string" && PREFIXES.some(function (p) { return key.indexOf(NS + p) === 0; }); }

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

  function missingTable(err) {
    var m = ((err && err.message) || "") + " " + ((err && err.code) || "");
    return /could not find the table|does not exist|schema cache|PGRST205/i.test(m);
  }

  function pushNow() {
    if (!SB || !userId || !ready || syncOff) return;
    var mine = snapshot();
    var cur = JSON.stringify(mine);
    if (cur === lastPushed) return;
    SB.from(TABLE).select("data").eq("user_id", userId).then(function (rd) {
      if (rd && rd.error) { warn("push read", rd.error.message); return; }
      var merged = (rd && rd.data && rd.data.length && rd.data[0].data) ? rd.data[0].data : {};
      // VANGNET: nooit een lege lokale state over echte serverdata heen laten gaan.
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
        if (missingTable(res.error)) { syncOff = true; warn("table missing — running local-only"); cb && cb(true); return; }
        warn("pull", res.error.message); cb && cb(false); return;
      }
      var row = res && res.data && res.data.length ? res.data[0] : null;
      var cur = JSON.stringify(snapshot());
      if (row && row.data && (lastPushed === null || cur === lastPushed)) { seed(row.data); lastPushed = JSON.stringify(snapshot()); }
      cb && cb(true);
    }, function (err) { warn("pull", (err && err.message) || err); cb && cb(false); });
  }

  function gate(title, msg, showReload) {
    var o = document.getElementById("gm-gate");
    if (o && o.parentNode) o.parentNode.removeChild(o);
    o = document.createElement("div");
    o.id = "gm-gate";
    o.style.cssText = "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;" +
      "font-family:-apple-system,Arial,sans-serif;background:#0f1115;color:#e7e9ee;padding:2rem;text-align:center";
    var inner = "<div style='max-width:22rem;line-height:1.5'><div style='font-size:2.4rem'>🎁🔒</div>" +
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
    window.__gmAttent = { userId: userId, ns: NS, isSandbox: IS_SANDBOX, syncOff: syncOff, demo: DEMO };
    var code = document.getElementById("gm-app-code");
    if (!code) { warn("app code element missing"); return; }
    var s = document.createElement("script");
    s.textContent = code.textContent;
    document.body.appendChild(s);
  }

  // Voorbeeldpersonen voor de demo-modus, met datums relatief aan vandaag
  // zodat het "binnenkort"-beeld altijd klopt.
  function demoBoot() {
    if (!oGet.call(localStorage, NS + "attentinus.people")) {
      var mk = function (offsetDays, withYear) {
        var d = new Date(); d.setDate(d.getDate() + offsetDays);
        return { month: d.getMonth() + 1, day: d.getDate(), year: withYear ? d.getFullYear() - withYear : null };
      };
      var p1 = mk(2, 61), p2 = mk(12, 34), p3 = mk(47, null);
      oSet.call(localStorage, NS + "attentinus.people", JSON.stringify([
        { id: "demo-1", name: "Papa", label: "verjaardag", month: p1.month, day: p1.day, year: p1.year,
          ideas: [{ id: "i1", text: "Boek over de Waddenzee", done: false }] },
        { id: "demo-2", name: "Emma", label: "verjaardag", month: p2.month, day: p2.day, year: p2.year,
          ideas: [{ id: "i2", text: "Concertkaartjes TivoliVredenburg", done: false },
                  { id: "i3", text: "Wijnproeverij-bon", done: false }] },
        { id: "demo-3", name: "Lisa & Tom", label: "trouwdag", month: p3.month, day: p3.day, year: null, ideas: [] }
      ]));
    }
    userId = "demo";
    syncOff = true;   // ready blijft false: er wordt nooit gepusht
    runApp();
  }

  var GT = "Log in om " + APP_LABEL + " te gebruiken";
  var GM_ = "Open de Daily Digest-app en log in — dit scherm ontgrendelt met je account.";

  function onSignedIn(session) {
    userId = session.user.id;
    ungate();
    pull(function (ok) {
      // Nooit de app draaien op een mislukte pull (ontbrekende tabel is de ene
      // getolereerde uitzondering; pull() meldt die als ok met syncOff aan).
      if (!ok) { gate("Kon je gegevens niet laden", "Je bent online maar de sync gaf geen antwoord. Laad opnieuw — er is niets veranderd.", true); return; }
      lastPushed = JSON.stringify(snapshot()); ready = !syncOff; runApp();
    });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) pull(); });
    window.addEventListener("pagehide", function () { if (pushTimer) { clearTimeout(pushTimer); pushNow(); } });
    window.addEventListener("beforeunload", function () { if (pushTimer) { clearTimeout(pushTimer); pushNow(); } });
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

  patch(); // shim actief vóór het uitgestelde app-script
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
