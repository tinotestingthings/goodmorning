(function () {
  "use strict";

  // Luisterinus — de wachtrij van digest-podcasts (Supabase `podcast_queue`,
  // audio in privébucket `digest-audio`). Leest, speelt af en doet per
  // aflevering: gehoord/ongehoord (listened_at), verwijderen (rij weg; het
  // bucketbestand ruimt het verwerkscript op), taak aanmaken en opnieuw
  // proberen bij `failed`. Nieuwe rijen maakt alleen de digest-kaart;
  // ready/failed zet alleen het verwerkscript.
  // Zelfde login-sessie als Daily Digest (zelfde origin + Supabase-project).
  // Geen sessie of tabel -> één rustige regel tekst, verder niets.
  //
  // Statebeheer: de speler onthoudt alléén een id (`playingId`). De DOM is de
  // rest van de waarheid en wordt opnieuw opgebouwd bij elke load; zo kan een
  // verversing nooit een verwijzing naar een losgekoppelde rij achterlaten
  // (die klasse fouten schreef eerder de verkeerde aflevering als gehoord weg).
  var SUPABASE_URL = "https://bobltktjohhnoqhnxslf.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_8SE7JZJrNv_wG-8SN6_NNA_K4Mc0yuR";
  var DAYS = 14; // zelfde venster als de Utilities-badge in practice.js; ouder ruimt het script op (fase 3)

  var SB = (window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      })
    : null;

  var list, msg, player, ptitle, audio, ask, askText, askOk, askCancel;
  var loaded = false;      // één keer laden; latere auth-events laten een spelende speler met rust
  var playingId = null;    // id van de aflevering in de mini-speler
  var rate = 1;            // afspeelsnelheid; bewaard in de store
  var playSeq = 0;         // laatste play()-aanroep wint; oudere fetch-callbacks doen niets meer
  var pendingSeek = 0;     // gewenste hervat-positie; één vaste canplay-listener voert hem uit

  // Luisterposities + snelheid per apparaat (localStorage). Live en sandbox
  // delen één origin, dus de sleutel volgt het pad — nooit "dd."/"sbx." hardcoden.
  var STORE_KEY = (location.pathname.indexOf("/sandbox/") !== -1 ? "sbx" : "dd") + ".luisterinus";
  function store() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; } }
  function saveStore(s) { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {} }
  function savePos(id, t) { var s = store(); s.pos = s.pos || {}; s.pos[id] = Math.floor(t); saveStore(s); }
  function clearPos(id) { var s = store(); if (s.pos && id in s.pos) { delete s.pos[id]; saveStore(s); } }
  function posFor(id) { var s = store(); return (s.pos && s.pos[id]) || 0; }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function setMsg(t) { msg.textContent = t || ""; }
  function domain(url) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return ""; } }
  function dateStr(iso) { return iso ? new Date(iso).toLocaleDateString("nl-NL") : ""; }  // app is Nederlandstalig
  function duration(s) { return s ? Math.max(1, Math.round(s / 60)) + " min" : ""; }

  // Eén foutpad voor Supabase: een resolve-met-error én een echte rejection
  // (offline, DNS, CORS) komen allebei op fail() uit. Zonder de tweede arm
  // bleef een knop na een netwerkfout voorgoed uitgeschakeld.
  function run(q, ok, fail, what) {
    q.then(function (res) {
      if (res && res.error) { fail(what + ": " + res.error.message); return; }
      ok(res);
    }, function (err) { fail(what + ": " + ((err && err.message) || "geen verbinding")); });
  }

  function rowElFor(id) {
    var rows = list.children;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].dataset && rows[i].dataset.id === id) return rows[i];
    }
    return null;
  }

  // Bevestiging in de app zelf: het native confirm() wordt in de Utilities-iframe
  // niet altijd getoond — dan leek een knop niets te doen. <dialog> regelt
  // Escape, focus en backdrop; annuleren zet de knop weer aan via onNo().
  function confirmAsk(text, okLabel, danger, onYes, onNo) {
    if (!ask || !ask.showModal) { onYes(); return; }   // heel oude browser: gewoon doorgaan
    askText.textContent = text;
    askOk.textContent = okLabel;
    askOk.className = "act" + (danger ? " danger" : "");
    function cleanup() { askOk.onclick = null; askCancel.onclick = null; ask.onclose = null; }
    askOk.onclick = function () { cleanup(); ask.close(); onYes(); };
    askCancel.onclick = function () { cleanup(); ask.close(); onNo(); };
    ask.onclose = function () { cleanup(); onNo(); };   // Escape of backdrop
    ask.showModal();
  }

  // Tekstknop die zichzelf uitzet tijdens de async stap. fn krijgt fail(msg)
  // om hem weer aan te zetten; fail("") zet alleen de knop terug (geannuleerd),
  // zodat een melding van een andere rij niet gewist wordt.
  function act(label, fn, danger) {
    var b = el("button", "act" + (danger ? " danger" : ""), label);
    b.type = "button";
    b.addEventListener("click", function () {
      b.disabled = true;
      fn(function fail(m) { if (m) setMsg(m); b.disabled = false; });
    });
    return b;
  }

  // Update met conflictdetectie: Supabase meldt geen fout als er 0 rijen
  // geraakt worden (rij intussen door de worker of een ander apparaat gewijzigd).
  function update(q, fail, then) {
    run(q.select("id"), function (res) {
      if (!res.data || !res.data.length) { fail("Deze aflevering is intussen gewijzigd — druk op Ververs."); return; }
      then();
    }, fail, "Niet opgeslagen");
  }

  // ---- speler ----
  function setPlaying(id, rowEl) {
    var old = playingId && rowElFor(playingId);
    if (old) old.classList.remove("playing");
    playingId = id;
    if (rowEl) rowEl.classList.add("playing");
  }

  // Hervat-seek via één vaste listener (boot: canplay) i.p.v. een listener per
  // play(): een snelle wissel van aflevering kan dan nooit met een oude
  // positie op de nieuwe audio seeken. Niet seeken zo goed als uitgeluisterd,
  // of als er al gescrubd is.
  function applySeek() {
    if (pendingSeek > 5 && audio.duration && pendingSeek < audio.duration * 0.95 && audio.currentTime < 1) audio.currentTime = pendingSeek;
    pendingSeek = 0;
  }

  // De ▶-rijknop toont en meldt (VoiceOver) de echte stand: ⏸ op de spelende rij.
  function syncBigplay() {
    var rows = list.children;
    for (var i = 0; i < rows.length; i++) {
      var bp = rows[i].querySelector && rows[i].querySelector(".bigplay");
      if (!bp) continue;
      var playing = rows[i].dataset.id === playingId && !audio.paused;
      bp.textContent = playing ? "⏸" : "▶";
      bp.setAttribute("aria-label", (playing ? "Pauzeren: " : "Afspelen: ") + ((rows[i]._row && rows[i]._row.title) || rows[i].dataset.id || ""));
    }
  }

  function clearPlaying() {
    // Positie eerst: het pause-event komt async, ná playingId = null hieronder.
    if (playingId && !audio.ended) savePos(playingId, audio.currentTime || 0);
    playSeq++;   // een play() waarvan de fetch nog loopt, mag niet alsnog starten
    audio.pause();
    player.classList.remove("on");
    document.body.classList.remove("with-player");
    var cur = playingId && rowElFor(playingId);
    if (cur) cur.classList.remove("playing");
    playingId = null;
  }

  // Lockscreen/oordopjes: titel + bron zichtbaar, "volgende" springt door de
  // ongehoorde lijst. Play/pauze regelt de browser zelf voor een audio-element.
  function setMediaSession(row) {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: row.title || row.id,
        artist: ["Luisterinus", domain(row.item_url)].filter(Boolean).join(" · ")
      });
    } catch (e) {}
  }

  // Volgende ongehoorde ready-aflevering in lijstvolgorde, ná afterEl
  // (of vanaf boven bij null). De DOM is de volgorde-waarheid (reorder).
  function nextUnheard(afterEl) {
    var rows = list.children, seen = !afterEl;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i] === afterEl) { seen = true; continue; }
      var r = rows[i]._row;
      if (seen && r && r.status === "ready" && r.audio_path && !r.listened_at) return rows[i];
    }
    return null;
  }

  // ---- acties ----
  function play(row, rowEl, fail) {
    var seq = ++playSeq;
    run(SB.storage.from("digest-audio").createSignedUrl(row.audio_path, 3600), function (res) {
      if (seq !== playSeq) return;   // intussen is iets anders gestart of gesloten: laatste wint
      // Een Ververs tijdens de fetch heeft de lijst herbouwd: verse rij opzoeken.
      rowEl = rowElFor(row.id) || rowEl;
      row = rowEl._row || row;
      var url = res && res.data && res.data.signedUrl;
      if (!url) { fail("Audio niet bereikbaar"); return; }
      setPlaying(row.id, rowEl);
      ptitle.textContent = row.title || row.id;
      player.classList.add("on");
      document.body.classList.add("with-player");
      audio.src = url;
      setMediaSession(row);
      // Halfweg gestopt? Verder waar je was. Zelfde src = geen load-events,
      // dan direct; anders doet de vaste canplay-listener het.
      pendingSeek = posFor(row.id);
      if (audio.readyState >= 1) applySeek();
      var p = audio.play();
      // iOS start niet vanuit een callback ná een netwerkronde (de tik telt dan
      // niet meer als gebruikersactie) — dan is de speler er wel, met controls.
      if (p && p.catch) p.catch(function () { setMsg("Tik op ▶ in de speler hieronder."); });
      rowEl.classList.remove("open");
      renderActs(row, rowEl);   // verse knoppen: act() liet de oude uitgeschakeld achter
    }, fail, "Audio niet bereikbaar");
  }

  function setListened(row, rowEl, on, fail) {
    var at = on ? new Date().toISOString() : null;
    update(SB.from("podcast_queue").update({ listened_at: at }).eq("id", row.id), fail, function () {
      row.listened_at = at;
      rowEl.classList.toggle("done", !!at);
      rowEl.classList.remove("open");
      renderActs(row, rowEl);
      reorder();
    });
  }

  function remove(row, rowEl, fail) {
    confirmAsk("Deze aflevering verwijderen? De podcast en het audiobestand zijn daarna weg.",
      "Verwijderen", true, function () {
        run(SB.from("podcast_queue").delete().eq("id", row.id), function () {
          if (playingId === row.id) clearPlaying();
          rowEl.remove();
          if (!list.children.length) renderEmpty();
          setMsg("Aflevering verwijderd.");
        }, fail, "Niet verwijderd");
      }, function () { fail(""); });
  }

  function makeTask(row, rowEl, fail) {
    confirmAsk("Taak aanmaken voor deze aflevering?", "Taak aanmaken", false,
      function () { doMakeTask(row, rowEl, fail); }, function () { fail(""); });
  }

  function doMakeTask(row, rowEl, fail) {
    // Zelfde tabel als Triage's Task-knop; de digest-taak verwerkt `actions`.
    // De lokale agenda-to-do die Triage óók aanmaakt slaan we over: to-do's
    // rijden op de agenda-sync van de hoofdapp en die raken we hier niet aan.
    run(SB.from("actions").insert([{ type: "task", target_id: row.id, body: (row.title || row.id) + "\n" + (row.item_url || "") }]), function () {
      row._taskSent = true;    // niet nog eens: anders staat dezelfde taak er dubbel in
      setMsg("Taak doorgegeven aan de digest-sync.");
      rowEl.classList.remove("open");
      renderActs(row, rowEl);
    }, fail, "Taak niet aangemaakt");
  }

  function retry(row, rowEl, fail) {
    var at = new Date().toISOString();
    update(SB.from("podcast_queue").update({ status: "requested", requested_at: at })
             .eq("id", row.id).eq("status", "failed"), fail, function () {
      row.status = "requested";
      row.requested_at = at;
      rowEl.dataset.at = at;
      renderRow(row, rowEl);
      reorder();
    });
  }

  // ---- rendering ----
  function renderActs(row, rowEl) {
    var acts = rowEl.querySelector(".acts");
    acts.textContent = "";
    if (row.status === "ready" && row.audio_path) {
      acts.appendChild(act("▶ Afspelen", function (fail) { play(row, rowEl, fail); }));
      acts.appendChild(act(row.listened_at ? "Ongehoord" : "Gehoord", function (fail) { setListened(row, rowEl, !row.listened_at, fail); }));
    } else if (row.status === "failed") {
      acts.appendChild(act("Probeer opnieuw", function (fail) { retry(row, rowEl, fail); }));
    }
    if (row.item_url) {
      var src = el("a", "act", "Bron ↗");
      src.href = row.item_url;
      src.target = "_blank";
      src.rel = "noopener noreferrer";
      acts.appendChild(src);
    }
    if (row._taskSent) acts.appendChild(el("span", "act-done", "Taak doorgegeven"));
    else acts.appendChild(act("Taak", function (fail) { makeTask(row, rowEl, fail); }));
    acts.appendChild(act("Verwijderen", function (fail) { remove(row, rowEl, fail); }, true));
  }

  function renderRow(row, rowEl) {
    rowEl.className = "row" + (row.listened_at ? " done" : "") + (row.id === playingId ? " playing" : "");
    rowEl.textContent = "";

    // De kop is een echte knop: zo zijn de acties ook met toetsenbord en
    // VoiceOver te bereiken (een div met click-handler is dat niet).
    var head = el("button", "rowhead");
    head.type = "button";
    head.setAttribute("aria-expanded", "false");
    head.appendChild(el("div", "title", row.title || row.id));
    var meta = [domain(row.item_url), dateStr(row.requested_at), duration(row.duration_s)].filter(Boolean).join(" · ");
    head.appendChild(el("div", "meta", meta));
    if (row.status === "failed") head.appendChild(el("div", "status failed", "Mislukt — bron niet importeerbaar"));
    else if (row.status !== "ready") {
      // Eerlijke voortgang: de worker draait buiten de app om, dus na een dag
      // wachten is "In de maak…" een leugen — zeg dan wat er echt aan de hand is.
      var reqAt = row.requested_at ? new Date(row.requested_at) : null;
      var days = reqAt ? Math.floor((Date.now() - reqAt.getTime()) / 86400000) : 0;
      head.appendChild(el("div", "status", reqAt && days >= 1
        ? "Wacht al " + (days === 1 ? "een dag" : days + " dagen") + " — de worker heeft nog niet gedraaid"
        : "In de maak…" + (reqAt ? " (sinds " + reqAt.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) + ")" : "")));
    }
    head.addEventListener("click", function () {
      var open = rowEl.classList.toggle("open");
      head.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // Ready-rijen krijgen een directe ▶ naast de kop: één tik i.p.v. uitklappen
    // + Afspelen. Op de spelende rij is dezelfde knop pauze/verder.
    var top = el("div", "rowtop");
    top.appendChild(head);
    if (row.status === "ready" && row.audio_path) {
      var bp = el("button", "bigplay", "▶");
      bp.type = "button";
      bp.setAttribute("aria-label", "Afspelen: " + (row.title || row.id));
      bp.addEventListener("click", function () {
        if (row.id === playingId && audio.src) { if (audio.paused) audio.play(); else audio.pause(); }
        else play(row, rowEl, setMsg);
      });
      top.appendChild(bp);
    }
    rowEl.appendChild(top);

    rowEl.appendChild(el("div", "acts"));
    renderActs(row, rowEl);
    return rowEl;
  }

  function renderEmpty() {
    list.appendChild(el("p", "empty", "Nog geen podcasts. Druk op een digest-kaart op “Maak er een podcast van”."));
  }

  // Ongehoord bovenaan (nieuwste eerst), gehoord gedimd onderaan.
  function reorder() {
    var rows = Array.prototype.slice.call(list.children);
    rows.sort(function (a, b) {
      var da = a.classList.contains("done") ? 1 : 0, db = b.classList.contains("done") ? 1 : 0;
      var at = a.dataset.at || "", bt = b.dataset.at || "";
      return da - db || (at < bt ? 1 : (at > bt ? -1 : 0));   // ISO-strings: gewone vergelijking, nieuwste eerst
    });
    rows.forEach(function (r) { list.appendChild(r); });
  }

  function render(rows) {
    list.textContent = "";
    if (!rows.length) { renderEmpty(); return; }
    rows.forEach(function (row) {
      var rowEl = el("div", "row");
      rowEl.dataset.at = row.requested_at || "";
      rowEl.dataset.id = row.id;
      rowEl._row = row;
      list.appendChild(renderRow(row, rowEl));
    });
    reorder();
    syncBigplay();   // verse knoppen: ⏸ terugzetten op de spelende rij
    // Posities van verdwenen afleveringen (verwijderd of >14 dagen) opruimen.
    var s = store();
    if (s.pos) {
      Object.keys(s.pos).forEach(function (id) { if (!rowElFor(id)) delete s.pos[id]; });
      saveStore(s);
    }
  }

  function load(then) {
    var since = new Date(Date.now() - DAYS * 86400000).toISOString();
    run(SB.from("podcast_queue").select("id,title,item_url,status,audio_path,requested_at,listened_at,duration_s")
          .gte("requested_at", since).order("requested_at", { ascending: false }),
      function (res) {
        setMsg("");
        loaded = true;
        render(res.data || []);
        if (then) then();
      },
      function (m) { setMsg(m); },
      "Wachtrij niet bereikbaar");
  }

  // Handmatig verversen (de worker draait buiten de app om, dus "In de maak…"
  // wordt vanzelf niet "klaar"). De speler loopt door: het audio-element staat
  // buiten de lijst. Herkoppelen gebeurt in de callback van de query — nooit op
  // een timer, anders wordt een rij herbonden die net vervangen is.
  function refresh() {
    load(function () {
      if (!playingId) return;
      var rowEl = rowElFor(playingId);
      if (rowEl) { rowEl.classList.add("playing"); return; }
      clearPlaying();   // aflevering bestaat niet meer (verwijderd of >14 dagen)
      setMsg("De aflevering die speelde staat niet meer in de lijst.");
    });
  }

  function boot() {
    list = document.getElementById("list");
    msg = document.getElementById("msg");
    player = document.getElementById("player");
    ptitle = document.getElementById("ptitle");
    audio = document.getElementById("audio");
    ask = document.getElementById("ask");
    askText = document.getElementById("askText");
    askOk = document.getElementById("askOk");
    askCancel = document.getElementById("askCancel");

    // Uitgeluisterd = gehoord, automatisch — en dan dóór met de volgende
    // ongehoorde (podcast-app-gedrag). De volgende wordt opgezocht vóór
    // setListened, want die reorder()t de lijst. De rij wordt op id opgezocht,
    // dus een verversing tussendoor kan dit niet naar de verkeerde rij sturen.
    audio.addEventListener("ended", function () {
      var rowEl = playingId && rowElFor(playingId);
      if (!rowEl) return;
      var row = rowEl._row;
      clearPos(row.id);
      var next = nextUnheard(rowEl);
      if (!row.listened_at) setListened(row, rowEl, true, setMsg);
      if (next) play(next._row, next, setMsg);
    });
    // Luisterpositie bijhouden: grofweg elke 5 s, plus exact bij pauze.
    var lastSavedPos = 0;
    audio.addEventListener("timeupdate", function () {
      if (!playingId) return;
      var t = audio.currentTime || 0;
      if (Math.abs(t - lastSavedPos) < 5) return;
      lastSavedPos = t;
      savePos(playingId, t);
    });
    audio.addEventListener("pause", function () {
      if (playingId && !audio.ended) savePos(playingId, audio.currentTime || 0);
    });
    audio.addEventListener("canplay", applySeek);
    audio.addEventListener("play", syncBigplay);
    audio.addEventListener("pause", syncBigplay);
    audio.addEventListener("ended", syncBigplay);
    // Verlopen signed URL of een bestand dat het opruimscript al weg heeft:
    // niet in stilte blijven hangen.
    audio.addEventListener("error", function () {
      if (!audio.src) return;
      setMsg("Audio kon niet geladen worden — druk op Ververs of probeer opnieuw.");
      clearPlaying();
    });

    if (!SB) { setMsg("Geen verbinding met de login-service."); return; }

    document.getElementById("refresh").addEventListener("click", refresh);
    document.getElementById("pclose").addEventListener("click", clearPlaying);

    // "▶ Alles": bovenste ongehoorde starten; de rest volgt via auto-advance.
    document.getElementById("playall").addEventListener("click", function () {
      var first = nextUnheard(null);
      if (first) play(first._row, first, setMsg);
      else setMsg("Geen ongehoorde afleveringen.");
    });

    // Snelheid: 1× → 1,25× → 1,5×; bewaard per apparaat, toegepast in play().
    var rateBtn = document.getElementById("prate");
    rate = Number(store().rate) || 1;
    function applyRate() {
      audio.defaultPlaybackRate = rate;
      audio.playbackRate = rate;
      rateBtn.textContent = String(rate).replace(".", ",") + "×";
    }
    rateBtn.addEventListener("click", function () {
      rate = rate >= 1.5 ? 1 : rate + 0.25;
      var s = store(); s.rate = rate; saveStore(s);
      applyRate();
    });
    applyRate();

    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.setActionHandler("nexttrack", function () {
          var next = nextUnheard(playingId && rowElFor(playingId));
          if (next) play(next._row, next, setMsg);
        });
      } catch (e) {}
    }

    SB.auth.onAuthStateChange(function (event, session) {
      if (!session) {                 // uitgelogd: lijst weg, zodat een volgende login opnieuw laadt
        if (playingId && !audio.ended) savePos(playingId, audio.currentTime || 0);
        loaded = false;
        playingId = null;
        playSeq++;
        audio.pause();
        player.classList.remove("on");
        document.body.classList.remove("with-player");
        list.textContent = "";
        setMsg("Log eerst in via Daily Digest.");
        return;
      }
      if (!loaded) load();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
