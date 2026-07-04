import * as Phaser from 'phaser';
import { ITEM_TYPE } from '../config/Constants.js';
import { gridToPixel } from '../map/LevelData.js';

const TEXTURE_MAP = {
  [ITEM_TYPE.SPEED]: 'item_speed',
  [ITEM_TYPE.BOMB]: 'item_bomb',
  [ITEM_TYPE.POWER]: 'item_power'
};

export default class Item {
  constructor(scene, col, row, type) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.type = type;
    this.collected = false;

    const pos = gridToPixel(col, row);
    this.sprite = scene.physics.add.sprite(pos.x, pos.y, TEXTURE_MAP[type]);
    this.sprite.setDepth(4);
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setSize(24, 24);
    this.sprite.body.setOffset(12, 12);

    scene.tweens.add({
      targets: this.sprite,
      y: pos.y - 4,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  collect(player) {
    if (this.collected) {
      return;
    }
    this.collected = true;
    player.applyItem(this.type);
    this.sprite.destroy();
    this.scene.removeItem(this);
  }

  destroy() {
    if (this.sprite.active) {
      this.sprite.destroy();
    }
  }
}

export function randomItemType() {
  const types = [ITEM_TYPE.SPEED, ITEM_TYPE.BOMB, ITEM_TYPE.POWER];
  return types[Phaser.Math.Between(0, types.length - 1)];
}
