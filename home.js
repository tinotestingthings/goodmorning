(function () {
  "use strict";

  var view = document.getElementById("homeView");

  function render() {
    var step = DigestLoop.getStep();
    view.innerHTML = "";

    var h1 = document.createElement("h1");
    var p = document.createElement("p");
    var actions = document.createElement("div");
    actions.className = "home-actions";

    if (step === "done") {
      h1.textContent = "Done for today ✓";
      var completed = DigestLoop.getCompletedDate();
      p.textContent = completed ? "Completed " + completed + "." : "Completed.";

      var againBtn = document.createElement("a");
      againBtn.className = "btn btn-ghost";
      againBtn.href = "triage.html";
      againBtn.textContent = "Do it again";
      actions.appendChild(againBtn);
    } else if (step === "triage" || step === "practice") {
      h1.textContent = "Daily Digest";
      p.textContent = "Pick up where you left off.";

      var resumeBtn = document.createElement("a");
      resumeBtn.className = "btn btn-primary";
      resumeBtn.href = step + ".html";
      resumeBtn.textContent = "Resume: " + (step === "triage" ? "Triage" : "Practice");
      actions.appendChild(resumeBtn);
    } else {
      h1.textContent = "Daily Digest";
      p.textContent = "Your morning ritual, start to finish.";

      var startBtn = document.createElement("a");
      startBtn.className = "btn btn-primary";
      startBtn.href = "triage.html";
      startBtn.textContent = "Start today's loop";
      actions.appendChild(startBtn);
    }

    view.appendChild(h1);
    view.appendChild(p);
    view.appendChild(actions);
  }

  render();
})();
