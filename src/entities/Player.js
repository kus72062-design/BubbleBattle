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
    // ★ 삭제: this.moving 플래그는 더 이상 사용하지 않음 (타일 단위 이동 락 제거)
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

    // ★ 추가: (0,0) 좌표의 픽셀 위치를 기준점으로 저장해서
    // 이후 현재 픽셀 위치 -> col/row 역산에 사용
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

    // ★ 추가: 방향 스택 방식으로 입력 처리
    // 가장 "최근에 누른" 방향키가 항상 우선 적용되고,
    // 그 키를 떼면 그 전에 누르고 있던 다른 방향키로 즉시 복귀함.
    // (크아처럼 이동 중에도 바로바로 방향 전환되는 느낌의 핵심)
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

  update() {
    if (!this.alive) {
      // ★ 죽은 상태에서는 속도를 0으로 고정
      this.sprite.setVelocity(0, 0);
      return;
    }

    // ★ 매 프레임 실제 픽셀 위치 기준으로 col/row 갱신 (폭탄 설치 등에 사용)
    this.updateGridPosition();

    // ★ 변경: tryMove(타일 단위 트윈 이동) 대신
    // 방향 스택 최상단 방향으로 매 프레임 velocity를 직접 설정 -> 연속 이동
    const direction = this.directionStack[this.directionStack.length - 1] || null;

    if (direction) {
      this.sprite.setVelocity(direction.x * this.speed, direction.y * this.speed);
    } else {
      this.sprite.setVelocity(0, 0);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.bomb) || Phaser.Input.Keyboard.JustDown(this.keys.bombAlt)) {
      this.scene.tryPlaceBomb(this.col, this.row, this);
    }
  }

  // ★ 추가: 현재 스프라이트의 픽셀 좌표를 기준으로 col/row를 역산
  updateGridPosition() {
    const offsetX = this.sprite.x - this.originPos.x;
    const offsetY = this.sprite.y - this.originPos.y;
    this.col = Math.round(offsetX / TILE_SIZE);
    this.row = Math.round(offsetY / TILE_SIZE);
  }

  // ★ 삭제: tryMove(direction) 메서드 전체 제거
  // (타일 단위 트윈 이동 로직은 더 이상 필요 없음 - 벽 충돌은
  // GameScene에서 physics collider로 처리)

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
    // ★ 추가: 죽는 순간 즉시 정지
    this.sprite.setVelocity(0, 0);
    this.sprite.setTint(0x555555);
    this.sprite.anims?.stop();
    this.scene.onPlayerDeath();
  }

  destroy() {
    this.sprite.destroy();
  }
}