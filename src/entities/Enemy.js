import { ENEMY_SPEED, DIR, TILE_SIZE } from '../config/Constants.js';
import { gridToPixel } from '../map/LevelData.js';

const DIRECTIONS = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];

export default class Enemy {
  constructor(scene, col, row) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.alive = true;
    // ★ 삭제: this.moving 플래그 제거 (타일 단위 이동 락 제거)
    this.speed = ENEMY_SPEED;
    this.direction = DIRECTIONS[Math.floor(Math.random() * 4)];
    this.changeTimer = 0;

    const pos = gridToPixel(col, row);
    this.sprite = scene.physics.add.sprite(pos.x, pos.y, 'enemy');
    this.sprite.setDepth(9);
    this.sprite.body.setSize(28, 28);
    this.sprite.body.setOffset(10, 12);

    // ★ 추가: col/row -> 픽셀 좌표 역산용 기준점
    this.originPos = gridToPixel(0, 0);
  }

  update(time, delta) {
    if (!this.alive) {
      // ★ 추가: 죽었으면 속도 0 고정
      this.sprite.setVelocity(0, 0);
      return;
    }

    // ★ 추가: 실제 픽셀 위치 기준으로 현재 col/row 갱신
    this.updateGridPosition();

    // ★ 변경: 타일 "중앙"에 정확히 도달했을 때만 방향 재판단
    // (중앙이 아닐 때 방향을 바꾸면 대각선으로 미끄러지는 이상한 움직임이 생김)
    if (this.isAtCellCenter()) {
      // ★ 추가: 살짝 어긋난 위치를 타일 중앙으로 스냅
      // (부동소수점 오차 누적으로 인한 미세한 벽 끼임 방지)
      this.snapToGrid();

      this.changeTimer += delta;

      if (this.changeTimer > 800 || !this.canMove(this.direction)) {
        this.changeTimer = 0;
        this.pickDirection();
      }
    }

    // ★ 변경: move(direction) 트윈 호출 대신 매 프레임 velocity 직접 설정
    this.sprite.setVelocity(this.direction.x * this.speed, this.direction.y * this.speed);
  }

  // ★ 추가: 픽셀 좌표 -> col/row 역산
  updateGridPosition() {
    const offsetX = this.sprite.x - this.originPos.x;
    const offsetY = this.sprite.y - this.originPos.y;
    this.col = Math.round(offsetX / TILE_SIZE);
    this.row = Math.round(offsetY / TILE_SIZE);
  }

  // ★ 추가: 현재 타일의 정중앙 근처에 있는지 판정
  isAtCellCenter() {
    const target = gridToPixel(this.col, this.row);
    // 한 프레임에 이동하는 거리보다 살짝 넉넉하게 임계값을 잡아서
    // 프레임 드랍이 있어도 중앙 판정을 놓치지 않도록 함
    const threshold = Math.max(2, (this.speed * delta_guard(this)) );
    return Math.abs(this.sprite.x - target.x) <= threshold &&
           Math.abs(this.sprite.y - target.y) <= threshold;
  }

  // ★ 추가: 타일 정중앙으로 좌표 스냅
  snapToGrid() {
    const target = gridToPixel(this.col, this.row);
    this.sprite.x = target.x;
    this.sprite.y = target.y;
  }

  pickDirection() {
    const available = DIRECTIONS.filter((dir) => this.canMove(dir));

    if (available.length === 0) {
      return;
    }

    const safeDirs = available.filter((dir) => !this.scene.isBombAt(this.col + dir.x, this.row + dir.y));
    const pool = safeDirs.length > 0 ? safeDirs : available;
    this.direction = pool[Math.floor(Math.random() * pool.length)];
  }

  canMove(direction) {
    return this.scene.canWalk(this.col + direction.x, this.row + direction.y);
  }

  // ★ 삭제: move(direction) 메서드 전체 제거 (트윈 기반 타일 이동 로직 불필요)

  kill() {
    if (!this.alive) {
      return;
    }
    this.alive = false;
    this.sprite.destroy();
    this.scene.onEnemyKilled();
  }

  destroy() {
    if (this.sprite.active) {
      this.sprite.destroy();
    }
  }
}

// ★ 추가: isAtCellCenter에서 쓰는 임계값 계산용 헬퍼
// (60fps 기준 한 프레임 이동 거리의 1.5배 정도를 여유값으로 사용)
function delta_guard(enemy) {
  return (1 / 60) * 1.5;
}