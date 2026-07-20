(function () {
  "use strict";

  // Simple mobile-style PIN gate. FOR NOW the PIN is hardcoded to 1234 —
  // this is a light lock to keep the app private on a shared phone, not real
  // security (anyone can read the source). Unlock is remembered for the
  // browser session (sessionStorage), so closing the tab re-locks.
  var PIN = "1234";
  var SESSION_KEY = "dd.auth.unlocked";

  if (sessionStorage.getItem(SESSION_KEY) === "1") return;

  var entered = "";

  var overlay = document.createElement("div");
  overlay.className = "pin-overlay";
  overlay.innerHTML =
    '<div class="pin-box">' +
      '<div class="pin-title">Enter PIN</div>' +
      '<div class="pin-dots" id="pinDots">' +
        '<span class="pin-dot"></span><span class="pin-dot"></span>' +
        '<span class="pin-dot"></span><span class="pin-dot"></span>' +
      '</div>' +
      '<div class="pin-pad" id="pinPad"></div>' +
    '</div>';

  function renderDots() {
    var dots = overlay.querySelectorAll(".pin-dot");
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle("filled", i < entered.length);
    }
  }

  function shake() {
    var box = overlay.querySelector(".pin-dots");
    box.classList.remove("pin-shake");
    void box.offsetWidth;
    box.classList.add("pin-shake");
  }

  function press(digit) {
    if (entered.length >= 4) return;
    entered += digit;
    renderDots();
    if (entered.length === 4) setTimeout(check, 120);
  }

  function backspace() {
    entered = entered.slice(0, -1);
    renderDots();
  }

  function check() {
    if (entered === PIN) {
      sessionStorage.setItem(SESSION_KEY, "1");
      overlay.classList.add("pin-ok");
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 200);
    } else {
      shake();
      entered = "";
      setTimeout(renderDots, 300);
    }
  }

  function buildPad() {
    var pad = overlay.querySelector("#pinPad");
    var keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];
    keys.forEach(function (k) {
      if (k === "") { pad.appendChild(document.createElement("span")); return; }
      var btn = document.createElement("button");
      btn.className = "pin-key" + (k === "back" ? " pin-key-back" : "");
      btn.textContent = k === "back" ? "⌫" : k;
      btn.addEventListener("click", function () {
        if (k === "back") backspace(); else press(k);
      });
      pad.appendChild(btn);
    });
  }

  function mount() {
    document.body.appendChild(overlay);
    buildPad();
    renderDots();
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
