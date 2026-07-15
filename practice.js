(function () {
  "use strict";

  var LS_OPENED = "dd.practice.opened";

  function loadOpened() {
    try {
      return JSON.parse(localStorage.getItem(LS_OPENED)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveOpened(opened) {
    localStorage.setItem(LS_OPENED, JSON.stringify(opened));
  }

  function init() {
    DigestLoop.setStep("practice");

    var opened = loadOpened();
    var links = document.querySelectorAll("[data-practice-link]");

    links.forEach(function (link) {
      var key = link.getAttribute("data-practice-link");
      var check = link.querySelector(".practice-link-check");
      if (opened[key]) check.classList.add("show");

      link.addEventListener("click", function () {
        opened[key] = true;
        saveOpened(opened);
        check.classList.add("show");
      });
    });

    document.getElementById("continueBtn").addEventListener("click", function () {
      window.location.href = "done.html";
    });
  }

  init();
})();
