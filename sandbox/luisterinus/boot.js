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

  var list, msg, player, ptitle, audio;
  var loaded = false;      // één keer laden; latere auth-events laten een spelende speler met rust
  var playingId = null;    // id van de aflevering in de mini-speler

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

  function clearPlaying() {
    audio.pause();
    player.classList.remove("on");
    var cur = playingId && rowElFor(playingId);
    if (cur) cur.classList.remove("playing");
    playingId = null;
  }

  // ---- acties ----
  function play(row, rowEl, fail) {
    run(SB.storage.from("digest-audio").createSignedUrl(row.audio_path, 3600), function (res) {
      var url = res && res.data && res.data.signedUrl;
      if (!url) { fail("Audio niet bereikbaar"); return; }
      setPlaying(row.id, rowEl);
      ptitle.textContent = row.title || row.id;
      player.classList.add("on");
      audio.src = url;
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
    if (typeof confirm === "function" && !confirm("Deze aflevering verwijderen?")) { fail(""); return; }
    run(SB.from("podcast_queue").delete().eq("id", row.id), function () {
      if (playingId === row.id) clearPlaying();
      rowEl.remove();
      if (!list.children.length) renderEmpty();
    }, fail, "Niet verwijderd");
  }

  function makeTask(row, rowEl, fail) {
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
    else if (row.status !== "ready") head.appendChild(el("div", "status", "In de maak…"));
    head.addEventListener("click", function () {
      var open = rowEl.classList.toggle("open");
      head.setAttribute("aria-expanded", open ? "true" : "false");
    });
    rowEl.appendChild(head);

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

    // Uitgeluisterd = gehoord, automatisch. De rij wordt op id opgezocht, dus
    // een verversing tussendoor kan dit niet naar de verkeerde rij sturen.
    audio.addEventListener("ended", function () {
      var rowEl = playingId && rowElFor(playingId);
      var row = rowEl && rowEl._row;
      if (row && !row.listened_at) setListened(row, rowEl, true, setMsg);
    });
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

    SB.auth.onAuthStateChange(function (event, session) {
      if (!session) {                 // uitgelogd: lijst weg, zodat een volgende login opnieuw laadt
        loaded = false;
        playingId = null;
        audio.pause();
        player.classList.remove("on");
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
