import { stopBgMusic } from "../utils/audio.js";

export class Chapter3Scene extends Phaser.Scene {
  constructor() {
    super("chapter3");
  }

  create() {
    stopBgMusic(this);

    this.bg = this.add.rectangle(640, 360, 1280, 720, 0x000000, 1).setDepth(0);

    // Dialogue box UI (reused for both cutscenes)
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

    this.cameras.main.fadeIn(800, 0, 0, 0);

    this.phase = 0;
    this.isReady = false;

    // Start the sequence
    this.showCutscene1();

    // Input to advance
    this.input.on("pointerdown", () => this.advance());
    this.input.keyboard.on("keydown-SPACE", () => this.advance());
  }

  advance() {
    if (!this.isReady) {
      return;
    }

    this.isReady = false;

    if (this.phase === 1) {
      this.transitionToCutscene2();
    } else if (this.phase === 2) {
      this.transitionToCredits();
    }
  }

  showCutscene1() {
    this.cutscene1 = this.add
      .image(640, 360, "end-cutscene-1")
      .setAlpha(0)
      .setDepth(1);

    const scaleX = 1280 / this.cutscene1.width;
    const scaleY = 720 / this.cutscene1.height;
    this.cutscene1.setScale(Math.max(scaleX, scaleY));

    // Fade in cutscene 1
    this.tweens.add({
      targets: this.cutscene1,
      alpha: 1,
      duration: 2000,
      delay: 300,
      ease: "Sine.easeInOut",
      onComplete: () => {
        // Show dialogue
        this.showDialogue("Cylinders delivered on time - MOMOS KI PLATE SASTI HO GAYI");
        this.phase = 1;
      },
    });
  }

  transitionToCutscene2() {
    // Hide dialogue
    this.hideDialogue();

    // Fade out cutscene 1, fade in cutscene 2
    this.cutscene2 = this.add
      .image(640, 360, "end-cutscene-2")
      .setAlpha(0)
      .setDepth(2);

    const scaleX = 1280 / this.cutscene2.width;
    const scaleY = 720 / this.cutscene2.height;
    this.cutscene2.setScale(Math.max(scaleX, scaleY));

    this.tweens.add({
      targets: this.cutscene1,
      alpha: 0,
      duration: 1200,
      ease: "Sine.easeInOut",
    });

    this.tweens.add({
      targets: this.cutscene2,
      alpha: 1,
      duration: 2000,
      delay: 800,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.showDialogue("One step closer to achieving world peace");
        this.phase = 2;
      },
    });
  }

  transitionToCredits() {
    this.hideDialogue();

    // Fade out cutscene 2
    this.tweens.add({
      targets: this.cutscene2,
      alpha: 0,
      duration: 1500,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.showCredits();
      },
    });
  }

  showDialogue(text) {
    this.dialogueText.setText(text);

    this.tweens.add({
      targets: [this.dialogueBox, this.dialogueText],
      alpha: 1,
      duration: 600,
      ease: "Sine.easeOut",
    });

    // Show prompt after a short delay
    this.time.delayedCall(800, () => {
      this.tweens.add({
        targets: this.promptText,
        alpha: 1,
        duration: 400,
      });
      this.isReady = true;
    });
  }

  hideDialogue() {
    this.promptText.setAlpha(0);
    this.tweens.add({
      targets: [this.dialogueBox, this.dialogueText],
      alpha: 0,
      duration: 400,
      ease: "Sine.easeIn",
    });
  }

  showCredits() {
    const style = {
      fontFamily: "Trebuchet MS",
      color: "#f8fafc",
      stroke: "#020617",
      strokeThickness: 5,
      align: "center",
    };

    const creditsY = 780;

    const creditsTitle = this.add
      .text(640, creditsY, "A game by GameImpala", {
        ...style,
        fontSize: "42px",
        color: "#93c5fd",
      })
      .setOrigin(0.5)
      .setDepth(5);

    const creditsLines = [
      { label: "Developer", value: "Adarsh Prakash" },
      { label: "Producer", value: "Adarsh Prakash" },
      { label: "Director", value: "Venu Kulshreshtha" },
      { label: "Designer", value: "Adarsh Prakash, Venu Kulshreshtha" },
      { label: "Voice Acting", value: "" },
      { label: "Gas Singh", value: "Aman Dudeja" },
      { label: "Yalina", value: "Venu Kulshreshtha" },
    ];

    const creditTexts = [creditsTitle];
    let offsetY = creditsY + 80;

    for (const line of creditsLines) {
      const labelText = this.add
        .text(640, offsetY, line.label, {
          ...style,
          fontSize: "20px",
          color: "#94a3b8",
        })
        .setOrigin(0.5)
        .setDepth(5);

      const valueText = this.add
        .text(640, offsetY + 30, line.value, {
          ...style,
          fontSize: "28px",
          color: "#e2e8f0",
        })
        .setOrigin(0.5)
        .setDepth(5);

      creditTexts.push(labelText, valueText);
      offsetY += 90;
    }

    const thanksText = this.add
      .text(640, offsetY + 30, "Thank you for playing!", {
        ...style,
        fontSize: "32px",
        color: "#fbbf24",
      })
      .setOrigin(0.5)
      .setDepth(5);

    creditTexts.push(thanksText);

    const totalHeight = offsetY + 80 - 780;
    const scrollDuration = totalHeight * 12;

    this.tweens.add({
      targets: creditTexts,
      y: `-=${totalHeight + 300}`,
      duration: scrollDuration,
      ease: "Linear",
      onComplete: () => {
        this.tweens.add({
          targets: creditTexts,
          alpha: 0,
          duration: 800,
          onComplete: () => {
            for (const t of creditTexts) {
              t.destroy();
            }
          },
        });
      },
    });
  }
}
