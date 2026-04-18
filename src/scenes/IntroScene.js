

const DIALOGUE_1 = {
  name: "Gas Singh",
  text: "India mei cylinders laane ki zarurat hai - It's CylinDHARing time",
};

const DIALOGUE_2 = {
  name: "Female",
  text: "Mai bhi tere saath aari aari aari",
};

export class IntroScene extends Phaser.Scene {
  constructor() {
    super("intro");
  }

  create() {


    this.isTransitioning = false;
    this.isLineComplete = false;
    this.typeTimer = null;
    this.step = 1;

    this.gasSinghSfx = new Audio("assets/audio/gas_singh.mp3");
    this.gasSinghSfx.volume = 1.0;

    this.femaleSfx = new Audio("assets/audio/female.mp3");
    this.femaleSfx.volume = 1.0;

    this.bg1 = this.add.image(640, 360, "intro-bg").setDisplaySize(1280, 720).setDepth(0).setAlpha(1);
    this.bg2 = this.add.image(640, 360, "intro-bg-2").setDisplaySize(1280, 720).setDepth(1).setAlpha(0);

    this.add.rectangle(640, 586, 1040, 190, 0x0b1220, 0.9).setStrokeStyle(2, 0x38bdf8, 0.85).setDepth(3);

    this.nameText = this.add
      .text(148, 515, DIALOGUE_1.name, {
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
    this.showDialogue(DIALOGUE_1);
    this.gasSinghSfx.play().catch(() => { });

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

  advanceOrCompleteLine() {
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

    if (this.step === 1) {
      this.step = 2;
      this.showSecondCutscene();
      return;
    }

    this.goToGame();
  }

  showSecondCutscene() {
    if (this.gasSinghSfx) {
      this.gasSinghSfx.pause();
    }

    this.promptText.setAlpha(0);
    this.tweens.add({
      targets: this.bg2,
      alpha: 1,
      duration: 320,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.bg1.setVisible(false);
        this.showDialogue(DIALOGUE_2);
        this.femaleSfx.play().catch(() => { });
      },
    });
  }

  goToGame() {
    if (this.isTransitioning) {
      return;
    }

    if (this.gasSinghSfx) {
      this.gasSinghSfx.pause();
    }

    if (this.femaleSfx) {
      this.femaleSfx.pause();
    }

    this.isTransitioning = true;
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.time.delayedCall(230, () => {
      this.scene.start("game");
    });
  }
}
