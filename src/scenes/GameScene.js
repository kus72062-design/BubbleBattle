console.log('★★★ GameScene.js LOADED v5 (stage system + trapped) ★★★');

import * as Phaser from 'phaser';
import {
  TILE_SIZE,
  MAP_COLS,
  MAP_ROWS,
  TILE,
  EXPLOSION_DURATION_MS,
  DIR,
  ITEM_DROP_CHANCE,
  STAGE_CLEAR_DELAY_MS,
  TOTAL_STAGES
} from '../config/Constants.js';
import { createLevel, gridToPixel } from '../map/LevelData.js';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import Bomb from '../entities/Bomb.js';
import Item, { randomItemType } from '../entities/Item.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  // ★ 추가: scene.restart({ stage: n })으로 전달받은 스테이지 번호를 기억
  // (없으면 1스테이지부터 시작)
  init(data) {
    this.currentStage = (data && data.stage) || 1;
  }

  create() {
    // ★ 추가: 씬 진행 단계 상태머신 ('playing' | 'clearing' | 'dead' | 'complete')
    this.phase = 'playing';

    this.grid = [];
    this.tileSprites = [];
    this.bombs = [];
    this.items = [];
    this.enemies = [];
    this.explosionCells = new Set();
    this.explosionSprites = [];
    this.player = null;

    const level = createLevel();
    this.grid = level.grid;

    this.drawMap();
    this.player = new Player(this, 1, 1);
    this.spawnEnemies();
    this.createHud();

    this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // ★ 추가: 스테이지 시작 안내 텍스트 (잠깐 표시 후 자동으로 사라짐)
    this.statusText.setText(`STAGE ${this.currentStage}`);
    this.time.delayedCall(1200, () => {
      if (this.phase === 'playing') {
        this.statusText.setText('');
      }
    });
  }

  drawMap() {
    for (let row = 0; row < MAP_ROWS; row++) {
      this.tileSprites[row] = [];
      for (let col = 0; col < MAP_COLS; col++) {
        const pos = gridToPixel(col, row);
        const tile = this.grid[row][col];
        let key = 'tile_floor';

        if (tile === TILE.WALL) {
          key = 'tile_wall';
        } else if (tile === TILE.BLOCK) {
          key = 'tile_block';
        }

        const sprite = this.add.image(pos.x, pos.y, key);
        sprite.setDepth(tile === TILE.WALL ? 1 : 0);
        this.tileSprites[row][col] = sprite;
      }
    }
  }

  createHud() {
    const hudY = MAP_ROWS * TILE_SIZE + 20;

    this.hudBg = this.add.rectangle(
      MAP_COLS * TILE_SIZE / 2,
      hudY,
      MAP_COLS * TILE_SIZE,
      60,
      0x102027
    ).setDepth(100);

    this.hudText = this.add.text(16, hudY - 12, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '15px',
      color: '#ffffff'
    }).setDepth(101);

    this.statusText = this.add.text(MAP_COLS * TILE_SIZE / 2, hudY - 12, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '16px',
      color: '#ffeb3b'
    }).setOrigin(0.5, 0).setDepth(101);

    this.updateHud();
  }

  spawnEnemies() {
    const spawnPoints = [
      { col: MAP_COLS - 2, row: 1 },
      { col: 1, row: MAP_ROWS - 2 },
      { col: MAP_COLS - 2, row: MAP_ROWS - 2 }
    ];

    spawnPoints.forEach((spawn) => {
      const enemy = new Enemy(this, spawn.col, spawn.row);
      this.enemies.push(enemy);
    });
  }

  updateHud() {
    if (!this.hudText || !this.player) {
      return;
    }

    const aliveEnemies = this.enemies.filter((e) => e.alive).length;
    const needleText = this.player.hasNeedle ? '바늘 보유(1/Ctrl)' : '바늘 없음';

    this.hudText.setText(
      `STAGE ${this.currentStage}/${TOTAL_STAGES}  |  ` +
      `물풍선: ${this.player.activeBombs}/${this.player.maxBombs}  |  ` +
      `위력: ${this.player.bombPower}  |  ` +
      `적: ${aliveEnemies}  |  ${needleText}`
    );
  }

  canWalk(col, row) {
    if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) {
      return false;
    }
    const tile = this.grid[row][col];
    return tile !== TILE.WALL && tile !== TILE.BLOCK;
  }

  isBombAt(col, row) {
    return this.bombs.some((bomb) => !bomb.exploded && bomb.col === col && bomb.row === row);
  }

  isEntityWalkable(col, row, entity) {
    if (!this.canWalk(col, row)) {
      return false;
    }

    const bomb = this.bombs.find((b) => !b.exploded && b.col === col && b.row === row);
    if (bomb && !bomb.isExempt(entity)) {
      return false;
    }

    return true;
  }

  // ★ 추가: 아직 터지지 않은 모든 폭탄들의 "폭발 예정 범위"를 모은 위험 지역 집합
  // 적 AI의 폭탄 회피 판단에 사용됨
  getDangerCells() {
    const danger = new Set();

    this.bombs.forEach((bomb) => {
      if (bomb.exploded) {
        return;
      }
      const cells = this.getExplosionCells(bomb.col, bomb.row, bomb.owner.bombPower);
      cells.forEach(({ col, row }) => danger.add(`${col},${row}`));
    });

    return danger;
  }

  tryPlaceBomb(col, row, owner) {
    if (this.phase !== 'playing') {
      return;
    }

    if (owner.activeBombs >= owner.maxBombs) {
      return;
    }

    if (this.isBombAt(col, row)) {
      return;
    }

    const bomb = new Bomb(this, col, row, owner);
    this.bombs.push(bomb);
    owner.activeBombs += 1;
    this.updateHud();
  }

  triggerExplosion(centerCol, centerRow, power, owner) {
    const cells = this.getExplosionCells(centerCol, centerRow, power);

    cells.forEach(({ col, row }) => {
      this.showExplosionAt(col, row);
      this.explosionCells.add(`${col},${row}`);
    });

    this.chainReaction(centerCol, centerRow, power);
    this.damageAtCells(cells);

    if (owner && owner.onBombExploded) {
      owner.onBombExploded();
    }

    this.bombs = this.bombs.filter((b) => !b.exploded);

    this.time.delayedCall(EXPLOSION_DURATION_MS, () => {
      cells.forEach(({ col, row }) => {
        this.explosionCells.delete(`${col},${row}`);
      });
      this.explosionSprites.forEach((s) => s.destroy());
      this.explosionSprites = [];
      this.updateHud();
    });

    this.updateHud();
  }

  getExplosionCells(centerCol, centerRow, power) {
    const cells = [{ col: centerCol, row: centerRow }];
    const directions = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];

    directions.forEach((dir) => {
      for (let i = 1; i <= power; i++) {
        const col = centerCol + dir.x * i;
        const row = centerRow + dir.y * i;

        if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) {
          break;
        }

        const tile = this.grid[row][col];
        cells.push({ col, row });

        if (tile === TILE.WALL) {
          break;
        }
        if (tile === TILE.BLOCK) {
          break;
        }
      }
    });

    return cells;
  }

  chainReaction(centerCol, centerRow, power) {
    const hitBombs = this.bombs.filter((bomb) => {
      if (bomb.exploded) {
        return false;
      }
      return this.explosionCells.has(`${bomb.col},${bomb.row}`);
    });

    hitBombs.forEach((bomb) => {
      bomb.exploded = true;
      bomb.sprite.destroy();
      const chainCells = this.getExplosionCells(bomb.col, bomb.row, bomb.owner.bombPower);
      chainCells.forEach(({ col, row }) => {
        this.showExplosionAt(col, row);
        this.explosionCells.add(`${col},${row}`);
      });
      this.damageAtCells(chainCells);
      if (bomb.owner && bomb.owner.onBombExploded) {
        bomb.owner.onBombExploded();
      }
    });
  }

  showExplosionAt(col, row) {
    const pos = gridToPixel(col, row);
    const sprite = this.add.sprite(pos.x, pos.y, 'explosion');
    sprite.setDepth(8);
    sprite.setAlpha(0.9);
    this.explosionSprites.push(sprite);
  }

  damageAtCells(cells) {
    cells.forEach(({ col, row }) => {
      if (this.grid[row][col] === TILE.BLOCK) {
        this.destroyBlockAt(col, row);
      }

      // ★ 변경: 즉사(kill) 대신 trapped 전환(trap)
      if (this.player && this.player.state === 'normal' && this.player.col === col && this.player.row === row) {
        this.player.trap();
      }

      this.enemies.forEach((enemy) => {
        if (enemy.alive && enemy.col === col && enemy.row === row) {
          enemy.kill();
        }
      });

      this.items.forEach((item) => {
        if (!item.collected && item.col === col && item.row === row) {
          item.destroy();
          item.collected = true;
        }
      });
    });

    this.items = this.items.filter((item) => !item.collected);
    this.checkWin();
  }

  destroyBlockAt(col, row) {
    console.log('1️⃣ destroyBlockAt 호출됨', col, row);
    console.log('2️⃣ grid 값:', this.grid[row][col], 'TILE.BLOCK:', TILE.BLOCK);
    if (this.grid[row][col] !== TILE.BLOCK) {
      return;
    }

    this.grid[row][col] = TILE.EMPTY;

    const tileSprite = this.tileSprites[row][col];
    if (tileSprite) {
      tileSprite.setTexture('tile_floor');
      tileSprite.setDepth(0);
    }

    // ★ 변경: 하드코딩된 35 대신 Constants의 ITEM_DROP_CHANCE 사용
    if (Phaser.Math.Between(0, 100) < ITEM_DROP_CHANCE) {
      const item = new Item(this, col, row, randomItemType());
      this.items.push(item);
    }
  }

  removeItem(item) {
    this.items = this.items.filter((i) => i !== item);
  }

  onEnemyKilled() {
    this.updateHud();
    this.checkWin();
  }

  // ★ 변경: 클리어 시 즉시 gameOver 처리하지 않고, 안내 후 자동 스테이지 전환
  checkWin() {
    if (this.phase !== 'playing') {
      return;
    }

    const aliveEnemies = this.enemies.filter((e) => e.alive).length;
    if (aliveEnemies === 0) {
      this.phase = 'clearing';
      const isFinalStage = this.currentStage >= TOTAL_STAGES;

      this.statusText.setText(isFinalStage ? '게임 클리어!' : `STAGE ${this.currentStage} 클리어!`);

      this.time.delayedCall(STAGE_CLEAR_DELAY_MS, () => {
        if (isFinalStage) {
          this.phase = 'complete';
          this.statusText.setText('축하합니다! 모든 스테이지 클리어! R키로 처음부터');
        } else {
          // ★ 핵심: 다음 스테이지로 - 맵/적/플레이어 전부 새로 생성되고
          // Player가 새 인스턴스로 만들어지므로 업그레이드는 자동으로 초기화됨
          this.scene.restart({ stage: this.currentStage + 1 });
        }
      });
    }
  }

  // ★ 변경: 사망 시 같은 스테이지 번호를 유지한 채 재시작 대기
  onPlayerDeath() {
    if (this.phase !== 'playing') {
      return;
    }
    this.phase = 'dead';
    this.statusText.setText(`STAGE ${this.currentStage} 패배! R키로 재시작`);
  }

  // ★ 변경: 즉사(kill) 대신 trapped 전환(trap)
  checkPlayerEnemyCollision() {
    if (!this.player || this.player.state !== 'normal') {
      return;
    }

    const hit = this.enemies.some((enemy) => {
      if (!enemy.alive) {
        return false;
      }
      return Math.abs(this.player.sprite.x - enemy.sprite.x) < 24 &&
             Math.abs(this.player.sprite.y - enemy.sprite.y) < 24;
    });

    if (hit) {
      this.player.trap();
    }
  }

  checkItemPickup() {
    if (!this.player || this.player.state !== 'normal') {
      return;
    }

    this.items.forEach((item) => {
      if (!item.collected && item.sprite && item.sprite.active &&
          this.player.col === item.col && this.player.row === item.row) {
        item.collect(this.player);
        item.collected = true;
        this.updateHud();
      }
    });

    this.items = this.items.filter((item) => !item.collected);
  }

  update(time, delta) {
    // ★ 변경: 'dead' / 'complete' 상태에서만 R키로 재시작 (같은 스테이지 유지, complete는 1스테이지로)
    if (this.phase !== 'playing') {
      if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
        if (this.phase === 'dead') {
          this.scene.restart({ stage: this.currentStage });
        } else if (this.phase === 'complete') {
          this.scene.restart({ stage: 1 });
        }
      }
      return;
    }

    this.player?.update(time, delta);

    this.enemies.forEach((enemy) => {
      if (enemy.alive) {
        enemy.update(time, delta);
      }
    });

    this.bombs.forEach((bomb) => {
      bomb.checkExit();
    });

    this.checkPlayerEnemyCollision();
    this.checkItemPickup();
  }
}