(function (global) {
  "use strict";
  // Wake-up — a once-a-day "start the day" flow, deliberately an add-on next
  // to the existing Today view (added 2026-09-03). Steps: today's weather by
  // time of day (CSS-animated, deterministic, no video lib), then star what
  // really has to happen today from the due to-dos, optionally tasks &
  // projects and the backlog, then a small send-off. A priority is
  // `prio: "YYYY-MM-DD"` on the to-do / item itself (DayModel.isPrio): it
  // expires by itself the next day (no cleanup pass) and syncs along with the
  // to-dos/items store. Today shows starred things in a "Priority" block at
  // the top (home.js appendUrgentCards).
  var DONE_KEY = k("wakeup.done");   // per device, like the overload banner

  function M() { return global.DayModel; }
  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function btn(label, cls, fn) {
    var b = el("button", "btn " + (cls || ""), label);
    b.type = "button";
    b.addEventListener("click", fn);
    return b;
  }
  function today() { return M().localDateStr(); }
  function tomorrow() { var d = new Date(); d.setDate(d.getDate() + 1); return M().localDateStr(d); }
  function doneToday() { try { return localStorage.getItem(DONE_KEY) === today(); } catch (e) { return false; } }
  function markDone() { try { localStorage.setItem(DONE_KEY, today()); } catch (e) {} }
  function isOpenItem(x) { return x.state === "idea" || x.state === "todo" || x.state === "active"; }
  function openItems() { return global.Items ? global.Items.all().filter(isOpenItem) : []; }
  function backlogItems() {
    return global.Items ? global.Items.all().filter(function (x) { return x.state === "backlog"; })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); }) : [];
  }
  // Due today + overdue, starred first — the same two lists Today renders.
  function dueTodos() {
    var isPrio = M().isPrio;
    return M().overdueTodos().concat(M().dueTodayTodos())
      .sort(function (a, b) { return isPrio(b) - isPrio(a); });
  }
  function prioCount() {
    return M().loadTodos().filter(function (t) { return !t.done && M().isPrio(t); }).length +
      openItems().filter(M().isPrio).length;
  }

  // Counts 0 → n in ~700ms. setTimeout, not rAF: a backgrounded tab stalls rAF
  // mid-count and would leave "5°" on screen; timers still fire and land on n.
  function countUp(node, n) {
    n = Math.round(n);
    var reduce = false;
    try { reduce = global.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    if (reduce) { node.textContent = n + "°"; return; }
    var t0 = Date.now();
    (function tick() {
      var p = Math.min(1, (Date.now() - t0) / 700);
      node.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))) + "°";
      if (p < 1) setTimeout(tick, 16);
    })();
  }

  // ---- overlay + step plumbing --------------------------------------------
  var ov = null, steps = [], at = 0;

  // Closing at any point re-renders Today: steps commit as they go, so what's
  // underneath must reflect stars/moves even when the flow isn't finished.
  function close() {
    if (!ov) return;
    ov.remove();
    ov = null;
    document.removeEventListener("keydown", onKey);
    if (global.App) global.App.go("today");
  }
  function onKey(e) { if (e.key === "Escape") close(); }

  function show() {
    var card = el("div", "wk-card");     // a fresh card per step = the slide-in plays again
    var x = btn("×", "wk-close", close);
    x.setAttribute("aria-label", "Close");
    card.appendChild(x);
    var dots = el("div", "wk-dots");
    steps.forEach(function (s, i) { dots.appendChild(el("span", "wk-dot" + (i === at ? " wk-dot-on" : ""))); });
    card.appendChild(dots);
    steps[at](card, function () { at++; if (at < steps.length) show(); else close(); });
    ov.replaceChildren(card);
    ov.scrollTop = 0;
  }

  function open() {
    close();
    steps = [stepDay, stepTodos];
    if (openItems().length) steps.push(stepItems);
    if (backlogItems().length) steps.push(stepBacklog);
    steps.push(stepDone);
    at = 0;
    ov = el("div", "wk-overlay");
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-label", "Wake-up");
    document.body.appendChild(ov);
    document.addEventListener("keydown", onKey);
    show();
  }

  // One selectable row: tapping toggles the star; `sel` is the step's selection map.
  function row(sel, id, text, meta) {
    var r = el("button", "wk-row" + (sel[id] ? " wk-row-on" : ""));
    r.type = "button";
    r.setAttribute("aria-pressed", sel[id] ? "true" : "false");
    r.appendChild(el("span", "wk-star", "★"));
    var body = el("span", "wk-row-body");
    body.appendChild(el("span", "wk-row-text", text));
    if (meta) body.appendChild(el("span", "wk-row-meta", meta));
    r.appendChild(body);
    r.addEventListener("click", function () {
      sel[id] = !sel[id];
      r.classList.toggle("wk-row-on", !!sel[id]);
      r.setAttribute("aria-pressed", sel[id] ? "true" : "false");
    });
    return r;
  }
  function actions(card) { var a = el("div", "wk-actions"); card.appendChild(a); return a; }

  // Title + list of starrable entries + Next/Skip. `entries` = [{id, text,
  // meta, on}]; onCommit(selectionMap) runs once on Next.
  function pickStep(card, next, title, sub, entries, onCommit) {
    card.appendChild(el("h2", "wk-title", title));
    card.appendChild(el("p", "wk-sub", sub));
    var sel = {};
    entries.forEach(function (e) { if (e.on) sel[e.id] = true; });
    var list = el("div", "wk-list");
    entries.forEach(function (e) { list.appendChild(row(sel, e.id, e.text, e.meta)); });
    card.appendChild(list);
    var a = actions(card);
    a.appendChild(btn("Next →", "btn-primary", function () { onCommit(sel); next(); }));
    a.appendChild(btn("Skip", "", next));
  }

  // ---- 1. the day: weather morning / midday / evening --------------------
  function stepDay(card, next) {
    var date = "";
    try { date = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }); } catch (e) {}
    card.appendChild(el("div", "wk-kicker", date));
    card.appendChild(el("h2", "wk-title", M().greetingWord() + ", Tinus"));
    var slots = el("div", "wk-slots");
    var faces = M().WEATHER_SLOTS.map(function (s, i) {
      var slot = el("div", "wk-slot");
      slot.style.animationDelay = (0.25 + i * 0.22) + "s";
      var icon = el("span", "wk-slot-icon");
      icon.style.animationDelay = (i * 0.6) + "s";
      slot.appendChild(icon);
      var txt = el("span", "wk-slot-text");
      txt.appendChild(el("span", "wk-slot-label", s.label));
      var cond = el("span", "wk-slot-cond", "…");
      txt.appendChild(cond);
      slot.appendChild(txt);
      var temp = el("span", "wk-slot-temp", "");
      slot.appendChild(temp);
      slots.appendChild(slot);
      return { hour: s.hour, icon: icon, cond: cond, temp: temp, delay: 250 + i * 220 };
    });
    card.appendChild(slots);

    M().weather().then(function (json) {
      faces.forEach(function (f) {
        var r = M().pickHourly(json, f.hour);
        if (!r || r.temp == null) { f.cond.textContent = "—"; return; }
        var info = M().weatherInfo(r.code);
        f.icon.innerHTML = info.icon;
        f.cond.textContent = info.label;
        setTimeout(function () { countUp(f.temp, r.temp); }, f.delay);
      });
    }).catch(function () {
      // no data → no cards (DESIGN.md), one quiet line instead
      slots.replaceWith(el("p", "wk-sub", "No weather right now."));
    });

    var due = dueTodos(), td = today();
    var over = due.filter(function (t) { return t.dueDate < td; }).length;
    var line = due.length === 0 ? "Nothing due today." :
      due.length + (due.length === 1 ? " to-do" : " to-dos") + (over ? ", " + over + " overdue" : "") + " on your plate.";
    var sub = el("p", "wk-sub", line);
    sub.style.animationDelay = "0.95s";
    card.appendChild(sub);
    var a = actions(card);
    a.style.animationDelay = "1.1s";
    a.appendChild(btn(due.length ? "Plan the day →" : "Let's go →", "btn-primary", next));
  }

  // ---- 2. to-dos due today / overdue: star what really has to happen ------
  function stepTodos(card, next) {
    var td = today(), due = dueTodos();
    card.appendChild(el("h2", "wk-title", due.length ? "What really has to happen today?" : "A clean slate"));
    card.appendChild(el("p", "wk-sub", due.length ? "Star it and it goes to the top of Today. The rest can wait." : "No to-dos due today. Anything from your tasks or the backlog?"));
    if (!due.length) { actions(card).appendChild(btn("Next →", "btn-primary", next)); return; }
    var sel = {};
    due.forEach(function (t) { if (M().isPrio(t)) sel[t.id] = true; });
    var list = el("div", "wk-list");
    due.forEach(function (t) {
      var meta = t.dueDate < td ? "overdue" : "";
      if (t.snoozes > 0) meta += (meta ? " · " : "") + "postponed " + t.snoozes + "×";
      list.appendChild(row(sel, t.id, t.text, meta));
    });
    card.appendChild(list);

    // One load, one save (= one sync push): stars and the move together.
    function commit(moveRest) {
      var dueIds = {}, rest = [];
      due.forEach(function (t) { dueIds[t.id] = true; });
      var all = M().loadTodos();
      all.forEach(function (t) {
        if (!dueIds[t.id] || t.done) return;
        t.prio = sel[t.id] ? td : null;
        if (!sel[t.id]) rest.push(t.id);
      });
      var n = moveRest && rest.length ? M().moveTodosIn(all, rest, tomorrow()) : 0;
      M().saveTodos(all);
      if (n) M().toast(n + (n === 1 ? " to-do" : " to-dos") + " → tomorrow");
      next();
    }
    var a = actions(card);
    a.appendChild(btn("Rest → tomorrow", "btn-primary", function () { commit(true); }));
    a.appendChild(btn("Keep the rest", "", function () { commit(false); }));
  }

  // ---- 3. tasks & projects (optional) --------------------------------------
  function stepItems(card, next) {
    var td = today(), items = openItems();
    pickStep(card, next, "Tasks & projects", "Anything here that gets attention today?",
      items.map(function (x) { return { id: x.id, text: x.title, meta: x.type === "project" ? "project" : "task", on: M().isPrio(x) }; }),
      function (sel) {
        var patches = {};
        items.forEach(function (x) {
          var want = sel[x.id] ? td : null;
          if ((x.prio || null) !== want) patches[x.id] = { prio: want };
        });
        global.Items.updateMany(patches);
      });
  }

  // ---- 4. backlog (optional): pull something in for today -----------------
  // The item stays an item (state → todo, starred), so a backlog project keeps
  // its subtasks; it shows up in Today's Priority block like any starred item.
  function stepBacklog(card, next) {
    var td = today(), items = backlogItems();
    pickStep(card, next, prioCount() ? "Room for one more?" : "Nothing to do? Grab something.",
      "Starred backlog items become tasks for today.",
      items.map(function (x) { return { id: x.id, text: x.title, meta: x.type === "project" ? "project" : "" }; }),
      function (sel) {
        var patches = {};
        items.forEach(function (x) { if (sel[x.id]) patches[x.id] = { state: "todo", prio: td }; });
        global.Items.updateMany(patches);
      });
  }

  // ---- 5. send-off ----------------------------------------------------------
  function stepDone(card, next) {
    var n = prioCount();
    if (n) {
      var big = el("div", "wk-big", String(n));
      card.appendChild(big);
      if (global.FX) setTimeout(function () { global.FX.celebrate(big); }, 350);
    }
    card.appendChild(el("h2", "wk-title", n ? (n === 1 ? "One thing that matters today." : n + " things that matter today.") : "An open day."));
    card.appendChild(el("p", "wk-sub", n ? "They're at the top of Today. Everything else is allowed to wait." : "Nothing starred — enjoy it, or come back to this later."));
    actions(card).appendChild(btn("Start the day", "btn-primary", function () { markDone(); next(); }));
  }

  global.Wakeup = { open: open, close: close, doneToday: doneToday };
})(window);
