import { stopBgMusic } from "../utils/audio.js";

// ═══════════════════════════════════════════════════════════
//  Phase 3 — First-Person Train Interior Combat
//  Layer order:
//    0: p3-bg          (base background)
//    2: window/door/hatch enemies (peek from edges)
//    3: p3-bg-lvl2     (frame overlay, masks enemy edges)
//    5: seat enemies   (pop up from behind seats)
//    6: p3-seat-left + p3-seat-right (cover seat enemies)
// ═══════════════════════════════════════════════════════════
const PLAYER_HP = 5;
const PLAYER_FIRE_COOLDOWN = 220;
const MAX_ACTIVE_ENEMIES = 4;
const MAX_ENEMY_BULLETS = 10;
const ENEMY_BULLET_SPEED = 420;
const ENEMY_ENTRY_DELAY = 400;

// Gun / dodge constants
const GUN_Y = 720;              // anchored to bottom of screen
const GUN_MIN_X = 200;          // left movement clamp
const GUN_MAX_X = 1080;         // right movement clamp
const GUN_FIRE_DURATION = 100;  // ms the fire texture shows
const DODGE_HIT_RADIUS = 80;    // how close a bullet must be to gun X to hit

const WAVE_CONFIG = [
  { total: 8, spawnMin: 1100, spawnMax: 1500, label: "WAVE 1" },
  { total: 10, spawnMin: 850, spawnMax: 1200, label: "WAVE 2" },
];

// ── Seat peek spots (enemies pop UP from behind seat tops) ──
const SEAT_SPOTS = [
  // Left seats
  { x: 220, y: 390, hideY: 500, side: "left", name: "left-seat-front" },
  { x: 310, y: 340, hideY: 430, side: "left", name: "left-seat-back" },
  // Right seats
  { x: 1060, y: 390, hideY: 500, side: "right", name: "right-seat-front" },
  { x: 970, y: 340, hideY: 430, side: "right", name: "right-seat-back" },
];

// ── Window/Door peek spots (enemies slide in from the side) ──
const SIDE_SPOTS = [
  // Left window — peeks from the LEFT edge
  { x: 155, y: 270, hideX: 50, dir: 1, side: "left", name: "left-window" },
  // Right window — peeks from the RIGHT edge
  { x: 1125, y: 270, hideX: 1230, dir: -1, side: "right", name: "right-window" },
  // Left door — peeks from the LEFT edge
  { x: 55, y: 380, hideX: -40, dir: 1, side: "left", name: "left-door" },
  // Right door — peeks from the RIGHT edge
  { x: 1225, y: 380, hideX: 1320, dir: -1, side: "right", name: "right-door" },
];

// ── Hatch spot (surprise — enemy drops upside-down from top) ──
const HATCH_SPOT = { x: 640, y: 120, hideY: 20, name: "hatch" };

// All normal spots combined for spawning
const ALL_SPOTS = [...SEAT_SPOTS, ...SIDE_SPOTS];

export class Phase3CombatScene extends Phaser.Scene {
  constructor() {
    super("phase3-combat");
  }

  // ── CREATE ────────────────────────────────────────────────

  create() {
    this.gameState = "playing";
    this.hp = PLAYER_HP;
    this.kills = 0;
    this.lastFireTime = 0;
    this.invulnerableUntil = 0;
    this.hatchUsed = false;

    // Wave state
    this.currentWave = 0;
    this.spawnedInWave = 0;
    this.killedInWave = 0;
    this.nextSpawnAt = 0;
    this.waveTransitioning = false;

    // Spot occupancy
    this.spotOccupancy = ALL_SPOTS.map(() => null);

    this.enemyDataMap = new Map();

    // Gunshot SFX
    this.gunshotSfx = new Audio("assets/audio/gun_shot_audio.mp3");
    this.gunshotSfx.volume = 0.5;

    // Background music — persists through ending and credits
    window.__creditsBgm = new Audio("assets/audio/SAINT MOTEL - A Good Song Never Dies by Pinocchio.mp3");
    window.__creditsBgm.loop = true;
    window.__creditsBgm.volume = 0.25;
    window.__creditsBgm.play().catch(() => {});

    this.buildLayers();
    this.buildEnemyPools();
    this.buildGun();
    this.buildCrosshair();
    this.buildUI();
    this.buildInput();

    this.cameras.main.fadeIn(800, 0, 0, 0);

    this.time.delayedCall(1200, () => {
      this.startWave(0);
    });
  }

  // ── LAYERED ENVIRONMENT ───────────────────────────────────

  buildLayers() {
    // Layer 0: Base background
    const bg = this.add.image(640, 360, "p3-bg").setDepth(0);
    bg.setDisplaySize(1280, 720);

    // Layer 3: Frame overlay (windows/doors/hatch frames with transparency)
    const lvl2 = this.add.image(640, 360, "p3-bg-lvl2").setDepth(3);
    lvl2.setDisplaySize(1280, 720);

    // Layer 6: Seat overlays (enemies hide behind these)
    this.seatLeft = this.add.image(320, 460, "p3-seat-left").setDepth(6);
    this.seatRight = this.add.image(960, 460, "p3-seat-right").setDepth(6);

    // Scale seats to fit the scene
    const seatScale = 0.9;
    this.seatLeft.setScale(seatScale);
    this.seatRight.setScale(seatScale);
  }

  // ── ENEMY POOLS ───────────────────────────────────────────

  buildEnemyPools() {
    this.enemies = this.physics.add.group({
      maxSize: MAX_ACTIVE_ENEMIES + 2,
      allowGravity: false,
    });

    this.enemyBullets = this.physics.add.group({
      maxSize: MAX_ENEMY_BULLETS,
      allowGravity: false,
    });
  }

  // ── GUN ────────────────────────────────────────────────────

  buildGun() {
    // Gun sprite: anchored to bottom-center, origin at bottom-center
    this.gun = this.add
      .image(640, GUN_Y, "p3-gun-idle")
      .setOrigin(0.5, 1)
      .setDepth(78)
      .setScale(0.45);

    // Track current gun X for dodge detection
    this.gunX = 640;
  }

  // ── CROSSHAIR ─────────────────────────────────────────────

  buildCrosshair() {
    this.crosshair = this.add
      .image(640, 360, "p3-crosshair")
      .setDepth(85)
      .setScale(1.5);

    this.input.setDefaultCursor("none");
  }

  // ── UI ────────────────────────────────────────────────────

  buildUI() {
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
      .setDepth(90);

    this.heartIcons = [];
    for (let i = 0; i < PLAYER_HP; i += 1) {
      const heart = this.add
        .image(30 + i * 30, 36, "p2-heart")
        .setDepth(91)
        .setScale(1.1);
      this.heartIcons.push(heart);
    }

    // Kills
    this.add
      .rectangle(120, 88, 220, 44, 0x0f172a, 0.86)
      .setStrokeStyle(2, 0x334155, 0.95)
      .setDepth(90);
    this.killsText = this.add.text(30, 72, "Kills: 0", style).setDepth(91);

    // Wave label
    this.waveText = this.add
      .text(640, 50, "", {
        ...style,
        fontSize: "36px",
        color: "#fbbf24",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(91)
      .setAlpha(0);

    // Enemy count
    this.enemyCountText = this.add
      .text(1200, 36, "", {
        ...style,
        fontSize: "18px",
        color: "#94a3b8",
      })
      .setOrigin(1, 0.5)
      .setDepth(91);

    // Controls
    this.add
      .text(640, 700, "Aim & Shoot: Mouse", {
        ...style,
        fontSize: "16px",
        color: "#64748b",
      })
      .setOrigin(0.5)
      .setDepth(91);

    // Hit flash overlay
    this.hitOverlay = this.add
      .rectangle(640, 360, 1280, 720, 0xff0000, 0)
      .setDepth(80);
  }

  // ── INPUT ─────────────────────────────────────────────────

  buildInput() {
    this.input.on("pointermove", (pointer) => {
      this.crosshair.setPosition(pointer.x, pointer.y);

      // Move gun left/right following the mouse (clamped)
      this.gunX = Phaser.Math.Clamp(pointer.x, GUN_MIN_X, GUN_MAX_X);
      this.gun.x = this.gunX;
    });

    this.input.on("pointerdown", (pointer) => {
      if (this.gameState === "playing") {
        this.tryPlayerShoot(pointer.x, pointer.y);
      }
    });

    this.keys = this.input.keyboard.addKeys({
      r: Phaser.Input.Keyboard.KeyCodes.R,
    });
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
    this.updateSpawning(now);
    this.updateEnemies(now);
    this.updateBullets();
    this.updateEnemyBulletHits();
    this.updateUI();
    this.checkWinLose();
  }

  // ── WAVE MANAGEMENT ───────────────────────────────────────

  startWave(index) {
    this.currentWave = index;
    this.spawnedInWave = 0;
    this.killedInWave = 0;
    this.waveTransitioning = false;
    this.nextSpawnAt = this.time.now + 800;

    const config = WAVE_CONFIG[index];
    this.waveText.setText(config.label);
    this.waveText.setAlpha(0);
    this.tweens.add({
      targets: this.waveText,
      alpha: 1,
      duration: 400,
      yoyo: true,
      hold: 1200,
      ease: "Sine.easeInOut",
    });

    // Hatch surprise during wave 2
    if (index === 1 && !this.hatchUsed) {
      this.time.delayedCall(Phaser.Math.Between(4000, 6000), () => {
        if (this.gameState === "playing") {
          this.spawnHatchEnemy();
        }
      });
    }
  }

  updateSpawning(now) {
    if (this.waveTransitioning) {
      return;
    }

    const config = WAVE_CONFIG[this.currentWave];
    if (!config) {
      return;
    }

    if (this.killedInWave >= config.total && this.spawnedInWave >= config.total) {
      if (this.currentWave < WAVE_CONFIG.length - 1) {
        this.waveTransitioning = true;
        this.time.delayedCall(1500, () => {
          this.startWave(this.currentWave + 1);
        });
      }
      return;
    }

    if (
      now >= this.nextSpawnAt &&
      this.spawnedInWave < config.total &&
      this.enemies.countActive(true) < MAX_ACTIVE_ENEMIES
    ) {
      this.spawnEnemy();
      this.spawnedInWave += 1;
      this.nextSpawnAt = now + Phaser.Math.Between(config.spawnMin, config.spawnMax);
    }
  }

  // ── SPAWNING ──────────────────────────────────────────────

  spawnEnemy() {
    const spotIndex = this.getFreeSpot();
    if (spotIndex === -1) {
      return;
    }

    const spot = ALL_SPOTS[spotIndex];

    // Is this a seat spot or a side (window/door) spot?
    const isSeat = spotIndex < SEAT_SPOTS.length;

    // Pick the correct enemy texture based on side
    const texKey = spot.side === "right" ? "p3-enemy-right" : "p3-enemy-left";

    let enemy = this.enemies.get(0, 0, texKey);
    if (!enemy) {
      enemy = this.physics.add.image(0, 0, texKey);
      this.enemies.add(enemy);
    }

    enemy.setActive(true).setVisible(true);
    enemy.body.enable = true;

    // Depth: seat enemies at 5 (behind seats at 6), side enemies at 2 (behind lvl2 at 3)
    enemy.setDepth(isSeat ? 5 : 2);

    // Scale: farther = smaller
    const depthScale = spot.y < 320 ? 0.5 : spot.y < 400 ? 0.6 : 0.7;
    enemy.setScale(depthScale);

    // No flip needed — we have separate left/right textures
    enemy.setFlipX(false);
    enemy.setFlipY(false);

    this.spotOccupancy[spotIndex] = enemy;

    this.enemyDataMap.set(enemy, {
      hp: 1,
      spotIndex: spotIndex,
      canShoot: false,
      nextShootAt: 0,
      isSeat: isSeat,
      type: "normal",
    });

    if (isSeat) {
      // SEAT: start hidden below, pop UP
      enemy.setPosition(spot.x, spot.hideY);
      enemy.setAlpha(1);

      this.tweens.add({
        targets: enemy,
        y: spot.y,
        duration: 350,
        ease: "Quad.out",
        onComplete: () => this.enableEnemyShooting(enemy),
      });
    } else {
      // SIDE (window/door): start hidden off-screen, slide IN
      enemy.setPosition(spot.hideX, spot.y);
      enemy.setAlpha(1);

      this.tweens.add({
        targets: enemy,
        x: spot.x,
        duration: 400,
        ease: "Quad.out",
        onComplete: () => this.enableEnemyShooting(enemy),
      });
    }
  }

  spawnHatchEnemy() {
    if (this.hatchUsed) {
      return;
    }
    this.hatchUsed = true;

    const spot = HATCH_SPOT;

    let enemy = this.enemies.get(spot.x, spot.hideY, "p3-enemy-left");
    if (!enemy) {
      enemy = this.physics.add.image(spot.x, spot.hideY, "p3-enemy-left");
      this.enemies.add(enemy);
    }

    enemy.setActive(true).setVisible(true);
    enemy.body.enable = true;
    enemy.setPosition(spot.x, spot.hideY);
    enemy.setDepth(2);
    enemy.setScale(0.5);
    enemy.setAlpha(1);

    // Upside down!
    enemy.setFlipY(true);
    enemy.setFlipX(false);

    this.enemyDataMap.set(enemy, {
      hp: 1,
      spotIndex: -1,
      canShoot: false,
      nextShootAt: 0,
      isSeat: false,
      type: "hatch",
    });

    // Drop down from the hatch — no telegraph, surprise!
    this.tweens.add({
      targets: enemy,
      y: spot.y,
      duration: 300,
      ease: "Back.out",
      onComplete: () => {
        this.cameras.main.shake(200, 0.008);
        this.enableEnemyShooting(enemy);
      },
    });
  }

  enableEnemyShooting(enemy) {
    this.time.delayedCall(ENEMY_ENTRY_DELAY, () => {
      const data = this.enemyDataMap.get(enemy);
      if (data && enemy.active) {
        data.canShoot = true;
        data.nextShootAt = this.time.now + Phaser.Math.Between(300, 700);
      }
    });
  }

  getFreeSpot() {
    const freeIndices = [];
    for (let i = 0; i < this.spotOccupancy.length; i += 1) {
      if (this.spotOccupancy[i] === null) {
        freeIndices.push(i);
      }
    }
    if (freeIndices.length === 0) {
      return -1;
    }
    return Phaser.Utils.Array.GetRandom(freeIndices);
  }

  // ── ENEMY UPDATE ──────────────────────────────────────────

  updateEnemies(now) {
    this.enemies.children.each((enemy) => {
      if (!enemy.active) {
        return;
      }
      const data = this.enemyDataMap.get(enemy);
      if (!data || !data.canShoot) {
        return;
      }
      if (now >= data.nextShootAt) {
        this.enemyShoot(enemy);
        data.nextShootAt = now + Phaser.Math.Between(1200, 1800);
      }
    });
  }

  enemyShoot(enemy) {
    // Shoot toward the gun's current position (player can dodge!)
    const targetX = this.gunX + Phaser.Math.Between(-40, 40);
    const targetY = GUN_Y;
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, targetX, targetY);

    let bullet = this.enemyBullets.get(enemy.x, enemy.y, "p3-bullet-enemy");
    if (!bullet) {
      bullet = this.physics.add.image(enemy.x, enemy.y, "p3-bullet-enemy");
      this.enemyBullets.add(bullet);
    }

    bullet.setActive(true).setVisible(true);
    bullet.body.enable = true;
    bullet.setPosition(enemy.x, enemy.y);
    bullet.setDepth(7);
    bullet.setRotation(angle + Math.PI / 2);
    bullet.setScale(0.05);
    bullet.setVelocity(
      Math.cos(angle) * ENEMY_BULLET_SPEED,
      Math.sin(angle) * ENEMY_BULLET_SPEED,
    );

    // Muzzle flash
    enemy.setTintFill(0xffffff);
    this.time.delayedCall(50, () => {
      if (enemy.active) {
        enemy.clearTint();
      }
    });

    // Enemy gunshot sound (lower volume)
    const enemySfx = this.gunshotSfx.cloneNode();
    enemySfx.volume = 0.2;
    enemySfx.play().catch(() => {});
  }

  // ── PLAYER SHOOTING ───────────────────────────────────────

  tryPlayerShoot(targetX, targetY) {
    const now = this.time.now;
    if (now - this.lastFireTime < PLAYER_FIRE_COOLDOWN) {
      return;
    }
    this.lastFireTime = now;

    // Hitscan: find closest enemy to click
    let hitEnemy = null;
    let closestDist = Infinity;

    this.enemies.children.each((enemy) => {
      if (!enemy.active) {
        return;
      }
      // Use displayed bounds for accurate hit detection
      const hw = (enemy.width * enemy.scaleX) / 2;
      const hh = (enemy.height * enemy.scaleY) / 2;
      if (
        targetX >= enemy.x - hw && targetX <= enemy.x + hw &&
        targetY >= enemy.y - hh && targetY <= enemy.y + hh
      ) {
        const dist = Phaser.Math.Distance.Between(targetX, targetY, enemy.x, enemy.y);
        if (dist < closestDist) {
          closestDist = dist;
          hitEnemy = enemy;
        }
      }
    });

    // ── Gun fire animation ──
    this.gun.setTexture("p3-gun-fire");
    this.time.delayedCall(GUN_FIRE_DURATION, () => {
      if (this.gun && this.gun.active) {
        this.gun.setTexture("p3-gun-idle");
      }
    });

    // Player gunshot sound
    const shotSfx = this.gunshotSfx.cloneNode();
    shotSfx.volume = 0.5;
    shotSfx.play().catch(() => {});

    // Gun recoil kick
    const gunBaseY = GUN_Y;
    this.tweens.add({
      targets: this.gun,
      y: gunBaseY + 8,
      duration: 50,
      yoyo: true,
      ease: "Quad.out",
    });

    // Muzzle flash at click
    const flash = this.add.circle(targetX, targetY, 8, 0xfbbf24, 0.7).setDepth(55);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2.5,
      scaleY: 2.5,
      duration: 80,
      onComplete: () => flash.destroy(),
    });

    // Impact dot
    const impact = this.add.circle(targetX, targetY, 3, 0xffffff, 0.9).setDepth(54);
    this.tweens.add({
      targets: impact,
      alpha: 0,
      duration: 200,
      onComplete: () => impact.destroy(),
    });

    // Light camera recoil
    this.cameras.main.shake(40, 0.002);

    if (hitEnemy) {
      this.hitEnemy(hitEnemy);
    }
  }

  // ── COMBAT HITS ───────────────────────────────────────────

  hitEnemy(enemy) {
    const data = this.enemyDataMap.get(enemy);
    if (!data) {
      return;
    }

    data.hp -= 1;
    data.canShoot = false;

    enemy.setTintFill(0xffffff);
    this.time.delayedCall(60, () => {
      if (enemy.active) {
        enemy.clearTint();
      }
    });

    if (data.hp <= 0) {
      this.kills += 1;
      this.killedInWave += 1;

      // Free spot
      if (data.spotIndex >= 0) {
        this.spotOccupancy[data.spotIndex] = null;
      }

      this.enemyDeathPop(enemy.x, enemy.y);

      // Animate retreat back to hiding position
      this.tweens.killTweensOf(enemy);

      if (data.type === "hatch") {
        // Slide back up
        this.tweens.add({
          targets: enemy,
          y: HATCH_SPOT.hideY,
          alpha: 0,
          duration: 300,
          ease: "Quad.in",
          onComplete: () => this.cleanupEnemy(enemy),
        });
      } else if (data.isSeat) {
        // Slide back down behind seat
        const spot = ALL_SPOTS[data.spotIndex];
        this.tweens.add({
          targets: enemy,
          y: spot.hideY,
          alpha: 0,
          duration: 300,
          ease: "Quad.in",
          onComplete: () => this.cleanupEnemy(enemy),
        });
      } else {
        // Slide back off-screen sideways
        const spot = ALL_SPOTS[data.spotIndex];
        this.tweens.add({
          targets: enemy,
          x: spot.hideX,
          alpha: 0,
          duration: 350,
          ease: "Quad.in",
          onComplete: () => this.cleanupEnemy(enemy),
        });
      }
    }
  }

  cleanupEnemy(enemy) {
    this.enemyDataMap.delete(enemy);
    this.enemies.killAndHide(enemy);
    enemy.body.enable = false;
  }

  playerHit() {
    const now = this.time.now;
    if (now < this.invulnerableUntil) {
      return;
    }

    this.hp -= 1;
    this.invulnerableUntil = now + 800;

    this.hitOverlay.fillAlpha = 0.3;
    this.tweens.add({
      targets: this.hitOverlay,
      fillAlpha: 0,
      duration: 300,
      ease: "Quad.out",
    });

    this.cameras.main.shake(150, 0.01);

    if (this.hp <= 0) {
      this.die();
    }
  }

  enemyDeathPop(x, y) {
    for (let i = 0; i < 5; i += 1) {
      const dot = this.add
        .circle(
          x + Phaser.Math.Between(-8, 8),
          y + Phaser.Math.Between(-8, 8),
          Phaser.Math.Between(3, 6),
          0xef4444, 1,
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

  // ── BULLET UPDATES ────────────────────────────────────────

  updateBullets() {
    this.enemyBullets.children.each((b) => {
      if (!b.active) {
        return;
      }
      if (b.x < -20 || b.x > 1300 || b.y < -20 || b.y > 740) {
        b.setActive(false).setVisible(false);
        b.body.enable = false;
      }
    });
  }

  updateEnemyBulletHits() {
    const now = this.time.now;
    if (now < this.invulnerableUntil) {
      return;
    }

    this.enemyBullets.children.each((b) => {
      if (!b.active) {
        return;
      }
      // Bullet must reach the bottom AND be near the gun's X to hit (dodge mechanic)
      if (b.y > 580) {
        const distToGun = Math.abs(b.x - this.gunX);
        if (distToGun < DODGE_HIT_RADIUS) {
          b.setActive(false).setVisible(false);
          b.body.enable = false;
          this.playerHit();
        } else {
          // Missed! Bullet passes by harmlessly
          b.setActive(false).setVisible(false);
          b.body.enable = false;
        }
      }
    });
  }

  // ── UI UPDATE ─────────────────────────────────────────────

  updateUI() {
    for (let i = 0; i < PLAYER_HP; i += 1) {
      this.heartIcons[i].setAlpha(i < this.hp ? 1 : 0.2);
    }
    this.killsText.setText(`Kills: ${this.kills}`);

    const config = WAVE_CONFIG[this.currentWave];
    if (config) {
      const remaining = config.total - this.killedInWave;
      this.enemyCountText.setText(`Enemies: ${remaining > 0 ? remaining : 0}`);
    }
  }

  // ── WIN / LOSE ────────────────────────────────────────────

  checkWinLose() {
    const lastWave = WAVE_CONFIG[WAVE_CONFIG.length - 1];
    if (
      this.currentWave === WAVE_CONFIG.length - 1 &&
      this.killedInWave >= lastWave.total &&
      this.spawnedInWave >= lastWave.total &&
      this.enemies.countActive(true) === 0
    ) {
      this.winPhase3();
    }
  }

  die() {
    if (this.gameState !== "playing") {
      return;
    }
    this.gameState = "dead";
    this.input.setDefaultCursor("default");

    this.hitOverlay.fillAlpha = 0.5;
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

    this.add.rectangle(640, 360, 1280, 720, 0x000000, 1).setDepth(100);

    this.add
      .text(640, 260, "YOU DIED", { ...style, fontSize: "54px", color: "#fca5a5" })
      .setOrigin(0.5).setDepth(101);

    this.add
      .text(640, 330, `Kills: ${this.kills}`, { ...style, fontSize: "28px" })
      .setOrigin(0.5).setDepth(101);

    const retryBtn = this.add
      .rectangle(640, 440, 260, 70, 0x22c55e, 1)
      .setStrokeStyle(2, 0x14532d, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(101);

    this.add
      .text(640, 440, "Retry", { ...style, fontSize: "32px", color: "#052e16" })
      .setOrigin(0.5).setDepth(102);

    retryBtn.on("pointerdown", () => this.scene.restart());

    this.add
      .text(640, 520, "Press R to retry", { ...style, fontSize: "18px", color: "#64748b" })
      .setOrigin(0.5).setDepth(101);

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  winPhase3() {
    if (this.gameState !== "playing") {
      return;
    }
    this.gameState = "won";
    stopBgMusic(this);
    this.input.setDefaultCursor("default");

    const victoryText = this.add
      .text(640, 300, "TRAIN CLEARED!", {
        fontFamily: "Trebuchet MS",
        fontSize: "54px",
        color: "#86efac",
        stroke: "#020617",
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setDepth(70)
      .setAlpha(0);

    this.tweens.add({
      targets: victoryText,
      alpha: 1,
      duration: 800,
      ease: "Sine.easeIn",
    });

    this.time.delayedCall(2500, () => {
      this.cameras.main.fadeOut(1500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("chapter3-ending");
      });
    });
  }
}
