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

    // ★ 추가: col/row <-> 픽셀 좌표 변환 기준점
    this.originPos = gridToPixel(0, 0);

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      bomb: Phaser.Input.Keyboard.KeyCodes.SPACE,
      bombAlt: Phaser.Input.Keyboard.KeyCodes.Z
    });

    // ★ 추가: 가장 최근에 누른 방향키가 항상 우선 적용되는 방향 스택
    this.directionStack = [];

    const bindDirection = (key, dir) => {
      key.on('down', () => {
        this.directionStack = this.directionStack.filter((d) => d !== dir);
        this.directionStack.push(dir);
      });
      key.on('up', () => {
        this.directionStack = this.directionStack.filter((d) => d !== dir);
      });
    };

    bindDirection(this.cursors.up, DIR.UP);
    bindDirection(this.keys.up, DIR.UP);
    bindDirection(this.cursors.down, DIR.DOWN);
    bindDirection(this.keys.down, DIR.DOWN);
    bindDirection(this.cursors.left, DIR.LEFT);
    bindDirection(this.keys.left, DIR.LEFT);
    bindDirection(this.cursors.right, DIR.RIGHT);
    bindDirection(this.keys.right, DIR.RIGHT);
  }

  // ★ 변경: GameScene에서 update(time, delta)로 호출하도록 파라미터 추가
  update(time, delta) {
    if (!this.alive) {
      this.sprite.setVelocity(0, 0);
      return;
    }

    this.updateGridPosition();

    const direction = this.directionStack[this.directionStack.length - 1] || null;

    let vx = 0;
    let vy = 0;

    // ★ 추가: 이동 방향과 수직인 축을 타일 중앙으로 계속 부드럽게 당겨줌
    // -> 코너(벽 모서리)에서 몸통이 걸리지 않고 자연스럽게 턴이 됨
    if (direction) {
      if (direction.x !== 0) {
        vx = direction.x * this.speed;
        vy = this.getAlignCorrection(this.sprite.y, this.originPos.y);
      } else if (direction.y !== 0) {
        vy = direction.y * this.speed;
        vx = this.getAlignCorrection(this.sprite.x, this.originPos.x);
      }
    }

    this.sprite.setVelocity(vx, vy);

    if (Phaser.Input.Keyboard.JustDown(this.keys.bomb) || Phaser.Input.Keyboard.JustDown(this.keys.bombAlt)) {
      this.scene.tryPlaceBomb(this.col, this.row, this);
    }
  }

  // ★ 추가: 현재 좌표를 가장 가까운 타일 중앙으로 당기는 보정 속도 계산
  // (스프링처럼 동작 - 어긋난 정도에 비례해서 당기되 최대 speed로 제한)
  getAlignCorrection(pos, originCoord) {
    const nearest = originCoord + Math.round((pos - originCoord) / TILE_SIZE) * TILE_SIZE;
    const diff = nearest - pos;
    const correctionSpeed = this.speed;
    return Phaser.Math.Clamp(diff * 8, -correctionSpeed, correctionSpeed);
  }

  updateGridPosition() {
    const offsetX = this.sprite.x - this.originPos.x;
    const offsetY = this.sprite.y - this.originPos.y;
    this.col = Math.round(offsetX / TILE_SIZE);
    this.row = Math.round(offsetY / TILE_SIZE);
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
    this.sprite.setVelocity(0, 0);
    this.sprite.setTint(0x555555);
    this.sprite.anims?.stop();
    this.scene.onPlayerDeath();
  }

  destroy() {
    this.sprite.destroy();
  }
}