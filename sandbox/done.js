(function () {
  "use strict";

  DigestLoop.markDoneToday();

  document.getElementById("startOverBtn").addEventListener("click", function () {
    DigestLoop.clearStep();
    window.location.href = "index.html";
  });
})();
