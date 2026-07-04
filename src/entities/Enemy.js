import { ENEMY_SPEED, DIR, TILE_SIZE } from '../config/Constants.js';
import { gridToPixel } from '../map/LevelData.js';

const DIRECTIONS = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];

export default class Enemy {
  constructor(scene, col, row) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.alive = true;
    this.moving = false;
    this.speed = ENEMY_SPEED;
    this.direction = DIRECTIONS[Math.floor(Math.random() * 4)];
    this.changeTimer = 0;

    const pos = gridToPixel(col, row);
    this.sprite = scene.physics.add.sprite(pos.x, pos.y, 'enemy');
    this.sprite.setDepth(9);
    this.sprite.body.setSize(28, 28);
    this.sprite.body.setOffset(10, 12);
  }

  update(time, delta) {
    if (!this.alive || this.moving) {
      return;
    }

    this.changeTimer += delta;

    if (this.changeTimer > 800) {
      this.changeTimer = 0;
      this.pickDirection();
    }

    if (!this.canMove(this.direction)) {
      this.pickDirection();
    }

    if (this.canMove(this.direction)) {
      this.move(this.direction);
    }
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

  move(direction) {
    this.moving = true;
    this.col += direction.x;
    this.row += direction.y;

    const target = gridToPixel(this.col, this.row);

    this.scene.tweens.add({
      targets: this.sprite,
      x: target.x,
      y: target.y,
      duration: 1000 / (this.speed / TILE_SIZE),
      ease: 'Linear',
      onComplete: () => {
        this.moving = false;
      }
    });
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
