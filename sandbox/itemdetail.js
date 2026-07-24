(function (global) {
  "use strict";

  // Full detail sheet for a task or project. Edits are optimistic: they save to
  // localStorage for instant display AND enqueue an `actions` row that the
  // bridge writes back into the vault markdown (the vault stays canonical).
  // If the immediate sync fails (offline), the row is buffered and retried.

  var STATUSES = {
    task: [["todo", "To do"], ["doing", "Doing"], ["done", "Done"]],
    project: [["idea-stage", "Idea"], ["active", "Active"], ["paused", "Paused"]]
  };

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
    var m = loadJSON("sbx.itemstatus", {});
    return m[section + ":" + id] || fb;
  }
  function setStatusLocal(section, id, status) {
    var m = loadJSON("sbx.itemstatus", {});
    m[section + ":" + id] = status;
    saveJSON("sbx.itemstatus", m);
  }
  function getSubtasks(id) {
    var m = loadJSON("sbx.subtasks", {});
    return (m[id] || []).slice();
  }
  function setSubtasks(id, list) {
    var m = loadJSON("sbx.subtasks", {});
    m[id] = list;
    saveJSON("sbx.subtasks", m);
  }
  function getNotes(section, id) {
    var m = loadJSON("sbx.itemnotes", {});
    return (m[section + ":" + id] || []).slice();
  }
  function setNotes(section, id, list) {
    var m = loadJSON("sbx.itemnotes", {});
    m[section + ":" + id] = list;
    saveJSON("sbx.itemnotes", m);
  }

  // ---- sync (optimistic; buffer on failure) ----
  function flushPending() {
    if (!global.DigestSync || !global.SB) return;
    var pend = loadJSON("sbx.pendingActions", []);
    if (!pend.length) return;
    saveJSON("sbx.pendingActions", []);
    pend.forEach(function (row) {
      global.DigestSync.pushOne(row, function (res) {
        if (res && res.error) {
          var p = loadJSON("sbx.pendingActions", []);
          p.push(row);
          saveJSON("sbx.pendingActions", p);
        }
      });
    });
  }

  function enqueue(row) {
    if (global.DigestSync && global.SB) {
      global.DigestSync.pushOne(row, function (res) {
        if (res && res.error) {
          var p = loadJSON("sbx.pendingActions", []);
          p.push(row);
          saveJSON("sbx.pendingActions", p);
        }
      });
    } else {
      var p = loadJSON("sbx.pendingActions", []);
      p.push(row);
      saveJSON("sbx.pendingActions", p);
    }
  }

  // ---- sheet ----
  function open(item, type) {
    var section = type === "project" ? "projects" : "tasks";
    var id = item.id;
    var changed = false;
    flushPending();

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
    header.appendChild(el("span", "detail-kind", type === "project" ? "Project" : "Task"));
    panel.appendChild(header);

    var body = el("div", "detail-body");

    body.appendChild(el("h1", "detail-title", item.title || "(untitled)"));
    var info = [item.detail, item.line, item.hint].filter(Boolean).join(" · ");
    if (info) body.appendChild(el("p", "detail-info", info));

    // ---- status ----
    body.appendChild(el("div", "detail-section-label", "Status"));
    var curStatus = getStatus(section, id, item.status);
    var seg = el("div", "detail-seg");
    STATUSES[type === "project" ? "project" : "task"].forEach(function (pair) {
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

    // ---- subtasks ----
    body.appendChild(el("div", "detail-section-label", "Subtasks"));
    var subList = el("div", "detail-subs");
    body.appendChild(subList);

    function renderSubs() {
      subList.innerHTML = "";
      var list = getSubtasks(id);
      if (!list.length) subList.appendChild(el("p", "detail-empty", "No subtasks yet."));
      list.forEach(function (s, i) {
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
    body.appendChild(el("div", "detail-section-label", "Notes"));
    var noteList = el("div", "detail-notes");
    body.appendChild(noteList);

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
    function addNote() {
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
    }
    noteAdd.addEventListener("click", addNote);
    addNoteRow.appendChild(noteInput);
    addNoteRow.appendChild(noteAdd);
    body.appendChild(addNoteRow);

    panel.appendChild(body);
    overlay.appendChild(panel);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.body.appendChild(overlay);
    (global.requestAnimationFrame || setTimeout)(function () { overlay.classList.add("show"); });
  }

  global.ItemDetail = { open: open };
})(window);
