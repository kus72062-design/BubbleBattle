import * as Phaser from 'phaser';
import {
  TILE_SIZE,
  MAP_COLS,
  MAP_ROWS,
  TILE,
  EXPLOSION_DURATION_MS,
  DIR
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

  create() {
    this.gameOver = false;
    this.gameWon = false;
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

    this.enemyGroup = this.physics.add.group();
    this.player = new Player(this, 1, 1);
    this.spawnEnemies();
    this.createHud();

    this.physics.add.overlap(this.player.sprite, this.enemyGroup, () => {
      if (!this.gameOver && this.player.alive) {
        this.player.kill();
      }
    });

    this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
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
      fontSize: '16px',
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
      this.enemyGroup.add(enemy.sprite);
    });
  }

  updateHud() {
    if (!this.hudText || !this.player) {
      return;
    }

    const aliveEnemies = this.enemies.filter((e) => e.alive).length;
    this.hudText.setText(
      `물풍선: ${this.player.activeBombs}/${this.player.maxBombs}  |  ` +
      `위력: ${this.player.bombPower}  |  ` +
      `적: ${aliveEnemies}`
    );
  }

  canWalk(col, row, allowThroughBomb = false, isPlayer = false) {
    if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) {
      return false;
    }

    const tile = this.grid[row][col];
    if (tile === TILE.WALL || tile === TILE.BLOCK) {
      return false;
    }

    if (!allowThroughBomb && !isPlayer && this.isBombAt(col, row)) {
      return false;
    }

    return true;
  }

  isBombAt(col, row) {
    return this.bombs.some((bomb) => !bomb.exploded && bomb.col === col && bomb.row === row);
  }

  tryPlaceBomb(col, row, owner) {
    if (this.gameOver) {
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
      this.destroyBlockAt(col, row);

      if (this.player?.alive && this.player.col === col && this.player.row === row) {
        this.player.kill();
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
    if (this.grid[row][col] !== TILE.BLOCK) {
      return;
    }

    this.grid[row][col] = TILE.EMPTY;

    const tileSprite = this.tileSprites[row][col];
    if (tileSprite) {
      tileSprite.setTexture('tile_floor');
      tileSprite.setDepth(0);
    }

    if (Phaser.Math.Between(0, 100) < 35) {
      const item = new Item(this, col, row, randomItemType());
      this.items.push(item);

      this.physics.add.overlap(this.player.sprite, item.sprite, () => {
        if (this.player?.alive && !item.collected) {
          item.collect(this.player);
          this.updateHud();
        }
      });
    }
  }

  removeItem(item) {
    this.items = this.items.filter((i) => i !== item);
  }

  onEnemyKilled() {
    this.updateHud();
    this.checkWin();
  }

  checkWin() {
    const aliveEnemies = this.enemies.filter((e) => e.alive).length;
    if (aliveEnemies === 0 && !this.gameOver) {
      this.gameWon = true;
      this.gameOver = true;
      this.statusText.setText('승리! R키로 재시작');
    }
  }

  onPlayerDeath() {
    if (this.gameOver) {
      return;
    }
    this.gameOver = true;
    this.statusText.setText('패배! R키로 재시작');
  }

  update(time, delta) {
    if (this.gameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
        this.scene.restart();
      }
      return;
    }

    this.player?.update();

    this.enemies.forEach((enemy) => {
      if (enemy.alive) {
        enemy.update(time, delta);
      }
    });

    this.items.forEach((item) => {
      if (!item.collected && item.sprite && item.sprite.active) {
        if (this.player?.col === item.col && this.player?.row === item.row && this.player?.alive) {
          item.collect(this.player);
          this.updateHud();
        }
      }
    });
  }
}
