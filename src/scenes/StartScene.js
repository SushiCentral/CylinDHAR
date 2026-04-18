

export class StartScene extends Phaser.Scene {
  constructor() {
    super("start");
  }

  create() {
    this.isStarting = false;
    const buttonX = 1110;
    const buttonY = 640;

    this.add.image(640, 360, "start-page-bg").setDisplaySize(1280, 720).setDepth(0);

    const button = this.add
      .rectangle(buttonX, buttonY, 280, 84, 0x22c55e, 0.98)
      .setStrokeStyle(3, 0x14532d, 1)
      .setDepth(3)
      .setInteractive({ useHandCursor: true });

    const buttonText = this.add
      .text(buttonX, buttonY, "START", {
        fontFamily: "Trebuchet MS",
        fontSize: "40px",
        color: "#052e16",
        stroke: "#dcfce7",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(4);

    const hoverIn = () => {
      button.setFillStyle(0x34d399, 1);
      buttonText.setScale(1.03);
    };

    const hoverOut = () => {
      button.setFillStyle(0x22c55e, 0.98);
      buttonText.setScale(1);
    };

    button.on("pointerover", hoverIn);
    button.on("pointerout", hoverOut);
    button.on("pointerdown", () => {
      this.startIntro();
    });

    this.input.keyboard.on("keydown-SPACE", () => {
      this.startIntro();
    });
    this.input.keyboard.on("keydown-ENTER", () => {
      this.startIntro();
    });

    this.tweens.add({
      targets: button,
      scaleX: 1.03,
      scaleY: 1.03,
      yoyo: true,
      repeat: -1,
      duration: 760,
      ease: "Sine.easeInOut",
    });

    this.cameras.main.fadeIn(260, 0, 0, 0);
  }

  startIntro() {
    if (this.isStarting) {
      return;
    }


    this.isStarting = true;
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.time.delayedCall(230, () => {
      this.scene.start("intro");
    });
  }
}
