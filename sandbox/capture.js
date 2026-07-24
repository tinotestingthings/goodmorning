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
      });
      seg.appendChild(b);
    });

    var send = el("button", "btn btn-primary capture-send", "Add to inbox");
    send.type = "button";
    send.addEventListener("click", function () {
      var body = (ta.value || "").trim();
      if (!body) { toast("Type something first"); return; }
      if (!global.SB) { toast("Not connected — try again"); return; }
      send.disabled = true; send.textContent = "Adding…";
      var title = body.split("\n")[0].slice(0, 120);
      global.SB.from("captures").insert({ kind: kind, title: title, body: body }).then(function (res) {
        send.disabled = false; send.textContent = "Add to inbox";
        if (res && res.error) { toast("Failed: " + res.error.message); return; }
        toast("Added to inbox");
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
    sheet.appendChild(send);
    sheet.appendChild(cancel);
    backdrop.appendChild(sheet);
    backdrop.addEventListener("click", function (e) { if (e.target === backdrop) close(); });
    document.body.appendChild(backdrop);
    (global.requestAnimationFrame || setTimeout)(function () { backdrop.classList.add("show"); });
    setTimeout(function () { ta.focus(); }, 60);
  }

  function mount() {
    if (document.querySelector(".capture-fab")) return;
    var fab = el("button", "capture-fab");
    fab.type = "button";
    fab.setAttribute("aria-label", "Quick capture");
    fab.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
    fab.addEventListener("click", openSheet);
    document.body.appendChild(fab);
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})(window);
