// ---------------------------------------------------------------------------
// One owner of the single <audio> element, so any play/stop button anywhere
// can take over and the previously-playing button is told to reset itself.
// ---------------------------------------------------------------------------

let player = null;
let activeBird = null;
let resetActiveButton = null;

function audio() {
  if (!player) {
    player = new Audio();
    player.preload = "none";
    player.addEventListener("ended", stopSound);
    player.addEventListener("error", stopSound);
  }
  return player;
}

export function isPlaying(bird) {
  return activeBird === bird;
}

export function stopSound() {
  audio().pause();
  resetActiveButton?.();
  activeBird = null;
  resetActiveButton = null;
}

/**
 * Toggle playback for `bird`. `onStateChange(isPlaying)` lets the caller flip
 * its own button's icon and label; it is also called with `false` when some
 * other button takes over.
 */
export function toggleSound(bird, onStateChange) {
  if (!bird?.soundUrl) return;
  if (activeBird === bird) {
    stopSound();
    return;
  }
  stopSound();

  const el = audio();
  el.src = bird.soundUrl;
  el.currentTime = 0;
  el.play().catch(() => stopSound());
  activeBird = bird;
  resetActiveButton = () => onStateChange(false);
  onStateChange(true);
}
