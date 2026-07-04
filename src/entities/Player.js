import * as Phaser from 'phaser';
import {
  TILE_SIZE,
  PLAYER_SPEED,
  DIR,
  ITEM_TYPE
} from '../config/Constants.js';
import { gridToPixel } from '../map/LevelData.js';

export default class Player {
  constructor(scene, col, row) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.alive = true;
    this.moving = false;
    this.speed = PLAYER_SPEED;
    this.maxBombs = 1;
    this.bombPower = 2;
    this.activeBombs = 0;

    const pos = gridToPixel(col, row);
    this.sprite = scene.physics.add.sprite(pos.x, pos.y, 'player');
    this.sprite.setDepth(10);
    this.sprite.body.setSize(28, 28);
    this.sprite.body.setOffset(10, 12);
    this.sprite.setCollideWorldBounds(false);

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      bomb: Phaser.Input.Keyboard.KeyCodes.SPACE,
      bombAlt: Phaser.Input.Keyboard.KeyCodes.Z
    });
  }

  update() {
    if (!this.alive || this.moving) {
      return;
    }

    let direction = null;

    if (this.cursors.up.isDown || this.keys.up.isDown) {
      direction = DIR.UP;
    } else if (this.cursors.down.isDown || this.keys.down.isDown) {
      direction = DIR.DOWN;
    } else if (this.cursors.left.isDown || this.keys.left.isDown) {
      direction = DIR.LEFT;
    } else if (this.cursors.right.isDown || this.keys.right.isDown) {
      direction = DIR.RIGHT;
    }

    if (direction) {
      this.tryMove(direction);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.bomb) || Phaser.Input.Keyboard.JustDown(this.keys.bombAlt)) {
      this.scene.tryPlaceBomb(this.col, this.row, this);
    }
  }

  tryMove(direction) {
    const nextCol = this.col + direction.x;
    const nextRow = this.row + direction.y;

    if (!this.scene.canWalk(nextCol, nextRow, false, true)) {
      return;
    }

    this.moving = true;
    this.col = nextCol;
    this.row = nextRow;

    const target = gridToPixel(nextCol, nextRow);

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

  onBombExploded() {
    this.activeBombs = Math.max(0, this.activeBombs - 1);
  }

  applyItem(type) {
    switch (type) {
      case ITEM_TYPE.SPEED:
        this.speed = Math.min(this.speed + 25, 220);
        break;
      case ITEM_TYPE.BOMB:
        this.maxBombs = Math.min(this.maxBombs + 1, 5);
        break;
      case ITEM_TYPE.POWER:
        this.bombPower = Math.min(this.bombPower + 1, 8);
        break;
      default:
        break;
    }
  }

  kill() {
    if (!this.alive) {
      return;
    }
    this.alive = false;
    this.sprite.setTint(0x555555);
    this.sprite.anims?.stop();
    this.scene.onPlayerDeath();
  }

  destroy() {
    this.sprite.destroy();
  }
}
