// ---------------------------------------------------------------------------
// Quiz screen: three game modes (type-the-answer, multiple-choice, and the
// Overhoren study drill in study.js) sharing one filtered pool, so custom
// games automatically restrict both the target bird AND (in multiple-choice)
// the wrong-answer options to the same filtered set. Filters + mode picker
// live behind an Options button/sheet instead of always being on screen.
// ---------------------------------------------------------------------------

let quizFilterSelection = emptyFilterSelection();
let quizMode = "text"; // 'text' | 'choice' | 'study'
let quizPool = [];
let quizCurrent = null;
let quizScore = { correct: 0, total: 0 };
let quizInitialized = false;

function activeQuizFilters() {
  if (activeGameContext && activeGameContext.gameMode.startsWith("quiz")) {
    return activeGameContext.filters;
  }
  return quizFilterSelection;
}

function refreshQuizPool() {
  quizPool = allBirds.filter((b) => matchesFilters(b, activeQuizFilters()) && (b.imageUrl || b.imageThumbUrl));
}

function normalizeGuess(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchesGuess(bird, guess) {
  const g = normalizeGuess(guess);
  if (!g) return false;
  const candidates = [bird.englishName, displayDutchName(bird), bird.scientificName].filter(Boolean);
  return candidates.some((c) => normalizeGuess(c) === g);
}

function setQuizMode(mode) {
  quizMode = mode;
  updateModeVisibility();
  closeQuizOptions();
  if (mode === "study") {
    if (typeof renderStudyMode === "function") renderStudyMode();
  } else {
    nextQuizBird();
  }
}

function updateModeVisibility() {
  document.getElementById("quiz-mode-text").classList.toggle("active", quizMode === "text");
  document.getElementById("quiz-mode-choice").classList.toggle("active", quizMode === "choice");
  document.getElementById("quiz-mode-study").classList.toggle("active", quizMode === "study");
  document.getElementById("quiz-answer-card").style.display = quizMode === "study" ? "none" : "block";
  document.getElementById("study-card").style.display = quizMode === "study" ? "block" : "none";
  document.getElementById("quiz-text-controls").style.display = quizMode === "text" ? "block" : "none";
  document.getElementById("quiz-choice-controls").style.display = quizMode === "choice" ? "block" : "none";
}

function updateScoreDisplay() {
  const scoreEl = document.getElementById("quiz-score");
  if (quizMode === "study") return; // study.js manages its own progress readout
  scoreEl.textContent = `${t("scoreLabel")}: ${quizScore.correct} / ${quizScore.total}`;
}

function resetQuizSoundButton() {
  const btn = document.getElementById("quiz-play-sound");
  btn.classList.remove("playing");
  btn.innerHTML = `${icon("speaker")} <span>${t("playCall")}</span>`;
}

function nextQuizBird() {
  stopBirdSound();
  resetQuizSoundButton();
  document.getElementById("quiz-result").textContent = "";
  document.getElementById("quiz-result").className = "quiz-result";
  document.getElementById("quiz-answer").innerHTML = "";
  document.getElementById("quiz-input").value = "";
  document.getElementById("quiz-input").disabled = false;
  document.getElementById("quiz-submit").disabled = false;
  document.getElementById("quiz-choice-grid").innerHTML = "";

  if (quizPool.length === 0) {
    document.getElementById("quiz-image").src = PLACEHOLDER_IMG;
    document.getElementById("quiz-result").textContent = t("noResults");
    document.getElementById("quiz-sound-row").style.display = "none";
    quizCurrent = null;
    return;
  }

  let candidate;
  do {
    candidate = quizPool[Math.floor(Math.random() * quizPool.length)];
  } while (quizPool.length > 1 && candidate === quizCurrent);
  quizCurrent = candidate;

  document.getElementById("quiz-image").src = quizCurrent.imageThumbUrl || quizCurrent.imageUrl || PLACEHOLDER_IMG;
  document.getElementById("quiz-sound-row").style.display = quizCurrent.soundUrl ? "block" : "none";

  if (quizMode === "choice") renderChoices();
  document.getElementById("quiz-input").focus();
}

function renderChoices() {
  const grid = document.getElementById("quiz-choice-grid");
  grid.innerHTML = "";
  const distractors = quizPool.filter((b) => b !== quizCurrent);
  shuffleInPlace(distractors);
  const options = [quizCurrent, ...distractors.slice(0, Math.min(3, distractors.length))];
  shuffleInPlace(options);

  for (const bird of options) {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = primaryName(bird);
    btn.addEventListener("click", () => handleChoiceAnswer(bird, btn));
    grid.appendChild(btn);
  }
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function handleChoiceAnswer(chosenBird, btnEl) {
  if (!quizCurrent) return;
  const correct = chosenBird === quizCurrent;
  quizScore.total += 1;
  if (correct) quizScore.correct += 1;
  updateScoreDisplay();

  document.querySelectorAll(".choice-btn").forEach((b) => (b.disabled = true));
  btnEl.classList.add(correct ? "choice-correct" : "choice-wrong");
  if (!correct) {
    document.querySelectorAll(".choice-btn").forEach((b) => {
      if (b.textContent === primaryName(quizCurrent)) b.classList.add("choice-correct");
    });
  }
  revealAnswer(correct);
}

function revealAnswer(wasCorrect) {
  if (!quizCurrent) return;
  document.getElementById("quiz-input").disabled = true;
  document.getElementById("quiz-submit").disabled = true;
  const fact = bf(quizCurrent, "fact");
  document.getElementById("quiz-answer").innerHTML = `
    <strong>${escapeHtml(primaryName(quizCurrent))}</strong>
    (${secondaryNames(quizCurrent).map(escapeHtml).join(", ")}${secondaryNames(quizCurrent).length ? ", " : ""}<em>${escapeHtml(quizCurrent.scientificName)}</em>)
    ${fact ? `<p>${escapeHtml(fact)}</p>` : ""}
    ${quizCurrent.wikipediaUrl ? `<a href="${quizCurrent.wikipediaUrl}" target="_blank" rel="noopener">${t("moreInfo")}</a>` : ""}
  `;
  if (wasCorrect !== null) {
    const resultEl = document.getElementById("quiz-result");
    resultEl.textContent = wasCorrect ? t("correct") : t("wrong");
    resultEl.className = "quiz-result " + (wasCorrect ? "correct" : "wrong");
  }
}

function submitGuess() {
  if (!quizCurrent || document.getElementById("quiz-input").disabled) return;
  const guess = document.getElementById("quiz-input").value.trim();
  if (!guess) return;
  const correct = matchesGuess(quizCurrent, guess);
  quizScore.total += 1;
  if (correct) quizScore.correct += 1;
  updateScoreDisplay();
  revealAnswer(correct);
}

// ---------------------------------------------------------------------------
// Options sheet (mode picker + filter bar, tucked away instead of inline)
// ---------------------------------------------------------------------------

function openQuizOptions() {
  document.getElementById("quiz-options-overlay").classList.remove("hidden");
}

function closeQuizOptions() {
  document.getElementById("quiz-options-overlay").classList.add("hidden");
}

function updateQuizOptionsCount() {
  const countEl = document.getElementById("quiz-options-count");
  if (!countEl) return;
  const n = allBirds.filter((b) => matchesFilters(b, quizFilterSelection) && (b.imageUrl || b.imageThumbUrl)).length;
  countEl.textContent = `${n} ${t("matchingBirds")}`;
}

function renderQuizScreen() {
  const isCustomGame = activeGameContext && activeGameContext.gameMode.startsWith("quiz");
  const filterBarEl = document.getElementById("quiz-filter-bar");
  const modeSwitchEl = document.getElementById("quiz-mode-switch");
  const optionsBtn = document.getElementById("quiz-options-btn");

  optionsBtn.style.display = isCustomGame ? "none" : "inline-flex";
  modeSwitchEl.style.display = isCustomGame ? "none" : "flex";
  filterBarEl.style.display = isCustomGame ? "none" : "block";

  if (!isCustomGame) {
    renderFilterBar(filterBarEl, quizFilterSelection, () => {
      updateQuizOptionsCount();
      if (quizMode === "study") {
        if (typeof refreshStudyPool === "function") refreshStudyPool();
      } else {
        refreshQuizPool();
        nextQuizBird();
      }
    });
    updateQuizOptionsCount();
  } else {
    quizMode = activeGameContext.gameMode === "quiz-choice" ? "choice" : activeGameContext.gameMode === "quiz-study" ? "study" : "text";
  }

  updateModeVisibility();

  if (!quizInitialized) {
    document.getElementById("quiz-options-btn").addEventListener("click", openQuizOptions);
    document.getElementById("quiz-options-close").addEventListener("click", closeQuizOptions);
    document.getElementById("quiz-options-overlay").addEventListener("click", (e) => {
      if (e.target === document.getElementById("quiz-options-overlay")) closeQuizOptions();
    });
    document.getElementById("quiz-mode-text").addEventListener("click", () => setQuizMode("text"));
    document.getElementById("quiz-mode-choice").addEventListener("click", () => setQuizMode("choice"));
    document.getElementById("quiz-mode-study").addEventListener("click", () => setQuizMode("study"));
    document.getElementById("quiz-submit").addEventListener("click", submitGuess);
    document.getElementById("quiz-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitGuess();
    });
    document.getElementById("quiz-reveal").addEventListener("click", () => revealAnswer(null));
    document.getElementById("quiz-next").addEventListener("click", nextQuizBird);
    document.getElementById("quiz-choice-next").addEventListener("click", nextQuizBird);
    document.getElementById("quiz-play-sound").addEventListener("click", () => {
      if (!quizCurrent) return;
      const btn = document.getElementById("quiz-play-sound");
      toggleBirdSound(quizCurrent, (isPlaying) => {
        btn.classList.toggle("playing", isPlaying);
        btn.innerHTML = isPlaying ? `${icon("stop")} <span>${t("stopSound")}</span>` : `${icon("speaker")} <span>${t("playCall")}</span>`;
      });
    });
    document.getElementById("quiz-image").addEventListener("click", () => {
      if (quizCurrent) openFullscreenImage(quizCurrent.imageUrl || quizCurrent.imageThumbUrl);
    });
    quizInitialized = true;
  }

  updateScoreDisplay();
  if (quizMode === "study") {
    if (typeof renderStudyMode === "function") renderStudyMode();
  } else {
    refreshQuizPool();
    nextQuizBird();
  }
}
