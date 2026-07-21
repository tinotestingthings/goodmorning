(function () {
  "use strict";

  // Calendar tab. Reuses window.DayModel (from home.js) so it reads/writes the
  // SAME sbx.todos and sbx.chores as the Today tab — no separate data model.
  // A month grid marks days that have items; tapping a day opens a detail panel
  // where you can complete, add, edit, move, or delete tasks. "Chore" = a
  // recurring task; "to-do" = a one-off. Both live together on the calendar.

  var root = document.getElementById("calendarView");
  if (!root) return;

  var M = null; // DayModel, resolved lazily on first show
  var viewYear, viewMonth;      // month currently displayed
  var selectedDate = null;      // YYYY-MM-DD selected day

  var MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  var DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseYmd(s) { return new Date(s + "T00:00:00"); }
  function todayStr() { return ymd(new Date()); }

  // ---- occurrence math (built on DayModel's addInterval/nudgeToWeekday) ----

  // A chore has no fixed schedule of dates — it rolls forward from its last
  // completion by a fixed interval. To show it on a month grid we project that
  // interval forward from an anchor across the visible range, plus mark past
  // completions from its log. The projection re-anchors whenever the chore is
  // actually completed, exactly like the Today tab's "next due" logic.
  function choreOccurrencesInRange(chore, startStr, endStr) {
    var out = {};
    var end = parseYmd(endStr);
    var periodStart = chore.startDate || null;   // recurrence begins
    var periodEnd = chore.endDate || null;       // recurrence stops (inclusive)
    // past completions from the log always show — they actually happened.
    (chore.log || []).forEach(function (iso) {
      var ds = M.localDateStr(new Date(iso));
      if (ds >= startStr && ds <= endStr) out[ds] = out[ds] || "done";
    });
    // projected upcoming due dates
    var anchor;
    if (chore.lastDone) {
      anchor = M.nudgeToWeekday(M.addInterval(new Date(chore.lastDone), chore.every, chore.unit), chore.weekday);
    } else {
      // never done -> first occurrence is the start date (or today), nudged
      // to its weekday if a legacy chore pins one.
      anchor = M.nudgeToWeekday(periodStart ? parseYmd(periodStart) : new Date(), chore.weekday);
    }
    // normalize the anchor to midnight — new Date()/lastDone carry a time of
    // day, which would make a same-day (start==end) comparison fail.
    anchor = parseYmd(ymd(anchor));
    var guard = 0;
    var cur = new Date(anchor.getTime());
    while (cur <= end && guard < 400) {
      var ds = ymd(cur);
      if (periodEnd && ds > periodEnd) break;               // series has ended
      var withinPeriod = (!periodStart || ds >= periodStart);
      if (ds >= startStr && withinPeriod && !out[ds]) out[ds] = "due";
      cur = M.nudgeToWeekday(M.addInterval(cur, chore.every, chore.unit), chore.weekday);
      guard++;
    }
    return out; // { 'YYYY-MM-DD': 'due' | 'done' }
  }

  // Everything happening on a single day: to-dos due that day + chore states.
  function itemsOnDay(dateStr) {
    var todos = M.loadTodos().filter(function (t) { return t.dueDate === dateStr; });
    var chores = [];
    M.loadChores().forEach(function (c) {
      var occ = choreOccurrencesInRange(c, dateStr, dateStr);
      if (occ[dateStr]) chores.push({ chore: c, state: occ[dateStr] });
    });
    return { todos: todos, chores: chores };
  }

  // Map of dateStr -> {todo, choreDue, choreDone, overdue} for the visible month.
  function monthMarks(startStr, endStr) {
    var marks = {};
    function bump(ds, key) {
      if (ds < startStr || ds > endStr) return;
      marks[ds] = marks[ds] || {};
      marks[ds][key] = true;
    }
    var today = todayStr();
    M.loadTodos().forEach(function (t) {
      if (!t.dueDate) return;
      if (t.done) bump(t.dueDate, "todoDone");
      else { bump(t.dueDate, "todo"); if (t.dueDate < today) bump(t.dueDate, "overdue"); }
    });
    M.loadChores().forEach(function (c) {
      var occ = choreOccurrencesInRange(c, startStr, endStr);
      Object.keys(occ).forEach(function (ds) {
        bump(ds, occ[ds] === "done" ? "choreDone" : "choreDue");
        if (occ[ds] === "due" && ds < today) bump(ds, "overdue");
      });
    });
    return marks;
  }

  // ---- rendering ----

  var viewMode = null; // 'month' | 'week' (persisted)
  var VIEW_KEY = "sbx.cal.view";

  function loadViewMode() {
    try { return localStorage.getItem(VIEW_KEY) === "week" ? "week" : "month"; } catch (e) { return "month"; }
  }
  function saveViewMode(m) { try { localStorage.setItem(VIEW_KEY, m); } catch (e) {} }

  // ISO-8601 week number (weeks start Monday; week 1 contains the first Thursday).
  function isoWeek(d) {
    var date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var day = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - day + 3);
    var firstThursday = date.getTime();
    date.setUTCMonth(0, 1);
    if (date.getUTCDay() !== 4) {
      date.setUTCMonth(0, 1 + ((4 - date.getUTCDay()) + 7) % 7);
    }
    return 1 + Math.round((firstThursday - date.getTime()) / 604800000);
  }

  function render() {
    if (!M) {
      M = window.DayModel;
      if (!M) { root.innerHTML = ""; root.appendChild(el("p", "dash-empty", "Loading…")); return; }
    }
    if (viewMode == null) viewMode = loadViewMode();
    if (viewYear == null) {
      var now = new Date();
      viewYear = now.getFullYear();
      viewMonth = now.getMonth();
      selectedDate = todayStr();
    }
    root.innerHTML = "";
    root.appendChild(buildHeader());
    root.appendChild(viewMode === "week" ? buildWeekGrid() : buildMonthGrid());
    root.appendChild(buildDayPanel());
  }

  function buildHeader() {
    var head = el("div", "cal-head");
    var prev = el("button", "cal-nav", "‹");
    prev.type = "button";
    prev.setAttribute("aria-label", viewMode === "week" ? "Previous week" : "Previous month");
    prev.addEventListener("click", function () { viewMode === "week" ? shiftWeek(-1) : shiftMonth(-1); });

    var title = el("div", "cal-title", headerTitle());

    var next = el("button", "cal-nav", "›");
    next.type = "button";
    next.setAttribute("aria-label", viewMode === "week" ? "Next week" : "Next month");
    next.addEventListener("click", function () { viewMode === "week" ? shiftWeek(1) : shiftMonth(1); });

    head.appendChild(prev);
    head.appendChild(title);
    head.appendChild(next);

    var controls = el("div", "cal-controls");
    var todayBtn = el("button", "cal-today-btn", "Today");
    todayBtn.type = "button";
    todayBtn.addEventListener("click", function () {
      var now = new Date();
      viewYear = now.getFullYear(); viewMonth = now.getMonth();
      selectedDate = todayStr();
      render();
    });
    controls.appendChild(todayBtn);

    var seg = el("div", "cal-seg");
    [["month", "Month"], ["week", "Week"]].forEach(function (pair) {
      var b = el("button", "cal-seg-btn" + (viewMode === pair[0] ? " active" : ""), pair[1]);
      b.type = "button";
      b.addEventListener("click", function () {
        viewMode = pair[0]; saveViewMode(viewMode); render();
      });
      seg.appendChild(b);
    });
    controls.appendChild(seg);

    var box = el("div", "cal-headbox");
    box.appendChild(head);
    box.appendChild(controls);
    return box;
  }

  function headerTitle() {
    if (viewMode !== "week") return MONTHS[viewMonth] + " " + viewYear;
    var sel = parseYmd(selectedDate);
    var offset = (sel.getDay() + 6) % 7;
    var mon = new Date(sel); mon.setDate(sel.getDate() - offset);
    var sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    var left = mon.getDate() + " " + MONTHS[mon.getMonth()].slice(0, 3);
    var right = sun.getDate() + " " + MONTHS[sun.getMonth()].slice(0, 3);
    return left + " – " + right + " " + sun.getFullYear();
  }

  function shiftMonth(delta) {
    viewMonth += delta;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    else if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    render();
  }

  function shiftWeek(delta) {
    var sel = parseYmd(selectedDate);
    sel.setDate(sel.getDate() + delta * 7);
    selectedDate = ymd(sel);
    viewYear = sel.getFullYear(); viewMonth = sel.getMonth();
    render();
  }

  function dowHeader() {
    var dowRow = el("div", "cal-dow");
    dowRow.appendChild(el("span", "cal-dow-cell cal-wk-head", "Wk"));
    DOW.forEach(function (d) { dowRow.appendChild(el("span", "cal-dow-cell", d)); });
    return dowRow;
  }

  // One day button (shared by month + week grids). `inMonth` dims days that
  // spill outside the displayed month (week view can straddle two months).
  function dayCell(dateObj, marks, today, inMonth) {
    var ds = ymd(dateObj);
    var cell = el("button", "cal-cell");
    cell.type = "button";
    if (inMonth === false) cell.classList.add("cal-cell-out");
    if (ds === today) cell.classList.add("cal-cell-today");
    if (ds === selectedDate) cell.classList.add("cal-cell-selected");
    cell.appendChild(el("span", "cal-cell-num", String(dateObj.getDate())));
    var m = marks[ds];
    if (m) {
      var dots = el("span", "cal-dots");
      if (m.overdue) dots.appendChild(el("span", "cal-dot cal-dot-overdue"));
      if (m.todo) dots.appendChild(el("span", "cal-dot cal-dot-todo"));
      if (m.choreDue) dots.appendChild(el("span", "cal-dot cal-dot-chore"));
      if ((m.todoDone || m.choreDone) && !m.todo && !m.choreDue && !m.overdue) {
        dots.appendChild(el("span", "cal-dot cal-dot-done"));
      }
      cell.appendChild(dots);
    }
    cell.addEventListener("click", function () { selectedDate = ds; render(); });
    return cell;
  }

  function wkCell(weekNo) {
    return el("span", "cal-cell cal-wk", String(weekNo));
  }

  function buildMonthGrid() {
    var wrap = el("div", "cal-grid-wrap");
    wrap.appendChild(dowHeader());

    var grid = el("div", "cal-grid");
    var first = new Date(viewYear, viewMonth, 1);
    var offset = (first.getDay() + 6) % 7; // Monday-first
    var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    var startStr = ymd(new Date(viewYear, viewMonth, 1 - offset));
    var totalCells = offset + daysInMonth;
    var rows = Math.ceil(totalCells / 7);
    var endStr = ymd(new Date(viewYear, viewMonth, 1 - offset + rows * 7 - 1));
    var marks = monthMarks(startStr, endStr);
    var today = todayStr();

    for (var w = 0; w < rows; w++) {
      var monday = new Date(viewYear, viewMonth, 1 - offset + w * 7);
      grid.appendChild(wkCell(isoWeek(monday)));
      for (var i = 0; i < 7; i++) {
        var dObj = new Date(viewYear, viewMonth, 1 - offset + w * 7 + i);
        grid.appendChild(dayCell(dObj, marks, today, dObj.getMonth() === viewMonth));
      }
    }
    wrap.appendChild(grid);
    return wrap;
  }

  function buildWeekGrid() {
    var wrap = el("div", "cal-grid-wrap");
    wrap.appendChild(dowHeader());
    var grid = el("div", "cal-grid cal-grid-week");
    var sel = parseYmd(selectedDate);
    var offset = (sel.getDay() + 6) % 7;
    var monday = new Date(sel); monday.setDate(sel.getDate() - offset);
    var startStr = ymd(monday);
    var sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    var marks = monthMarks(startStr, ymd(sunday));
    var today = todayStr();
    grid.appendChild(wkCell(isoWeek(monday)));
    for (var i = 0; i < 7; i++) {
      var dObj = new Date(monday); dObj.setDate(monday.getDate() + i);
      grid.appendChild(dayCell(dObj, marks, today, dObj.getMonth() === viewMonth));
    }
    wrap.appendChild(grid);
    return wrap;
  }

  function niceDate(dateStr) {
    var d = parseYmd(dateStr);
    return DOW[(d.getDay() + 6) % 7] + " " + d.getDate() + " " + MONTHS[d.getMonth()];
  }

  function buildDayPanel() {
    var panel = el("div", "cal-day");
    var head = el("div", "cal-day-head");
    var label = selectedDate === todayStr() ? "Today · " + niceDate(selectedDate) : niceDate(selectedDate);
    head.appendChild(el("h2", "cal-day-title", label));
    panel.appendChild(head);

    var data = itemsOnDay(selectedDate);

    if (data.todos.length === 0 && data.chores.length === 0) {
      panel.appendChild(el("p", "cal-empty", "Nothing scheduled. Add a task below."));
    } else {
      var list = el("div", "cal-item-list");
      data.chores.forEach(function (row) { list.appendChild(choreItem(row.chore, row.state)); });
      data.todos.forEach(function (t) { list.appendChild(todoItem(t)); });
      panel.appendChild(list);
    }

    panel.appendChild(buildAddArea());
    return panel;
  }

  // ---- item rows ----

  function checkbox(done, onToggle) {
    var b = el("button", "cal-check" + (done ? " cal-check-done" : ""));
    b.type = "button";
    b.innerHTML = done ? "&#10003;" : "";
    b.addEventListener("click", onToggle);
    return b;
  }

  function todoItem(t) {
    var row = el("div", "cal-item");
    row.appendChild(checkbox(t.done, function () {
      var list = M.loadTodos();
      list.forEach(function (x) {
        if (x.id === t.id) {
          x.done = !x.done;
          if (x.done) M.logTodoHistory(x.text);
        }
      });
      M.saveTodos(list);
      render();
    }));
    var body = el("div", "cal-item-body");
    body.appendChild(el("div", "cal-item-title" + (t.done ? " cal-item-done" : ""), t.text));
    body.appendChild(el("div", "cal-item-sub", "To-do"));
    row.appendChild(body);
    row.appendChild(editBtn(function () { openTodoEditor(t); }));
    return row;
  }

  function choreItem(chore, state) {
    var row = el("div", "cal-item");
    var doneToday = state === "done";
    row.appendChild(checkbox(doneToday, function () {
      // completion is only meaningful for "today"; for other days we still let
      // the toggle mark/unmark via the chore log through setChoreDoneToday,
      // which operates on today — so guard to today to avoid confusion.
      if (selectedDate !== todayStr()) {
        M.toast("Tick chores off on the day you do them (today).");
        return;
      }
      var list = M.loadChores();
      list.forEach(function (c) { if (c.id === chore.id) M.setChoreDoneToday(c, !doneToday); });
      M.saveChores(list);
      render();
    }));
    var body = el("div", "cal-item-body");
    body.appendChild(el("div", "cal-item-title" + (doneToday ? " cal-item-done" : ""), chore.name));
    body.appendChild(el("div", "cal-item-sub", "Chore · " + M.freqLabel(chore)));
    row.appendChild(body);
    row.appendChild(editBtn(function () { openChoreEditor(chore); }));
    return row;
  }

  function editBtn(onClick) {
    var b = el("button", "cal-edit", "✎");
    b.type = "button";
    b.setAttribute("aria-label", "Edit");
    b.addEventListener("click", onClick);
    return b;
  }

  // ---- add / edit ----

  var addMode = null; // null | 'choose' | 'todo' | 'chore'

  function buildAddArea() {
    var wrap = el("div", "cal-add");
    if (!addMode || addMode === "choose") {
      var addBtn = el("button", "btn btn-primary cal-add-btn", "+ Add task on this day");
      addBtn.type = "button";
      addBtn.addEventListener("click", function () { addMode = "pick"; render(); });
      wrap.appendChild(addBtn);
      return wrap;
    }
    if (addMode === "pick") {
      var q = el("div", "cal-pick");
      q.appendChild(el("div", "cal-pick-label", "What kind of task?"));
      var oneoff = el("button", "btn btn-ghost", "One-off to-do");
      oneoff.type = "button";
      oneoff.addEventListener("click", function () { openTodoEditor(null); });
      var recur = el("button", "btn btn-ghost", "Recurring chore");
      recur.type = "button";
      recur.addEventListener("click", function () { openChoreEditor(null); });
      var cancel = el("button", "cal-link", "Cancel");
      cancel.type = "button";
      cancel.addEventListener("click", function () { addMode = null; render(); });
      q.appendChild(oneoff); q.appendChild(recur); q.appendChild(cancel);
      wrap.appendChild(q);
      return wrap;
    }
    if (addMode === "todo") { wrap.appendChild(todoEditor); return wrap; }
    if (addMode === "chore") { wrap.appendChild(choreEditor); return wrap; }
    return wrap;
  }

  var todoEditor = null, choreEditor = null;

  function field(placeholder, value) {
    var i = document.createElement("input");
    i.type = "text"; i.className = "field-input"; i.placeholder = placeholder;
    if (value) i.value = value;
    return i;
  }

  function openTodoEditor(existing) {
    addMode = "todo";
    var box = el("div", "inline-form");
    var text = field("What needs doing?", existing ? existing.text : "");
    box.appendChild(text);

    var dateRow = el("div", "inline-form-row");
    dateRow.appendChild(el("span", "inline-form-label", "Day"));
    var dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.className = "field-input";
    dateInput.value = existing && existing.dueDate ? existing.dueDate : selectedDate;
    dateRow.appendChild(dateInput);
    box.appendChild(dateRow);

    var actions = el("div", "inline-form-row");
    var save = el("button", "btn btn-primary", existing ? "Save" : "+ Add to-do");
    save.type = "button";
    save.addEventListener("click", function () {
      var txt = text.value.trim();
      if (!txt) { M.toast("Type something first"); return; }
      var list = M.loadTodos();
      if (existing) {
        list.forEach(function (x) { if (x.id === existing.id) { x.text = txt; x.dueDate = dateInput.value || null; } });
      } else {
        list.push({ id: "todo-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
          text: txt, dueDate: dateInput.value || null, done: false });
      }
      M.saveTodos(list);
      if (dateInput.value) selectedDate = dateInput.value;
      addMode = null; render();
    });
    actions.appendChild(save);
    if (existing) {
      var del = el("button", "btn btn-danger", "Delete");
      del.type = "button";
      del.addEventListener("click", function () {
        if (!window.confirm("Delete this to-do?")) return;
        M.saveTodos(M.loadTodos().filter(function (x) { return x.id !== existing.id; }));
        addMode = null; render();
      });
      actions.appendChild(del);
    }
    var cancel = el("button", "cal-link", "Cancel");
    cancel.type = "button";
    cancel.addEventListener("click", function () { addMode = null; render(); });
    actions.appendChild(cancel);
    box.appendChild(actions);
    todoEditor = box;
    render();
    setTimeout(function () { text.focus(); }, 0);
  }

  function openChoreEditor(existing) {
    addMode = "chore";
    var box = el("div", "inline-form");
    var name = field("Chore name", existing ? existing.name : "");
    box.appendChild(name);

    var freqRow = el("div", "inline-form-row");
    freqRow.appendChild(el("span", "inline-form-label", "Every"));
    var every = document.createElement("input");
    every.type = "number"; every.min = "1"; every.max = "365";
    every.className = "field-input field-input-narrow";
    every.value = existing ? String(existing.every) : "1";
    freqRow.appendChild(every);
    var unit = document.createElement("select");
    unit.className = "field-select";
    [["day", "days"], ["week", "weeks"], ["month", "months"], ["year", "years"]].forEach(function (p) {
      var o = document.createElement("option"); o.value = p[0]; o.textContent = p[1]; unit.appendChild(o);
    });
    unit.value = existing ? existing.unit : "week";
    freqRow.appendChild(unit);
    box.appendChild(freqRow);

    // Starts — defaults to the day you tapped, so a weekly chore added on a
    // Thursday just recurs on Thursdays; no separate weekday picker needed.
    var startRow = el("div", "inline-form-row");
    startRow.appendChild(el("span", "inline-form-label", "Starts"));
    var startInput = document.createElement("input");
    startInput.type = "date";
    startInput.className = "field-input";
    startInput.value = existing && existing.startDate ? existing.startDate : selectedDate;
    startRow.appendChild(startInput);
    box.appendChild(startRow);

    // Ends — Never, or on a chosen date (the recurrence "period").
    var endsRow = el("div", "inline-form-row");
    endsRow.appendChild(el("span", "inline-form-label", "Ends"));
    var endsSelect = document.createElement("select");
    endsSelect.className = "field-select";
    [["never", "Never"], ["on", "On date"]].forEach(function (p) {
      var o = document.createElement("option"); o.value = p[0]; o.textContent = p[1]; endsSelect.appendChild(o);
    });
    endsRow.appendChild(endsSelect);
    var endInput = document.createElement("input");
    endInput.type = "date";
    endInput.className = "field-input";
    if (existing && existing.endDate) { endsSelect.value = "on"; endInput.value = existing.endDate; }
    else { endInput.classList.add("hidden"); }
    endsRow.appendChild(endInput);
    endsSelect.addEventListener("change", function () {
      if (endsSelect.value === "on") {
        endInput.classList.remove("hidden");
        if (!endInput.value) endInput.value = startInput.value;
      } else {
        endInput.classList.add("hidden");
      }
    });
    box.appendChild(endsRow);

    var actions = el("div", "inline-form-row");
    var save = el("button", "btn btn-primary", existing ? "Save" : "+ Add chore");
    save.type = "button";
    save.addEventListener("click", function () {
      var nm = name.value.trim();
      if (!nm) { M.toast("Give the chore a name first"); return; }
      var ev = Math.max(1, parseInt(every.value, 10) || 1);
      var startDate = startInput.value || null;
      var endDate = (endsSelect.value === "on" && endInput.value) ? endInput.value : null;
      if (startDate && endDate && endDate < startDate) { M.toast("End date is before the start."); return; }
      var list = M.loadChores();
      if (existing) {
        list = list.map(function (c) {
          if (c.id !== existing.id) return c;
          return { id: c.id, name: nm, every: ev, unit: unit.value,
            weekday: (existing.weekday !== undefined ? existing.weekday : null),
            lastDone: c.lastDone || null, log: c.log || [],
            startDate: startDate, endDate: endDate };
        });
      } else {
        list.push({ id: "chore-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
          name: nm, every: ev, unit: unit.value, weekday: null, lastDone: null, log: [],
          startDate: startDate, endDate: endDate });
      }
      M.saveChores(list);
      if (startDate) selectedDate = startDate;
      addMode = null; render();
    });
    actions.appendChild(save);
    if (existing) {
      var del = el("button", "btn btn-danger", "Delete");
      del.type = "button";
      del.addEventListener("click", function () {
        if (!window.confirm("Delete \"" + existing.name + "\" and stop it recurring? This can't be undone.")) return;
        M.saveChores(M.loadChores().filter(function (c) { return c.id !== existing.id; }));
        addMode = null; render();
      });
      actions.appendChild(del);
    }
    var cancel = el("button", "cal-link", "Cancel");
    cancel.type = "button";
    cancel.addEventListener("click", function () { addMode = null; render(); });
    actions.appendChild(cancel);
    box.appendChild(actions);
    choreEditor = box;
    render();
    setTimeout(function () { name.focus(); }, 0);
  }

  if (window.App && window.App.onShow) {
    window.App.onShow("calendar", function () { addMode = null; render(); });
  }
})();
