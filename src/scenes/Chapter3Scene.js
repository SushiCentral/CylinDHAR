import { stopBgMusic } from "../utils/audio.js";

export class Chapter3Scene extends Phaser.Scene {
  constructor() {
    super("chapter3");
  }

  create() {
    stopBgMusic(this);

    this.add.rectangle(640, 360, 1280, 720, 0x000000, 1).setDepth(0);

    // ── Phase 1: End cutscene image ──
    const cutscene = this.add
      .image(640, 360, "end-cutscene")
      .setAlpha(0)
      .setDepth(1);

    const scaleX = 1280 / cutscene.width;
    const scaleY = 720 / cutscene.height;
    cutscene.setScale(Math.max(scaleX, scaleY));

    this.cameras.main.fadeIn(800, 0, 0, 0);

    // Fade in the cutscene
    this.tweens.add({
      targets: cutscene,
      alpha: 1,
      duration: 2500,
      delay: 300,
      ease: "Sine.easeInOut",
    });

    // ── Phase 2: Fade out cutscene → show credits ──
    this.time.delayedCall(6000, () => {
      this.tweens.add({
        targets: cutscene,
        alpha: 0,
        duration: 1500,
        ease: "Sine.easeInOut",
        onComplete: () => {
          this.showCredits();
        },
      });
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

    // Credits container — starts below screen and scrolls up
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

    // Thank you at the bottom
    const thanksText = this.add
      .text(640, offsetY + 30, "Thank you for playing!", {
        ...style,
        fontSize: "32px",
        color: "#fbbf24",
      })
      .setOrigin(0.5)
      .setDepth(5);

    creditTexts.push(thanksText);

    // Scroll all credits upward
    const totalHeight = offsetY + 80 - 780;
    const scrollDuration = totalHeight * 12;

    this.tweens.add({
      targets: creditTexts,
      y: `-=${totalHeight + 300}`,
      duration: scrollDuration,
      ease: "Linear",
      onComplete: () => {
        // Fade out credits
        this.tweens.add({
          targets: creditTexts,
          alpha: 0,
          duration: 800,
          onComplete: () => {
            for (const t of creditTexts) {
              t.destroy();
            }
            this.showChapter3();
          },
        });
      },
    });
  }

  showChapter3() {
    const titleText = this.add
      .text(640, 300, "Chapter 3", {
        fontFamily: "Trebuchet MS",
        fontSize: "72px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(5);

    const subText = this.add
      .text(640, 390, "Coming Soon...", {
        fontFamily: "Trebuchet MS",
        fontSize: "28px",
        color: "#cbd5e1",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(5);

    this.tweens.add({
      targets: titleText,
      alpha: 1,
      duration: 1500,
      delay: 400,
      ease: "Sine.easeIn",
    });

    this.tweens.add({
      targets: subText,
      alpha: 1,
      duration: 1500,
      delay: 1200,
      ease: "Sine.easeIn",
    });
  }
}
