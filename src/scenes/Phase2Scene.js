import { ensureBgMusic, stopBgMusic } from "../utils/audio.js";

// ═══════════════════════════════════════════════════════════
//  Phase 2 Configuration
// ═══════════════════════════════════════════════════════════
const GRAVITY = 900;
const PLAYER_SPEED = 300;
const PLAYER_JUMP = -520;
const COYOTE_MS = 85;
const JUMP_BUFFER_MS = 100;
const BULLET_SPEED = 750;
const FIRE_COOLDOWN_MS = 250;
const TARGET_DISTANCE = 8000;
const MAX_HP = 5;
const INVULN_MS = 1000;
const ENEMY_HP_DEFAULT = 2;
const ENEMY_SPEED = 80;
const GROUND_Y = 636;
const DEATH_Y = 800;
const SPAWN_AHEAD_PX = 1600;
const CLEANUP_BEHIND_PX = 1200;
const MAX_BULLETS = 15;
const MAX_ENEMIES = 20;
const PLAYER_START_X = 200;
const CAR_MIN_W = 250;
const CAR_MAX_W = 500;
const CAR_GAP_MIN = 40;
const CAR_GAP_MAX = 70;
const CARGO_CHANCE = 0.35;
const CARGO_HEIGHT = 50;
const ENEMY_ON_CAR_CHANCE = 0.4;
const ENEMY_ON_CARGO_CHANCE = 0.5;

export class Phase2Scene extends Phaser.Scene {
  constructor() {
    super("phase2");
  }

  // ── CREATE ────────────────────────────────────────────────

  create() {
    this.physics.world.gravity.y = GRAVITY;

    // State
    this.hp = MAX_HP;
    this.kills = 0;
    this.facing = 1;
    this.lastFireTime = 0;
    this.lastGroundedTime = 0;
    this.lastJumpPress = 0;
    this.invulnerableUntil = 0;
    this.gameState = "playing";
    this.lastGenX = 0;
    this.platformRefs = [];
    this.enemyDataMap = new Map();
    this.bgAutoScroll = 0;
    this.runFrame = 1;
    this.lastRunFrameSwap = 0;

    this.buildBackground();
    this.platforms = this.physics.add.staticGroup();
    this.buildPlayer();
    this.buildInput();
    this.bullets = this.physics.add.group({
      maxSize: MAX_BULLETS,
      allowGravity: false,
    });
    this.enemies = this.physics.add.group({ bounceY: 0 });
    this.buildCollisions();
    this.buildCamera();
    this.generateInitialWorld();
    this.buildHud();

    this.cameras.main.fadeIn(800, 0, 0, 0);
    ensureBgMusic(this);
  }

  buildBackground() {
    // Full-screen tileSprite background that auto-scrolls right-to-left
    this.bg = this.add
      .tileSprite(640, 360, 1280, 720, "p2-bg")
      .setScrollFactor(0)
      .setDepth(0);
  }

  buildPlayer() {
    this.player = this.physics.add.sprite(
      PLAYER_START_X,
      GROUND_Y - 60,
      "p2-player-idle",
    );
    this.player.setDepth(10);
    this.player.setBounce(0);
    this.player.setCollideWorldBounds(false);
    this.player.body.setSize(28, 48);
    this.player.body.setOffset(10, 8);
  }

  buildInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      r: Phaser.Input.Keyboard.KeyCodes.R,
      f: Phaser.Input.Keyboard.KeyCodes.F,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.input.on("pointerdown", () => {
      if (this.gameState === "playing") {
        this.tryShoot();
      }
    });
  }

  buildCollisions() {
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.overlap(
      this.bullets,
      this.enemies,
      (bullet, enemy) => this.hitEnemy(bullet, enemy),
    );

    this.physics.add.overlap(
      this.player,
      this.enemies,
      (_p, enemy) => this.playerHit(enemy),
    );
  }

  buildCamera() {
    this.cameras.main.startFollow(this.player, false, 0.08, 0.06, -150, 80);
    this.cameras.main.setDeadzone(80, 50);
  }

  generateInitialWorld() {
    // First car is large and safe (no enemies, no cargo)
    this.createTrainCar(0, 700);
    this.lastGenX = 700;

    while (this.lastGenX < PLAYER_START_X + SPAWN_AHEAD_PX) {
      this.generateNextSegment();
    }
  }

  buildHud() {
    const style = {
      fontFamily: "Trebuchet MS",
      fontSize: "22px",
      color: "#f8fafc",
      stroke: "#0b1114",
      strokeThickness: 4,
    };

    // HP card
    this.add
      .rectangle(120, 36, 220, 56, 0x0f172a, 0.86)
      .setStrokeStyle(2, 0x334155, 0.95)
      .setScrollFactor(0)
      .setDepth(90);

    // Kills card
    this.add
      .rectangle(120, 88, 220, 44, 0x0f172a, 0.86)
      .setStrokeStyle(2, 0x334155, 0.95)
      .setScrollFactor(0)
      .setDepth(90);

    // Distance progress bar background
    this.add
      .rectangle(640, 20, 500, 18, 0x0f172a, 0.86)
      .setStrokeStyle(1, 0x334155, 0.95)
      .setScrollFactor(0)
      .setDepth(90);

    // Distance bar fill
    this.distBar = this.add
      .rectangle(391, 20, 0, 12, 0x22c55e, 0.9)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(91);

    // Heart icons
    this.heartIcons = [];
    for (let i = 0; i < MAX_HP; i += 1) {
      const heart = this.add
        .image(30 + i * 30, 36, "p2-heart")
        .setScrollFactor(0)
        .setDepth(91)
        .setScale(1.1);
      this.heartIcons.push(heart);
    }

    this.killsText = this.add
      .text(30, 72, "Kills: 0", style)
      .setScrollFactor(0)
      .setDepth(91);

    this.distText = this.add
      .text(640, 40, "0%", { ...style, fontSize: "16px" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(91);

    // Controls hint
    this.add
      .text(640, 700, "A/D Move · W/Space Jump · Click/F Shoot", {
        ...style,
        fontSize: "16px",
        color: "#64748b",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(91);
  }

  // ── UPDATE ────────────────────────────────────────────────

  update(_time, _delta) {
    if (this.gameState === "dead") {
      if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
        this.scene.restart();
      }
      return;
    }

    if (this.gameState !== "playing") {
      return;
    }

    const now = this.time.now;
    this.updatePlayer(now);
    this.updateBullets();
    this.updateEnemies();
    this.updateWorldGeneration();
    this.updateCleanup();
    this.updateHud();
    this.updateParallax();
    this.checkWinLose();
  }

  updatePlayer(now) {
    const onGround =
      this.player.body.blocked.down || this.player.body.touching.down;

    if (onGround) {
      this.lastGroundedTime = now;
    }

    // Horizontal movement
    const moveLeft = this.cursors.left.isDown || this.keys.a.isDown;
    const moveRight = this.cursors.right.isDown || this.keys.d.isDown;

    if (moveLeft) {
      this.player.setVelocityX(-PLAYER_SPEED);
      this.facing = -1;
      this.player.setFlipX(true);
    } else if (moveRight) {
      this.player.setVelocityX(PLAYER_SPEED);
      this.facing = 1;
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    // Jump (coyote time + jump buffer)
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.w) ||
      Phaser.Input.Keyboard.JustDown(this.keys.space);

    if (jumpPressed) {
      this.lastJumpPress = now;
    }

    const inCoyote = now - this.lastGroundedTime < COYOTE_MS;
    const inBuffer = now - this.lastJumpPress < JUMP_BUFFER_MS;

    if (inCoyote && inBuffer) {
      this.player.setVelocityY(PLAYER_JUMP);
      this.lastGroundedTime = 0;
      this.lastJumpPress = 0;
    }

    // Shoot with F key
    if (Phaser.Input.Keyboard.JustDown(this.keys.f)) {
      this.tryShoot();
    }

    // Invulnerability flash
    if (now < this.invulnerableUntil) {
      this.player.alpha = Math.sin(now / 50) > 0 ? 0.4 : 1;
    } else {
      this.player.alpha = 1;
    }

    // ── Sprite animation ──
    if (!onGround) {
      // In the air → jump sprite
      this.player.setTexture("p2-player-jump");
    } else if (Math.abs(this.player.body.velocity.x) > 10) {
      // Running on ground → alternate run frames every 150ms
      if (now - this.lastRunFrameSwap > 150) {
        this.lastRunFrameSwap = now;
        this.runFrame = this.runFrame === 1 ? 2 : 1;
      }
      this.player.setTexture(
        this.runFrame === 1 ? "p2-player-run1" : "p2-player-run2",
      );
    } else {
      // Standing still on ground → idle sprite
      this.player.setTexture("p2-player-idle");
    }
  }

  tryShoot() {
    const now = this.time.now;
    if (now - this.lastFireTime < FIRE_COOLDOWN_MS) {
      return;
    }
    if (this.gameState !== "playing") {
      return;
    }

    this.lastFireTime = now;

    const offX = this.facing === 1 ? 22 : -22;
    const bx = this.player.x + offX;
    const by = this.player.y - 2;

    let bullet = this.bullets.get(bx, by, "p2-bullet");
    if (!bullet) {
      return;
    }

    bullet.setActive(true).setVisible(true);
    bullet.body.enable = true;
    bullet.setPosition(bx, by);
    bullet.setVelocityX(this.facing * BULLET_SPEED);
    bullet.setVelocityY(0);
    bullet.setDepth(8);
    bullet.setFlipX(this.facing === -1);

    // Muzzle flash
    const flash = this.add
      .image(bx, by, "p2-muzzle")
      .setAlpha(0.8)
      .setDepth(11)
      .setScale(0.8);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 70,
      onComplete: () => flash.destroy(),
    });
  }

  updateBullets() {
    this.bullets.children.each((b) => {
      if (!b.active) {
        return;
      }

      if (Math.abs(b.x - this.player.x) > 800) {
        b.setActive(false).setVisible(false);
        b.body.enable = false;
        this.bullets.killAndHide(b);
      }
    });
  }

  updateEnemies() {
    this.enemies.children.each((e) => {
      if (!e.active) {
        return;
      }

      const d = this.enemyDataMap.get(e);
      if (!d) {
        return;
      }

      // Patrol
      if (e.x <= d.patrolLeft) {
        d.dir = 1;
      } else if (e.x >= d.patrolRight) {
        d.dir = -1;
      }

      e.setVelocityX(d.dir * ENEMY_SPEED);
      e.setFlipX(d.dir === -1);
    });
  }

  updateParallax() {
    if (this.bg) {
      // Constant auto-scroll for train motion + camera parallax for depth
      this.bgAutoScroll += 1.5;
      this.bg.tilePositionX =
        this.cameras.main.scrollX * 0.15 + this.bgAutoScroll;
    }
  }

  // ── COMBAT ────────────────────────────────────────────────

  hitEnemy(bullet, enemy) {
    bullet.setActive(false).setVisible(false);
    bullet.body.enable = false;
    this.bullets.killAndHide(bullet);

    const d = this.enemyDataMap.get(enemy);
    if (!d) {
      return;
    }

    d.hp -= 1;

    // Hit flash
    enemy.setTintFill(0xffffff);
    this.time.delayedCall(60, () => {
      if (enemy.active) {
        enemy.clearTint();
      }
    });

    if (d.hp <= 0) {
      this.kills += 1;
      this.enemyDeathPop(enemy.x, enemy.y);
      this.enemyDataMap.delete(enemy);
      this.enemies.killAndHide(enemy);
      enemy.body.enable = false;
    }
  }

  enemyDeathPop(x, y) {
    for (let i = 0; i < 5; i += 1) {
      const dot = this.add
        .circle(
          x + Phaser.Math.Between(-8, 8),
          y + Phaser.Math.Between(-8, 8),
          Phaser.Math.Between(3, 6),
          0xef4444,
          1,
        )
        .setDepth(12);

      this.tweens.add({
        targets: dot,
        x: x + Phaser.Math.Between(-40, 40),
        y: y + Phaser.Math.Between(-50, -10),
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: Phaser.Math.Between(200, 350),
        ease: "Quad.out",
        onComplete: () => dot.destroy(),
      });
    }

    const pop = this.add
      .text(x, y - 16, "+1", {
        fontFamily: "Trebuchet MS",
        fontSize: "22px",
        color: "#fbbf24",
        stroke: "#0b1114",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(13);

    this.tweens.add({
      targets: pop,
      y: y - 50,
      alpha: 0,
      duration: 380,
      ease: "Quad.out",
      onComplete: () => pop.destroy(),
    });
  }

  playerHit(enemy) {
    const now = this.time.now;
    if (now < this.invulnerableUntil) {
      return;
    }

    this.hp -= 1;
    this.invulnerableUntil = now + INVULN_MS;
    this.cameras.main.shake(120, 0.008);
    this.cameras.main.flash(60, 255, 100, 100);

    // Knockback
    const kbDir = this.player.x < enemy.x ? -1 : 1;
    this.player.setVelocityX(kbDir * 250);
    this.player.setVelocityY(-200);

    if (this.hp <= 0) {
      this.die();
    }
  }

  // ── GENERATION & CLEANUP ──────────────────────────────────

  generateNextSegment() {
    // Gap between train cars (coupling gap)
    this.lastGenX += Phaser.Math.Between(CAR_GAP_MIN, CAR_GAP_MAX);

    const carWidth = Phaser.Math.Between(CAR_MIN_W, CAR_MAX_W);
    this.createTrainCar(this.lastGenX, carWidth);

    // Maybe place a cargo crate on top of the car
    if (Math.random() < CARGO_CHANCE) {
      const crateX = this.lastGenX + Phaser.Math.Between(
        Math.floor(carWidth * 0.15),
        Math.floor(carWidth * 0.5),
      );
      const crateW = Phaser.Math.Between(60, Math.min(140, Math.floor(carWidth * 0.4)));
      const maxRight = this.lastGenX + carWidth - 20;
      const clamped = Math.min(crateW, maxRight - crateX);

      if (clamped >= 50) {
        this.createPlatform(crateX, GROUND_Y - CARGO_HEIGHT, clamped, "p2-cargo");

        // Enemy on cargo crate
        if (
          Math.random() < ENEMY_ON_CARGO_CHANCE &&
          this.enemies.countActive(true) < MAX_ENEMIES
        ) {
          this.spawnEnemy(
            crateX + clamped / 2,
            GROUND_Y - CARGO_HEIGHT - 30,
            crateX,
            crateX + clamped,
          );
        }
      }
    }

    // Enemy patrolling on the car roof
    if (
      Math.random() < ENEMY_ON_CAR_CHANCE &&
      this.enemies.countActive(true) < MAX_ENEMIES
    ) {
      const ex = this.lastGenX + Phaser.Math.Between(30, Math.max(50, carWidth - 30));
      this.spawnEnemy(ex, GROUND_Y - 30, this.lastGenX, this.lastGenX + carWidth);
    }

    this.lastGenX += carWidth;
  }

  createTrainCar(x, width) {
    const TRAIN_DISPLAY_H = 200;

    // Invisible physics body at the roof level (player walks on this)
    const body = this.platforms.create(x + width / 2, GROUND_Y, "p2-platform");
    body.setDisplaySize(width, 24).refreshBody();
    body.setAlpha(0);
    this.platformRefs.push({ sprite: body, left: x, right: x + width });

    // Full train car image — top edge = roof, extends downward
    const visual = this.add
      .image(x + width / 2, GROUND_Y - 12, "p2-train-top")
      .setOrigin(0.5, 0)
      .setDisplaySize(width, TRAIN_DISPLAY_H)
      .setDepth(4);
    this.platformRefs.push({ sprite: visual, left: x, right: x + width });
  }

  createPlatform(x, y, width, texKey) {
    const plat = this.platforms.create(x + width / 2, y, texKey);
    plat.setDisplaySize(width, 24).refreshBody();
    plat.setDepth(5);
    this.platformRefs.push({ sprite: plat, left: x, right: x + width });
    return plat;
  }

  spawnEnemy(x, y, patrolL, patrolR) {
    const e = this.enemies.create(x, y, "p2-enemy");
    if (!e) {
      return;
    }

    e.setDepth(9).setBounce(0);
    e.body.setSize(28, 44, true);
    e.setCollideWorldBounds(false);
    e.setVelocityX(ENEMY_SPEED);
    this.enemyDataMap.set(e, {
      hp: ENEMY_HP_DEFAULT,
      patrolLeft: patrolL + 18,
      patrolRight: patrolR - 18,
      dir: 1,
    });
  }

  updateWorldGeneration() {
    while (this.lastGenX < this.player.x + SPAWN_AHEAD_PX) {
      this.generateNextSegment();
    }
  }

  updateCleanup() {
    const cx = this.player.x - CLEANUP_BEHIND_PX;

    for (let i = this.platformRefs.length - 1; i >= 0; i -= 1) {
      if (this.platformRefs[i].right < cx) {
        this.platformRefs[i].sprite.destroy();
        this.platformRefs.splice(i, 1);
      }
    }

    this.enemies.children.each((e) => {
      if (!e.active) {
        return;
      }

      if (e.x < cx || e.y > DEATH_Y) {
        this.enemyDataMap.delete(e);
        this.enemies.killAndHide(e);
        e.body.enable = false;
      }
    });
  }

  // ── HUD ───────────────────────────────────────────────────

  updateHud() {
    for (let i = 0; i < MAX_HP; i += 1) {
      this.heartIcons[i].setAlpha(i < this.hp ? 1 : 0.2);
    }

    this.killsText.setText(`Kills: ${this.kills}`);

    const dist = Math.max(0, this.player.x - PLAYER_START_X);
    const pct = Math.min(1, dist / TARGET_DISTANCE);
    this.distBar.width = Math.round(498 * pct);
    this.distText.setText(`${Math.round(pct * 100)}%`);
  }

  // ── WIN / LOSE ────────────────────────────────────────────

  checkWinLose() {
    if (this.player.y > DEATH_Y) {
      this.die();
      return;
    }

    if (this.player.x - PLAYER_START_X >= TARGET_DISTANCE) {
      this.winPhase2();
    }
  }

  die() {
    if (this.gameState !== "playing") {
      return;
    }

    this.gameState = "dead";
    this.player.body.enable = false;
    this.player.setTintFill(0xff0000);

    this.cameras.main.flash(200, 255, 50, 50);
    this.cameras.main.shake(300, 0.015);

    this.time.delayedCall(600, () => {
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.showDeathScreen();
      });
    });
  }

  showDeathScreen() {
    this.children.removeAll(true);

    const style = {
      fontFamily: "Trebuchet MS",
      color: "#f8fafc",
      stroke: "#020617",
      strokeThickness: 6,
    };

    this.add
      .rectangle(640, 360, 1280, 720, 0x000000, 1)
      .setScrollFactor(0)
      .setDepth(100);

    this.add
      .text(640, 260, "YOU DIED", {
        ...style,
        fontSize: "54px",
        color: "#fca5a5",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);

    this.add
      .text(640, 330, `Kills: ${this.kills}`, {
        ...style,
        fontSize: "28px",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);

    const retryBtn = this.add
      .rectangle(640, 440, 260, 70, 0x22c55e, 1)
      .setStrokeStyle(2, 0x14532d, 1)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(101);

    this.add
      .text(640, 440, "Retry", {
        ...style,
        fontSize: "32px",
        color: "#052e16",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(102);

    retryBtn.on("pointerdown", () => this.scene.restart());

    this.add
      .text(640, 520, "Press R to retry", {
        ...style,
        fontSize: "18px",
        color: "#64748b",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  winPhase2() {
    if (this.gameState !== "playing") {
      return;
    }

    this.gameState = "won";
    this.player.body.enable = false;
    stopBgMusic(this);

    this.cameras.main.fadeOut(1500, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("chapter3");
    });
  }
}
