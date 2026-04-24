// ═══════════════════════════════════════════════════════════
//  Chapter 3 Cutscene — Plays before Phase 3 (train interior)
//  Background: p3_bg.png (reused)
//  3 dialogues with typewriter effect, then transitions
// ═══════════════════════════════════════════════════════════

const DIALOGUES = [
  { name: "CylinDHAR", text: "that blast almost got me" },
  { name: "CylinDHAR", text: "i hear noises they are still on the train" },
  { name: "CylinDHAR", text: "i miss the prime minister need his milk" },
];

export class Ch3CutsceneScene extends Phaser.Scene {
  constructor() {
    super("chapter3-cutscene");
  }

  create() {
    this.step = 0;
    this.isLineComplete = false;
    this.isTransitioning = false;
    this.typeTimer = null;

    // Background (reusing p3-bg which is already loaded)
    this.bg = this.add.image(640, 360, "p3-bg").setDepth(0);
    const scaleX = 1280 / this.bg.width;
    const scaleY = 720 / this.bg.height;
    this.bg.setScale(Math.max(scaleX, scaleY));

    // Dialogue box
    this.add
      .rectangle(640, 586, 1040, 190, 0x0b1220, 0.9)
      .setStrokeStyle(2, 0x38bdf8, 0.85)
      .setDepth(3);

    this.nameText = this.add
      .text(148, 515, "", {
        fontFamily: "Trebuchet MS",
        fontSize: "30px",
        color: "#93c5fd",
        stroke: "#020617",
        strokeThickness: 6,
      })
      .setDepth(4);

    this.dialogueText = this.add
      .text(148, 556, "", {
        fontFamily: "Trebuchet MS",
        fontSize: "33px",
        color: "#f8fafc",
        stroke: "#020617",
        strokeThickness: 6,
        wordWrap: { width: 950 },
      })
      .setDepth(4);

    this.promptText = this.add
      .text(1084, 662, "Space/Click continue | Enter skip", {
        fontFamily: "Trebuchet MS",
        fontSize: "18px",
        color: "#94a3b8",
        stroke: "#020617",
        strokeThickness: 4,
      })
      .setOrigin(1)
      .setDepth(4)
      .setAlpha(0);

    this.cameras.main.fadeIn(800, 0, 0, 0);
    this.showDialogue(DIALOGUES[0]);

    // Input
    this.input.on("pointerdown", () => this.advanceOrComplete());
    this.input.keyboard.on("keydown-SPACE", () => this.advanceOrComplete());
    this.input.keyboard.on("keydown-ENTER", () => this.goToPhase3());
  }

  showDialogue(dialogue) {
    this.currentDialogue = dialogue;
    this.nameText.setText(dialogue.name);
    this.dialogueText.setText("");
    this.isLineComplete = false;
    this.promptText.setAlpha(0);
    this.typeLine(dialogue.text, 24);
  }

  typeLine(text, speedMs) {
    if (this.typeTimer) {
      this.typeTimer.remove(false);
      this.typeTimer = null;
    }

    let index = 0;
    this.typeTimer = this.time.addEvent({
      delay: speedMs,
      loop: true,
      callback: () => {
        index += 1;
        this.dialogueText.setText(text.slice(0, index));

        if (index >= text.length) {
          this.typeTimer.remove(false);
          this.typeTimer = null;
          this.isLineComplete = true;
          this.tweens.add({
            targets: this.promptText,
            alpha: 1,
            duration: 180,
            ease: "Quad.out",
          });
        }
      },
    });
  }

  advanceOrComplete() {
    if (this.isTransitioning) {
      return;
    }

    if (!this.isLineComplete) {
      if (this.typeTimer) {
        this.typeTimer.remove(false);
        this.typeTimer = null;
      }
      this.dialogueText.setText(this.currentDialogue.text);
      this.isLineComplete = true;
      this.promptText.setAlpha(1);
      return;
    }

    this.step += 1;

    if (this.step < DIALOGUES.length) {
      this.showDialogue(DIALOGUES[this.step]);
    } else {
      this.goToPhase3();
    }
  }

  goToPhase3() {
    if (this.isTransitioning) {
      return;
    }
    this.isTransitioning = true;

    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("phase3-combat");
    });
  }
}
