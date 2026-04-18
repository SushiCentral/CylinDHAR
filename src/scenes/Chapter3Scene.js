export class Chapter3Scene extends Phaser.Scene {
  constructor() {
    super("chapter3");
  }

  create() {
    this.add.rectangle(640, 360, 1280, 720, 0x000000, 1);

    const titleText = this.add
      .text(640, 320, "Chapter 3", {
        fontFamily: "Trebuchet MS",
        fontSize: "72px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const subText = this.add
      .text(640, 400, "Coming Soon...", {
        fontFamily: "Trebuchet MS",
        fontSize: "28px",
        color: "#94a3b8",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.cameras.main.fadeIn(800, 0, 0, 0);

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
