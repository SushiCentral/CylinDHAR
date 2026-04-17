const ROAD_CENTER_X = 640;
const ROAD_RENDER_WIDTH = 900;
const ROAD_DRIVE_WIDTH = 700;
const ROAD_SCROLL_HEIGHT = 940;
const LANE_COUNT = 5;
const LANE_ALIGNMENT_OFFSET = 0;
const SPEED_MULTIPLIER = 1.5;
const PLAYER_BASE_SPEED = 580 * SPEED_MULTIPLIER;
const PLAYER_ACCEL = 2400 * SPEED_MULTIPLIER;
const PLAYER_DRAG = 3200 * SPEED_MULTIPLIER;
const PLAYER_Y = 620;
const PLAYER_HALF_WIDTH = 30;
const RUN_DURATION_MS = 75_000;
const DISTRACTION_MAX = 100;
const CYLINDER_SPAWN_MIN_MS = 3500;
const CYLINDER_SPAWN_MAX_MS = 6200;
const CYLINDER_SPEED_MIN = 180 * SPEED_MULTIPLIER;
const CYLINDER_SPEED_MAX = 260 * SPEED_MULTIPLIER;
const OBSTACLE_SPAWN_LANE_CLEAR_Y = 280;
const CYLINDER_SPAWN_LANE_CLEAR_Y = 340;
const CYLINDER_OVERLAP_CULL_GAP = 84;

const MEME_EVENTS = [
  { text: "Bro replied [skull]", icon: "icon-chat", kind: "shake" },
  { text: "1% battery", icon: "icon-battery", kind: "freeze" },
  { text: "New reel dropped", icon: "icon-reel", kind: "reverse" },
  { text: "Group chat exploding", icon: "icon-chat", kind: "blur" },
  { text: "Mom calling... again", icon: "icon-chat", kind: "shake" },
  { text: "POV: You looked away", icon: "icon-battery", kind: "blur" },
  { text: "Friend sent a Bihari reel 🎶", icon: "icon-reel", kind: "reel" },
];

export class GameScene extends Phaser.Scene {
  constructor() {
    super("game");
  }

  create() {
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

    this.streetLights = this.add.group();
    for (let i = 0; i < 9; i += 1) {
      const y = 40 + i * 85;
      this.streetLights.add(this.add.circle(160, y, 10, 0x22d3ee, 0.45));
      this.streetLights.add(this.add.circle(1120, y + 32, 10, 0x22d3ee, 0.45));
    }

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

    this.physics.add.overlap(this.player, this.obstacles, () => {
      this.lose("crash");
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
      .text(26, 60, "Survive 75s", { ...uiStyle, fontSize: "20px" })
      .setDepth(50);

    this.controlsText = this.add
      .text(26, 92, "Move: A/D or <- ->", {
        ...uiStyle,
        fontSize: "18px",
        color: "#cbd5e1",
        strokeThickness: 4,
      })
      .setDepth(50);

    this.meterCard = this.add
      .rectangle(1040, 44, 280, 80, 0x0f172a, 0.86)
      .setStrokeStyle(2, 0x334155, 0.95)
      .setDepth(49);
    this.meterBg = this.add.rectangle(1040, 44, 220, 22, 0x020617, 0.92).setDepth(50);
    this.meterFill = this.add.rectangle(931, 32, 2, 14, 0x22c55e, 1).setDepth(51).setOrigin(0, 0.5);
    this.meterLabel = this.add
      .text(930, 16, "Distraction", {
        ...uiStyle,
        fontSize: "18px",
        color: "#e2e8f0",
        strokeThickness: 4,
      })
      .setDepth(51);

    this.cylinderCard = this.add
      .rectangle(1040, 118, 280, 72, 0x0f172a, 0.86)
      .setStrokeStyle(2, 0x334155, 0.95)
      .setDepth(49);
    this.cylinderIcon = this.add.image(930, 118, "gas-cylinder").setDepth(51).setScale(0.44);
    this.cylinderText = this.add
      .text(968, 102, "Cylinders: 0", {
        ...uiStyle,
        fontSize: "24px",
        color: "#bbf7d0",
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

    this.lastUiTimeText = "Time: 0.0";
    this.lastMeterWidth = -1;
    this.lastControlsState = "normal";
    this.lastCylinderText = "Cylinders: 0";
  }

  buildDistractionSystem() {
    this.ping = this.cache.audio.exists("ping") ? this.sound.add("ping", { volume: 0.35 }) : null;
    this.crashSound = this.cache.audio.exists("crash") ? this.sound.add("crash", { volume: 0.42 }) : null;
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

    if (this.survivalTimeMs >= RUN_DURATION_MS) {
      this.win();
      return;
    }

    if (this.distractionMeter >= DISTRACTION_MAX) {
      this.lose("distracted");
    }
  }

  updateRoad(delta) {
    const normalized = Phaser.Math.Clamp((this.obstacleBaseSpeed - 220) / 210, 0, 1);
    const scrollSpeed = 210 + normalized * 130;
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
  }

  updateObstacles() {
    this.obstacles.children.each((obstacle) => {
      if (!obstacle.active) {
        return;
      }

      if (obstacle.y > 830) {
        if (obstacle.shadow && obstacle.shadow.active) {
          obstacle.shadow.setActive(false).setVisible(false);
        }
        obstacle.setVelocityY(0);
        this.obstacles.killAndHide(obstacle);
        obstacle.body.enable = false;
      } else if (obstacle.shadow && obstacle.shadow.active) {
        obstacle.shadow.setPosition(obstacle.x, obstacle.y + 30);
      }
    });
  }

  updateCollectibles(now) {
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
      const lights = this.streetLights.getChildren();
      for (let i = 0; i < lights.length; i += 1) {
        const light = lights[i];
        const flicker = 0.35 + Math.abs(Math.sin(this.neonPulseAccumulator + i * 0.75)) * 0.55;
        light.setFillStyle(0x22d3ee, flicker);
      }
      const reelWobble = Math.sin(this.neonPulseAccumulator * 1.25) * 0.007;
      this.cameras.main.setZoom(Math.max(this.cameras.main.zoom, 1 + reelWobble));
    } else {
      this.neonOverlay.setVisible(false);
      this.neonOverlay.setAlpha(0);
      const lights = this.streetLights.getChildren();
      for (let i = 0; i < lights.length; i += 1) {
        lights[i].setFillStyle(0x22d3ee, 0.45);
      }
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

    const ratio = Phaser.Math.Clamp(this.distractionMeter / DISTRACTION_MAX, 0, 1);
    const nextMeterWidth = Math.round(202 * ratio);
    if (nextMeterWidth !== this.lastMeterWidth) {
      this.meterFill.width = nextMeterWidth;
      this.lastMeterWidth = nextMeterWidth;
    }

    if (ratio < 0.4) {
      this.meterFill.fillColor = 0x22c55e;
    } else if (ratio < 0.75) {
      this.meterFill.fillColor = 0xf59e0b;
    } else {
      this.meterFill.fillColor = 0xef4444;
    }

    const nextCylinderText = `Cylinders: ${this.gasCylindersCollected}`;
    if (nextCylinderText !== this.lastCylinderText) {
      this.cylinderText.setText(nextCylinderText);
      this.lastCylinderText = nextCylinderText;
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
    } else if (eventConfig.kind === "reverse") {
      this.controlsReversedUntil = now + Phaser.Math.Between(1200, 2200);
    } else if (eventConfig.kind === "freeze") {
      this.controlsFrozenUntil = now + Phaser.Math.Between(320, 520);
      this.freezeOverlayUntil = this.controlsFrozenUntil;
    } else if (eventConfig.kind === "blur") {
      this.blurUntil = now + Phaser.Math.Between(900, 1700);
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
    }
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
    const texture = isBarrier
      ? "barrier"
      : Phaser.Math.Between(0, 1) === 0
        ? "obstacle-car-red"
        : "obstacle-car-b";

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
    this.collectPop(cylinder.x, cylinder.y);
    this.recycleCylinder(cylinder);
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
    this.finishRound("win");
  }

  lose(reason) {
    if (reason === "crash") {
      if (this.crashSound) {
        this.crashSound.play();
      }
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
    this.spawnEvent.paused = true;
    this.neonOverlay.setVisible(false);
    this.popupIcon.setVisible(false);

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
