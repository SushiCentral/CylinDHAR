import { ensureBgMusic, stopBgMusic } from "../utils/audio.js";

const ROAD_CENTER_X = 640;
const ROAD_RENDER_WIDTH = 900;
const ROAD_DRIVE_WIDTH = 700;
const ROAD_SCROLL_HEIGHT = 940;
const LANE_COUNT = 5;
const LANE_ALIGNMENT_OFFSET = 0;
const SPEED_MULTIPLIER = 2;
const PLAYER_BASE_SPEED = 580 * SPEED_MULTIPLIER;
const PLAYER_ACCEL = 2400 * SPEED_MULTIPLIER;
const PLAYER_DRAG = 3200 * SPEED_MULTIPLIER;
const PLAYER_Y = 620;
const PLAYER_HALF_WIDTH = 30;
const TARGET_CYLINDERS_TO_WIN = 10;
const DISTRACTION_MAX = 100;
const CYLINDER_SPAWN_MIN_MS = 3500;
const CYLINDER_SPAWN_MAX_MS = 6200;
const CYLINDER_SPEED_MIN = 180 * SPEED_MULTIPLIER;
const CYLINDER_SPEED_MAX = 260 * SPEED_MULTIPLIER;
const OBSTACLE_SPAWN_LANE_CLEAR_Y = 280;
const CYLINDER_SPAWN_LANE_CLEAR_Y = 340;
const CYLINDER_OVERLAP_CULL_GAP = 84;
const FIRST_HIT_IMAGE_OFFSET_X = 84;
const FIRST_HIT_IMAGE_SPEED_MIN = 260 * SPEED_MULTIPLIER;
const FIRST_HIT_IMAGE_SPEED_MAX = 340 * SPEED_MULTIPLIER;
const HIT_INVULNERABLE_MS = 1200;

const MEME_EVENTS = [
  { text: "jogender is calling", icon: "icon-chat", kind: "shake" },
  { text: "1% battery", icon: "icon-battery", kind: "freeze" },
  { text: "rear end mein itching", icon: "icon-reel", kind: "reverse" },
  { text: "ammi jaan calling... again", icon: "icon-chat", kind: "shake" },
  { text: "huzz dms", icon: "icon-battery", kind: "blur" },
  { text: "Friend sent a Bihari reel", icon: "icon-reel", kind: "reel" },
];

export class GameScene extends Phaser.Scene {
  constructor() {
    super("game");
  }

  create() {
    ensureBgMusic(this);

    this.initState();
    this.buildWorld();
    this.buildPlayer();
    this.buildInput();
    this.buildObstacles();
    this.buildCollectibles();
    this.buildUi();
    this.buildDistractionSystem();
    this.setupDifficultyTimers();
  }

  initState() {
    this.gameState = "playing";
    this.startTime = this.time.now;
    this.survivalTimeMs = 0;

    this.playerSpeedX = 0;
    this.controlsReversedUntil = 0;
    this.controlsFrozenUntil = 0;

    this.currentSpawnDelay = 1100;
    this.minSpawnDelay = 470;
    this.obstacleBaseSpeed = 220 * SPEED_MULTIPLIER;
    this.obstacleSpeedCap = 430 * SPEED_MULTIPLIER;
    this.difficultyLevel = 1;
    this.maxObstacleCount = 16;

    this.distractionMeter = 0;
    this.nextDistractionAt = this.time.now + Phaser.Math.Between(3500, 6500);
    this.popupHideAt = 0;
    this.blurUntil = 0;
    this.freezeOverlayUntil = 0;
    this.neonBurstUntil = 0;
    this.reelCooldownUntil = 0;
    this.neonPulseAccumulator = 0;

    this.gasCylindersCollected = 0;
    this.nextCylinderSpawnAt = this.time.now + Phaser.Math.Between(CYLINDER_SPAWN_MIN_MS, CYLINDER_SPAWN_MAX_MS);
    this.maxCylinderCount = 4;

    this.hasShownFirstHitImage = false;
    this.maxLives = 2;
    this.livesRemaining = 2;
    this.invulnerableUntil = 0;

    this.cylinderSfx = new Audio("assets/audio/cylinder.mp3");
    this.cylinderSfx.volume = 0.6;

    this.collisionSfx = new Audio("assets/audio/collision.mp3");
    this.collisionSfx.volume = 0.7;

    this.firstDeathSfx = new Audio("assets/audio/1st_death.mp3");
    this.firstDeathSfx.volume = 1.0;
  }

  buildWorld() {
    this.skyBg = this.add.image(640, 360, "sky-bg").setDepth(0);
    this.roadWidth = ROAD_RENDER_WIDTH;
    this.roadSegmentHeight = ROAD_SCROLL_HEIGHT;
    this.roadSegments = [];

    for (let i = 0; i < 2; i += 1) {
      const segment = this.add.image(ROAD_CENTER_X, 360 - i * this.roadSegmentHeight, "road-tile").setDepth(1);
      segment.setDisplaySize(this.roadWidth, this.roadSegmentHeight);
      this.roadSegments.push(segment);
    }

    this.driveLeft = ROAD_CENTER_X - ROAD_DRIVE_WIDTH / 2;
    this.driveRight = ROAD_CENTER_X + ROAD_DRIVE_WIDTH / 2;
    this.laneWidth = ROAD_DRIVE_WIDTH / LANE_COUNT;
    this.lanes = [];
    for (let i = 0; i < LANE_COUNT; i += 1) {
      this.lanes.push(this.driveLeft + this.laneWidth * (i + 0.5) + LANE_ALIGNMENT_OFFSET);
    }

    this.roadEdgeLeft = this.add.rectangle(this.driveLeft, 360, 12, 740, 0xe2e8f0, 0.7).setDepth(2);
    this.roadEdgeRight = this.add.rectangle(this.driveRight, 360, 12, 740, 0xe2e8f0, 0.7).setDepth(2);


    this.blurOverlay = this.add
      .image(640, 360, "blur-overlay")
      .setAlpha(0)
      .setDepth(30)
      .setVisible(false);

    this.neonOverlay = this.add
      .image(640, 360, "neon-overlay")
      .setAlpha(0)
      .setDepth(29)
      .setVisible(false);

    this.freezeOverlay = this.add
      .rectangle(640, 360, 1280, 720, 0x9ca3af, 0)
      .setDepth(31)
      .setVisible(false);
  }

  buildPlayer() {
    this.playerShadow = this.add.image(640, PLAYER_Y + 48, "shadow").setDepth(8).setAlpha(0.34);
    this.player = this.physics.add.image(ROAD_CENTER_X, PLAYER_Y, "player-car");
    this.player.setScale(0.85);
    this.player.setImmovable(true);
    this.player.body.setAllowGravity(false);
    this.player.body.setSize(90, this.player.displayHeight, true);
    this.player.setDepth(10);
  }

  buildInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      r: Phaser.Input.Keyboard.KeyCodes.R,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
    });
  }

  buildObstacles() {
    this.obstacles = this.physics.add.group({
      immovable: true,
      allowGravity: false,
      maxSize: this.maxObstacleCount,
    });

    this.lastSpawnX = -999;

    this.spawnEvent = this.time.addEvent({
      delay: this.currentSpawnDelay,
      loop: true,
      callback: () => {
        if (this.gameState !== "playing") {
          return;
        }
        if (this.obstacles.countActive(true) >= this.maxObstacleCount) {
          return;
        }
        this.spawnObstacle();
      },
    });

    this.physics.add.overlap(this.player, this.obstacles, (_player, obstacle) => {
      this.handleObstacleCollision(obstacle);
    });
  }

  buildCollectibles() {
    this.gasCylinders = this.physics.add.group({
      immovable: true,
      allowGravity: false,
      maxSize: this.maxCylinderCount,
    });

    this.physics.add.overlap(this.player, this.gasCylinders, (_player, cylinder) => {
      this.collectCylinder(cylinder);
    });
  }

  buildUi() {
    const uiStyle = {
      fontFamily: "Trebuchet MS",
      color: "#f8fafc",
      stroke: "#0b1114",
      strokeThickness: 5,
    };

    this.timeText = this.add
      .text(26, 20, "Time: 0.0", { ...uiStyle, fontSize: "34px" })
      .setDepth(50);

    this.timeCard = this.add
      .rectangle(150, 60, 248, 92, 0x0f172a, 0.86)
      .setStrokeStyle(2, 0x334155, 0.95)
      .setDepth(49)
      .setOrigin(0.5);
    this.timeText.setDepth(50);

    this.goalText = this.add
      .text(26, 60, `Collect ${TARGET_CYLINDERS_TO_WIN} cylinders`, { ...uiStyle, fontSize: "20px" })
      .setDepth(50);

    this.controlsText = this.add
      .text(26, 92, "Move: A/D or <- ->", {
        ...uiStyle,
        fontSize: "18px",
        color: "#cbd5e1",
        strokeThickness: 4,
      })
      .setDepth(50);

    this.cylinderCard = this.add
      .rectangle(1040, 44, 280, 72, 0x0f172a, 0.86)
      .setStrokeStyle(2, 0x334155, 0.95)
      .setDepth(49);
    this.cylinderIcon = this.add.image(930, 44, "gas-cylinder").setDepth(51).setScale(0.44);
    this.cylinderText = this.add
      .text(968, 28, "Cylinders: 0", {
        ...uiStyle,
        fontSize: "24px",
        color: "#bbf7d0",
        strokeThickness: 5,
      })
      .setDepth(51);

    this.livesCard = this.add
      .rectangle(150, 128, 248, 62, 0x0f172a, 0.86)
      .setStrokeStyle(2, 0x334155, 0.95)
      .setDepth(49)
      .setOrigin(0.5);
    this.livesText = this.add
      .text(38, 112, "Lives: 2", {
        ...uiStyle,
        fontSize: "24px",
        color: "#fecaca",
        strokeThickness: 5,
      })
      .setDepth(51);

    this.popupPanel = this.add
      .rectangle(640, 110, 500, 86, 0x0f172a, 0.94)
      .setStrokeStyle(2, 0x22d3ee, 0.9)
      .setDepth(60)
      .setVisible(false);

    this.popupIcon = this.add.image(430, 110, "icon-chat").setScale(0.52).setDepth(61).setVisible(false);

    this.popupText = this.add
      .text(680, 110, "", {
        ...uiStyle,
        fontSize: "28px",
        color: "#fef08a",
        strokeThickness: 6,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(61)
      .setVisible(false);

    this.lastLifeAlertText = this.add
      .text(640, 180, "LAST LIFE", {
        ...uiStyle,
        fontSize: "48px",
        color: "#fb7185",
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setDepth(66)
      .setAlpha(0)
      .setVisible(false);

    // Red warning banner (top of screen)
    this.warningBanner = this.add
      .rectangle(640, -40, 460, 38, 0x7f1d1d, 0.82)
      .setStrokeStyle(1, 0xfca5a5, 0.6)
      .setDepth(70)
      .setVisible(false);
    this.warningText = this.add
      .text(640, -40, "", {
        ...uiStyle,
        fontSize: "18px",
        color: "#fecaca",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(71)
      .setVisible(false);
    this.warningHideAt = 0;

    this.lastUiTimeText = "Time: 0.0";
    this.lastControlsState = "normal";
    this.lastCylinderText = "Cylinders: 0";
    this.lastLivesText = "Lives: 2";
  }

  buildDistractionSystem() {
    this.ping = this.cache.audio.exists("ping") ? this.sound.add("ping", { volume: 0.35 }) : null;
    this.crashSound = this.cache.audio.exists("crash") ? this.sound.add("crash", { volume: 0.42 }) : null;
    this.lastLifeSfx = this.cache.audio.exists("last-life-alert")
      ? this.sound.add("last-life-alert", { volume: 0.45 })
      : null;
  }

  setupDifficultyTimers() {
    this.time.addEvent({
      delay: 10_000,
      loop: true,
      callback: () => {
        if (this.gameState !== "playing") {
          return;
        }

        this.difficultyLevel += 1;
        this.currentSpawnDelay = Math.max(this.minSpawnDelay, this.currentSpawnDelay - 90);
        this.obstacleBaseSpeed = Math.min(this.obstacleSpeedCap, this.obstacleBaseSpeed + 24);

        this.spawnEvent.delay = this.currentSpawnDelay;
      },
    });
  }

  update(_time, delta) {
    if (this.gameState === "ending_sequence") {
      this.updateRoad(delta);
      this.updateEndingSequence(delta);
      return;
    }

    if (this.gameState !== "playing") {
      if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
        this.scene.restart();
      }
      return;
    }

    const now = this.time.now;

    this.survivalTimeMs = now - this.startTime;
    this.updateRoad(delta);
    this.updatePlayerMovement(delta, now);
    this.updateObstacles();
    this.updateCollectibles(now);
    this.updateDistractions(now, delta);
    this.updateUi(now);

    // Debug shortcut: press 2 to get 9 cylinders instantly
    if (Phaser.Input.Keyboard.JustDown(this.keys.two) && this.gasCylindersCollected < 9) {
      this.gasCylindersCollected = 9;
    }

    if (this.gasCylindersCollected >= TARGET_CYLINDERS_TO_WIN) {
      this.win();
      return;
    }

    if (this.distractionMeter >= DISTRACTION_MAX) {
      this.lose("distracted");
    }
  }

  updateRoad(delta) {
    const normalized = Phaser.Math.Clamp(
      (this.obstacleBaseSpeed - 220 * SPEED_MULTIPLIER) / (210 * SPEED_MULTIPLIER),
      0,
      1,
    );
    const scrollSpeed = 210 * SPEED_MULTIPLIER + normalized * (130 * SPEED_MULTIPLIER);
    const travel = (scrollSpeed * delta) / 1000;

    for (let i = 0; i < this.roadSegments.length; i += 1) {
      const segment = this.roadSegments[i];
      segment.y += travel;

      if (segment.y - this.roadSegmentHeight / 2 >= 720) {
        segment.y -= this.roadSegmentHeight * 2;
      }
    }

  }

  updatePlayerMovement(delta, now) {
    let direction = 0;
    const moveLeft = this.cursors.left.isDown || this.keys.a.isDown;
    const moveRight = this.cursors.right.isDown || this.keys.d.isDown;

    if (moveLeft) {
      direction -= 1;
    }

    if (moveRight) {
      direction += 1;
    }

    if (now < this.controlsFrozenUntil) {
      direction = 0;
    }

    if (now < this.controlsReversedUntil) {
      direction *= -1;
    }

    const dt = delta / 1000;

    if (direction !== 0) {
      this.playerSpeedX += direction * PLAYER_ACCEL * dt;
      this.playerSpeedX = Phaser.Math.Clamp(this.playerSpeedX, -PLAYER_BASE_SPEED, PLAYER_BASE_SPEED);
    } else {
      if (this.playerSpeedX > 0) {
        this.playerSpeedX = Math.max(0, this.playerSpeedX - PLAYER_DRAG * dt);
      } else if (this.playerSpeedX < 0) {
        this.playerSpeedX = Math.min(0, this.playerSpeedX + PLAYER_DRAG * dt);
      }
    }

    this.player.x += this.playerSpeedX * dt;
    this.player.x = Phaser.Math.Clamp(this.player.x, this.driveLeft + PLAYER_HALF_WIDTH, this.driveRight - PLAYER_HALF_WIDTH);
    this.player.x = Math.round(this.player.x);
    this.playerShadow.x = this.player.x;
    this.playerShadow.alpha = 0.27 + Math.min(0.15, Math.abs(this.playerSpeedX) / 3200);

    if (now < this.invulnerableUntil) {
      this.player.alpha = Math.sin(now / 60) > 0 ? 0.45 : 1;
    } else {
      this.player.alpha = 1;
    }
  }

  updateObstacles() {
    this.obstacles.children.each((obstacle) => {
      if (!obstacle.active) {
        return;
      }

      if (obstacle.y > 830) {
        this.recycleObstacle(obstacle);
      } else if (obstacle.shadow && obstacle.shadow.active) {
        obstacle.shadow.setPosition(obstacle.x, obstacle.y + 30);
      }
    });
  }

  updateCollectibles(now) {
    this.updateFirstHitImage();

    this.gasCylinders.children.each((cylinder) => {
      if (!cylinder.active) {
        return;
      }

      if (this.isTooCloseToObstacle(cylinder)) {
        this.recycleCylinder(cylinder);
        return;
      }

      if (cylinder.y > 830) {
        this.recycleCylinder(cylinder);
      }
    });

    if (
      now >= this.nextCylinderSpawnAt &&
      this.gasCylinders.countActive(true) < this.maxCylinderCount &&
      this.gameState === "playing"
    ) {
      this.spawnCylinder();
      this.nextCylinderSpawnAt = now + Phaser.Math.Between(CYLINDER_SPAWN_MIN_MS, CYLINDER_SPAWN_MAX_MS);
    }
  }

  updateDistractions(now, delta) {
    const decay = (8 * delta) / 1000;
    this.distractionMeter = Math.max(0, this.distractionMeter - decay);

    if (now >= this.nextDistractionAt) {
      this.triggerDistraction(now);
      this.nextDistractionAt = now + Phaser.Math.Between(4200, 7600);
    }

    if (now >= this.popupHideAt) {
      this.popupPanel.setVisible(false);
      this.popupText.setVisible(false);
      this.popupIcon.setVisible(false);
    }

    // Auto-hide warning banner
    if (this.warningBanner.visible && now >= this.warningHideAt) {
      this.tweens.add({
        targets: [this.warningBanner, this.warningText],
        y: -40,
        alpha: 0,
        duration: 300,
        ease: "Quad.in",
        onComplete: () => {
          this.warningBanner.setVisible(false);
          this.warningText.setVisible(false);
        },
      });
    }

    if (now < this.blurUntil) {
      this.blurOverlay.setVisible(true);
      this.blurOverlay.setAlpha(0.17);
      const wobble = Math.sin(now / 65) * 0.004;
      this.cameras.main.setZoom(1 + wobble);
    } else {
      this.blurOverlay.setVisible(false);
      this.cameras.main.setZoom(1);
    }

    if (now < this.neonBurstUntil) {
      this.neonOverlay.setVisible(true);
      this.neonPulseAccumulator += delta * 0.014;
      const pulse = 0.12 + Math.abs(Math.sin(this.neonPulseAccumulator)) * 0.22;
      this.neonOverlay.setAlpha(pulse);
      const reelWobble = Math.sin(this.neonPulseAccumulator * 1.25) * 0.007;
      this.cameras.main.setZoom(Math.max(this.cameras.main.zoom, 1 + reelWobble));
    } else {
      this.neonOverlay.setVisible(false);
      this.neonOverlay.setAlpha(0);
    }

    if (now < this.freezeOverlayUntil) {
      this.freezeOverlay.setVisible(true);
      this.freezeOverlay.fillAlpha = 0.1;
    } else {
      this.freezeOverlay.setVisible(false);
    }
  }

  updateUi(now) {
    const timeSeconds = this.survivalTimeMs / 1000;
    const nextTimeText = `Time: ${timeSeconds.toFixed(1)}`;
    if (nextTimeText !== this.lastUiTimeText) {
      this.timeText.setText(nextTimeText);
      this.lastUiTimeText = nextTimeText;
    }

    const nextCylinderText = `Cylinders: ${this.gasCylindersCollected}`;
    if (nextCylinderText !== this.lastCylinderText) {
      this.cylinderText.setText(nextCylinderText);
      this.lastCylinderText = nextCylinderText;
    }

    const nextLivesText = `Lives: ${this.livesRemaining}`;
    if (nextLivesText !== this.lastLivesText) {
      this.livesText.setText(nextLivesText);
      this.lastLivesText = nextLivesText;
    }

    const reverseActive = now < this.controlsReversedUntil;
    const freezeActive = now < this.controlsFrozenUntil;

    if (reverseActive) {
      if (this.lastControlsState !== "reversed") {
        this.controlsText.setText("Controls reversed! Keep cool");
        this.controlsText.setColor("#fecaca");
        this.lastControlsState = "reversed";
      }
    } else if (freezeActive) {
      if (this.lastControlsState !== "frozen") {
        this.controlsText.setText("Lag spike... inputs frozen");
        this.controlsText.setColor("#fef08a");
        this.lastControlsState = "frozen";
      }
    } else {
      if (this.lastControlsState !== "normal") {
        this.controlsText.setText("Move: A/D or <- ->");
        this.controlsText.setColor("#cbd5e1");
        this.lastControlsState = "normal";
      }
    }
  }

  triggerDistraction(now) {
    const eventConfig = Phaser.Utils.Array.GetRandom(MEME_EVENTS);
    if (eventConfig.kind === "reel" && now < this.reelCooldownUntil) {
      this.nextDistractionAt = now + Phaser.Math.Between(1800, 3000);
      return;
    }

    this.popupText.setText(eventConfig.text);
    this.popupIcon.setTexture(eventConfig.icon);
    this.popupPanel.setVisible(true);
    this.popupIcon.setVisible(true);
    this.popupText.setVisible(true);
    this.popupPanel.setScale(0.94);
    this.popupPanel.x = 660;
    this.popupIcon.x = 450;
    this.popupText.x = 700;

    this.tweens.killTweensOf([this.popupPanel, this.popupText, this.popupIcon]);
    this.tweens.add({
      targets: [this.popupPanel, this.popupText, this.popupIcon],
      x: "-=20",
      duration: 160,
      ease: "Quad.out",
    });
    this.tweens.add({
      targets: this.popupPanel,
      scaleX: 1,
      scaleY: 1,
      duration: 130,
      ease: "Back.out",
    });

    this.popupHideAt = now + 1300;

    if (this.ping) {
      this.ping.play();
    }

    this.distractionMeter = Math.min(DISTRACTION_MAX, this.distractionMeter + Phaser.Math.Between(10, 15));

    if (eventConfig.kind === "shake") {
      this.cameras.main.shake(240, 0.006);
      this.showWarning("⚠ INCOMING CALL — SCREEN SHAKING");
    } else if (eventConfig.kind === "reverse") {
      this.controlsReversedUntil = now + Phaser.Math.Between(1200, 2200);
      this.showWarning("⚠ CONTROLS REVERSED");
    } else if (eventConfig.kind === "freeze") {
      this.controlsFrozenUntil = now + Phaser.Math.Between(320, 520);
      this.freezeOverlayUntil = this.controlsFrozenUntil;
      this.showWarning("⚠ INPUTS FROZEN — LAG SPIKE");
    } else if (eventConfig.kind === "blur") {
      this.blurUntil = now + Phaser.Math.Between(900, 1700);
      this.showWarning("⚠ VISION BLURRED");
    } else if (eventConfig.kind === "reel") {
      this.neonBurstUntil = now + Phaser.Math.Between(1600, 2400);
      this.reelCooldownUntil = now + Phaser.Math.Between(11000, 14000);
      this.cameras.main.shake(300, 0.005);
      this.cameras.main.zoomTo(1.025, 200, "Sine.easeOut", true, (_, progress) => {
        if (progress >= 1) {
          this.cameras.main.zoomTo(1, 220, "Sine.easeInOut");
        }
      });
      if (this.cache.audio.exists("reel-stinger")) {
        this.sound.play("reel-stinger", { volume: 0.5 });
      }
      this.showWarning("⚠ REEL DISTRACTION — NEON OVERLOAD");
    }
  }

  showWarning(message) {
    this.warningText.setText(message);
    this.warningBanner.setVisible(true);
    this.warningText.setVisible(true);
    this.warningBanner.setAlpha(0);
    this.warningText.setAlpha(0);
    this.warningBanner.y = -40;
    this.warningText.y = -40;

    this.tweens.killTweensOf([this.warningBanner, this.warningText]);
    this.tweens.add({
      targets: [this.warningBanner, this.warningText],
      y: 24,
      alpha: 1,
      duration: 250,
      ease: "Back.out",
    });

    this.warningHideAt = this.time.now + 1800;
  }

  spawnObstacle() {
    let spawnX = this.pickSpawnLaneX(OBSTACLE_SPAWN_LANE_CLEAR_Y);
    if (spawnX === null) {
      return;
    }

    if (Math.abs(spawnX - this.lastSpawnX) < 50 && Phaser.Math.Between(0, 100) < 55) {
      const alternatives = this.lanes.filter((x) => Math.abs(x - this.lastSpawnX) >= 100);
      const clearAlternatives = alternatives.filter((x) => this.isLaneSpawnClear(x, OBSTACLE_SPAWN_LANE_CLEAR_Y));
      if (clearAlternatives.length > 0) {
        spawnX = Phaser.Utils.Array.GetRandom(clearAlternatives);
      }
    }

    const timeSinceStart = this.time.now - this.startTime;
    if (timeSinceStart > 3000 && Math.abs(spawnX - this.player.x) < 95 && Phaser.Math.Between(0, 100) < 70) {
      const safeLanes = this.lanes.filter((x) => Math.abs(x - this.player.x) >= 95);
      if (safeLanes.length > 0) {
        spawnX = Phaser.Utils.Array.GetRandom(safeLanes);
      }
    }

    this.lastSpawnX = spawnX;

    const isBarrier = Phaser.Math.Between(0, 100) < 24;
    const obstacleTextures = isBarrier ? [] : ["obstacle-car-red", "obstacle-car-blue", "obstacle-car-blue"];
    const texture = isBarrier ? "barrier" : Phaser.Utils.Array.GetRandom(obstacleTextures);

    let obstacle = this.obstacles.get(spawnX, -90, texture);
    if (!obstacle) {
      obstacle = this.physics.add.image(spawnX, -90, texture);
      this.obstacles.add(obstacle);
    }

    obstacle.setActive(true);
    obstacle.setVisible(true);
    obstacle.setTexture(texture);
    obstacle.body.enable = true;
    obstacle.setImmovable(true);
    obstacle.body.setAllowGravity(false);

    if (isBarrier) {
      obstacle.body.setSize(84, 48, true);
    } else {
      obstacle.body.setSize(56, 108, true);
    }

    obstacle.setPosition(spawnX, -90);
    obstacle.setVelocityY(this.obstacleBaseSpeed + Phaser.Math.Between(0, 70));
    obstacle.setDepth(9);

    if (!obstacle.shadow) {
      obstacle.shadow = this.add.image(spawnX, -58, "shadow").setDepth(8).setAlpha(0.3);
    }
    obstacle.shadow.setActive(true).setVisible(true);
    obstacle.shadow.setPosition(spawnX, -58);
    obstacle.shadow.scaleX = isBarrier ? 1.15 : 1;
    obstacle.shadow.scaleY = isBarrier ? 0.9 : 1;
  }

  spawnCylinder() {
    const spawnX = this.pickSpawnLaneX(CYLINDER_SPAWN_LANE_CLEAR_Y);
    if (spawnX === null) {
      return;
    }

    let cylinder = this.gasCylinders.get(spawnX, -70, "gas-cylinder");
    if (!cylinder) {
      cylinder = this.physics.add.image(spawnX, -70, "gas-cylinder");
      this.gasCylinders.add(cylinder);
    }

    cylinder.setActive(true);
    cylinder.setVisible(true);
    cylinder.body.enable = true;
    cylinder.setImmovable(true);
    cylinder.body.setAllowGravity(false);
    cylinder.body.setSize(34, 58, true);
    cylinder.setPosition(spawnX, -70);
    cylinder.setVelocityY(Phaser.Math.Between(CYLINDER_SPEED_MIN, CYLINDER_SPEED_MAX));
    cylinder.setDepth(9);
    cylinder.setScale(0.82);
  }

  pickSpawnLaneX(minClearY) {
    const shuffled = Phaser.Utils.Array.Shuffle([...this.lanes]);
    for (let i = 0; i < shuffled.length; i += 1) {
      if (this.isLaneSpawnClear(shuffled[i], minClearY)) {
        return shuffled[i];
      }
    }
    return null;
  }

  isLaneSpawnClear(laneX, minClearY) {
    const laneIndex = this.getLaneIndexForX(laneX);

    let blocked = false;
    this.obstacles.children.each((obstacle) => {
      if (blocked || !obstacle.active) {
        return;
      }

      if (this.getLaneIndexForX(obstacle.x) === laneIndex && obstacle.y < minClearY) {
        blocked = true;
      }
    });

    if (blocked) {
      return false;
    }

    this.gasCylinders.children.each((cylinder) => {
      if (blocked || !cylinder.active) {
        return;
      }

      if (this.getLaneIndexForX(cylinder.x) === laneIndex && cylinder.y < minClearY) {
        blocked = true;
      }
    });

    return !blocked;
  }

  isTooCloseToObstacle(cylinder) {
    const cylinderLane = this.getLaneIndexForX(cylinder.x);
    let overlaps = false;

    this.obstacles.children.each((obstacle) => {
      if (overlaps || !obstacle.active) {
        return;
      }

      if (this.getLaneIndexForX(obstacle.x) !== cylinderLane) {
        return;
      }

      if (Math.abs(obstacle.y - cylinder.y) < CYLINDER_OVERLAP_CULL_GAP) {
        overlaps = true;
      }
    });

    return overlaps;
  }

  getLaneIndexForX(x) {
    const laneRaw = (x - this.driveLeft) / this.laneWidth;
    return Phaser.Math.Clamp(Math.round(laneRaw - 0.5), 0, LANE_COUNT - 1);
  }

  collectCylinder(cylinder) {
    this.gasCylindersCollected += 1;

    // Play pickup SFX (clone so overlapping pickups don't cut each other off)
    const sfx = this.cylinderSfx.cloneNode();
    sfx.volume = this.cylinderSfx.volume;
    sfx.play().catch(() => { });

    this.collectPop(cylinder.x, cylinder.y);
    this.recycleCylinder(cylinder);

    if (
      (this.gameState === "playing" || this.gameState === "ending_sequence") &&
      this.gasCylindersCollected >= TARGET_CYLINDERS_TO_WIN &&
      !this.endingStarted
    ) {
      this.win();
    }
  }

  handleFirstCollisionImage() {
    if (this.hasShownFirstHitImage || this.gameState !== "playing") {
      return;
    }

    this.hasShownFirstHitImage = true;

    const spawnX = Phaser.Math.Clamp(this.player.x + FIRST_HIT_IMAGE_OFFSET_X, this.driveLeft + 40, this.driveRight - 40);
    const spawnY = this.player.y - 8;

    this.firstHitImage = this.physics.add.image(spawnX, spawnY, "first-hit-image");
    this.firstHitImage.setDepth(9.5);
    this.firstHitImage.setScale(0.82);
    this.firstHitImage.setImmovable(true);
    this.firstHitImage.body.setAllowGravity(false);
    this.firstHitImage.body.setVelocityY(0);
    this.firstHitImage.body.setEnable(false);

    this.tweens.add({
      targets: this.firstHitImage,
      scaleX: 0.94,
      scaleY: 0.94,
      duration: 140,
      ease: "Back.out",
      onComplete: () => {
        if (!this.firstHitImage) {
          return;
        }
        this.firstHitImage.body.setEnable(true);
        this.firstHitImage.setVelocityY(Phaser.Math.Between(FIRST_HIT_IMAGE_SPEED_MIN, FIRST_HIT_IMAGE_SPEED_MAX));
      },
    });
  }

  handleObstacleCollision(obstacle) {
    if (this.gameState !== "playing") {
      return;
    }

    const now = this.time.now;
    if (now < this.invulnerableUntil) {
      return;
    }

    this.handleFirstCollisionImage();
    this.recycleObstacle(obstacle);

    if (this.livesRemaining > 1) {
      this.livesRemaining -= 1;

      const sfx = this.firstDeathSfx.cloneNode();
      sfx.volume = this.firstDeathSfx.volume;
      sfx.play().catch(() => { });

      this.player.setTexture("player-car-last-life");
      this.player.setScale(0.85);
      this.player.body.setSize(90, this.player.displayHeight, true);
      this.showLastLifeAlert();
      this.invulnerableUntil = now + HIT_INVULNERABLE_MS;
      this.cameras.main.flash(90, 255, 190, 190);
      this.cameras.main.shake(120, 0.006);
      return;
    }

    this.lose("crash");
  }

  recycleObstacle(obstacle) {
    if (!obstacle || !obstacle.active) {
      return;
    }

    if (obstacle.shadow && obstacle.shadow.active) {
      obstacle.shadow.setActive(false).setVisible(false);
    }
    obstacle.setVelocityY(0);
    this.obstacles.killAndHide(obstacle);
    obstacle.body.enable = false;
  }

  showLastLifeAlert() {
    if (!this.lastLifeAlertText) {
      return;
    }

    this.playLastLifeAlertSfx();

    this.tweens.killTweensOf(this.lastLifeAlertText);
    this.lastLifeAlertText.setVisible(true);
    this.lastLifeAlertText.setAlpha(1);
    this.lastLifeAlertText.setScale(0.94);

    this.tweens.add({
      targets: this.lastLifeAlertText,
      scaleX: 1,
      scaleY: 1,
      duration: 140,
      ease: "Back.out",
    });

    this.tweens.add({
      targets: this.lastLifeAlertText,
      alpha: 0,
      delay: 820,
      duration: 220,
      ease: "Quad.out",
      onComplete: () => {
        if (this.lastLifeAlertText) {
          this.lastLifeAlertText.setVisible(false);
        }
      },
    });
  }

  playLastLifeAlertSfx() {
    if (this.lastLifeSfx) {
      this.lastLifeSfx.play();
      return;
    }

    const audioCtx = this.sound?.context;
    if (!audioCtx || audioCtx.state !== "running") {
      return;
    }

    const now = audioCtx.currentTime;
    const gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.09, now + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    const oscA = audioCtx.createOscillator();
    oscA.type = "triangle";
    oscA.frequency.setValueAtTime(720, now);
    oscA.frequency.exponentialRampToValueAtTime(980, now + 0.12);
    oscA.connect(gainNode);
    oscA.start(now);
    oscA.stop(now + 0.12);

    const oscB = audioCtx.createOscillator();
    oscB.type = "sine";
    oscB.frequency.setValueAtTime(860, now + 0.11);
    oscB.frequency.exponentialRampToValueAtTime(1180, now + 0.24);
    oscB.connect(gainNode);
    oscB.start(now + 0.11);
    oscB.stop(now + 0.24);
  }

  updateFirstHitImage() {
    if (!this.firstHitImage || !this.firstHitImage.active) {
      return;
    }

    if (this.firstHitImage.y > 860) {
      this.firstHitImage.destroy();
      this.firstHitImage = null;
    }
  }

  recycleCylinder(cylinder) {
    cylinder.setVelocityY(0);
    this.gasCylinders.killAndHide(cylinder);
    cylinder.body.enable = false;
  }

  collectPop(x, y) {
    const text = this.add
      .text(x, y - 12, "+1", {
        fontFamily: "Trebuchet MS",
        fontSize: "24px",
        color: "#bbf7d0",
        stroke: "#052e16",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(70);

    this.tweens.add({
      targets: text,
      y: y - 40,
      alpha: 0,
      duration: 340,
      ease: "Quad.out",
      onComplete: () => text.destroy(),
    });
  }

  win() {
    if (this.endingStarted) {
      return;
    }
    this.endingStarted = true;

    // Stop spawning obstacles, distractions, and cylinders
    this.gameState = "ending_sequence";
    this.spawnEvent.paused = true;
    this.neonOverlay.setVisible(false);
    this.blurOverlay.setVisible(false);
    this.freezeOverlay.setVisible(false);
    this.popupPanel.setVisible(false);
    this.popupText.setVisible(false);
    this.popupIcon.setVisible(false);
    this.player.alpha = 1;
    this.playerSpeedX = 0;

    // Clear all remaining obstacles and cylinders
    this.obstacles.children.each((obs) => {
      if (obs.active) this.recycleObstacle(obs);
    });
    this.gasCylinders.children.each((cyl) => {
      if (cyl.active) this.recycleCylinder(cyl);
    });
    if (this.firstHitImage && this.firstHitImage.active) {
      this.firstHitImage.destroy();
      this.firstHitImage = null;
    }

    // Center the player smoothly on the road
    this.tweens.add({
      targets: this.player,
      x: ROAD_CENTER_X,
      duration: 600,
      ease: "Sine.easeInOut",
    });
    this.tweens.add({
      targets: this.playerShadow,
      x: ROAD_CENTER_X,
      duration: 600,
      ease: "Sine.easeInOut",
    });

    // Spawn the railway crossing at the top of the screen
    this.railwayCrossing = this.add
      .image(ROAD_CENTER_X, -120, "railway-crossing")
      .setDepth(9)
      .setDisplaySize(ROAD_RENDER_WIDTH + 40, 100);

    this.railwayCrossingSpeed = this.obstacleBaseSpeed * 0.6;
    this.trainTriggered = false;
  }

  updateEndingSequence(delta) {
    if (!this.railwayCrossing || this.trainTriggered) {
      return;
    }

    // Scroll the railway crossing down at the same speed as the road
    const travel = (this.railwayCrossingSpeed * delta) / 1000;
    this.railwayCrossing.y += travel;

    // When the crossing reaches the player, snap it so the player is ON the tracks
    if (this.railwayCrossing.y >= PLAYER_Y) {
      this.railwayCrossing.y = PLAYER_Y;
      this.trainTriggered = true;
      this.triggerTrainSequence();
    }
  }

  triggerTrainSequence() {
    // Freeze the player in place
    this.player.body.setVelocity(0, 0);
    this.player.body.enable = false;

    // Spawn train off-screen to the right
    this.train = this.add
      .image(1500, PLAYER_Y, "train")
      .setDepth(15)
      .setScale(1.1);

    // Short pause before the train barrels in
    this.time.delayedCall(400, () => {
      // Train sweeps across from right to left, taking the player with it
      this.tweens.add({
        targets: this.train,
        x: -400,
        duration: 900,
        ease: "Quad.in",
      });

      // Slight delay so the train "hits" the player mid-sweep
      this.time.delayedCall(250, () => {
        this.cameras.main.shake(200, 0.01);
        // Player gets dragged off with the train
        this.tweens.add({
          targets: [this.player, this.playerShadow],
          x: -400,
          duration: 550,
          ease: "Quad.in",
        });
      });

      // After the train has passed, fade to chapter screen
      this.time.delayedCall(1200, () => {
        stopBgMusic(this);
        this.cameras.main.fadeOut(1500, 0, 0, 0);

        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.showChapter2Screen();
        });
      });
    });
  }

  showChapter2Screen() {
    // Destroy all game objects and show a clean black screen with text
    this.children.removeAll(true);

    this.add.rectangle(640, 360, 1280, 720, 0x000000, 1).setDepth(100);

    const chapterText = this.add
      .text(640, 360, "Chapter 2", {
        fontFamily: "Trebuchet MS",
        fontSize: "72px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setAlpha(0);

    this.cameras.main.fadeIn(800, 0, 0, 0);

    // Fade in the "Chapter 2" text, then transition to Phase 2
    this.tweens.add({
      targets: chapterText,
      alpha: 1,
      duration: 1500,
      delay: 400,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.time.delayedCall(1500, () => {
          this.cameras.main.fadeOut(800, 0, 0, 0);
          this.cameras.main.once("camerafadeoutcomplete", () => {
            this.scene.start("phase2");
          });
        });
      },
    });
  }

  lose(reason) {
    if (reason === "crash") {
      const sfx = this.collisionSfx.cloneNode();
      sfx.volume = this.collisionSfx.volume;
      sfx.play().catch(() => { });

      this.cameras.main.flash(120, 255, 225, 225);
      this.cameras.main.shake(220, 0.012);
    }
    this.finishRound(reason);
  }

  finishRound(result) {
    if (this.gameState !== "playing") {
      return;
    }

    this.gameState = "ended";
    stopBgMusic(this);
    this.spawnEvent.paused = true;
    this.neonOverlay.setVisible(false);
    this.popupIcon.setVisible(false);
    this.player.alpha = 1;

    if (this.lastLifeAlertText) {
      this.lastLifeAlertText.setVisible(false);
      this.lastLifeAlertText.setAlpha(0);
    }

    if (this.firstHitImage && this.firstHitImage.active) {
      this.firstHitImage.setVelocityY(0);
    }

    const survivalSeconds = this.survivalTimeMs / 1000;
    const previousBest = Number(localStorage.getItem("cylindhar-best-time") || 0);
    const bestTime = Math.max(previousBest, survivalSeconds);
    localStorage.setItem("cylindhar-best-time", String(bestTime));

    this.time.delayedCall(350, () => {
      this.scene.start("game-over", {
        result,
        survivalSeconds,
        bestTime,
      });
    });
  }
}
