import { BOMB_FUSE_MS, TILE_SIZE } from '../config/Constants.js';
import { gridToPixel } from '../map/LevelData.js';

export default class Bomb {
  constructor(scene, col, row, owner) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.owner = owner;
    this.exploded = false;

    // ★ 추가: 아직 이 폭탄 타일을 벗어나지 않아서 "통과 가능"한 대상 목록
    // 처음엔 놓은 사람만 포함
    this.exemptEntities = new Set([owner]);

    const pos = gridToPixel(col, row);

    // ★ 변경: 일반 스프라이트 -> 정적 physics 스프라이트로 변경
    // (실제 충돌 바디가 있어야 "벗어나면 다시 못 들어감"을 구현 가능)
    this.sprite = scene.physics.add.staticSprite(pos.x, pos.y, 'bomb');
    this.sprite.setDepth(5);
    // ★ 추가: 충돌 콜백에서 이 Bomb 인스턴스로 역참조하기 위한 데이터
    this.sprite.setData('bombRef', this);

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

  // ★ 추가: 이 엔티티가 지금 이 폭탄을 통과할 수 있는지 여부
  isExempt(entity) {
    return this.exemptEntities.has(entity);
  }

  // ★ 추가: 매 프레임 호출. 예외 대상이 폭탄 타일에서 벗어났으면
  // 목록에서 제거 -> 이후로는 본인 포함 아무도 다시 못 들어옴
  checkExit() {
    if (this.exploded || this.exemptEntities.size === 0) {
      return;
    }

    this.exemptEntities.forEach((entity) => {
      if (!entity || entity.col !== this.col || entity.row !== this.row) {
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