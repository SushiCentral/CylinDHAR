export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    this.load.image("start-page-bg", "assets/sprites/start_page.png");
    this.load.image("intro-bg", "assets/sprites/1st_cutscene.png");
    this.load.image("intro-bg-2", "assets/sprites/2nd_cutscene.png");
    this.load.image("player-car", "assets/sprites/player_car.png");
    this.load.image("player-car-last-life", "assets/sprites/player_car_last_life.png");
    this.load.image("gas-cylinder", "assets/sprites/gas_cylinder.png");
    this.load.image("road-tile", "assets/sprites/road_tile.png");
    this.load.image("obstacle-car-red", "assets/sprites/obstacle_car_red.png");
    this.load.image("obstacle-car-blue", "assets/sprites/obstacle_car_blue.png");
    this.load.image("first-hit-image", "assets/sprites/image.png");
    this.load.audio("last-life-alert", "assets/audio/last_life_alert.ogg");
    this.createProceduralTextures();
  }

  create() {
    if (!this.textures.exists("player-car") && this.textures.exists("player-car-fallback")) {
      this.textures.renameTexture("player-car-fallback", "player-car");
    }
    if (!this.textures.exists("start-page-bg") && this.textures.exists("start-page-bg-fallback")) {
      this.textures.renameTexture("start-page-bg-fallback", "start-page-bg");
    }
    if (!this.textures.exists("player-car-last-life") && this.textures.exists("player-car-last-life-fallback")) {
      this.textures.renameTexture("player-car-last-life-fallback", "player-car-last-life");
    }
    if (!this.textures.exists("gas-cylinder") && this.textures.exists("gas-cylinder-fallback")) {
      this.textures.renameTexture("gas-cylinder-fallback", "gas-cylinder");
    }
    if (!this.textures.exists("road-tile") && this.textures.exists("road-tile-fallback")) {
      this.textures.renameTexture("road-tile-fallback", "road-tile");
    }
    if (!this.textures.exists("obstacle-car-red") && this.textures.exists("obstacle-car-a-fallback")) {
      this.textures.renameTexture("obstacle-car-a-fallback", "obstacle-car-red");
    }
    if (!this.textures.exists("obstacle-car-blue")) {
      if (this.textures.exists("obstacle-car-b")) {
        this.textures.renameTexture("obstacle-car-b", "obstacle-car-blue");
      }
    }
    if (!this.textures.exists("intro-bg") && this.textures.exists("intro-bg-fallback")) {
      this.textures.renameTexture("intro-bg-fallback", "intro-bg");
    }
    if (!this.textures.exists("intro-bg-2") && this.textures.exists("intro-bg-2-fallback")) {
      this.textures.renameTexture("intro-bg-2-fallback", "intro-bg-2");
    }
    if (!this.textures.exists("intro-char-left") && this.textures.exists("intro-char-left-fallback")) {
      this.textures.renameTexture("intro-char-left-fallback", "intro-char-left");
    }
    if (!this.textures.exists("intro-char-right") && this.textures.exists("intro-char-right-fallback")) {
      this.textures.renameTexture("intro-char-right-fallback", "intro-char-right");
    }
    this.scene.start("start");
  }

  createProceduralTextures() {
    const g = this.add.graphics();

    g.clear();
    g.fillStyle(0x0a0f17, 1);
    g.fillRect(0, 0, 1280, 720);
    g.fillStyle(0x101a28, 0.9);
    g.fillRect(0, 420, 1280, 300);
    g.fillStyle(0x1e293b, 0.5);
    g.fillRect(0, 460, 1280, 260);
    g.generateTexture("sky-bg", 1280, 720);

    g.clear();
    g.fillStyle(0x020617, 1);
    g.fillRect(0, 0, 1280, 720);
    g.fillStyle(0x0f172a, 1);
    g.fillRect(0, 390, 1280, 330);
    g.fillStyle(0x0891b2, 0.22);
    g.fillCircle(230, 230, 290);
    g.fillStyle(0x2563eb, 0.2);
    g.fillCircle(1040, 170, 250);
    g.fillStyle(0x22d3ee, 0.12);
    for (let i = 0; i < 11; i += 1) {
      g.fillRect(i * 130, 0, 20, 720);
    }
    g.generateTexture("start-page-bg-fallback", 1280, 720);

    g.clear();
    g.fillStyle(0x2a3036, 1);
    g.fillRect(0, 0, 320, 320);
    g.fillStyle(0x242b31, 0.35);
    for (let i = 0; i < 180; i += 1) {
      g.fillRect(Phaser.Math.Between(0, 319), Phaser.Math.Between(0, 319), 2, 2);
    }
    g.fillStyle(0x9ca3af, 0.9);
    g.fillRect(0, 0, 7, 320);
    g.fillRect(313, 0, 7, 320);
    g.generateTexture("road-tile-fallback", 320, 320);

    g.clear();
    g.fillStyle(0x000000, 0.26);
    g.fillEllipse(64, 20, 118, 34);
    g.generateTexture("shadow", 128, 40);

    g.clear();
    g.fillStyle(0x16a34a, 1);
    g.fillRoundedRect(0, 0, 50, 72, 10);
    g.fillStyle(0xdcfce7, 0.38);
    g.fillRoundedRect(7, 7, 36, 20, 7);
    g.fillStyle(0x14532d, 1);
    g.fillRect(14, 30, 22, 6);
    g.fillStyle(0x166534, 1);
    g.fillRect(18, -2, 14, 8);
    g.generateTexture("gas-cylinder-fallback", 50, 72);

    g.clear();
    g.fillStyle(0x22c55e, 1);
    g.fillRoundedRect(0, 0, 70, 120, 12);
    g.fillStyle(0x93c5fd, 0.85);
    g.fillRoundedRect(11, 12, 48, 24, 9);
    g.fillStyle(0xe2e8f0, 0.35);
    g.fillRoundedRect(8, 44, 54, 16, 7);
    g.fillStyle(0x111827, 1);
    g.fillRect(10, 88, 17, 26);
    g.fillRect(43, 88, 17, 26);
    g.generateTexture("player-car-fallback", 70, 120);

    g.clear();
    g.fillStyle(0xf97316, 1);
    g.fillRoundedRect(0, 0, 70, 120, 12);
    g.fillStyle(0xfee2e2, 0.85);
    g.fillRoundedRect(11, 12, 48, 24, 9);
    g.fillStyle(0xfca5a5, 0.38);
    g.fillRoundedRect(8, 44, 54, 16, 7);
    g.fillStyle(0x111827, 1);
    g.fillRect(10, 88, 17, 26);
    g.fillRect(43, 88, 17, 26);
    g.generateTexture("player-car-last-life-fallback", 70, 120);

    g.clear();
    g.fillStyle(0xfb7185, 1);
    g.fillRoundedRect(0, 0, 70, 120, 10);
    g.fillStyle(0xfef3c7, 0.28);
    g.fillRoundedRect(8, 10, 54, 22, 7);
    g.fillStyle(0x111827, 1);
    g.fillRect(12, 90, 16, 24);
    g.fillRect(42, 90, 16, 24);
    g.generateTexture("obstacle-car-a-fallback", 70, 120);

    g.clear();
    g.fillStyle(0x60a5fa, 1);
    g.fillRoundedRect(0, 0, 70, 120, 10);
    g.fillStyle(0xf8fafc, 0.24);
    g.fillRoundedRect(8, 10, 54, 20, 7);
    g.fillStyle(0x111827, 1);
    g.fillRect(12, 90, 16, 24);
    g.fillRect(42, 90, 16, 24);
    g.generateTexture("obstacle-car-b", 70, 120);

    g.clear();
    g.fillStyle(0xf59e0b, 1);
    g.fillRoundedRect(0, 0, 90, 56, 8);
    g.fillStyle(0x111827, 0.65);
    g.fillRect(0, 24, 90, 8);
    g.generateTexture("barrier", 90, 56);

    g.clear();
    g.fillStyle(0x38bdf8, 0.95);
    g.fillCircle(20, 20, 15);
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(14, 30, 52, 30, 8);
    g.fillStyle(0x38bdf8, 1);
    g.fillRoundedRect(20, 37, 40, 5, 3);
    g.fillRoundedRect(20, 45, 28, 5, 3);
    g.generateTexture("icon-chat", 80, 80);

    g.clear();
    g.fillStyle(0xfacc15, 1);
    g.fillRoundedRect(8, 10, 48, 60, 8);
    g.fillStyle(0x111827, 1);
    g.fillRoundedRect(56, 30, 12, 20, 3);
    g.fillStyle(0xef4444, 1);
    g.fillRoundedRect(14, 16, 34, 48, 5);
    g.generateTexture("icon-battery", 80, 80);

    g.clear();
    g.fillStyle(0xa78bfa, 1);
    g.fillCircle(40, 40, 30);
    g.fillStyle(0xf8fafc, 1);
    g.fillTriangle(31, 24, 31, 56, 58, 40);
    g.generateTexture("icon-reel", 80, 80);

    g.clear();
    g.fillStyle(0x10b981, 0.26);
    g.fillRect(0, 0, 1280, 720);
    g.fillStyle(0x06b6d4, 0.22);
    g.fillRect(0, 0, 1280, 720);
    g.fillStyle(0xf43f5e, 0.16);
    for (let x = -200; x < 1480; x += 140) {
      g.fillRect(x, 0, 70, 720);
    }
    g.generateTexture("neon-overlay", 1280, 720);

    g.clear();
    g.fillStyle(0x000000, 0.22);
    g.fillRect(0, 0, 1280, 720);
    g.generateTexture("blur-overlay", 1280, 720);

    g.clear();
    g.fillStyle(0x0b1020, 1);
    g.fillRect(0, 0, 1280, 720);
    g.fillStyle(0x111a33, 1);
    g.fillRect(0, 360, 1280, 360);
    g.fillStyle(0x1d4ed8, 0.28);
    g.fillCircle(240, 180, 280);
    g.fillStyle(0x06b6d4, 0.24);
    g.fillCircle(1040, 170, 260);
    g.fillStyle(0x22d3ee, 0.1);
    for (let i = 0; i < 12; i += 1) {
      g.fillRect(i * 120, 0, 24, 720);
    }
    g.generateTexture("intro-bg-fallback", 1280, 720);

    g.clear();
    g.fillStyle(0x130824, 1);
    g.fillRect(0, 0, 1280, 720);
    g.fillStyle(0x261048, 1);
    g.fillRect(0, 390, 1280, 330);
    g.fillStyle(0xf43f5e, 0.22);
    g.fillCircle(240, 220, 270);
    g.fillStyle(0xa855f7, 0.2);
    g.fillCircle(1040, 190, 240);
    g.fillStyle(0xfb7185, 0.1);
    for (let i = 0; i < 12; i += 1) {
      g.fillRect(i * 120, 0, 24, 720);
    }
    g.generateTexture("intro-bg-2-fallback", 1280, 720);

    g.clear();
    g.fillStyle(0x22c55e, 1);
    g.fillRoundedRect(0, 0, 240, 420, 24);
    g.fillStyle(0xf8fafc, 0.9);
    g.fillCircle(120, 90, 54);
    g.fillStyle(0x0f172a, 0.22);
    g.fillRoundedRect(44, 170, 152, 206, 18);
    g.generateTexture("intro-char-left-fallback", 240, 420);

    g.clear();
    g.fillStyle(0xf97316, 1);
    g.fillRoundedRect(0, 0, 240, 420, 24);
    g.fillStyle(0xffedd5, 0.95);
    g.fillCircle(120, 90, 54);
    g.fillStyle(0x0f172a, 0.22);
    g.fillRoundedRect(44, 170, 152, 206, 18);
    g.generateTexture("intro-char-right-fallback", 240, 420);

    g.destroy();
  }
}
