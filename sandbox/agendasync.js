(function (global) {
  "use strict";

  // Cross-device agenda sync. The calendar's to-dos + chores (sbx.todos /
  // sbx.chores) are mirrored to one `agenda_state` row per user in Supabase
  // (last writer wins — fine for one person). Every device pulls on
  // boot/focus, and pushes the instant its local copy changes (home.js's
  // saveTodos/saveChores call pushNow) with a 25s safety poll behind it.

  var KEYS = ["sbx.todos", "sbx.todos.history", "sbx.chores"];
  var POLL_MS = 25000;
  var lastSynced = null;   // JSON string of the state last pushed/pulled
  var remoteStamp = null;
  var userId = null;
  var started = false;
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
    if (global.App && global.App.go && global.App.getRoute) global.App.go(global.App.getRoute());
  }

  function note(err) {
    try { localStorage.setItem("sbx.agendasync.status", err ? ("error: " + err) : ("ok " + new Date().toISOString())); } catch (e) {}
    if (err) { try { console.warn("[AgendaSync]", err); } catch (e) {} }
  }

  function push(cur) {
    if (!global.SB || !userId) return;
    busy = true;
    global.SB.from("agenda_state")
      .upsert({ user_id: userId, data: JSON.parse(cur), updated_at: new Date().toISOString() }, { onConflict: "user_id" })
      .then(function (res) {
        busy = false;
        if (res && res.error) { note(res.error.message); return; }
        lastSynced = cur;
        note(null);
      }, function (err) { busy = false; note((err && err.message) || "push failed"); });
  }

  function pull(cb) {
    if (!global.SB || !userId) { cb && cb(); return; }
    global.SB.from("agenda_state").select("data,updated_at").eq("user_id", userId).then(function (res) {
      if (res && res.error) { note(res.error.message); cb && cb(); return; }
      if (res && res.data && res.data.length) {
        var row = res.data[0];
        if (row.updated_at !== remoteStamp) {
          remoteStamp = row.updated_at;
          var remoteJson = JSON.stringify(row.data);
          // local edits win: only overwrite if we've nothing unpushed
          if (lastSynced === null || snapshot() === lastSynced) {
            applySnapshot(remoteJson);
            lastSynced = snapshot();
          }
        }
      }
      cb && cb();
    }, function (err) { note((err && err.message) || "pull failed"); cb && cb(); });
  }

  function pushNow() {
    if (!global.SB || !userId || busy) return;
    var cur = snapshot();
    if (cur !== lastSynced) push(cur);
  }

  function tick() {
    if (busy || !global.SB || !userId) return;
    var cur = snapshot();
    if (lastSynced !== null && cur !== lastSynced) push(cur);
    else pull();
  }

  // Idempotent init — runs whether the session was already present at load
  // OR arrives later via login (the bug before: login-after-load never armed
  // the loop). Starts the poll + focus sync exactly once.
  function init(session) {
    if (started || !session) return;
    started = true;
    userId = session.user.id;
    pull(function () { if (lastSynced === null) lastSynced = snapshot(); });
    setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) tick(); });
  }

  function start() {
    if (!global.SB) return;
    global.SB.auth.getSession().then(function (res) {
      var s = res && res.data && res.data.session;
      if (s) init(s);
    });
    global.SB.auth.onAuthStateChange(function (event, session) { if (session) init(session); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();

  global.AgendaSync = { pushNow: pushNow, tick: tick };
})(window);
