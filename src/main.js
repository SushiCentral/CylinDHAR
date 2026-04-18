import { BootScene } from "./scenes/BootScene.js";
import { StartScene } from "./scenes/StartScene.js";
import { IntroScene } from "./scenes/IntroScene.js";
import { GameScene } from "./scenes/GameScene.js";
import { GameOverScene } from "./scenes/GameOverScene.js";
import { Phase2Scene } from "./scenes/Phase2Scene.js";
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
  scene: [BootScene, StartScene, IntroScene, GameScene, GameOverScene, Phase2Scene, Chapter3Scene],
};

new Phaser.Game(config);
