(function (global) {
  "use strict";

  // Quick-capture: a floating "+" that opens a sheet and writes a row to the
  // Supabase `captures` table. The Mac bridge task later drains those rows into
  // the vault inbox. Insert relies on RLS (user_id defaults to auth.uid()), so
  // a row can only ever be created for the logged-in user.

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function toast(message) {
    var t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.textContent = message;
    t.classList.add("show");
    clearTimeout(t._hideTimer);
    t._hideTimer = setTimeout(function () { t.classList.remove("show"); }, 1900);
  }

  var KINDS = [["note", "Note"], ["task", "Task"], ["project", "Project"]];

  // Local log of what was captured, so the History view can show it even after
  // the Supabase rows are drained into the vault. Capped to the last 60.
  function logCapture(kind, title, held) {
    try {
      var list = JSON.parse(localStorage.getItem(k("capture.log")) || "[]");
      list.push({ kind: kind, title: title, held: !!held, at: new Date().toISOString() });
      if (list.length > 60) list = list.slice(list.length - 60);
      localStorage.setItem(k("capture.log"), JSON.stringify(list));
    } catch (e) {}
  }

  function openSheet() {
    var backdrop = el("div", "card-menu-backdrop");
    var sheet = el("div", "card-menu capture-sheet");

    function close() {
      backdrop.classList.remove("show");
      setTimeout(function () { if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop); }, 180);
    }

    sheet.appendChild(el("div", "capture-heading", "Quick capture"));

    var ta = document.createElement("textarea");
    ta.className = "capture-textarea";
    ta.rows = 4;
    ta.placeholder = "What's on your mind? First line becomes the title.";

    var kind = "note";
    var seg = el("div", "capture-seg");
    KINDS.forEach(function (pair) {
      var b = el("button", "capture-seg-btn" + (pair[0] === kind ? " active" : ""), pair[1]);
      b.type = "button";
      b.addEventListener("click", function () {
        kind = pair[0];
        seg.querySelectorAll(".capture-seg-btn").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        send.textContent = kind === "task" ? "Add task" : kind === "project" ? "Add project" : "Add to inbox";
        hold.style.display = kind === "note" ? "" : "none";
        whenWrap.style.display = kind === "task" ? "" : "none";
      });
      seg.appendChild(b);
    });

    // "When" for tasks: Today (default) / Tomorrow / a picked date land the task
    // straight on the calendar as a to-do; "No date" keeps the old behaviour
    // (it goes to the Tasks list only). This is the fix for "the + button
    // can't create to-dos" — before, every task went to the undated list.
    var when = "today";
    var whenWrap = el("div", "capture-when");
    whenWrap.appendChild(el("div", "capture-when-label", "When?"));
    var whenSeg = el("div", "capture-seg");
    var whenDate = document.createElement("input");
    whenDate.type = "date"; whenDate.className = "field-input capture-when-date";
    whenDate.style.display = "none";
    function localYmd(d) { var p = function (n) { return n < 10 ? "0" + n : "" + n; }; return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
    [["today", "Today"], ["tomorrow", "Tomorrow"], ["pick", "Date…"], ["none", "No date"]].forEach(function (pair) {
      var b = el("button", "capture-seg-btn" + (pair[0] === when ? " active" : ""), pair[1]);
      b.type = "button";
      b.addEventListener("click", function () {
        when = pair[0];
        whenSeg.querySelectorAll(".capture-seg-btn").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        whenDate.style.display = when === "pick" ? "" : "none";
        if (when === "pick" && !whenDate.value) whenDate.value = localYmd(new Date());
      });
      whenSeg.appendChild(b);
    });
    whenWrap.appendChild(whenSeg);
    whenWrap.appendChild(whenDate);
    whenWrap.style.display = "none"; // shown only for kind=task

    // Hold = keep it in Supabase to ponder; it won't sync to the vault until
    // released. Unchecked = syncs on the next bridge run (or "sync my notes").
    var hold = el("label", "capture-hold");
    var holdCb = document.createElement("input");
    holdCb.type = "checkbox";
    holdCb.className = "capture-hold-cb";
    hold.appendChild(holdCb);
    hold.appendChild(el("span", null, "Hold to ponder — don't sync yet"));

    var send = el("button", "btn btn-primary capture-send", "Add to inbox");
    send.type = "button";
    send.addEventListener("click", function () {
      var body = (ta.value || "").trim();
      if (!body) { toast("Type something first"); return; }
      if (kind === "task" || kind === "project") {
        var _t = body.split("\n")[0].slice(0, 120);
        var _note = body.slice(_t.length).trim();
        // Dated task -> a real calendar to-do (same store the calendar edits).
        if (kind === "task" && when !== "none" && global.DayModel) {
          var due = when === "tomorrow" ? localYmd(new Date(Date.now() + 86400000))
                  : when === "pick" ? (whenDate.value || localYmd(new Date()))
                  : localYmd(new Date());
          var list = global.DayModel.loadTodos();
          list.push({ id: "todo-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
            text: _t, dueDate: due, startTime: null, endTime: null,
            done: false, snoozes: 0, note: _note || null });
          global.DayModel.saveTodos(list);
          logCapture("todo", _t, false);
          toast("To-do added · " + due);
          close();
          if (global.App && global.App.go && global.App.getRoute) global.App.go(global.App.getRoute());
          return;
        }
        if (!global.Items || !global.Items.add) { toast("App not ready — try again"); return; }
        global.Items.add({ type: kind, state: kind === "project" ? "idea" : "todo", title: _t, note: _note });
        logCapture(kind, _t, false);
        toast(kind === "project" ? "Project added" : "Task added");
        close();
        if (global.App && global.App.go && global.App.getRoute) global.App.go(global.App.getRoute());
        return;
      }
      if (!global.SB) { toast("Not connected — try again"); return; }
      send.disabled = true; send.textContent = "Adding…";
      var title = body.split("\n")[0].slice(0, 120);
      var status = holdCb.checked ? "holding" : "new";
      global.SB.from("captures").insert({ kind: kind, title: title, body: body, status: status }).then(function (res) {
        send.disabled = false; send.textContent = "Add to inbox";
        if (res && res.error) { toast("Failed: " + res.error.message); return; }
        logCapture(kind, title, holdCb.checked);
        toast(holdCb.checked ? "Held to ponder" : "Added to inbox");
        close();
      }, function (err) {
        send.disabled = false; send.textContent = "Add to inbox";
        toast("Failed: " + ((err && err.message) || "unknown"));
      });
    });

    var cancel = el("button", "card-menu-cancel", "Cancel");
    cancel.type = "button";
    cancel.addEventListener("click", close);

    sheet.appendChild(ta);
    sheet.appendChild(seg);
    sheet.appendChild(whenWrap);
    sheet.appendChild(hold);
    sheet.appendChild(send);
    sheet.appendChild(cancel);

    // If any notes are on hold, offer to release them all for the next sync.
    if (global.SB) {
      global.SB.from("captures").select("id").eq("status", "holding").then(function (res) {
        if (!res || res.error || !res.data || !res.data.length) return;
        var n = res.data.length;
        var rel = el("button", "capture-release", "Release " + n + " held → sync");
        rel.type = "button";
        rel.addEventListener("click", function () {
          rel.disabled = true; rel.textContent = "Releasing…";
          global.SB.from("captures").update({ status: "new" }).eq("status", "holding").then(function (r2) {
            if (r2 && r2.error) { toast("Failed"); rel.disabled = false; rel.textContent = "Release " + n + " held → sync"; return; }
            toast(n + " released — syncs next run");
            if (rel.parentNode) rel.parentNode.removeChild(rel);
          });
        });
        sheet.insertBefore(rel, cancel);
      });
    }
    if (global.Sheet) global.Sheet.swipeClose(sheet, close);
    backdrop.appendChild(sheet);
    backdrop.addEventListener("click", function (e) { if (e.target === backdrop) close(); });
    document.body.appendChild(backdrop);
    (global.requestAnimationFrame || setTimeout)(function () { backdrop.classList.add("show"); });
    setTimeout(function () { ta.focus(); }, 60);
  }

  // ---- movable FAB: hold & drag to reposition, snaps to the nearest side,
  // remembers where you left it. A plain tap still opens the capture sheet. ----
  var POS_KEY = k("fabpos");
  function loadPos() { try { var p = JSON.parse(localStorage.getItem(POS_KEY)); if (p && p.side) return p; } catch (e) {} return null; }
  function savePos(p) { try { localStorage.setItem(POS_KEY, JSON.stringify(p)); } catch (e) {} }

  function applyPos(fab, p) {
    if (!p) return;
    fab.classList.add("capture-fab-moved");
    var h = fab.offsetHeight || 56;
    var top = Math.max(12, Math.min(p.top, window.innerHeight - h - 12));
    fab.style.top = top + "px"; fab.style.bottom = "auto"; fab.style.opacity = "1";
    if (p.side === "left") { fab.style.left = "16px"; fab.style.right = "auto"; }
    else { fab.style.right = "16px"; fab.style.left = "auto"; }
  }

  function wireDrag(fab) {
    var sx = 0, sy = 0, grabX = 0, grabY = 0, dragging = false, pid = null;
    fab.addEventListener("pointerdown", function (e) {
      pid = e.pointerId; sx = e.clientX; sy = e.clientY; dragging = false;
      var r = fab.getBoundingClientRect(); grabX = e.clientX - r.left; grabY = e.clientY - r.top;
    });
    fab.addEventListener("pointermove", function (e) {
      if (pid === null) return;
      if (!dragging) {
        if (Math.abs(e.clientX - sx) < 6 && Math.abs(e.clientY - sy) < 6) return;
        dragging = true;
        try { fab.setPointerCapture(pid); } catch (_) {}
        fab.classList.add("capture-fab-dragging", "capture-fab-moved");
        fab.style.transition = "none";
      }
      if (e.cancelable) e.preventDefault();
      var w = fab.offsetWidth || 56, h = fab.offsetHeight || 56;
      var left = Math.max(6, Math.min(e.clientX - grabX, window.innerWidth - w - 6));
      var top = Math.max(12, Math.min(e.clientY - grabY, window.innerHeight - h - 12));
      fab.style.left = left + "px"; fab.style.right = "auto";
      fab.style.top = top + "px"; fab.style.bottom = "auto"; fab.style.opacity = "1";
    });
    function end() {
      if (pid === null) return;
      try { fab.releasePointerCapture(pid); } catch (_) {}
      pid = null;
      if (!dragging) return;
      dragging = false;
      fab.classList.remove("capture-fab-dragging");
      fab.style.transition = "";
      var r = fab.getBoundingClientRect();
      var side = (r.left + r.width / 2) < window.innerWidth / 2 ? "left" : "right";
      var pos = { side: side, top: Math.round(r.top) };
      savePos(pos); applyPos(fab, pos);
      fab._justDragged = true;
      setTimeout(function () { fab._justDragged = false; }, 80);
    }
    fab.addEventListener("pointerup", end);
    fab.addEventListener("pointercancel", end);
  }

  function mount() {
    if (document.querySelector(".capture-fab")) return;
    var fab = el("button", "capture-fab");
    fab.type = "button";
    fab.setAttribute("aria-label", "Quick capture (hold and drag to move)");
    fab.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
    fab.addEventListener("click", function (e) {
      if (fab._justDragged) { e.preventDefault(); e.stopPropagation(); return; }
      openSheet();
    });
    document.body.appendChild(fab);
    applyPos(fab, loadPos());
    wireDrag(fab);
    window.addEventListener("resize", function () { applyPos(fab, loadPos()); });
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})(window);
