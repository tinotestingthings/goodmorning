(function () {
  "use strict";

  // Clipinus: de UI om segue.js heen. Geen opslag en geen Supabase-tabel — de
  // link in de adresbalk is de hele staat, dus #<base64> in deze pagina speelt
  // hetzelfde rijtje als dezelfde payload op segue.video.

  var $ = function (id) { return document.getElementById(id); };
  var box = $("script"), msg = $("msg"), stage = $("stage"), list = $("clips"),
      out = $("out"), copyBtn = $("copy"), segueLink = $("segue"), sum = $("sum");
  var ctl = null, current = [];

  // "0:43-1:02 Refrein", met de video-regel erboven (of ervoor op dezelfde regel).
  var RANGE = /^([\d:.hms]+)\s*(?:-|–|—|tot|to)\s*([\d:.hms]+)\s*(.*)$/i;

  function fromScript(text) {
    var vid = null, clips = [], skipped = 0;
    String(text || "").split("\n").forEach(function (raw) {
      var line = raw.trim();
      if (!line || line.charAt(0) === "#") return;
      var parts = line.split(/\s+/);
      var id = Segue.videoId(parts[0]);
      if (id) { vid = id; parts.shift(); }
      var rest = parts.join(" ").trim();
      if (!rest) { if (!id) skipped++; return; }
      var m = rest.match(RANGE);
      var start = m && Segue.seconds(m[1]), end = m && Segue.seconds(m[2]);
      if (!m || !vid || isNaN(start) || isNaN(end)) { skipped++; return; }
      clips.push({ id: vid, start: start, end: end, label: m[3] });
    });
    return { clips: clips, skipped: skipped };
  }

  function toScript(clips) {
    var lines = [], last = null;
    clips.forEach(function (c) {
      if (c.id !== last) { lines.push("https://youtu.be/" + c.id); last = c.id; }
      lines.push(Segue.clock(c.start) + "-" + Segue.clock(c.end) + (c.label ? " " + c.label : ""));
    });
    return lines.join("\n");
  }

  // "3 fragmenten \u00b7 1:12" — met een + als er een fragment tot het eind van
  // de video doorloopt, want die lengte weten we hier nog niet.
  function summary(clips) {
    var known = clips.filter(function (c) { return c.end > c.start; });
    var total = known.reduce(function (t, c) { return t + (c.end - c.start); }, 0);
    var n = clips.length + " fragment" + (clips.length === 1 ? "" : "en");
    return total ? n + " \u00b7 " + Segue.clock(total) + (known.length < clips.length ? "+" : "") : n;
  }

  function say(text, bad) {
    msg.textContent = text || "";
    msg.className = bad ? "bad" : "";
  }

  function render(clips, active) {
    list.innerHTML = "";
    clips.forEach(function (c, n) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.className = "clip" + (n === active ? " now" : "");
      b.innerHTML = '<span class="t"></span><span class="l"></span>';
      b.querySelector(".t").textContent = Segue.clock(c.start) + (c.end > c.start ? "–" + Segue.clock(c.end) : "–eind");
      b.querySelector(".l").textContent = c.label || "";
      b.onclick = function () { if (ctl) ctl.go(n); };
      li.appendChild(b);
      list.appendChild(li);
    });
  }

  function start(clips, replaceHash) {
    if (ctl) { ctl.destroy(); ctl = null; }
    current = clips;
    var hash = Segue.encode(clips);
    if (replaceHash !== false) history.replaceState(null, "", "#" + hash);
    segueLink.href = Segue.SEGUE_URL + hash;
    out.className = "on";
    sum.textContent = summary(clips);
    render(clips, 0);

    // YT.Player vervangt het element, dus elke keer een verse div in het kader.
    stage.className = "on";
    stage.innerHTML = "<div></div>";
    ctl = Segue.play(stage.firstChild, clips, {
      onChange: function (i) { render(clips, i); },
      onEnd: function () { say("Klaar — " + clips.length + " fragment" + (clips.length === 1 ? "" : "en") + " gespeeld."); },
      onError: function (why, n) {
        say(why === "api" ? "De YouTube-speler laadt niet — ben je offline?"
                          : "Fragment " + (n + 1) + " speelt hier niet (verwijderd of niet insluitbaar) — overgeslagen.", true);
      }
    });
  }

  $("play").onclick = function () {
    var r = fromScript(box.value);
    if (!r.clips.length) {
      say("Geen fragmenten gevonden. Eerst een YouTube-link, daaronder regels als 0:43-1:02 Refrein.", true);
      return;
    }
    say(r.skipped ? r.skipped + " regel" + (r.skipped === 1 ? "" : "s") + " overgeslagen." : "");
    start(r.clips);
  };

  $("clear").onclick = function () {
    if (ctl) { ctl.destroy(); ctl = null; }
    box.value = ""; list.innerHTML = ""; say(""); sum.textContent = "";
    stage.className = ""; stage.innerHTML = ""; out.className = "";
    history.replaceState(null, "", location.pathname + location.search);
  };

  copyBtn.onclick = function () {
    var url = location.href;
    var done = function () { copyBtn.textContent = "Gekopieerd"; setTimeout(function () { copyBtn.textContent = "Kopieer link"; }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { say(url); });
    else say(url);
  };

  // Binnenkomen op een link: rijtje terugvertalen naar tekst en meteen spelen.
  if (location.hash.length > 1) {
    var parsed = Segue.parse(location.hash);
    if (parsed) {
      box.value = toScript(parsed.clips);
      start(parsed.clips, false);
    } else {
      say("Deze link kon ik niet lezen.", true);
    }
  }
})();
