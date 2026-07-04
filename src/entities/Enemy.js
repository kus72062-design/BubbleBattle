import { ENEMY_SPEED, DIR, TILE_SIZE } from '../config/Constants.js';
import { gridToPixel } from '../map/LevelData.js';

const DIRECTIONS = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];

// ★ 추가: "타일 중앙에 도착했다"고 판단할 허용 오차(px). delta 참조 버그 대신 고정값 사용
const CENTER_THRESHOLD = 4;

export default class Enemy {
  constructor(scene, col, row) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.alive = true;
    this.speed = ENEMY_SPEED;
    this.direction = DIRECTIONS[Math.floor(Math.random() * 4)];
    this.changeTimer = 0;

    const pos = gridToPixel(col, row);
    this.sprite = scene.physics.add.sprite(pos.x, pos.y, 'enemy');
    this.sprite.setDepth(9);
    this.sprite.body.setSize(28, 28);
    this.sprite.body.setOffset(10, 12);

    this.originPos = gridToPixel(0, 0);

    // ★ 추가: 스폰 직후 갈 수 없는 방향으로 시작하는 경우 대비
    if (!this.canMove(this.direction)) {
      this.pickDirection();
    }
  }

  update(time, delta) {
    if (!this.alive) {
      this.sprite.setVelocity(0, 0);
      return;
    }

    this.updateGridPosition();

    // ★ 변경: 방향 전환은 반드시 "타일 정중앙"에서만 일어나도록 함
    // (중간에 방향을 바꾸면 대각선으로 새거나 모서리에 끼는 문제가 생김)
    if (this.isAtCellCenter()) {
      this.snapToGrid();

      this.changeTimer += delta;

      if (this.changeTimer > 800 || !this.canMove(this.direction)) {
        this.changeTimer = 0;
        this.pickDirection();
      }
    }

    let vx = this.direction.x * this.speed;
    let vy = this.direction.y * this.speed;

    // ★ 추가: 이동 축의 수직 방향은 항상 0으로 고정
    // -> 정확히 격자를 따라서만 움직이므로 모서리에 걸릴 여지 자체가 없음
    if (this.direction.x !== 0) {
      vy = 0;
    } else if (this.direction.y !== 0) {
      vx = 0;
    }

    this.sprite.setVelocity(vx, vy);
  }

  updateGridPosition() {
    const offsetX = this.sprite.x - this.originPos.x;
    const offsetY = this.sprite.y - this.originPos.y;
    this.col = Math.round(offsetX / TILE_SIZE);
    this.row = Math.round(offsetY / TILE_SIZE);
  }

  isAtCellCenter() {
    const target = gridToPixel(this.col, this.row);
    return Math.abs(this.sprite.x - target.x) <= CENTER_THRESHOLD &&
           Math.abs(this.sprite.y - target.y) <= CENTER_THRESHOLD;
  }

  snapToGrid() {
    const target = gridToPixel(this.col, this.row);
    this.sprite.x = target.x;
    this.sprite.y = target.y;
  }

  pickDirection() {
    const available = DIRECTIONS.filter((dir) => this.canMove(dir));

    if (available.length === 0) {
      // ★ 추가: 갈 곳이 전혀 없으면 정지 (벽 방향으로 계속 속도를 주지 않도록)
      this.direction = { x: 0, y: 0 };
      return;
    }

    const safeDirs = available.filter((dir) => !this.scene.isBombAt(this.col + dir.x, this.row + dir.y));
    const pool = safeDirs.length > 0 ? safeDirs : available;
    this.direction = pool[Math.floor(Math.random() * pool.length)];
  }

  canMove(direction) {
    return this.scene.canWalk(this.col + direction.x, this.row + direction.y);
  }

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