(function (global) {
  "use strict";

  // Adds a grab-handle at the top of a bottom-sheet and lets the user swipe it
  // down to dismiss (common mobile pattern). Drag past ~90px = close; otherwise
  // it springs back. Only the handle is draggable, so it never fights content
  // scrolling inside the sheet.
  function swipeClose(sheet, onClose) {
    if (!sheet || sheet.querySelector(":scope > .sheet-handle")) return;
    var handle = document.createElement("div");
    handle.className = "sheet-handle";
    sheet.insertBefore(handle, sheet.firstChild);

    var startY = 0, dy = 0, dragging = false;
    handle.addEventListener("pointerdown", function (e) {
      startY = e.clientY; dy = 0; dragging = true;
      sheet.style.transition = "none";
      try { handle.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });
    handle.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      dy = Math.max(0, e.clientY - startY);
      sheet.style.transform = "translateY(" + dy + "px)";
    });
    function end() {
      if (!dragging) return;
      dragging = false;
      sheet.style.transition = "";
      if (dy > 90) { onClose(); }
      else { sheet.style.transform = ""; }
    }
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  }

  global.Sheet = { swipeClose: swipeClose };
})(window);
