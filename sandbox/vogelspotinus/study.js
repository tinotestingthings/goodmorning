// ---------------------------------------------------------------------------
// "Overhoren" study mode: a Leitner spaced-repetition drill driven by honest
// self-report (knew it / didn't know it). The Leitner store, scoring and the
// stats all live in progress.js now; this file is just the drill UI plus the
// three pool-based practice sessions (review-due / mastered / weak) that
// reuse it.
// ---------------------------------------------------------------------------

let studyPool = [];
let studyCurrent = null;
let studyRevealed = false;
let studySession = newSession();

function newSession() {
  return { seen: 0, correct: 0, learned: 0, mastered: 0, dropped: 0 };
}

function tallySession(session, res) {
  session.seen += 1;
  if (res.knew) session.correct += 1;
  if (res.event === "learned") session.learned += 1;
  if (res.event === "mastered") session.mastered += 1;
  if (res.event === "dropped") session.dropped += 1;
}

function sessionSummaryHtml(session) {
  if (!session.seen) return "";
  const bits = [`${session.seen} ${t("sessSeen")}`, `${session.correct} ${t("sessCorrect")}`];
  if (session.mastered) bits.push(`${session.mastered} ${t("sessMastered")}`);
  else if (session.learned) bits.push(`${session.learned} ${t("sessLearned")}`);
  if (session.dropped) bits.push(`${session.dropped} ${t("sessDropped")}`);
  return `<p class="session-line">${bits.join(" &middot; ")}</p>`;
}

function studyPoolFn() {
  if (activeGameContext && typeof activeGameContext.poolFn === "function") {
    return activeGameContext.poolFn();
  }
  return allBirds.filter((b) => matchesFilters(b, activeQuizFilters()) && (b.imageUrl || b.imageThumbUrl));
}

function refreshStudyPool() {
  studyPool = studyPoolFn();
}

function pickNextStudyBird() {
  if (studyPool.length === 0) return null;
  const state = getLeitnerState();
  const now = Date.now();
  const withInfo = studyPool.map((b) => ({ bird: b, info: getBoxInfo(b, state) }));
  const due = withInfo.filter((x) => x.info.dueAt <= now);
  const pool = due.length ? due : withInfo;
  pool.sort((a, b) => a.info.box - b.info.box || a.info.dueAt - b.info.dueAt);
  const candidates = pool.slice(0, Math.min(5, pool.length));
  return candidates[Math.floor(Math.random() * candidates.length)].bird;
}

function progressCounts() {
  const state = getLeitnerState();
  let fresh = 0;
  let reviewing = 0;
  let mastered = 0;
  for (const bird of studyPool) {
    const info = getBoxInfo(bird, state);
    if (!info.started) fresh += 1;
    else if (info.box >= MASTERED_BOX) mastered += 1;
    else reviewing += 1;
  }
  return { fresh, reviewing, mastered };
}

function renderStudyMode() {
  refreshStudyPool();
  studySession = newSession();
  studyRevealed = false;
  studyCurrent = pickNextStudyBird();
  renderStudyCard();
}

function renderStudyCard() {
  const container = document.getElementById("study-content");
  const counts = progressCounts();
  const title = activeGameContext && activeGameContext.title ? `<p class="study-session-title">${escapeHtml(activeGameContext.title)}</p>` : "";
  const progressHtml = `${title}<p class="study-progress">${counts.fresh} ${t("studyNew")} &middot; ${counts.reviewing} ${t("studyReviewing")} &middot; ${counts.mastered} ${t("studyMastered")}</p>${sessionSummaryHtml(studySession)}`;

  if (!studyCurrent) {
    const done = studySession.seen ? t("sessDone") : t("studyDone");
    container.innerHTML = `${progressHtml}<p class="empty-state">${done}</p>`;
    return;
  }

  const imgUrl = studyCurrent.imageThumbUrl || studyCurrent.imageUrl || PLACEHOLDER_IMG;

  if (!studyRevealed) {
    container.innerHTML = `
      ${progressHtml}
      <div class="quiz-image-wrap" id="study-flip-target">
        <img src="${imgUrl}" alt="" />
      </div>
      <p class="tap-hint">${icon("eye")} ${t("tapToReveal")}</p>
    `;
    document.getElementById("study-flip-target").addEventListener("click", () => {
      studyRevealed = true;
      renderStudyCard();
    });
    return;
  }

  const fact = bf(studyCurrent, "fact");
  container.innerHTML = `
    ${progressHtml}
    <div class="quiz-image-wrap">
      <img src="${imgUrl}" alt="" />
    </div>
    <h2 class="study-answer-name">${escapeHtml(primaryName(studyCurrent))}</h2>
    <p class="names">${secondaryNames(studyCurrent).map(escapeHtml).join(" &middot; ")}${secondaryNames(studyCurrent).length ? " &middot; " : ""}<em>${escapeHtml(studyCurrent.scientificName)}</em></p>
    ${studyCurrent.soundUrl ? `<button class="secondary" id="study-play-sound">${icon("speaker")} <span>${t("playCall")}</span></button>` : ""}
    ${fact ? `<p>${escapeHtml(fact)}</p>` : ""}
    <div class="quiz-actions">
      <button class="secondary" id="study-didnt-know">${icon("close")} ${t("didntKnowIt")}</button>
      <button class="primary" id="study-knew">${icon("check")} ${t("knewIt")}</button>
    </div>
  `;
  document.getElementById("study-knew").addEventListener("click", () => handleStudyAnswer(true));
  document.getElementById("study-didnt-know").addEventListener("click", () => handleStudyAnswer(false));
  const soundBtn = document.getElementById("study-play-sound");
  if (soundBtn) {
    soundBtn.addEventListener("click", () => {
      toggleBirdSound(studyCurrent, (isPlaying) => {
        soundBtn.classList.toggle("playing", isPlaying);
        soundBtn.innerHTML = isPlaying ? `${icon("stop")} <span>${t("stopSound")}</span>` : `${icon("speaker")} <span>${t("playCall")}</span>`;
      });
    });
  }
}

function handleStudyAnswer(knew) {
  if (!studyCurrent) return;
  stopBirdSound();
  const res = recordAnswer(studyCurrent, knew);
  tallySession(studySession, res);

  studyRevealed = false;
  // Pull a fresh pool so a "goed gehad" bird that just dropped out (or a due
  // bird that's now scheduled far ahead) leaves the session immediately.
  refreshStudyPool();
  studyCurrent = pickNextStudyBird();
  renderStudyCard();
}
