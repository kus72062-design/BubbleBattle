import { MAP_COLS, MAP_ROWS, TILE, TILE_SIZE, BLOCK_DESTROY_CHANCE } from '../config/Constants.js';

const SPAWN_POINTS = [
  { col: 1, row: 1 },
  { col: MAP_COLS - 2, row: 1 },
  { col: 1, row: MAP_ROWS - 2 },
  { col: MAP_COLS - 2, row: MAP_ROWS - 2 }
];

function isSpawnArea(col, row) {
  return SPAWN_POINTS.some((spawn) => {
    return Math.abs(spawn.col - col) <= 1 && Math.abs(spawn.row - row) <= 1;
  });
}

export function createLevel(seed = Date.now()) {
  let random = seed;
  const nextRandom = () => {
    random = (random * 9301 + 49297) % 233280;
    return random / 233280;
  };

  const grid = [];

  for (let row = 0; row < MAP_ROWS; row++) {
    grid[row] = [];
    for (let col = 0; col < MAP_COLS; col++) {
      const isBorder = row === 0 || row === MAP_ROWS - 1 || col === 0 || col === MAP_COLS - 1;
      const isFixedWall = !isBorder && row % 2 === 0 && col % 2 === 0;

      if (isBorder || isFixedWall) {
        grid[row][col] = TILE.WALL;
      } else if (isSpawnArea(col, row)) {
        grid[row][col] = TILE.EMPTY;
      } else if (nextRandom() < BLOCK_DESTROY_CHANCE) {
        grid[row][col] = TILE.BLOCK;
      } else {
        grid[row][col] = TILE.EMPTY;
      }
    }
  }

  return { grid, spawnPoints: SPAWN_POINTS };
}

export function gridToPixel(col, row) {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2
  };
}

export function pixelToGrid(x, y) {
  return {
    col: Math.floor(x / TILE_SIZE),
    row: Math.floor(y / TILE_SIZE)
  };
}
