console.log('★★★ Enemy.js LOADED v5 (avoid > chase > random AI) ★★★');

import { ENEMY_SPEED, DIR, ENEMY_DECISION_INTERVAL_MS } from '../config/Constants.js';
import { gridToPixel } from '../map/LevelData.js';
import { pixelToCol, pixelToRow, canOccupy } from '../utils/GridMovement.js';

const DIRECTIONS = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];
const HALF_W = 14;
const HALF_H = 14;

export default class Enemy {
  constructor(scene, col, row) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.alive = true;
    this.speed = ENEMY_SPEED;
    this.changeTimer = 0;
    this.direction = { x: 0, y: 0 };

    const pos = gridToPixel(col, row);
    this.sprite = scene.add.sprite(pos.x, pos.y, 'enemy');
    this.sprite.setDepth(9);

    this.pickDirection();
  }

  isBlocked(col, row) {
    return !this.scene.isEntityWalkable(col, row, this);
  }

  canMove(direction) {
    return !this.isBlocked(this.col + direction.x, this.row + direction.y);
  }

  update(time, delta) {
    if (!this.alive) {
      return;
    }

    const deltaSec = delta / 1000;
    const amountX = this.direction.x * this.speed * deltaSec;
    const amountY = this.direction.y * this.speed * deltaSec;

    let blocked = false;

    if (amountX !== 0 && !this.moveAxis('x', amountX)) {
      blocked = true;
    }
    if (amountY !== 0 && !this.moveAxis('y', amountY)) {
      blocked = true;
    }

    this.col = pixelToCol(this.sprite.x);
    this.row = pixelToRow(this.sprite.y);

    this.changeTimer += delta;

    if (blocked || this.changeTimer > ENEMY_DECISION_INTERVAL_MS) {
      this.changeTimer = 0;
      this.pickDirection();
    }
  }

  moveAxis(axis, amount) {
    const prevX = this.sprite.x;
    const prevY = this.sprite.y;

    if (axis === 'x') {
      this.sprite.x += amount;
    } else {
      this.sprite.y += amount;
    }

    if (!canOccupy(this.sprite.x, this.sprite.y, HALF_W, HALF_H, (c, r) => this.isBlocked(c, r))) {
      this.sprite.x = prevX;
      this.sprite.y = prevY;
      return false;
    }
    return true;
  }

  pickDirection() {
    const available = DIRECTIONS.filter((dir) => this.canMove(dir));

    if (available.length === 0) {
      this.direction = { x: 0, y: 0 };
      return;
    }

    // ★ 1순위: 폭탄 회피 - 현재 활성화된 폭탄들의 폭발 예정 범위(위험 지역)를 피함
    const dangerCells = this.scene.getDangerCells();
    const isDangerous = (dir) => dangerCells.has(`${this.col + dir.x},${this.row + dir.y}`);
    const safeDirs = available.filter((dir) => !isDangerous(dir));
    const pool = safeDirs.length > 0 ? safeDirs : available;

    // ★ 2순위: 플레이어 추적 - 같은 행/열에 있으면 그 방향으로 (안전한 후보 중에서만)
    const chaseDir = this.getChaseDirection(pool);
    if (chaseDir) {
      this.direction = chaseDir;
      return;
    }

    // ★ 3순위: 랜덤 이동
    this.direction = pool[Math.floor(Math.random() * pool.length)];
  }

  // ★ 추가: 플레이어와 같은 행/열에 있을 때 그 방향을 pool 안에서 찾아 반환
  getChaseDirection(pool) {
    const player = this.scene.player;
    if (!player || player.state === 'dead') {
      return null;
    }

    if (player.row === this.row && player.col !== this.col) {
      const dir = player.col < this.col ? DIR.LEFT : DIR.RIGHT;
      return pool.find((d) => d === dir) || null;
    }

    if (player.col === this.col && player.row !== this.row) {
      const dir = player.row < this.row ? DIR.UP : DIR.DOWN;
      return pool.find((d) => d === dir) || null;
    }

    return null;
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