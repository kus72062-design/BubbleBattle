import * as Phaser from 'phaser';
import { TILE_SIZE, MAP_COLS, MAP_ROWS, COLORS } from '../config/Constants.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.createTextures();
    this.scene.start('MenuScene');
  }

  createTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    g.clear();
    g.fillStyle(COLORS.floor, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(COLORS.floorAlt, 0.35);
    g.fillRect(0, 0, TILE_SIZE / 2, TILE_SIZE / 2);
    g.fillRect(TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 2);
    g.generateTexture('tile_floor', TILE_SIZE, TILE_SIZE);

    g.clear();
    g.fillStyle(COLORS.wall, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.lineStyle(3, 0x4e342e, 1);
    g.strokeRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
    g.generateTexture('tile_wall', TILE_SIZE, TILE_SIZE);

    g.clear();
    g.fillStyle(COLORS.block, 1);
    g.fillRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
    g.lineStyle(2, 0xa1887f, 1);
    g.strokeRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
    g.lineBetween(8, 8, TILE_SIZE - 8, TILE_SIZE - 8);
    g.generateTexture('tile_block', TILE_SIZE, TILE_SIZE);

    g.clear();
    g.fillStyle(COLORS.player, 1);
    g.fillCircle(TILE_SIZE / 2, TILE_SIZE / 2 + 4, 14);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(TILE_SIZE / 2 - 5, TILE_SIZE / 2, 4);
    g.fillCircle(TILE_SIZE / 2 + 5, TILE_SIZE / 2, 4);
    g.generateTexture('player', TILE_SIZE, TILE_SIZE);

    g.clear();
    g.fillStyle(COLORS.enemy, 1);
    g.fillCircle(TILE_SIZE / 2, TILE_SIZE / 2 + 4, 14);
    g.fillStyle(0x000000, 1);
    g.fillCircle(TILE_SIZE / 2 - 5, TILE_SIZE / 2, 3);
    g.fillCircle(TILE_SIZE / 2 + 5, TILE_SIZE / 2, 3);
    g.lineStyle(2, 0x000000, 1);
    g.beginPath();
    g.arc(TILE_SIZE / 2, TILE_SIZE / 2 + 8, 6, 0, Math.PI);
    g.strokePath();
    g.generateTexture('enemy', TILE_SIZE, TILE_SIZE);

    g.clear();
    g.fillStyle(COLORS.bomb, 0.9);
    g.fillCircle(TILE_SIZE / 2, TILE_SIZE / 2, 14);
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(TILE_SIZE / 2 - 4, TILE_SIZE / 2 - 4, 5);
    g.generateTexture('bomb', TILE_SIZE, TILE_SIZE);

    g.clear();
    g.fillStyle(COLORS.explosion, 0.85);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0xff9800, 0.5);
    g.fillRect(8, 8, TILE_SIZE - 16, TILE_SIZE - 16);
    g.generateTexture('explosion', TILE_SIZE, TILE_SIZE);

    g.clear();
    g.fillStyle(COLORS.itemSpeed, 1);
    g.fillCircle(TILE_SIZE / 2, TILE_SIZE / 2, 12);
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(22, 18, 22, 30, 32, 24);
    g.generateTexture('item_speed', TILE_SIZE, TILE_SIZE);

    g.clear();
    g.fillStyle(COLORS.itemBomb, 1);
    g.fillCircle(TILE_SIZE / 2, TILE_SIZE / 2, 12);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(TILE_SIZE / 2, TILE_SIZE / 2, 5);
    g.generateTexture('item_bomb', TILE_SIZE, TILE_SIZE);

    g.clear();
    g.fillStyle(COLORS.itemPower, 1);
    g.fillCircle(TILE_SIZE / 2, TILE_SIZE / 2, 12);
    g.fillStyle(0xffffff, 1);
    g.fillRect(20, 22, 8, 4);
    g.fillRect(22, 18, 4, 12);
    g.generateTexture('item_power', TILE_SIZE, TILE_SIZE);

    g.destroy();

    this.registry.set('gameSize', {
      width: MAP_COLS * TILE_SIZE,
      height: MAP_ROWS * TILE_SIZE + 80
    });
  }
}
