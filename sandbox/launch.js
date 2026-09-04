// launch.js — app-launch splash for the utility apps (2026-09-04).
// home.js zooms a card in the home's background colour with the app's icon out
// of the tapped tile, leaves a marker in sessionStorage and navigates. This
// script is the first thing in every launched app's <head>, so it runs before
// the first paint: it paints that same card again, and the app calls
// Launch.done() once it has real content (or shows its login gate). The
// hand-over between the two documents is therefore invisible in every browser;
// no view-transition support needed. Reload / direct open: no marker, no splash.
(function () {
  var KEY = "gm.launch";   // one tab, consumed immediately — not namespaced on purpose
  var m = null;
  try { m = JSON.parse(sessionStorage.getItem(KEY) || "null"); sessionStorage.removeItem(KEY); } catch (e) {}
  var done = function () {};
  if (m && m.bg && Date.now() - (m.t || 0) < 10000) {
    var icon = typeof m.icon === "string" && m.icon.indexOf("<svg") === 0 ? m.icon : "";
    var st = document.createElement("style");
    st.textContent = "#gm-launch{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;" +
      "background:" + m.bg + ";transition:opacity .22s ease}" +
      "#gm-launch svg{width:44px;height:44px;color:" + (m.fg || "currentColor") + "}" +
      "#gm-launch.out{opacity:0;pointer-events:none}";
    document.documentElement.appendChild(st);
    var o = document.createElement("div");
    o.id = "gm-launch";
    o.innerHTML = icon;
    document.documentElement.appendChild(o);
    var gone = false;
    done = function () {
      if (gone) return; gone = true;
      requestAnimationFrame(function () {
        o.classList.add("out");
        setTimeout(function () { o.remove(); st.remove(); }, 260);
      });
    };
    setTimeout(done, 6000);   // safety net: never trap the user behind the splash
  }
  window.Launch = { done: done };
})();
