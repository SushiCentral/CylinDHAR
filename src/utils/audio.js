/**
 * Background music manager using a plain HTML5 Audio element.
 * This bypasses Phaser's Web Audio decoder entirely, which can
 * silently fail on certain MP3 encodings.
 */

let audioEl = null;

export function ensureBgMusic(_scene) {
  // Already playing
  if (audioEl && !audioEl.paused) {
    return;
  }

  // Create element if needed
  if (!audioEl) {
    audioEl = new Audio("assets/audio/bg_music_lv1.mp3");
    audioEl.loop = true;
    audioEl.volume = 0.45;
  }

  // Play (returns a promise in modern browsers)
  const playPromise = audioEl.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn("[audio] play blocked by browser autoplay policy:", err.message);
    });
  }
}

export function stopBgMusic(_scene) {
  if (!audioEl) {
    return;
  }

  // Fade out over ~400ms
  const fadeSteps = 20;
  const fadeInterval = 20; // ms per step
  const startVol = audioEl.volume;
  let step = 0;

  const fade = setInterval(() => {
    step += 1;
    audioEl.volume = Math.max(0, startVol * (1 - step / fadeSteps));
    if (step >= fadeSteps) {
      clearInterval(fade);
      audioEl.pause();
      audioEl.currentTime = 0;
      audioEl.volume = startVol;
    }
  }, fadeInterval);
}
