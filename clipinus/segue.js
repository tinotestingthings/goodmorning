(function (global) {
  "use strict";

  // Segue-engine: een rijtje YouTube-fragmenten achter elkaar afspelen, harde
  // cut op de eindtijd. Twee helften, los bruikbaar:
  //   codec  — link <-> [{id, start, end, label}]   pure functies, geen DOM
  //   speler — Segue.play(el, clips, opts)          YT IFrame API
  // Geen opslag, geen state: de link *is* de opslag. Payload is dezelfde als
  // die van segue.video/watch#…, dus links zijn beide kanten op uitwisselbaar.
  //
  // Eén afspraak: end <= start betekent "tot het einde van de video".

  var API_SRC = "https://www.youtube.com/iframe_api";
  var SEGUE_URL = "https://segue.video/watch#";

  // ---- codec ---------------------------------------------------------------

  // btoa() struikelt over accenten; via UTF-8-bytes niet.
  function b64(s) {
    return btoa(String.fromCharCode.apply(null, new TextEncoder().encode(s)));
  }
  function unb64(s) {
    s = String(s).replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    return new TextDecoder().decode(Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }));
  }

  // "1:02:03" | "4:20" | "83" | "1m23s" -> seconden; NaN als het geen tijd is.
  function seconds(v) {
    if (typeof v === "number") return isFinite(v) && v > 0 ? v : 0;
    var s = String(v == null ? "" : v).trim();
    if (!s) return 0;
    var u = s.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:([\d.]+)s)?$/i);
    if (u && (u[1] || u[2] || u[3])) return (+u[1] || 0) * 3600 + (+u[2] || 0) * 60 + (+u[3] || 0);
    var parts = s.split(":").map(Number);
    if (!parts.length || parts.some(function (n) { return isNaN(n) || n < 0; })) return NaN;
    return parts.reduce(function (t, n) { return t * 60 + n; }, 0);
  }

  function clock(sec) {
    sec = Math.max(0, Math.round(seconds(sec) || 0));
    var h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60;
    var mm = h ? String(m).padStart(2, "0") : String(m);
    return (h ? h + ":" : "") + mm + ":" + String(s).padStart(2, "0");
  }

  // Losse id, of elke YouTube-URL-vorm (watch, youtu.be, embed, shorts, live).
  function videoId(url) {
    var s = String(url == null ? "" : url).trim();
    if (/^[\w-]{11}$/.test(s)) return s;
    var m = s.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  // De velden die één clip in de tekstvorm beschrijven; komma's, pipes en
  // tildes zijn scheidingstekens, dus die kunnen niet in een label staan.
  function clean(s) { return String(s == null ? "" : s).replace(/[,|~]/g, " ").replace(/\s+/g, " ").trim(); }

  function encode(clips, opts) {
    opts = opts || {};
    var body = (clips || []).map(function (c) {
      var start = Math.round(seconds(c.start) || 0);
      var end = Math.round(seconds(c.end) || 0);
      return [videoId(c.id) || "", start, end, clean(c.label)].join(",");
    }).join("|");
    return b64(["2", clean(opts.title) || "Clips", opts.transition || "hard-cut", body].join("~"));
  }

  function build(clips, opts) { return SEGUE_URL + encode(clips, opts); }

  // Slikt een hele segue-link, een eigen #hash of kaal base64. null = onleesbaar.
  function parse(link) {
    var raw = String(link == null ? "" : link).trim();
    var hash = raw.indexOf("#") >= 0 ? raw.slice(raw.indexOf("#") + 1) : raw;
    var text;
    try { text = unb64(hash); } catch (e) { return null; }
    var f = text.split("~");
    if (f.length < 4) return null;
    var clips = f.slice(3).join("~").split("|").map(function (part) {
      var p = part.split(",");
      var id = videoId(p[0]);
      if (!id) return null;
      var start = seconds(p[1]), end = seconds(p[2]);
      return { id: id, start: isNaN(start) ? 0 : start, end: isNaN(end) ? 0 : end, label: (p[3] || "").trim() };
    }).filter(Boolean);
    return clips.length ? { version: f[0], title: f[1], transition: f[2], clips: clips } : null;
  }

  // Tekstvorm, ook het formaat waarin een mens (of een LLM) fragmenten opschrijft:
  // een YouTube-link op een regel zet de huidige video, daaronder regels als
  // "0:43-1:02 Refrein". Regels met # ervoor zijn commentaar.
  var RANGE = /^([\d:.hms]+)\s*(?:-|–|—|tot|to)\s*([\d:.hms]+)\s*(.*)$/i;

  // clip.line is het regelnummer in de tekst; daarmee kan een aanroeper precies
  // die ene regel herschrijven zonder de rest van het tekstvak aan te raken.
  function parseText(text) {
    var vid = null, clips = [], skipped = 0;
    String(text == null ? "" : text).split("\n").forEach(function (raw, n) {
      var line = raw.trim();
      if (!line || line.charAt(0) === "#") return;
      var parts = line.split(/\s+/);
      var id = videoId(parts[0]);
      if (id) { vid = id; parts.shift(); }
      var rest = parts.join(" ").trim();
      if (!rest) { if (!id) skipped++; return; }
      var m = rest.match(RANGE);
      var start = m && seconds(m[1]), end = m && seconds(m[2]);
      if (!m || !vid || isNaN(start) || isNaN(end)) { skipped++; return; }
      clips.push({ id: vid, start: start, end: end, label: m[3].trim(), line: n });
    });
    return { clips: clips, skipped: skipped };
  }

  function toText(clips) {
    var lines = [], last = null;
    (clips || []).forEach(function (c) {
      if (c.id !== last) { lines.push("https://youtu.be/" + c.id); last = c.id; }
      lines.push(clock(c.start) + "-" + clock(c.end) + (c.label ? " " + c.label : ""));
    });
    return lines.join("\n");
  }

  // ---- speler --------------------------------------------------------------

  var apiReady = null;
  function loadApi() {
    if (apiReady) return apiReady;
    apiReady = new Promise(function (resolve, reject) {
      if (global.YT && global.YT.Player) return resolve(global.YT);
      var prev = global.onYouTubeIframeAPIReady;
      global.onYouTubeIframeAPIReady = function () {
        if (typeof prev === "function") prev();
        resolve(global.YT);
      };
      var s = document.createElement("script");
      s.src = API_SRC;
      // Offline of YouTube geblokkeerd: melden, en een volgende poging opnieuw
      // toestaan in plaats van een belofte die nooit oplost.
      s.onerror = function () { apiReady = null; reject(new Error("iframe_api")); };
      document.head.appendChild(s);
    });
    return apiReady;
  }

  // el wordt vervangen door de iframe. Terug: {next, prev, go, pause, resume,
  // index, time, destroy}. opts: {onChange(i, clip), onEnd(), onError(reden, i,
  // clip), autoplay}. reden is "clip" (deze video speelt niet), "autoplay" (de
  // browser blokkeert starten) of "api" (de speler laadde niet).
  function play(el, clips, opts) {
    if (!el || !clips || !clips.length) return null;
    opts = opts || {};
    var i = 0, player = null, timer = null, ended = false, dead = false, switched = 0;
    var loaded = null, seeking = false;   // welke video staat er, en zoekt hij nog
    var ready = false, queued = null;     // vóór onReady kan de speler nog niets

    function fail(why) { if (opts.onError) opts.onError(why, i, clips[i]); }

    function go(n) {
      if (dead) return;
      i = Math.min(Math.max(n, 0), clips.length - 1);
      ended = false;
      var c = clips[i];
      switched = Date.now();
      seeking = true;
      // Vóór onReady bestaan seekTo/loadVideoById nog niet op het YT-object:
      // onthoud het doel en laat onReady het inlossen. Direct aanroepen zou een
      // TypeError geven én loaded naar een nooit geladen video laten wijzen.
      if (!player || !ready) { queued = i; if (opts.onChange) opts.onChange(i, c); return; }
      playAt(c);
      if (opts.onChange) opts.onChange(i, c);
    }

    // Zelfde video? Dan springen in plaats van herladen. Elke loadVideoById is
    // voor YouTube een nieuwe kijksessie en levert dus een nieuwe reclame op —
    // een reeks fragmenten uit één video hoort één keer reclame te kosten, niet
    // per fragment. Let op: na seekTo vervalt endSeconds, dus de tik in tick()
    // is dan de enige schaar. Die was het toch al.
    function playAt(c) {
      if (loaded === c.id) {
        player.seekTo(c.start, true);
        player.playVideo();
      } else {
        player.loadVideoById({ videoId: c.id, startSeconds: c.start, endSeconds: c.end > c.start ? c.end : undefined });
        loaded = c.id;
      }
    }

    function advance() {
      if (i + 1 < clips.length) return go(i + 1);
      if (ended) return;
      ended = true;
      try { player.pauseVideo(); } catch (e) {}
      if (opts.onEnd) opts.onEnd();
    }

    // YouTube's eigen endSeconds mist de cut soms een halve seconde; deze tik
    // is de echte schaar, het ENDED-event hieronder is het vangnet.
    function tick() {
      if (!player || !player.getCurrentTime || player.getPlayerState() !== 1) return;
      var c = clips[i];
      if (!c) return;
      var t = player.getCurrentTime();
      // Vlak na een sprong meldt de speler nog de óude positie. Die zou hier als
      // "eind bereikt" tellen en het fragment meteen overslaan; wachten tot hij
      // in de buurt van het nieuwe begin is (keyframes kunnen ~2 s vroeg landen).
      if (seeking) {
        if ((t >= c.start - 3 && t < c.end) || Date.now() - switched > 5000) seeking = false;
        return;
      }
      if (c.end > c.start && t >= c.end - 0.15) advance();
    }

    loadApi().catch(function () { if (!dead) fail("api"); return null; }).then(function (YT) {
      if (dead || !YT) return;
      // Vastleggen wat er ECHT geladen wordt: clips kan vóór onReady al
      // verwisseld zijn via setClips, en dan zou loaded liegen.
      var first = clips[0];
      player = new YT.Player(el, {
        videoId: first.id,
        playerVars: {
          start: Math.round(first.start),
          end: first.end > first.start ? Math.round(first.end) : undefined,
          autoplay: opts.autoplay === false ? 0 : 1,
          rel: 0, playsinline: 1
        },
        events: {
          onReady: function () {
            if (dead) return;
            ready = true;
            loaded = first.id;
            timer = setInterval(tick, 250);
            if (queued !== null) { var q = queued; queued = null; playAt(clips[q]); }
            else if (opts.onChange) opts.onChange(0, clips[0]);
          },
          // Vangnet als de tik de cut mist. Vlak na een wissel niet: dan is dit
          // het late einde van de vórige clip en zou het er een overslaan.
          onStateChange: function (e) { if (e.data === 0 && Date.now() - switched > 1000) advance(); },
          // Verwijderde of niet-insluitbare video: doorlopen, niet blijven hangen.
          onError: function () { fail("clip"); advance(); },
          // De browser weigert automatisch afspelen: dat moet de gebruiker weten,
          // anders staat er een stil kader zonder uitleg.
          onAutoplayBlocked: function () { fail("autoplay"); }
        }
      });
    });

    return {
      next: function () { advance(); },
      prev: function () { go(i - 1); },
      go: go,
      pause: function () { try { player.pauseVideo(); } catch (e) {} },
      resume: function () { try { player.playVideo(); } catch (e) {} },
      index: function () { return i; },
      // Een ander rijtje op dezelfde speler: scheelt een nieuwe iframe, en
      // daarmee opnieuw reclame, zolang het dezelfde video is.
      setClips: function (list) { if (list && list.length) { clips = list; i = 0; ended = false; } },
      time: function () { try { return player.getCurrentTime() || 0; } catch (e) { return 0; } },
      destroy: function () {
        dead = true;
        clearInterval(timer);
        try { player && player.destroy(); } catch (e) {}
      }
    };
  }

  global.Segue = {
    SEGUE_URL: SEGUE_URL,
    seconds: seconds, clock: clock, videoId: videoId,
    encode: encode, build: build, parse: parse, play: play,
    parseText: parseText, toText: toText
  };
})(typeof window !== "undefined" ? window : globalThis);
