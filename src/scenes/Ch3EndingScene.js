import { stopBgMusic } from "../utils/audio.js";

// ═══════════════════════════════════════════════════════════
//  Chapter 3 Ending — Plays after Phase 3 combat wins
//  Shows 1st_ending.png, then transitions to credits
// ═══════════════════════════════════════════════════════════

export class Ch3EndingScene extends Phaser.Scene {
  constructor() {
    super("chapter3-ending");
  }

  create() {
    stopBgMusic(this);

    this.add.rectangle(640, 360, 1280, 720, 0x000000, 1).setDepth(0);

    // Ending image
    const img = this.add.image(640, 360, "1st-ending").setAlpha(0).setDepth(1);
    const scaleX = 1280 / img.width;
    const scaleY = 720 / img.height;
    img.setScale(Math.max(scaleX, scaleY));

    // Dialogue box
    this.dialogueBox = this.add
      .rectangle(640, 586, 1040, 130, 0x0b1220, 0.9)
      .setStrokeStyle(2, 0x38bdf8, 0.85)
      .setDepth(10)
      .setAlpha(0);

    this.dialogueText = this.add
      .text(640, 586, "", {
        fontFamily: "Trebuchet MS",
        fontSize: "28px",
        color: "#f8fafc",
        stroke: "#020617",
        strokeThickness: 6,
        wordWrap: { width: 950 },
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setAlpha(0);

    this.promptText = this.add
      .text(1100, 646, "Click / Space to continue", {
        fontFamily: "Trebuchet MS",
        fontSize: "16px",
        color: "#94a3b8",
        stroke: "#020617",
        strokeThickness: 4,
      })
      .setOrigin(1, 0.5)
      .setDepth(11)
      .setAlpha(0);

    this.isReady = false;
    this.isTransitioning = false;

    this.cameras.main.fadeIn(800, 0, 0, 0);

    // Fade in the ending image
    this.tweens.add({
      targets: img,
      alpha: 1,
      duration: 2000,
      delay: 300,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.showDialogue();
      },
    });

    // Input
    this.input.on("pointerdown", () => this.advance());
    this.input.keyboard.on("keydown-SPACE", () => this.advance());
  }

  showDialogue() {
    this.dialogueText.setText("The cylinders have been delivered... for now.");

    this.tweens.add({
      targets: [this.dialogueBox, this.dialogueText],
      alpha: 1,
      duration: 600,
      ease: "Sine.easeOut",
    });

    this.time.delayedCall(800, () => {
      this.tweens.add({
        targets: this.promptText,
        alpha: 1,
        duration: 400,
      });
      this.isReady = true;
    });
  }

  advance() {
    if (!this.isReady || this.isTransitioning) {
      return;
    }
    this.isTransitioning = true;

    this.cameras.main.fadeOut(1500, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("chapter3");
    });
  }
}
