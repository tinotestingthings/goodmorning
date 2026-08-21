(function () {
  "use strict";

  // Luisterinus — de wachtrij van digest-podcasts (Supabase `podcast_queue`,
  // audio in privébucket `digest-audio`). Deze pagina leest en speelt af;
  // schrijven doen de digest-kaart (triage.js: nieuwe rij) en het
  // verwerkscript (ready/failed). Zelfde login-sessie als Daily Digest, want
  // zelfde origin + zelfde Supabase-project. UI bewust kaal — UX komt later.
  // Geen sessie of tabel -> één rustige regel tekst, verder niets.
  var SUPABASE_URL = "https://bobltktjohhnoqhnxslf.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_8SE7JZJrNv_wG-8SN6_NNA_K4Mc0yuR";
  var DAYS = 14; // ouder ruimt het verwerkscript op (fase 3)

  var SB = (window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      })
    : null;

  var list, msg;
  var loaded = false; // één keer laden; latere auth-events laten een spelende speler met rust

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function setMsg(t) { msg.textContent = t || ""; }

  // Knop die zichzelf uitzet tijdens de async stap; fn krijgt fail(msg) om hem weer aan te zetten.
  function btn(label, fn) {
    var b = el("button", "play", label);
    b.type = "button";
    b.addEventListener("click", function () {
      b.disabled = true;
      fn(function fail(m) { setMsg(m); b.disabled = false; });
    });
    return b;
  }

  function play(row, slot, fail) {
    SB.storage.from("digest-audio").createSignedUrl(row.audio_path, 3600).then(function (res) {
      var url = res && res.data && res.data.signedUrl;
      if (!url) { fail("Audio niet bereikbaar"); return; }
      document.querySelectorAll("audio").forEach(function (a) { a.pause(); }); // één tegelijk
      var audio = document.createElement("audio");
      audio.controls = true;
      audio.className = "player";
      audio.src = url;
      slot.textContent = "";
      slot.appendChild(audio);
      var p = audio.play();
      if (p && p.catch) p.catch(function () {}); // autoplay geblokkeerd is geen fout
    });
  }

  function retry(row, slot, fail) {
    SB.from("podcast_queue").update({ status: "requested", requested_at: new Date().toISOString() })
      .eq("id", row.id).eq("status", "failed").then(function (res) {
        if (res.error) { fail("Wachtrij niet bereikbaar"); return; }
        slot.textContent = ""; // alleen deze rij bijwerken — geen load() die elders een speler sloopt
        slot.appendChild(el("span", "status", "In de maak…"));
      });
  }

  function render(rows) {
    list.textContent = "";
    if (!rows.length) {
      list.appendChild(el("p", "empty", "Nog geen podcasts. Druk op een digest-kaart op “Maak er een podcast van”."));
      return;
    }
    rows.forEach(function (row) {
      var card = el("div", "row");
      card.appendChild(el("div", "title", row.title || row.id));
      var meta = el("div", "meta", row.requested_at ? new Date(row.requested_at).toLocaleDateString("nl-NL") : "");
      if (row.item_url) {
        var a = el("a", null, "bron ↗");
        a.href = row.item_url; a.target = "_blank"; a.rel = "noopener noreferrer";
        meta.appendChild(a);
      }
      card.appendChild(meta);
      var slot = el("div", "slot");
      if (row.status === "ready" && row.audio_path) {
        slot.appendChild(btn("▶ Speel af", function (fail) { play(row, slot, fail); }));
      } else if (row.status === "failed") {
        slot.appendChild(el("span", "status failed", "Mislukt"));
        slot.appendChild(btn("Probeer opnieuw", function (fail) { retry(row, slot, fail); }));
      } else {
        slot.appendChild(el("span", "status", "In de maak…"));
      }
      card.appendChild(slot);
      list.appendChild(card);
    });
  }

  function load() {
    var since = new Date(Date.now() - DAYS * 86400000).toISOString();
    SB.from("podcast_queue").select("id,title,item_url,status,audio_path,requested_at")
      .gte("requested_at", since).order("requested_at", { ascending: false }).then(function (res) {
        if (res.error) { setMsg("Wachtrij niet bereikbaar: " + res.error.message); return; }
        setMsg("");
        loaded = true;
        render(res.data || []);
      });
  }

  function boot() {
    list = document.getElementById("list");
    msg = document.getElementById("msg");
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
