const RESULT_COPY = {
  win: {
    title: "YOU WIN",
    subtitle: "You resisted peak brainrot.",
    color: "#86efac",
  },
  crash: {
    title: "GAME OVER",
    subtitle: "You bonked traffic. Skill issue.",
    color: "#fca5a5",
  },
  distracted: {
    title: "GAME OVER",
    subtitle: "Too distracted to drive.",
    color: "#fef08a",
  },
};

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("game-over");
  }

  create(data) {
    const resultKey = data.result || "crash";
    const copy = RESULT_COPY[resultKey] || RESULT_COPY.crash;

    // Play game over sound on loss
    if (resultKey !== "win") {
      const gameOverSfx = new Audio("assets/audio/game_over_sound.mp3");
      gameOverSfx.volume = 0.8;
      gameOverSfx.play().catch(() => {});
    }

    const timeValue = Number.isFinite(data.survivalSeconds) ? data.survivalSeconds : 0;
    const bestValue = Number.isFinite(data.bestTime) ? data.bestTime : 0;

    this.add.rectangle(640, 360, 1280, 720, 0x070b12, 1);

    const roadBack = this.add.tileSprite(640, 360, 860, 760, "road-tile").setAlpha(0.18);
    roadBack.tilePositionY = 180;

    this.add.rectangle(640, 160, 540, 164, 0x0f172a, 0.88).setStrokeStyle(2, 0x22d3ee, 0.8);

    this.add
      .text(640, 130, copy.title, {
        fontFamily: "Trebuchet MS",
        fontSize: "54px",
        color: copy.color,
        stroke: "#020617",
        strokeThickness: 7,
      })
      .setOrigin(0.5);

    this.add
      .text(640, 188, copy.subtitle, {
        fontFamily: "Trebuchet MS",
        fontSize: "26px",
        color: "#e2e8f0",
        stroke: "#020617",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.add
      .text(640, 300, `Time Survived: ${timeValue.toFixed(1)}s`, {
        fontFamily: "Trebuchet MS",
        fontSize: "34px",
        color: "#f8fafc",
        stroke: "#020617",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(640, 348, `Best Time: ${bestValue.toFixed(1)}s`, {
        fontFamily: "Trebuchet MS",
        fontSize: "26px",
        color: "#cbd5e1",
        stroke: "#020617",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.add
      .text(640, 398, "Controls: A/D or <- ->", {
        fontFamily: "Trebuchet MS",
        fontSize: "22px",
        color: "#94a3b8",
        stroke: "#020617",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add.rectangle(640, 454, 380, 2, 0x334155, 0.8);

    const retryButton = this.add
      .rectangle(640, 512, 280, 74, 0x22c55e, 1)
      .setStrokeStyle(2, 0x14532d, 1)
      .setInteractive({ useHandCursor: true });

    const retryText = this.add
      .text(640, 500, "Retry", {
        fontFamily: "Trebuchet MS",
        fontSize: "34px",
        color: "#052e16",
        stroke: "#dcfce7",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const pulseTween = this.tweens.add({
      targets: retryButton,
      scaleX: 1.04,
      scaleY: 1.04,
      yoyo: true,
      repeat: -1,
      duration: 760,
      ease: "Sine.easeInOut",
    });

    retryButton.on("pointerover", () => {
      retryButton.setFillStyle(0x34d399, 1);
      retryText.setScale(1.05);
    });

    retryButton.on("pointerout", () => {
      retryButton.setFillStyle(0x22c55e, 1);
      retryText.setScale(1);
    });

    retryButton.on("pointerdown", () => {
      pulseTween.stop();
      this.scene.start("game");
    });

    this.add
      .text(640, 604, "Press R or click Retry", {
        fontFamily: "Trebuchet MS",
        fontSize: "22px",
        color: "#64748b",
        stroke: "#020617",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.input.keyboard.once("keydown-R", () => {
      pulseTween.stop();
      this.scene.start("game");
    });
  }
}
