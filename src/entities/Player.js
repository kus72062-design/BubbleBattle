console.log('★★★ Player.js LOADED v5 (trapped system) ★★★');

import * as Phaser from 'phaser';
import {
  PLAYER_SPEED,
  DIR,
  ITEM_TYPE,
  MAX_BOMB_POWER,
  TRAPPED_DURATION_MS
} from '../config/Constants.js';
import { gridToPixel } from '../map/LevelData.js';
import {
  pixelToCol,
  pixelToRow,
  canOccupy,
  laneCorrectionVelocity,
  originX,
  originY
} from '../utils/GridMovement.js';

const HALF_W = 14;
const HALF_H = 14;

export default class Player {
  constructor(scene, col, row) {
    this.scene = scene;
    this.col = col;
    this.row = row;

    // ★ 변경: alive 불리언 대신 상태머신 사용 (normal / trapped / dead)
    this.state = 'normal';

    this.speed = PLAYER_SPEED;
    this.maxBombs = 1;
    // ★ 변경: 기본 폭발 범위 1x1 (십자 팔 길이 0 = 설치 칸만 폭발)
    this.bombPower = 1;
    this.activeBombs = 0;

    // ★ 변경: 박스 드랍이 아니라 스테이지 시작 시 기본 1개 보유
    this.hasNeedle = true;
    this.trapTimer = null;
    this.trapTween = null;

    const pos = gridToPixel(col, row);
    this.sprite = scene.add.sprite(pos.x, pos.y, 'player');
    this.sprite.setDepth(10);

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      bomb: Phaser.Input.Keyboard.KeyCodes.SPACE,
      bombAlt: Phaser.Input.Keyboard.KeyCodes.Z,
      // ★ 추가: 바늘 사용 키
      needle: Phaser.Input.Keyboard.KeyCodes.ONE,
      needleAlt: Phaser.Input.Keyboard.KeyCodes.CTRL
    });

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

  // ★ 추가: 기존 코드 곳곳에서 player.alive를 참조하므로 호환용 getter 제공
  // (dead가 아니면 true - trapped도 "아직 살아있는" 상태로 취급)
  get alive() {
    return this.state !== 'dead';
  }

  isBlocked(col, row) {
    return !this.scene.isEntityWalkable(col, row, this);
  }

  update(time, delta) {
    if (this.state === 'dead') {
      return;
    }

    // ★ 추가: 바늘 사용 판정은 trapped 상태에서도 매 프레임 체크
    if (Phaser.Input.Keyboard.JustDown(this.keys.needle) || Phaser.Input.Keyboard.JustDown(this.keys.needleAlt)) {
      this.useNeedle();
    }

    // ★ 추가: trapped 상태에서는 이동/폭탄설치 완전 정지
    if (this.state === 'trapped') {
      return;
    }

    const deltaSec = delta / 1000;
    const direction = this.directionStack[this.directionStack.length - 1] || null;

    if (direction) {
      if (direction.x !== 0) {
        this.moveAxis('x', direction.x * this.speed * deltaSec);
        const vy = laneCorrectionVelocity(this.sprite.y, originY(), this.speed);
        this.moveAxis('y', vy * deltaSec);
      } else if (direction.y !== 0) {
        this.moveAxis('y', direction.y * this.speed * deltaSec);
        const vx = laneCorrectionVelocity(this.sprite.x, originX(), this.speed);
        this.moveAxis('x', vx * deltaSec);
      }
    }

    this.col = pixelToCol(this.sprite.x);
    this.row = pixelToRow(this.sprite.y);

    if (Phaser.Input.Keyboard.JustDown(this.keys.bomb) || Phaser.Input.Keyboard.JustDown(this.keys.bombAlt)) {
      this.scene.tryPlaceBomb(this.col, this.row, this);
    }
  }

  moveAxis(axis, amount) {
    if (amount === 0) {
      return;
    }

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
    }
  }

  onBombExploded() {
    this.activeBombs = Math.max(0, this.activeBombs - 1);
  }

  applyItem(type) {
    switch (type) {
      case ITEM_TYPE.SPEED:
        this.speed = Math.min(this.speed + 25, 260);
        break;
      case ITEM_TYPE.BOMB:
        this.maxBombs = Math.min(this.maxBombs + 1, 8);
        break;
      case ITEM_TYPE.POWER:
        this.bombPower = Math.min(this.bombPower + 1, MAX_BOMB_POWER);
        break;
      case ITEM_TYPE.NEEDLE:
        // ★ 추가: 이미 보유 중이면 중복 획득 무시 (스테이지당 1회 사용 컨셉 유지)
        this.hasNeedle = true;
        break;
      default:
        break;
    }
  }

  // ★ 추가: 폭발/적 접촉 등 "피격" 발생 시 호출. 즉사 대신 trapped로 전환
  trap() {
    if (this.state !== 'normal') {
      return;
    }

    this.state = 'trapped';
    this.sprite.setTexture('player_trapped');

    // 물풍선 안에 갇힌 느낌의 미세한 통통 튀는 애니메이션
    this.trapTween = this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.08,
      scaleY: 0.92,
      duration: 350,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.trapTimer = this.scene.time.delayedCall(TRAPPED_DURATION_MS, () => {
      this.die();
    });
  }

  // ★ 추가: 바늘로 trapped 상태에서 즉시 탈출
  useNeedle() {
    if (!this.hasNeedle || this.state !== 'trapped') {
      return;
    }

    this.hasNeedle = false;
    this.releaseFromTrap();
  }

  releaseFromTrap() {
    if (this.trapTimer) {
      this.trapTimer.remove(false);
      this.trapTimer = null;
    }
    if (this.trapTween) {
      this.trapTween.stop();
      this.trapTween = null;
    }
    this.sprite.setScale(1);
    this.sprite.setTexture('player');
    this.state = 'normal';
  }

  die() {
    if (this.state === 'dead') {
      return;
    }

    if (this.trapTimer) {
      this.trapTimer.remove(false);
      this.trapTimer = null;
    }
    if (this.trapTween) {
      this.trapTween.stop();
      this.trapTween = null;
    }

    this.state = 'dead';
    this.sprite.setTexture('player');
    this.sprite.setScale(1);
    this.sprite.setTint(0x555555);
    this.sprite.anims?.stop();
    this.scene.onPlayerDeath();
  }

  destroy() {
    if (this.trapTimer) {
      this.trapTimer.remove(false);
    }
    if (this.trapTween) {
      this.trapTween.stop();
    }
    this.sprite.destroy();
  }
}