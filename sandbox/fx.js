(function (global) {
  "use strict";
  // Little completion celebration: a confetti burst + a cheerful "pling"
  // (WebAudio, no asset). Sound respects the Settings toggle (sbx.sound).
  var SOUND_KEY = "sbx.sound";
  function soundOn() { try { return localStorage.getItem(SOUND_KEY) !== "off"; } catch (e) { return true; } }
  function setSound(on) { try { localStorage.setItem(SOUND_KEY, on ? "on" : "off"); } catch (e) {} }

  var actx = null;
  function ding() {
    if (!soundOn()) return;
    try {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return;
      actx = actx || new AC();
      if (actx.state === "suspended") actx.resume();
      var now = actx.currentTime;
      [[784, 0], [1046, 0.08], [1318, 0.16]].forEach(function (p) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = "sine"; o.frequency.value = p[0];
        o.connect(g); g.connect(actx.destination);
        g.gain.setValueAtTime(0.0001, now + p[1]);
        g.gain.exponentialRampToValueAtTime(0.22, now + p[1] + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + p[1] + 0.2);
        o.start(now + p[1]); o.stop(now + p[1] + 0.22);
      });
    } catch (e) {}
  }

  function celebrate(anchor) {
    try {
      var r = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : null;
      var cx = r ? r.left + r.width / 2 : global.innerWidth / 2;
      var cy = r ? r.top + r.height / 2 : global.innerHeight / 2;
      var colors = ["#2fae66", "#e8730c", "#4a90d9", "#a774d9", "#f2c14e"];
      for (var i = 0; i < 16; i++) {
        var s = document.createElement("span");
        s.className = "fx-confetti";
        s.style.left = cx + "px"; s.style.top = cy + "px";
        s.style.background = colors[i % colors.length];
        var ang = Math.random() * Math.PI * 2, dist = 26 + Math.random() * 46;
        s.style.setProperty("--dx", (Math.cos(ang) * dist) + "px");
        s.style.setProperty("--dy", (Math.sin(ang) * dist - 10) + "px");
        document.body.appendChild(s);
        (function (elm) { setTimeout(function () { elm.remove(); }, 750); })(s);
      }
    } catch (e) {}
  }

  global.FX = {
    ding: ding, celebrate: celebrate, soundOn: soundOn, setSound: setSound,
    party: function (anchor) { celebrate(anchor); ding(); }
  };
})(window);
