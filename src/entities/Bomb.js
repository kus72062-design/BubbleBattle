console.log('★★★ Bomb.js LOADED v4 (overlap-based exit check) ★★★');

import { BOMB_FUSE_MS, TILE_SIZE } from '../config/Constants.js';
import { gridToPixel } from '../map/LevelData.js';

// 엔티티들의 히트박스 반너비/반높이 (Player.js, Enemy.js와 동일한 값)
const ENTITY_HALF_W = 14;
const ENTITY_HALF_H = 14;

export default class Bomb {
  constructor(scene, col, row, owner) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.owner = owner;
    this.exploded = false;
    this.exemptEntities = new Set([owner]);

    const pos = gridToPixel(col, row);
    this.sprite = scene.add.sprite(pos.x, pos.y, 'bomb');
    this.sprite.setDepth(5);

    scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.15,
      scaleY: 0.9,
      duration: 300,
      yoyo: true,
      repeat: Math.floor(BOMB_FUSE_MS / 600)
    });

    scene.time.delayedCall(BOMB_FUSE_MS, () => {
      this.explode();
    });
  }

  isExempt(entity) {
    return this.exemptEntities.has(entity);
  }

  // ★ 변경: col/row 정수 비교 대신, 실제 픽셀 히트박스가 폭탄 타일과
  // 물리적으로 겹치는지 직접 계산. 완전히 벗어나야만 예외 자격 제거.
  // -> 반올림 경계에서 몸체가 아직 겹쳐있는데 자격만 먼저 사라지는
  //    "경계선에 끼어서 영구 정지"하는 버그를 원천 차단.
  checkExit() {
    if (this.exploded || this.exemptEntities.size === 0) {
      return;
    }

    const center = gridToPixel(this.col, this.row);
    const halfTile = TILE_SIZE / 2;

    this.exemptEntities.forEach((entity) => {
      if (!entity || !entity.sprite) {
        this.exemptEntities.delete(entity);
        return;
      }

      const overlapX = Math.abs(entity.sprite.x - center.x) < halfTile + ENTITY_HALF_W;
      const overlapY = Math.abs(entity.sprite.y - center.y) < halfTile + ENTITY_HALF_H;

      // 완전히 벗어났을 때(겹침이 전혀 없을 때)만 예외 목록에서 제거
      if (!(overlapX && overlapY)) {
        this.exemptEntities.delete(entity);
      }
    });
  }

  explode() {
    if (this.exploded) {
      return;
    }
    this.exploded = true;
    this.sprite.destroy();
    this.scene.triggerExplosion(this.col, this.row, this.owner.bombPower, this.owner);
  }
}