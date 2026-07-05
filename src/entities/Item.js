import * as Phaser from 'phaser';
import { ITEM_TYPE } from '../config/Constants.js';
import { gridToPixel } from '../map/LevelData.js';

const TEXTURE_MAP = {
  [ITEM_TYPE.SPEED]: 'item_speed',
  [ITEM_TYPE.BOMB]: 'item_bomb',
  [ITEM_TYPE.POWER]: 'item_power',
  // ★ 추가
  [ITEM_TYPE.NEEDLE]: 'item_needle'
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

// ★ 변경: 가중치 기반 랜덤 - 바늘(needle)은 훨씬 희귀하게 등장
// SPEED/BOMB/POWER 각각 가중치 9, NEEDLE 가중치 1 -> 전체 드랍 중 약 3.6%가 바늘
export function randomItemType() {
  const weighted = [
    { type: ITEM_TYPE.SPEED, weight: 9 },
    { type: ITEM_TYPE.BOMB, weight: 9 },
    { type: ITEM_TYPE.POWER, weight: 9 }
    // ★ 제거: NEEDLE 드랍은 이제 스테이지 시작 시 자동 지급으로 대체
  ];

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let roll = Phaser.Math.Between(1, totalWeight);

  for (const entry of weighted) {
    if (roll <= entry.weight) {
      return entry.type;
    }
    roll -= entry.weight;
  }

  return ITEM_TYPE.SPEED;
}