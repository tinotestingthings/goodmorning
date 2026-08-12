(function (global) {
  "use strict";

  // Full detail sheet for a task or project. Edits are optimistic: they save to
  // localStorage for instant display AND enqueue an `actions` row that the
  // bridge writes back into the vault markdown (the vault stays canonical).
  // If the immediate sync fails (offline), the row is buffered and retried.

  var STATUSES = {
    task: [["todo", "To do"], ["doing", "Doing"], ["done", "Done"]],
    project: [["idea-stage", "Idea"], ["active", "Active"], ["paused", "Paused"], ["done", "Finished"]],
    radar: [["open", "Open"], ["follow-up", "Follow up"], ["reviewed", "Reviewed"]]
  };
  var SECTIONS = { task: "tasks", project: "projects", radar: "radar" };

  function loadJSON(key, fb) { try { return JSON.parse(localStorage.getItem(key)) || fb; } catch (e) { return fb; } }
  function saveJSON(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function toast(msg) {
    var t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove("show"); }, 1700);
  }

  // ---- optimistic stores ----
  function getStatus(section, id, fb) {
    var m = loadJSON(k("itemstatus"), {});
    return m[section + ":" + id] || fb;
  }
  function setStatusLocal(section, id, status) {
    var m = loadJSON(k("itemstatus"), {});
    m[section + ":" + id] = status;
    saveJSON(k("itemstatus"), m);
  }
  function getSubtasks(id) {
    var m = loadJSON(k("subtasks"), {});
    return (m[id] || []).slice();
  }
  function setSubtasks(id, list) {
    var m = loadJSON(k("subtasks"), {});
    m[id] = list;
    saveJSON(k("subtasks"), m);
  }
  function getNotes(section, id) {
    var m = loadJSON(k("itemnotes"), {});
    return (m[section + ":" + id] || []).slice();
  }
  function setNotes(section, id, list) {
    var m = loadJSON(k("itemnotes"), {});
    m[section + ":" + id] = list;
    saveJSON(k("itemnotes"), m);
  }

  // ---- sync (optimistic; buffer on failure) ----
  function flushPending() {
    if (!global.DigestSync || !global.SB) return;
    var pend = loadJSON(k("pendingActions"), []);
    if (!pend.length) return;
    saveJSON(k("pendingActions"), []);
    pend.forEach(function (row) {
      global.DigestSync.pushOne(row, function (res) {
        if (res && res.error) {
          var p = loadJSON(k("pendingActions"), []);
          p.push(row);
          saveJSON(k("pendingActions"), p);
        }
      });
    });
  }

  function enqueue(row) {
    if (global.DigestSync && global.SB) {
      global.DigestSync.pushOne(row, function (res) {
        if (res && res.error) {
          var p = loadJSON(k("pendingActions"), []);
          p.push(row);
          saveJSON(k("pendingActions"), p);
        }
      });
    } else {
      var p = loadJSON(k("pendingActions"), []);
      p.push(row);
      saveJSON(k("pendingActions"), p);
    }
  }

  // ---- sheet ----
  function todayStr() {
    var d = new Date(), p = function (n) { return n < 10 ? "0" + n : "" + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  // Put an item (or subtask) onto the calendar as a to-do — appears instantly
  // (the calendar reads the same store) and rides the cross-device agenda sync.
  function scheduleTodo(text, dateVal, startVal, endVal) {
    if (!global.DayModel) { toast("Calendar not ready"); return; }
    var list = global.DayModel.loadTodos();
    list.push({
      id: "todo-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      text: text, dueDate: dateVal || todayStr(), startTime: startVal || null, endTime: endVal || null,
      done: false, snoozes: 0
    });
    global.DayModel.saveTodos(list);
    toast("Added to calendar");
  }

  // Radar -> scheduled task: a normal calendar to-do, tagged with the radar id
  // so the radar tile can show/link it and count it as an open task.
  function makeRadarTask(text, dateVal, radarId) {
    if (!global.DayModel) { toast("Calendar not ready"); return false; }
    var list = global.DayModel.loadTodos();
    list.push({
      id: "todo-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      text: text, dueDate: dateVal || todayStr(), startTime: null, endTime: null,
      done: false, snoozes: 0, radarId: radarId || null, source: "radar"
    });
    global.DayModel.saveTodos(list);
    return true;
  }
  function radarTaskFor(radarId) {
    try { return (global.DayModel ? global.DayModel.loadTodos() : []).filter(function (t) { return t.radarId === radarId; }); }
    catch (e) { return []; }
  }

  function open(item, type) {
    var section = SECTIONS[type] || "tasks";
    var id = item.id;
    var changed = false;
    flushPending();

    // Round-trip: if this device has no local copy (fresh device, or after a
    // cache clear) but the feed carries the vault's notes/subtasks, seed the
    // local store from the feed so they show up and stay editable.
    if (item.subtasks && item.subtasks.length && getSubtasks(id).length === 0) {
      setSubtasks(id, item.subtasks.map(function (s) {
        return typeof s === "string" ? { text: s, done: false } : { text: s.text, done: !!s.done };
      }));
    }
    if (item.notes && item.notes.length && getNotes(section, id).length === 0) {
      setNotes(section, id, item.notes.map(function (n) {
        return typeof n === "string" ? { text: n, ts: "" } : { text: n.text, ts: n.ts || "" };
      }));
    }

    var overlay = el("div", "detail-overlay");
    var panel = el("div", "detail-panel");

    function close() {
      overlay.classList.remove("show");
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (changed && global.App && global.App.go) global.App.go("today");
      }, 200);
    }

    // header
    var header = el("div", "detail-header");
    var closeBtn = el("button", "detail-close", "");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    closeBtn.addEventListener("click", close);
    header.appendChild(closeBtn);
    header.appendChild(el("span", "detail-kind",
      type === "project" ? "Project" : type === "radar" ? "Radar item" : "Task"));

    // Remove → 99 Archive (tasks + projects only; projects need confirmation).
    if (type === "task" || type === "project") {
      var removeBtn = el("button", "detail-remove", "Remove");
      removeBtn.type = "button";
      removeBtn.addEventListener("click", function () {
        if (type === "project") {
          var sure = (typeof confirm === "function")
            ? confirm("Remove this project? It moves to 99 Archive in your vault (never deleted outright).")
            : true;
          if (!sure) return;
        }
        var rm = loadJSON(k("removed"), {});
        rm[id] = { title: item.title || id, section: section, type: type, at: new Date().toISOString() };
        saveJSON(k("removed"), rm);
        enqueue({ type: "remove", target_id: id, section: section });
        changed = true;
        toast("Moved to archive");
        close();
      });
      header.appendChild(removeBtn);
    }
    panel.appendChild(header);

    var body = el("div", "detail-body");

    body.appendChild(el("h1", "detail-title", item.title || "(untitled)"));
    var info = [item.detail, item.line, item.hint].filter(Boolean).join(" · ");
    if (info) body.appendChild(el("p", "detail-info", info));

    // ---- status (radar items convert to a task instead — no status here) ----
    if (type !== "radar") {
    body.appendChild(el("div", "detail-section-label", "Status"));
    var curStatus = getStatus(section, id, item.status);
    var seg = el("div", "detail-seg");
    (STATUSES[type] || STATUSES.task).forEach(function (pair) {
      var b = el("button", "detail-seg-btn" + (pair[0] === curStatus ? " active" : ""), pair[1]);
      b.type = "button";
      b.addEventListener("click", function () {
        curStatus = pair[0];
        setStatusLocal(section, id, curStatus);
        seg.querySelectorAll(".detail-seg-btn").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        enqueue({ type: "status", target_id: id, section: section, body: curStatus });
        changed = true;
        toast("Status → " + pair[1]);
      });
      seg.appendChild(b);
    });
    body.appendChild(seg);
    }

    // ---- promote task <-> project ----
    // These are vault items, so the actual file move (30 Tasks <-> 40 Projects)
    // happens on the next daily-digest sync via a `convert` action; the sheet
    // just enqueues it and tells the user it lands on next sync.
    if (type === "task" || type === "project") {
      body.appendChild(el("div", "detail-section-label", type === "project" ? "Make this a task" : "Make this a project"));
      var to = type === "project" ? "task" : "project";
      var convBtn = el("button", "detail-convert-btn", "Convert to " + (to === "project" ? "project" : "task"));
      convBtn.type = "button";
      convBtn.addEventListener("click", function () {
        enqueue({ type: "convert", target_id: id, section: section, body: to });
        changed = true;
        toast("Will move to " + (to === "project" ? "Projects" : "Tasks") + " on next sync");
        close();
      });
      body.appendChild(convBtn);
    }

    // ---- radar items: convert to a scheduled task, then notes ----
    if (type === "radar") {
      body.appendChild(buildRadarTaskSection());
      body.appendChild(buildNotesSection());
      finish();
      return;
    }

    function buildRadarTaskSection() {
      var wrap = el("div", "detail-radar-task-wrap");
      var openTasks = radarTaskFor(id).filter(function (t) { return !t.done; });
      if (openTasks.length) {
        wrap.appendChild(el("div", "detail-section-label", "Scheduled task"));
        openTasks.forEach(function (t) {
          wrap.appendChild(el("div", "detail-radar-task", t.text + (t.dueDate ? " · due " + t.dueDate : "")));
        });
        var openBtn = el("button", "detail-convert-btn", "Open in calendar");
        openBtn.type = "button";
        openBtn.addEventListener("click", function () { if (global.App && App.go) App.go("calendar"); close(); });
        wrap.appendChild(openBtn);
        return wrap;
      }
      wrap.appendChild(el("div", "detail-section-label", "Make into a scheduled task"));
      var rowEl = el("div", "detail-add-row");
      var dateEl = document.createElement("input");
      dateEl.type = "date"; dateEl.className = "detail-input";
      dateEl.value = (item.hint && /^\d{4}-\d{2}-\d{2}$/.test(item.hint)) ? item.hint : todayStr();
      var btn = el("button", "detail-add-btn", "Make task");
      btn.type = "button";
      btn.addEventListener("click", function () {
        if (makeRadarTask(item.title, dateEl.value, id)) { changed = true; toast("Scheduled task created"); close(); }
      });
      rowEl.appendChild(dateEl); rowEl.appendChild(btn);
      wrap.appendChild(rowEl);
      return wrap;
    }

    // ---- schedule the whole item into the calendar ----
    body.appendChild(el("div", "detail-section-label", "Schedule in calendar"));
    var schedRow = el("div", "detail-add-row");
    var schedDate = document.createElement("input"); schedDate.type = "date"; schedDate.className = "detail-input"; schedDate.value = todayStr();
    var schedTime = document.createElement("input"); schedTime.type = "time"; schedTime.className = "detail-input";
    var schedBtn = el("button", "detail-add-btn", "Add");
    schedBtn.type = "button";
    schedBtn.addEventListener("click", function () { scheduleTodo(item.title, schedDate.value, schedTime.value || null, null); });
    schedRow.appendChild(schedDate); schedRow.appendChild(schedTime); schedRow.appendChild(schedBtn);
    body.appendChild(schedRow);

    body.appendChild(el("div", "detail-section-label", "Subtasks"));
    var subList = el("div", "detail-subs");
    body.appendChild(subList);

    function renderSubs() {
      subList.innerHTML = "";
      var list = getSubtasks(id);
      if (!list.length) subList.appendChild(el("p", "detail-empty", "No subtasks yet."));
      list.map(function (s, i) { return { s: s, i: i }; }).sort(function (a, b) { return (a.s.done ? 1 : 0) - (b.s.done ? 1 : 0); }).forEach(function (ent) { var s = ent.s, i = ent.i;
        var rowEl = el("div", "detail-sub" + (s.done ? " done" : ""));
        var box = el("button", "detail-check" + (s.done ? " checked" : ""));
        box.type = "button";
        box.innerHTML = s.done ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' : "";
        box.addEventListener("click", function () {
          var arr = getSubtasks(id);
          arr[i].done = !arr[i].done;
          setSubtasks(id, arr);
          enqueue({ type: "subtask", target_id: id, section: section, body: JSON.stringify({ op: "set", text: arr[i].text, done: arr[i].done }) });
          changed = true;
          renderSubs();
        });
        rowEl.appendChild(box);
        rowEl.appendChild(el("span", "detail-sub-text", s.text));
        var sched = el("button", "detail-sub-sched", "");
        sched.type = "button";
        sched.setAttribute("aria-label", "Add subtask to calendar");
        sched.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></svg>';
        sched.addEventListener("click", function () { scheduleTodo(s.text, todayStr(), null, null); });
        rowEl.appendChild(sched);
        var del = el("button", "detail-sub-del", "×");
        del.type = "button";
        del.addEventListener("click", function () {
          var arr = getSubtasks(id);
          var removed = arr.splice(i, 1)[0];
          setSubtasks(id, arr);
          enqueue({ type: "subtask", target_id: id, section: section, body: JSON.stringify({ op: "remove", text: removed.text }) });
          changed = true;
          renderSubs();
        });
        rowEl.appendChild(del);
        subList.appendChild(rowEl);
      });
    }
    renderSubs();

    var addSubRow = el("div", "detail-add-row");
    var subInput = document.createElement("input");
    subInput.type = "text";
    subInput.className = "detail-input";
    subInput.placeholder = "Add a subtask…";
    var subAdd = el("button", "detail-add-btn", "Add");
    subAdd.type = "button";
    function addSub() {
      var text = (subInput.value || "").trim();
      if (!text) return;
      var arr = getSubtasks(id);
      arr.push({ text: text, done: false });
      setSubtasks(id, arr);
      enqueue({ type: "subtask", target_id: id, section: section, body: JSON.stringify({ op: "add", text: text }) });
      changed = true;
      subInput.value = "";
      renderSubs();
    }
    subAdd.addEventListener("click", addSub);
    subInput.addEventListener("keydown", function (e) { if (e.key === "Enter") addSub(); });
    addSubRow.appendChild(subInput);
    addSubRow.appendChild(subAdd);
    body.appendChild(addSubRow);

    // ---- notes ----
    body.appendChild(buildNotesSection());
    finish();

    function buildNotesSection() {
      var frag = document.createDocumentFragment();
      frag.appendChild(el("div", "detail-section-label", "Notes"));
      var noteList = el("div", "detail-notes");
      frag.appendChild(noteList);

      function renderNotes() {
        noteList.innerHTML = "";
        var list = getNotes(section, id);
        if (!list.length) noteList.appendChild(el("p", "detail-empty", "No notes yet."));
        list.slice().reverse().forEach(function (n) {
          var nEl = el("div", "detail-note");
          nEl.appendChild(el("div", "detail-note-text", n.text));
          nEl.appendChild(el("div", "detail-note-ts", n.ts));
          noteList.appendChild(nEl);
        });
      }
      renderNotes();

      var addNoteRow = el("div", "detail-add-row");
      var noteInput = document.createElement("textarea");
      noteInput.className = "detail-input detail-note-input";
      noteInput.rows = 2;
      noteInput.placeholder = "Add a note…";
      var noteAdd = el("button", "detail-add-btn", "Add");
      noteAdd.type = "button";
      noteAdd.addEventListener("click", function () {
        var text = (noteInput.value || "").trim();
        if (!text) return;
        var arr = getNotes(section, id);
        var ts = new Date().toISOString().slice(0, 16).replace("T", " ");
        arr.push({ text: text, ts: ts });
        setNotes(section, id, arr);
        enqueue({ type: "note", target_id: id, section: section, body: text });
        changed = true;
        noteInput.value = "";
        renderNotes();
        toast("Note saved");
      });
      addNoteRow.appendChild(noteInput);
      addNoteRow.appendChild(noteAdd);
      frag.appendChild(addNoteRow);
      return frag;
    }

    function finish() {
      panel.appendChild(body);
      if (global.Sheet) global.Sheet.swipeClose(panel, close);
      overlay.appendChild(panel);
      overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
      document.body.appendChild(overlay);
      (global.requestAnimationFrame || setTimeout)(function () { overlay.classList.add("show"); });
    }
  }

  global.ItemDetail = { open: open };
})(window);
