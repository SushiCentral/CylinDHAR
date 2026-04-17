export function ensureBgMusic(scene) {
  if (scene.registry.get("bgMusicPlaying")) {
    return;
  }

  if (!scene.cache.audio.exists("bg-music-lv1")) {
    return;
  }

  if (scene.sound?.locked) {
    return;
  }

  const bgMusic = scene.sound.add("bg-music-lv1", {
    loop: true,
    volume: 0.28,
  });

  bgMusic.play();
  scene.registry.set("bgMusicPlaying", true);
  scene.registry.set("bgMusicRef", bgMusic);
}

export function stopBgMusic(scene) {
  const bgMusic = scene.registry.get("bgMusicRef");
  if (!bgMusic) {
    scene.registry.set("bgMusicRef", null);
    scene.registry.set("bgMusicPlaying", false);
    return;
  }

  const fadeDurationMs = 420;

  if (scene.tweens) {
    scene.tweens.add({
      targets: bgMusic,
      volume: 0,
      duration: fadeDurationMs,
      ease: "Quad.out",
      onComplete: () => {
        bgMusic.stop();
        bgMusic.destroy();
      },
    });
  } else {
    bgMusic.stop();
    bgMusic.destroy();
  }

  setTimeout(() => {
    if (bgMusic.isPlaying) {
      bgMusic.stop();
      bgMusic.destroy();
    }
    if (scene.registry.get("bgMusicRef") === bgMusic) {
      scene.registry.set("bgMusicRef", null);
    }
  }, fadeDurationMs + 80);

  scene.registry.set("bgMusicPlaying", false);
}
