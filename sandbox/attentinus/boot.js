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
  var syncOff = false;      // true zolang de tabel onbruikbaar is: lokaal draaien
  var syncReason = null;    // "missing" (tabel bestaat niet) | "grant" (geen rechten)
  var dirty = false;        // er staat een bewuste lokale wijziging open die de server nog niet heeft
  var pushing = false;      // er loopt een push: niet nog een keer beginnen
  var conflict = false;     // lokaal én de server zijn allebei veranderd sinds de laatste sync
  var RETRY_MS = 8000;      // mislukte push opnieuw proberen i.p.v. stilletjes verliezen
  var RETRY_MAX_MS = 300000;// ...maar met oplopende pauze: een blijvende fout mag geen 8s-lus worden
  var retryWait = RETRY_MS;

  var proto = (window.Storage && window.Storage.prototype) || Object.getPrototypeOf(localStorage);
  var oGet = proto.getItem, oSet = proto.setItem, oRem = proto.removeItem;

  function isLogical(key) { return typeof key === "string" && PREFIXES.some(function (p) { return key.indexOf(p) === 0; }); }
  function isPhysical(key) { return typeof key === "string" && PREFIXES.some(function (p) { return key.indexOf(NS + p) === 0; }); }

  // "Dirty" = de gebruiker heeft iets gewijzigd dat de server aantoonbaar nog
  // niet heeft. Dat overleeft een herstart in localStorage, want juist op de
  // telefoon haalt de push het vaak niet: iOS bevriest het tabblad zodra je
  // wegswipet en gooit de request weg. De vlag staat buiten het gesyncte
  // key-bereik (geen isPhysical-match) en gaat dus zelf nooit mee de server op.
  var DIRTY_KEY = NS + "__attentinus_pending";
  // De updated_at die we voor het laatst van de server zagen of er zelf op
  // schreven. Zonder dit weet een apparaat met een openstaande wijziging niet
  // of de server intussen is opgeschoten, en zou het blind zijn eigen (oude)
  // state eroverheen duwen.
  var STAMP_KEY = NS + "__attentinus_seen";
  function storedStamp() { try { return oGet.call(localStorage, STAMP_KEY) || ""; } catch (e) { return ""; } }
  function setStamp(v) { try { if (v) oSet.call(localStorage, STAMP_KEY, String(v)); else oRem.call(localStorage, STAMP_KEY); } catch (e) {} }
  function storedDirty() { try { return oGet.call(localStorage, DIRTY_KEY) === "1"; } catch (e) { return false; } }
  function setDirty(v) {
    dirty = !!v;
    try { if (dirty) oSet.call(localStorage, DIRTY_KEY, "1"); else oRem.call(localStorage, DIRTY_KEY); } catch (e) {}
    // De app mag laten zien dat er nog iets openstaat.
    try { if (window.__gmAttent && window.__gmAttent.onchange) window.__gmAttent.onchange(); } catch (e) {}
  }
  dirty = storedDirty();

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
  // de app draait dan lokaal door met sync uit (en dus zonder ooit te pushen)
  // in plaats van een doodlopende foutmelding te tonen.
  function tableProblem(err) {
    var m = ((err && err.message) || "") + " " + ((err && err.code) || "");
    if (/permission denied|42501/i.test(m)) return "grant";
    if (/could not find the table|does not exist|schema cache|PGRST205/i.test(m)) return "missing";
    return null;
  }

  function pushNow() {
    if (!SB || !userId || !ready || syncOff) return;
    // Achtergrond en sluiten vuren allebei flush(); zonder deze guard gaan er
    // per app-switch twee complete select+upsert-rondes de deur uit, en kan
    // een oudere upsert ná een nieuwere landen.
    if (pushing) return;
    // Allebei veranderd: niet stilzwijgend een van beide kanten wissen.
    if (conflict) return;
    if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
    var mine = snapshot();
    var cur = JSON.stringify(mine);
    if (cur === lastPushed) return;
    pushing = true;
    SB.from(TABLE).select("data, updated_at").eq("user_id", userId).then(function (rd) {
      // supabase-js *resolvet* met {error} bij een gewone HTTP-fout — dit is
      // dus de normale faalroute, niet de zeldzame. Zonder retryLater() blijft
      // de wijziging hier hangen zonder dat er ooit nog iets probeert.
      if (rd && rd.error) { pushing = false; warn("push read", rd.error.message); retryLater(); return; }
      var merged = (rd && rd.data && rd.data.length && rd.data[0].data) ? rd.data[0].data : {};
      // VANGNET: nooit een lege lokale state over echte serverdata heen laten gaan.
      var _srvHas = Object.keys(merged).some(function (key) { return isPhysical(key) && !blankVal(merged[key]); });
      var _locHas = Object.keys(mine).some(function (key) { return !blankVal(mine[key]); });
      // Blijft: nooit een lege lokale state over echte serverdata heen duwen.
      // Maar leeg-na-een-bewuste-verwijdering is geen ongeluk — die MOET erdoor,
      // anders komt de laatst verwijderde persoon bij elke pull weer terug.
      // Bewust storedDirty() en niet de variabele: wordt localStorage onder een
      // openstaand tabblad weggegooid (Safari-opruiming), dan verdwijnt de vlag
      // mee en valt het vangnet vanzelf weer dicht.
      if (_srvHas && !_locHas && !storedDirty()) { pushing = false; warn("refusing to push empty local state over existing server data"); return; }
      // De server is opgeschoten sinds onze laatste geslaagde sync terwijl wij
      // nog iets open hebben staan: allebei gewijzigd. Niets overschrijven.
      var srvStamp = (rd && rd.data && rd.data.length && rd.data[0].updated_at) || "";
      if (dirty && storedStamp() && srvStamp && srvStamp !== storedStamp()) {
        pushing = false; conflict = true;
        warn("conflict: server is nieuwer dan onze laatste sync — niet pushen");
        try { if (window.__gmAttent && window.__gmAttent.onchange) window.__gmAttent.onchange(); } catch (e) {}
        return;
      }
      Object.keys(merged).forEach(function (key) { if (isPhysical(key)) delete merged[key]; });
      Object.keys(mine).forEach(function (key) { merged[key] = mine[key]; });
      var stamp = new Date().toISOString();
      SB.from(TABLE).upsert({ user_id: userId, data: merged, updated_at: stamp }, { onConflict: "user_id" })
        .then(function (res) {
                pushing = false;
                if (res && res.error) { warn("push", res.error.message); retryLater(); return; }
                lastPushed = cur;
                setStamp(stamp);
                // Alleen schoonmelden als er ondertussen niets nieuws bij kwam.
                retryWait = RETRY_MS;
                if (JSON.stringify(snapshot()) === cur) setDirty(false); else schedulePush();
              },
              function (err) { pushing = false; warn("push", (err && err.message) || err); retryLater(); });
    }, function (err) { pushing = false; warn("push read", (err && err.message) || err); retryLater(); });
  }
  // Een verse gebruikersactie of een terugkeer naar de voorgrond zet de
  // backoff-ladder terug: die hoort opeenvolgende mislukkingen te volgen, niet
  // hoe vaak je de app wegswipet.
  function schedulePush() { if (!ready) return; setDirty(true); retryWait = RETRY_MS; if (pushTimer) clearTimeout(pushTimer); pushTimer = setTimeout(pushNow, PUSH_DEBOUNCE_MS); }
  function retryLater() {
    if (!ready) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, retryWait);
    retryWait = Math.min(retryWait * 2, RETRY_MAX_MS);   // 8s, 16s, 32s ... max 5 min
  }
  // Meteen wegschrijven i.p.v. de debounce afwachten: gebruikt op het moment
  // dat de pagina naar de achtergrond gaat of sluit.
  function flush() { if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; } pushNow(); }

  function pull(cb) {
    if (!SB || !userId) { cb && cb(); return; }
    SB.from(TABLE).select("data, updated_at").eq("user_id", userId).then(function (res) {
      if (res && res.error) {
        var prob = tableProblem(res.error);
        if (prob) { syncOff = true; syncReason = prob; warn("tabel onbruikbaar (" + prob + ") — lokaal draaien:", res.error.message); cb && cb(true); return; }
        warn("pull", res.error.message); cb && cb(false); return;
      }
      var row = res && res.data && res.data.length ? res.data[0] : null;
      var cur = JSON.stringify(snapshot());
      // !dirty is de kern van de telefoonfix: staat er nog een lokale wijziging
      // open (bv. een verwijdering die niet meer weggekomen is voordat iOS het
      // tabblad afknipte), dan is lokaal leidend en duwen we die alsnog omhoog.
      // We leiden hier niets af uit "leeg" — we handelen op een aantoonbare,
      // eerder vastgelegde schrijfactie van de gebruiker.
      var srvStamp = (row && row.updated_at) || "";
      // Allebei veranderd sinds onze laatste geslaagde sync: lokaal houden,
      // server met rust laten, en het zeggen. Anders zou een telefoon met een
      // oude openstaande wijziging een week aan invoer op de laptop wissen.
      conflict = !!(dirty && storedStamp() && srvStamp && srvStamp !== storedStamp());
      if (row && row.data && !dirty && (lastPushed === null || cur === lastPushed)) {
        seed(row.data); lastPushed = JSON.stringify(snapshot()); setStamp(srvStamp);
      }
      try { if (window.__gmAttent && window.__gmAttent.onchange) window.__gmAttent.onchange(); } catch (e) {}
      if (dirty && !conflict) schedulePush();
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
    window.__gmAttent = { userId: userId, ns: NS, isSandbox: IS_SANDBOX, syncOff: syncOff, syncReason: syncReason, demo: DEMO,
                          pending: function () { return dirty; }, conflict: function () { return conflict; },
                          onchange: null };
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
      var p1 = mk(2, 61), p2 = mk(12, 34), p3 = mk(47, null), p4 = mk(25, 13);
      oSet.call(localStorage, NS + "attentinus.people", JSON.stringify([
        { id: "demo-1", name: "Papa", cat: "verjaardag", label: null, month: p1.month, day: p1.day, year: p1.year,
          ideas: [{ id: "i1", text: "Boek over de Waddenzee", done: false }] },
        { id: "demo-2", name: "Emma", cat: "verjaardag", label: null, month: p2.month, day: p2.day, year: p2.year,
          ideas: [{ id: "i2", text: "Concertkaartjes TivoliVredenburg", done: false },
                  { id: "i3", text: "Wijnproeverij-bon", done: false }] },
        { id: "demo-3", name: "Lisa & Tom", cat: "trouwdag", label: null, month: p3.month, day: p3.day, year: null, ideas: [] },
        { id: "demo-4", name: "Oma", cat: "sterfdag", label: null, month: p4.month, day: p4.day, year: p4.year,
          ideas: [{ id: "i4", text: "Bloemen voor op het graf", done: false }] }
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
      // Bij een openstaande wijziging is lokaal NIET wat de server heeft:
      // lastPushed op null laten, anders slaat pushNow de inhaalslag over.
      if (!dirty) lastPushed = JSON.stringify(snapshot());
      ready = !syncOff; runApp();
      if (dirty) schedulePush();
    });
    // Op de telefoon zijn pagehide/beforeunload onbetrouwbaar: wegswipen of het
    // scherm vergrendelen levert vaak alleen een visibilitychange op, waarna
    // iOS het tabblad bevriest en later weggooit. Dit is dus het enige moment
    // waarop een net gedane verwijdering nog weg kan.
    document.addEventListener("visibilitychange", function () { if (document.hidden) flush(); else pull(); });
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    window.addEventListener("online", function () { retryWait = RETRY_MS; if (dirty) flush(); });
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
