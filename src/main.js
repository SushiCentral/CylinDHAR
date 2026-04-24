import { BootScene } from "./scenes/BootScene.js";
import { StartScene } from "./scenes/StartScene.js";
import { IntroScene } from "./scenes/IntroScene.js";
import { GameScene } from "./scenes/GameScene.js";
import { GameOverScene } from "./scenes/GameOverScene.js";
import { Ch2CutsceneScene } from "./scenes/Ch2CutsceneScene.js";
import { Phase2Scene } from "./scenes/Phase2Scene.js";
import { Ch3CutsceneScene } from "./scenes/Ch3CutsceneScene.js";
import { Phase3CombatScene } from "./scenes/Phase3CombatScene.js";
import { Ch3EndingScene } from "./scenes/Ch3EndingScene.js";
import { Chapter3Scene } from "./scenes/Chapter3Scene.js";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

const config = {
  type: Phaser.AUTO,
  parent: "game-root",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#0f1414",
  pixelArt: true,
  antialias: false,
  autoRound: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    StartScene,
    IntroScene,
    GameScene,
    GameOverScene,
    Ch2CutsceneScene,
    Phase2Scene,
    Ch3CutsceneScene,
    Phase3CombatScene,
    Ch3EndingScene,
    Chapter3Scene,
  ],
};

new Phaser.Game(config);
