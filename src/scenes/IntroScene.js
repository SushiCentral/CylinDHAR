const DIALOGUE_LINE = "India mei cylinders laane ki zarurat hai - It's CylinDHARing time";

export class IntroScene extends Phaser.Scene {
  constructor() {
    super("intro");
  }

  create() {
    this.isLineComplete = false;
    this.isTransitioning = false;
    this.typeTimer = null;

    this.add.image(640, 360, "intro-bg").setDisplaySize(1280, 720).setDepth(0);

    this.leftCharacter = this.add.image(240, 445, "intro-char-left").setDepth(2);
    this.rightCharacter = this.add.image(1040, 445, "intro-char-right").setDepth(2);

    this.leftCharacter.setScale(1.12);
    this.rightCharacter.setScale(1.12);

    this.add.rectangle(640, 586, 1040, 190, 0x0b1220, 0.9).setStrokeStyle(2, 0x38bdf8, 0.85).setDepth(3);

    this.nameText = this.add
      .text(148, 515, "Dispatch HQ", {
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

    this.cameras.main.fadeIn(280, 0, 0, 0);
    this.typeLine(DIALOGUE_LINE, 24);

    this.input.on("pointerdown", () => {
      this.advanceOrCompleteLine();
    });

    this.input.keyboard.on("keydown-SPACE", () => {
      this.advanceOrCompleteLine();
    });

    this.input.keyboard.on("keydown-ENTER", () => {
      this.goToGame();
    });
  }

  typeLine(text, speedMs) {
    this.dialogueText.setText("");
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

  advanceOrCompleteLine() {
    if (this.isTransitioning) {
      return;
    }

    if (!this.isLineComplete) {
      if (this.typeTimer) {
        this.typeTimer.remove(false);
        this.typeTimer = null;
      }
      this.dialogueText.setText(DIALOGUE_LINE);
      this.isLineComplete = true;
      this.promptText.setAlpha(1);
      return;
    }

    this.goToGame();
  }

  goToGame() {
    if (this.isTransitioning) {
      return;
    }

    this.isTransitioning = true;
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.time.delayedCall(230, () => {
      this.scene.start("game");
    });
  }
}
