(function () {
  "use strict";

  // Luisterinus — de wachtrij van digest-podcasts (Supabase `podcast_queue`,
  // audio in privébucket `digest-audio`). Leest, speelt af en doet per
  // aflevering: gehoord/ongehoord (listened_at), verwijderen (rij weg; het
  // bucketbestand ruimt het verwerkscript op), taak aanmaken (dezelfde
  // `actions`-rij als de Task-knop in Triage, dus de digest-taak zet hem in
  // 30 Tasks), en opnieuw proberen bij `failed`. Nieuwe rijen maakt alleen de
  // digest-kaart; ready/failed zet alleen het verwerkscript.
  // Zelfde login-sessie als Daily Digest (zelfde origin + Supabase-project).
  // Geen sessie of tabel -> één rustige regel tekst, verder niets.
  var SUPABASE_URL = "https://bobltktjohhnoqhnxslf.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_8SE7JZJrNv_wG-8SN6_NNA_K4Mc0yuR";
  var DAYS = 14; // ouder ruimt het verwerkscript op (fase 3)

  var SB = (window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      })
    : null;

  var list, msg, player, ptitle, audio;
  var loaded = false;     // één keer laden; latere auth-events laten een spelende speler met rust
  var playingRow = null;  // { row, el } van de aflevering in de mini-speler

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function setMsg(t) { msg.textContent = t || ""; }
  function domain(url) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return ""; } }
  function dateNL(iso) { return iso ? new Date(iso).toLocaleDateString("nl-NL") : ""; }
  function duration(s) { return s ? Math.max(1, Math.round(s / 60)) + " min" : ""; }

  // Tekstknop die zichzelf uitzet tijdens de async stap; fn krijgt fail(msg) om hem weer aan te zetten.
  function act(label, fn, danger) {
    var b = el("button", "act" + (danger ? " danger" : ""), label);
    b.type = "button";
    b.addEventListener("click", function (ev) {
      ev.stopPropagation();   // niet ook de rij dichtklappen
      b.disabled = true;
      fn(function fail(m) { setMsg(m); b.disabled = false; });
    });
    return b;
  }

  function update(id, patch, fail, then) {
    SB.from("podcast_queue").update(patch).eq("id", id).then(function (res) {
      if (res.error) { fail("Niet opgeslagen: " + res.error.message); return; }
      then();
    });
  }

  // ---- acties ----
  function play(row, rowEl, fail) {
    SB.storage.from("digest-audio").createSignedUrl(row.audio_path, 3600).then(function (res) {
      var url = res && res.data && res.data.signedUrl;
      if (!url) { fail("Audio niet bereikbaar"); return; }
      if (playingRow) playingRow.el.classList.remove("playing");
      playingRow = { row: row, el: rowEl };
      rowEl.classList.add("playing");
      ptitle.textContent = row.title || row.id;
      player.classList.add("on");
      audio.src = url;
      var p = audio.play();
      if (p && p.catch) p.catch(function () {}); // autoplay geblokkeerd is geen fout: controls staan er
      rowEl.classList.remove("open");
      renderActs(row, rowEl);   // verse knoppen: act() liet de oude disabled achter
    });
  }

  function setListened(row, rowEl, on, fail) {
    var at = on ? new Date().toISOString() : null;
    update(row.id, { listened_at: at }, fail, function () {
      row.listened_at = at;
      rowEl.classList.toggle("done", !!at);
      rowEl.classList.remove("open");
      renderActs(row, rowEl);
      reorder();
    });
  }

  function remove(row, rowEl, fail) {
    if (typeof confirm === "function" && !confirm("Deze aflevering verwijderen?")) { fail(""); return; }
    SB.from("podcast_queue").delete().eq("id", row.id).then(function (res) {
      if (res.error) { fail("Niet verwijderd: " + res.error.message); return; }
      if (playingRow && playingRow.row.id === row.id) { audio.pause(); player.classList.remove("on"); playingRow = null; }
      rowEl.remove();
      if (!list.children.length) renderEmpty();
    });
  }

  function makeTask(row, rowEl, fail) {
    // Zelfde rij als Triage's Task-knop: de digest-taak zet hem in 30 Tasks. De
    // lokale agenda-to-do die Triage óók aanmaakt, slaan we hier bewust over —
    // todos rijden op de agenda-sync en die raken we vanuit een utility-app niet.
    SB.from("actions").insert([{ type: "task", target_id: row.id, body: (row.title || row.id) + "\n" + (row.item_url || "") }]).then(function (res) {
      if (res.error) { fail("Taak niet aangemaakt: " + res.error.message); return; }
      setMsg("Taak aangemaakt — staat na de volgende digest-sync in 30 Tasks.");
      rowEl.classList.remove("open");
      renderActs(row, rowEl);
    });
  }

  function retry(row, rowEl, fail) {
    SB.from("podcast_queue").update({ status: "requested", requested_at: new Date().toISOString() })
      .eq("id", row.id).eq("status", "failed").then(function (res) {
        if (res.error) { fail("Wachtrij niet bereikbaar"); return; }
        row.status = "requested";
        renderRow(row, rowEl);
      });
  }

  // ---- rendering ----
  function renderActs(row, rowEl) {
    var acts = rowEl.querySelector(".acts");
    acts.textContent = "";
    if (row.status === "ready" && row.audio_path) {
      acts.appendChild(act("▶ Afspelen", function (fail) { play(row, rowEl, fail); }));
      acts.appendChild(act(row.listened_at ? "Ongehoord" : "Gehoord", function (fail) { setListened(row, rowEl, !row.listened_at, fail); }));
      acts.appendChild(act("Taak", function (fail) { makeTask(row, rowEl, fail); }));
    } else if (row.status === "failed") {
      acts.appendChild(act("Probeer opnieuw", function (fail) { retry(row, rowEl, fail); }));
      acts.appendChild(act("Taak", function (fail) { makeTask(row, rowEl, fail); }));
    }
    acts.appendChild(act("Verwijderen", function (fail) { remove(row, rowEl, fail); }, true));
  }

  function renderRow(row, rowEl) {
    rowEl.className = "row" + (row.listened_at ? " done" : "") + (playingRow && playingRow.row.id === row.id ? " playing" : "");
    rowEl.textContent = "";
    rowEl.appendChild(el("div", "title", row.title || row.id));
    var meta = [domain(row.item_url), dateNL(row.requested_at), duration(row.duration_s)].filter(Boolean).join(" · ");
    rowEl.appendChild(el("div", "meta", meta));
    if (row.status === "failed") rowEl.appendChild(el("div", "status failed", "Mislukt — bron niet importeerbaar"));
    else if (row.status !== "ready") rowEl.appendChild(el("div", "status", "In de maak…"));
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
      return da - db || (b.dataset.at || "").localeCompare(a.dataset.at || "");
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
      rowEl.addEventListener("click", function () { rowEl.classList.toggle("open"); });
      list.appendChild(renderRow(row, rowEl));
    });
    reorder();
  }

  function load() {
    var since = new Date(Date.now() - DAYS * 86400000).toISOString();
    SB.from("podcast_queue").select("id,title,item_url,status,audio_path,requested_at,listened_at,duration_s")
      .gte("requested_at", since).order("requested_at", { ascending: false }).then(function (res) {
        if (res.error) { setMsg("Wachtrij niet bereikbaar: " + res.error.message); return; }
        setMsg("");
        loaded = true;
        render(res.data || []);
      });
  }

  // Handmatig verversen (de worker draait buiten de app om, dus "In de maak…"
  // wordt vanzelf niet "klaar"). De speler blijft doorspelen: het audio-element
  // staat buiten de lijst; we koppelen alleen de rij-verwijzing opnieuw.
  function refresh(fail) {
    var playingId = playingRow && playingRow.row.id;
    playingRow = null;
    load();
    setTimeout(function () {
      if (!playingId) return;
      var rows = Array.prototype.slice.call(list.children);
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].dataset.id === playingId) {
          playingRow = { row: rows[i]._row, el: rows[i] };
          rows[i].classList.add("playing");
          return;
        }
      }
      audio.pause();                       // rij is weg (verwijderd of >14 dagen)
      player.classList.remove("on");
    }, 900);
  }

  function boot() {
    list = document.getElementById("list");
    msg = document.getElementById("msg");
    player = document.getElementById("player");
    ptitle = document.getElementById("ptitle");
    audio = document.getElementById("audio");
    document.getElementById("refresh").addEventListener("click", function () { refresh(); });
    document.getElementById("pclose").addEventListener("click", function () {
      audio.pause();
      player.classList.remove("on");
      if (playingRow) { playingRow.el.classList.remove("playing"); playingRow = null; }
    });
    // Uitgeluisterd = gehoord, automatisch.
    audio.addEventListener("ended", function () {
      if (playingRow && !playingRow.row.listened_at) setListened(playingRow.row, playingRow.el, true, setMsg);
    });
    if (!SB) { setMsg("Geen verbinding met de login-service."); return; }
    // INITIAL_SESSION komt direct bij het abonneren (dekt de boot); daarna nog
    // maar één keer laden — token-refresh/focus-events (ook SIGNED_IN) mogen
    // een spelende speler niet weggooien.
    SB.auth.onAuthStateChange(function (event, session) {
      if (!session) { setMsg("Log eerst in via Daily Digest."); return; }
      if (!loaded) load();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
