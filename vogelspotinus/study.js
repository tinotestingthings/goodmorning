// ---------------------------------------------------------------------------
// "Overhoren" study mode: a Leitner spaced-repetition drill. Real progress
// tracking driven entirely by the user's own honest self-report (knew it /
// didn't know it) -- not a guess at mastery, an actual record of it.
// ---------------------------------------------------------------------------

const LEITNER_BOX_COUNT = 5;
// Days until next review when a card is answered correctly and moves INTO
// box N (index 0 unused; box 1 is always "due now" for a fresh miss).
const LEITNER_INTERVALS_DAYS = [0, 0, 1, 3, 7, 30];

let studyPool = [];
let studyCurrent = null;
let studyRevealed = false;

function getLeitnerState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.leitner) || "{}");
  } catch {
    return {};
  }
}

function saveLeitnerState(state) {
  localStorage.setItem(STORAGE_KEYS.leitner, JSON.stringify(state));
}

function getBoxInfo(bird, state) {
  return state[bird.scientificName] || { box: 1, dueAt: 0 };
}

function refreshStudyPool() {
  studyPool = allBirds.filter((b) => matchesFilters(b, activeQuizFilters()) && (b.imageUrl || b.imageThumbUrl));
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
    const entry = state[bird.scientificName];
    if (!entry) fresh += 1;
    else if (entry.box >= LEITNER_BOX_COUNT) mastered += 1;
    else reviewing += 1;
  }
  return { fresh, reviewing, mastered };
}

function renderStudyMode() {
  refreshStudyPool();
  studyRevealed = false;
  studyCurrent = pickNextStudyBird();
  renderStudyCard();
}

function renderStudyCard() {
  const container = document.getElementById("study-content");
  const counts = progressCounts();
  const progressHtml = `<p class="study-progress">${counts.fresh} ${t("studyNew")} &middot; ${counts.reviewing} ${t("studyReviewing")} &middot; ${counts.mastered} ${t("studyMastered")}</p>`;

  if (!studyCurrent) {
    container.innerHTML = `${progressHtml}<p class="empty-state">${t("studyDone")}</p>`;
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
  const state = getLeitnerState();
  const info = getBoxInfo(studyCurrent, state);
  const newBox = knew ? Math.min(LEITNER_BOX_COUNT, info.box + 1) : 1;
  const days = LEITNER_INTERVALS_DAYS[newBox];
  state[studyCurrent.scientificName] = {
    box: newBox,
    dueAt: Date.now() + days * 24 * 60 * 60 * 1000,
  };
  saveLeitnerState(state);

  studyRevealed = false;
  studyCurrent = pickNextStudyBird();
  renderStudyCard();
}
