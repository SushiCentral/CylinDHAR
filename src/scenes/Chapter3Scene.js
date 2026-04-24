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

    // ── Devs image in a framed box ──
    const devsImgY = offsetY + 330;

    // Frame border
    const frame = this.add
      .rectangle(640, devsImgY, 750, 560, 0x1e293b, 1)
      .setStrokeStyle(4, 0xfbbf24, 1)
      .setDepth(5);

    // Inner frame accent
    this.add
      .rectangle(640, devsImgY, 730, 540, 0x000000, 0.4)
      .setStrokeStyle(2, 0x93c5fd, 0.6)
      .setDepth(5);

    const devsImg = this.add
      .image(640, devsImgY, "devs-image")
      .setDepth(6);

    // Scale to fit inside the frame
    const maxW = 720;
    const maxH = 530;
    const imgScale = Math.min(maxW / devsImg.width, maxH / devsImg.height);
    devsImg.setScale(imgScale);

    // "The Devs" label under the frame
    const devsLabel = this.add
      .text(640, devsImgY + 310, "The Devs", {
        ...style,
        fontSize: "24px",
        color: "#fbbf24",
      })
      .setOrigin(0.5)
      .setDepth(5);

    creditTexts.push(frame, devsImg, devsLabel);

    // Also push the inner frame accent rectangle
    // (we need a reference to destroy it)
    const innerFrame = this.children.list[this.children.list.length - 3];
    creditTexts.push(innerFrame);

    // Scroll so the devs image lands at the vertical center (Y=360)
    const scrollDistance = devsImgY - 360;
    const scrollDuration = scrollDistance * 12;

    this.tweens.add({
      targets: creditTexts,
      y: `-=${scrollDistance}`,
      duration: scrollDuration,
      ease: "Linear",
      onComplete: () => {
        // Hold at center for a moment, then fade
        this.time.delayedCall(3000, () => {
          this.tweens.add({
            targets: creditTexts,
            alpha: 0,
            duration: 800,
            onComplete: () => {
              for (const t of creditTexts) {
                t.destroy();
              }
              // Start the easter egg after credits disappear
              this.startEasterEgg();
            },
          });
        });
      },
    });
  }

  // ── EASTER EGG SEQUENCE ──────────────────────────────────

  startEasterEgg() {
    const style = {
      fontFamily: "Trebuchet MS",
      color: "#f8fafc",
      stroke: "#020617",
      strokeThickness: 5,
      align: "center",
      wordWrap: { width: 1000 },
    };

    // Step 1: After 10 secs — "The Game has ended..."
    this.time.delayedCall(10000, () => {
      this.showEasterText(
        ' The Game has ended why are YOU still here??? ',
        { ...style, fontSize: "36px", color: "#ef4444" },
        5000,
        () => {
          // Step 2: "Maybe..."
          this.showEasterText(
            "Maybe.....What if.....just what if there is a.....",
            { ...style, fontSize: "30px", color: "#94a3b8" },
            3000,
            () => {
              // Fade out credits music before Chapter 4
              this.fadeOutCreditsBgm();

              // Step 3: "Chapter 4" simple animation
              this.showChapter4Goofy(() => {
                // Step 4: "Nah, no way..."
                this.showEasterText(
                  'Nah, no way Me too tired',
                  { ...style, fontSize: "32px", color: "#fbbf24" },
                  5000,
                  () => {
                    // Step 5: "but here is a AI generated video..."
                    this.showEasterText(
                      "but here is a AI genrated video of the devs dancing ENJOY!!!!!",
                      { ...style, fontSize: "28px", color: "#22d3ee" },
                      3000,
                      () => {
                        // Play the video
                        this.playDevDanceVideo();
                      },
                    );
                  },
                );
              });
            },
          );
        },
      );
    });
  }

  showEasterText(message, textStyle, holdMs, onDone) {
    const txt = this.add
      .text(640, 360, message, textStyle)
      .setOrigin(0.5)
      .setDepth(20)
      .setAlpha(0);

    this.tweens.add({
      targets: txt,
      alpha: 1,
      duration: 600,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.time.delayedCall(holdMs, () => {
          this.tweens.add({
            targets: txt,
            alpha: 0,
            duration: 500,
            ease: "Sine.easeIn",
            onComplete: () => {
              txt.destroy();
              if (onDone) onDone();
            },
          });
        });
      },
    });
  }

  showChapter4Goofy(onDone) {
    const ch4 = this.add
      .text(640, 360, "Chapter 4", {
        fontFamily: "Trebuchet MS",
        fontSize: "64px",
        color: "#f8fafc",
        stroke: "#020617",
        strokeThickness: 7,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setAlpha(0);

    // Simple fade in, hold, fade out — same style as other chapter titles
    this.tweens.add({
      targets: ch4,
      alpha: 1,
      duration: 1500,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.time.delayedCall(3000, () => {
          this.tweens.add({
            targets: ch4,
            alpha: 0,
            duration: 800,
            ease: "Sine.easeOut",
            onComplete: () => {
              ch4.destroy();
              if (onDone) onDone();
            },
          });
        });
      },
    });
  }

  fadeOutCreditsBgm() {
    if (!window.__creditsBgm) return;
    const bgm = window.__creditsBgm;
    const fadeSteps = 30;
    const fadeInterval = 50;
    const startVol = bgm.volume;
    let step = 0;
    const fade = setInterval(() => {
      step += 1;
      bgm.volume = Math.max(0, startVol * (1 - step / fadeSteps));
      if (step >= fadeSteps) {
        clearInterval(fade);
        bgm.pause();
        bgm.currentTime = 0;
      }
    }, fadeInterval);
  }

  playDevDanceVideo() {

    // Create an HTML video element overlaid on the canvas
    const canvas = this.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();

    const video = document.createElement("video");
    video.src = "assets/sprites/dev_dance_easter_egg.mp4";
    video.style.position = "absolute";

    // Size and center like the devs image frame
    const vw = 560;
    const vh = 420;
    const scaleX = canvasRect.width / 1280;
    const scaleY = canvasRect.height / 720;
    const scaledW = vw * scaleX;
    const scaledH = vh * scaleY;
    video.style.width = `${scaledW}px`;
    video.style.height = `${scaledH}px`;
    video.style.left = `${canvasRect.left + (canvasRect.width - scaledW) / 2}px`;
    video.style.top = `${canvasRect.top + (canvasRect.height - scaledH) / 2}px`;
    video.style.border = "4px solid #fbbf24";
    video.style.borderRadius = "8px";
    video.style.boxShadow = "0 0 40px rgba(251,191,36,0.4)";
    video.style.zIndex = "9999";
    video.style.backgroundColor = "#000";
    video.autoplay = true;
    video.playsInline = true;

    document.body.appendChild(video);

    // Draw a Phaser frame behind (in case canvas shifts)
    const phaserFrame = this.add
      .rectangle(640, 360, vw + 20, vh + 20, 0x1e293b, 0.9)
      .setStrokeStyle(4, 0xfbbf24, 1)
      .setDepth(20);

    video.play().catch(() => { });

    video.addEventListener("ended", () => {
      video.remove();
      phaserFrame.destroy();
      this.showFinalMessage();
    });

    // Fallback in case video fails to load
    video.addEventListener("error", () => {
      video.remove();
      phaserFrame.destroy();
      this.showFinalMessage();
    });
  }

  showFinalMessage() {
    const txt = this.add
      .text(
        640,
        360,
        "ok now there is really nothing ahead move on with ur life and touch some grass",
        {
          fontFamily: "Trebuchet MS",
          fontSize: "26px",
          color: "#94a3b8",
          stroke: "#020617",
          strokeThickness: 5,
          align: "center",
          wordWrap: { width: 900 },
        },
      )
      .setOrigin(0.5)
      .setDepth(20)
      .setAlpha(0);

    // Fade in
    this.tweens.add({
      targets: txt,
      alpha: 1,
      duration: 800,
      ease: "Sine.easeOut",
      onComplete: () => {
        // Hold for 8 seconds then very slow fade out everything
        this.time.delayedCall(8000, () => {
          this.tweens.add({
            targets: [txt, this.bg],
            alpha: 0,
            duration: 5000,
            ease: "Sine.easeInOut",
          });
        });
      },
    });
  }
}
