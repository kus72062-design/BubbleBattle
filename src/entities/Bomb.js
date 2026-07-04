import { BOMB_FUSE_MS, TILE_SIZE } from '../config/Constants.js';
import { gridToPixel } from '../map/LevelData.js';

export default class Bomb {
  constructor(scene, col, row, owner) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.owner = owner;
    this.exploded = false;

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

  explode() {
    if (this.exploded) {
      return;
    }
    this.exploded = true;
    this.sprite.destroy();
    this.scene.triggerExplosion(this.col, this.row, this.owner.bombPower, this.owner);
  }
}
