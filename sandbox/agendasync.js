(function (global) {
  "use strict";

  // Cross-device agenda sync. The calendar's to-dos + chores (sbx.todos /
  // sbx.chores, browser-local until now) are mirrored to a single
  // `agenda_state` row per user in Supabase (last writer wins — fine for one
  // person). Every device pulls on boot/focus and pushes when its local copy
  // changes, so phone and laptop finally see the same agenda. The daily
  // bridge writes a markdown snapshot of it into the vault for the record.

  var KEYS = ["sbx.todos", "sbx.todos.history", "sbx.chores"];
  var POLL_MS = 25000;
  var lastPushed = null;   // JSON string of the last state we pushed/pulled
  var remoteStamp = null;  // updated_at we last saw remotely
  var userId = null;
  var busy = false;

  function snapshot() {
    var o = {};
    KEYS.forEach(function (k) {
      try { o[k] = JSON.parse(localStorage.getItem(k)) || null; } catch (e) { o[k] = null; }
    });
    return JSON.stringify(o);
  }

  function applySnapshot(json) {
    var o;
    try { o = JSON.parse(json); } catch (e) { return; }
    KEYS.forEach(function (k) {
      if (o && Object.prototype.hasOwnProperty.call(o, k)) {
        if (o[k] === null) localStorage.removeItem(k);
        else localStorage.setItem(k, JSON.stringify(o[k]));
      }
    });
    // Re-render whichever view is showing so the pulled agenda appears.
    if (global.App && global.App.go && global.App.getRoute) global.App.go(global.App.getRoute());
  }

  function push(cur) {
    if (!global.SB || !userId) return;
    busy = true;
    global.SB.from("agenda_state").upsert({ user_id: userId, data: JSON.parse(cur), updated_at: new Date().toISOString() })
      .then(function (res) {
        busy = false;
        if (!res || !res.error) lastPushed = cur;
      }, function () { busy = false; });
  }

  function pull(cb) {
    if (!global.SB || !userId) { cb && cb(); return; }
    global.SB.from("agenda_state").select("data,updated_at").eq("user_id", userId).then(function (res) {
      if (res && !res.error && res.data && res.data.length) {
        var row = res.data[0];
        var remoteJson = JSON.stringify(row.data);
        if (row.updated_at !== remoteStamp) {
          remoteStamp = row.updated_at;
          // Only overwrite local if we haven't changed anything since last sync
          // (local edits win; they'll push next tick).
          if (snapshot() === lastPushed || lastPushed === null) {
            applySnapshot(remoteJson);
            lastPushed = snapshot();
          }
        }
      }
      cb && cb();
    }, function () { cb && cb(); });
  }

  function tick() {
    if (busy || !global.SB || !userId) return;
    var cur = snapshot();
    if (lastPushed !== null && cur !== lastPushed) { push(cur); return; }
    pull();
  }

  function start() {
    if (!global.SB) return;
    global.SB.auth.getSession().then(function (res) {
      var session = res && res.data && res.data.session;
      if (!session) return;
      userId = session.user.id;
      pull(function () { if (lastPushed === null) lastPushed = snapshot(); });
      setInterval(tick, POLL_MS);
      document.addEventListener("visibilitychange", function () { if (!document.hidden) tick(); });
    });
    global.SB.auth.onAuthStateChange(function (event, session) {
      if (session && !userId) { userId = session.user.id; tick(); }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();

  global.AgendaSync = { tick: tick };
})(window);
