import * as Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import { TILE_SIZE, MAP_COLS, MAP_ROWS } from './config/Constants.js';

const GAME_WIDTH = MAP_COLS * TILE_SIZE;
const GAME_HEIGHT = MAP_ROWS * TILE_SIZE + 80;

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0a1628',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [BootScene, MenuScene, GameScene]
};

new Phaser.Game(config);
