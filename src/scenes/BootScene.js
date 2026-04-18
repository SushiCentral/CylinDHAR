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
    this.load.image("barrier", "assets/sprites/yellow_barrier.png");
    this.load.image("road-tile", "assets/sprites/road_tile.png");
    this.load.image("obstacle-car-red", "assets/sprites/obstacle_car_red.png");
    this.load.image("obstacle-car-blue", "assets/sprites/obstacle_car_blue.png");
    this.load.image("first-hit-image", "assets/sprites/image.png");
    this.load.image("railway-crossing", "assets/sprites/railway_crossing.png");
    this.load.image("train", "assets/sprites/train.png");
    this.load.image("p2-train-top", "assets/sprites/train_top.png");
    this.load.image("p2-bg", "assets/sprites/p2_bg.png");
    this.load.image("p2-player-idle", "assets/sprites/p2_player_idle.png");
    this.load.image("p2-player-run1", "assets/sprites/p2_player_run1.png");
    this.load.image("p2-player-run2", "assets/sprites/p2_player_run2.png");
    this.load.image("p2-player-jump", "assets/sprites/p2_player_jump.png");
    this.load.image("p2-enemy", "assets/sprites/p2_enemy.png");
    this.load.image("end-cutscene-1", "assets/sprites/end_cutscene1.png");
    this.load.image("end-cutscene-2", "assets/sprites/end_cutscene2.png");
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
    if (!this.textures.exists("barrier") && this.textures.exists("barrier-fallback")) {
      this.textures.renameTexture("barrier-fallback", "barrier");
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
    g.generateTexture("barrier-fallback", 90, 56);

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

    // ── Phase 2 procedural textures (8-bit pixel art) ──
    // All shapes use fillRect only for a blocky retro look.

    // Player (side view, facing right, with gun)
    g.clear();
    g.fillStyle(0x22d3ee, 1);
    g.fillRect(10, 16, 24, 28);
    g.fillStyle(0xf8fafc, 1);
    g.fillRect(12, 0, 20, 16);
    g.fillStyle(0x0e7490, 1);
    g.fillRect(26, 6, 4, 4);
    g.fillStyle(0x0f172a, 1);
    g.fillRect(12, 44, 8, 12);
    g.fillRect(24, 44, 8, 12);
    g.fillStyle(0x94a3b8, 1);
    g.fillRect(34, 26, 10, 4);
    g.fillRect(30, 24, 8, 10);
    g.generateTexture("p2-player", 44, 56);

    // Bullet
    g.clear();
    g.fillStyle(0xfbbf24, 1);
    g.fillRect(0, 0, 16, 6);
    g.fillStyle(0xffffff, 0.6);
    g.fillRect(10, 1, 5, 4);
    g.generateTexture("p2-bullet", 16, 6);

    // Train car rooftop (platform tile)
    g.clear();
    g.fillStyle(0x4b5563, 1);
    g.fillRect(0, 0, 64, 24);
    g.fillStyle(0x6b7280, 1);
    g.fillRect(0, 0, 64, 4);
    g.fillStyle(0x374151, 1);
    g.fillRect(0, 20, 64, 4);
    g.fillStyle(0x9ca3af, 1);
    for (let rx = 4; rx < 60; rx += 10) {
      g.fillRect(rx, 1, 2, 2);
    }
    g.fillStyle(0x374151, 0.5);
    g.fillRect(16, 4, 1, 16);
    g.fillRect(32, 4, 1, 16);
    g.fillRect(48, 4, 1, 16);
    g.generateTexture("p2-platform", 64, 24);

    // Train car side (decoration below platforms)
    g.clear();
    g.fillStyle(0x374151, 1);
    g.fillRect(0, 0, 64, 48);
    g.fillStyle(0x1f2937, 1);
    g.fillRect(0, 0, 64, 2);
    g.fillStyle(0x93c5fd, 0.5);
    g.fillRect(6, 8, 10, 10);
    g.fillRect(22, 8, 10, 10);
    g.fillRect(38, 8, 10, 10);
    g.fillRect(54, 8, 8, 10);
    g.fillStyle(0x1f2937, 1);
    g.fillRect(0, 36, 64, 4);
    g.fillStyle(0x111827, 1);
    g.fillRect(8, 40, 12, 8);
    g.fillRect(44, 40, 12, 8);
    g.fillStyle(0x6b7280, 1);
    g.fillRect(10, 42, 8, 4);
    g.fillRect(46, 42, 8, 4);
    g.generateTexture("p2-train-side", 64, 48);

    // Cargo crate (elevated platform on train)
    g.clear();
    g.fillStyle(0x92400e, 1);
    g.fillRect(0, 0, 32, 24);
    g.fillStyle(0x78350f, 1);
    g.fillRect(0, 0, 32, 2);
    g.fillRect(0, 22, 32, 2);
    g.fillRect(0, 0, 2, 24);
    g.fillRect(30, 0, 2, 24);
    g.fillStyle(0xfbbf24, 0.4);
    g.fillRect(14, 0, 4, 24);
    g.fillRect(0, 10, 32, 4);
    g.generateTexture("p2-cargo", 32, 24);

    // Enemy (8-bit blocky)
    g.clear();
    g.fillStyle(0xef4444, 1);
    g.fillRect(4, 14, 28, 26);
    g.fillStyle(0xfca5a5, 1);
    g.fillRect(8, 0, 20, 16);
    g.fillStyle(0x7f1d1d, 1);
    g.fillRect(12, 6, 4, 4);
    g.fillRect(20, 6, 4, 4);
    g.fillStyle(0x991b1b, 1);
    g.fillRect(12, 12, 12, 2);
    g.fillStyle(0x0f172a, 1);
    g.fillRect(6, 40, 10, 12);
    g.fillRect(20, 40, 10, 12);
    g.generateTexture("p2-enemy-fallback", 36, 52);

    // Heart (HUD icon, blocky)
    g.clear();
    g.fillStyle(0xef4444, 1);
    g.fillRect(2, 0, 8, 8);
    g.fillRect(14, 0, 8, 8);
    g.fillRect(0, 4, 24, 8);
    g.fillRect(2, 12, 20, 4);
    g.fillRect(6, 16, 12, 4);
    g.fillRect(10, 20, 4, 2);
    g.generateTexture("p2-heart", 24, 22);

    // Muzzle flash (blocky)
    g.clear();
    g.fillStyle(0xfbbf24, 0.9);
    g.fillRect(2, 2, 16, 16);
    g.fillStyle(0xffffff, 0.6);
    g.fillRect(6, 6, 8, 8);
    g.generateTexture("p2-muzzle", 20, 20);

    // Background far (night sky with stars + mountains)
    g.clear();
    g.fillStyle(0x0f172a, 1);
    g.fillRect(0, 0, 256, 200);
    g.fillStyle(0xffffff, 0.5);
    for (let i = 0; i < 20; i += 1) {
      const sx = (i * 47 + 13) % 256;
      const sy = (i * 31 + 7) % 140;
      g.fillRect(sx, sy, 2, 2);
    }
    g.fillStyle(0x1e293b, 1);
    g.fillRect(0, 150, 50, 50);
    g.fillRect(40, 130, 60, 70);
    g.fillRect(110, 155, 40, 45);
    g.fillRect(160, 125, 50, 75);
    g.fillRect(220, 145, 36, 55);
    g.generateTexture("p2-bg-far", 256, 200);

    // Background mid (landscape with telegraph poles)
    g.clear();
    g.fillStyle(0x1a1a2e, 1);
    g.fillRect(0, 200, 256, 100);
    g.fillStyle(0x16213e, 1);
    g.fillRect(0, 180, 256, 20);
    g.fillStyle(0x4b5563, 1);
    g.fillRect(60, 100, 4, 200);
    g.fillRect(180, 100, 4, 200);
    g.fillRect(56, 100, 12, 4);
    g.fillRect(176, 100, 12, 4);
    g.fillStyle(0x374151, 0.4);
    g.fillRect(64, 102, 112, 1);
    g.generateTexture("p2-bg-mid", 256, 300);

    g.destroy();
  }
}
