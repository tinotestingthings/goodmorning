(function (global) {
  "use strict";

  // ---- one-time agenda recovery (2026-08-09) --------------------------------
  // The live agenda was wiped when a seed write pushed a not-yet-populated
  // snapshot over the server row (see CHANGELOG 2026-08-09 hotfix). The
  // service_role key can only READ agenda_state, so the restore has to happen
  // client-side under the user's own auth — the same approach items.js uses.
  //
  // Deliberately conservative. It runs ONLY when all of these hold:
  //   * the first AgendaSync pull has completed (never fight the sync), and
  //   * this stamp hasn't been applied on this device before, and
  //   * the local to-do list is genuinely empty (so it can NEVER overwrite
  //     anything the user has since re-created, or run twice).
  // Once written it pushes to Supabase so the other devices pick it up.

  var FLAG = k("agendaRestore");
  var STAMP = "2026-08-09-agenda-restore";

  function isEmpty(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw || raw === "null") return true;
      var v = JSON.parse(raw);
      return !Array.isArray(v) || v.length === 0;
    } catch (e) { return false; }   // unreadable -> treat as NOT empty, never overwrite
  }

  function run() {
    try { if (localStorage.getItem(FLAG) === STAMP) return; } catch (e) { return; }
    if (!isEmpty(k("todos"))) {                       // real data present -> stand down
      try { localStorage.setItem(FLAG, STAMP); } catch (e) {}
      return;
    }
    fetch("agenda-restore.json", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("no restore file");
      return r.json();
    }).then(function (data) {
      if (!data || !Array.isArray(data.todos)) return;
      if (!isEmpty(k("todos"))) return;               // re-check after the await
      try {
        localStorage.setItem(k("todos"), JSON.stringify(data.todos));
        if (Array.isArray(data.chores) && isEmpty(k("chores"))) {
          localStorage.setItem(k("chores"), JSON.stringify(data.chores));
        }
        localStorage.setItem(FLAG, STAMP);
      } catch (e) { return; }
      if (global.AgendaSync && global.AgendaSync.pushNow) global.AgendaSync.pushNow();
      if (global.App && global.App.go && global.App.getRoute) global.App.go(global.App.getRoute());
      try {
        var t = document.querySelector(".toast");
        if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
        t.textContent = "Agenda restored from 7 Aug backup";
        t.classList.add("show");
        setTimeout(function () { t.classList.remove("show"); }, 2600);
      } catch (e) {}
    }).catch(function () { /* offline — try again next boot */ });
  }

  // Only after the first pull has landed.
  document.addEventListener("dd-agenda-ready", run);
})(window);
