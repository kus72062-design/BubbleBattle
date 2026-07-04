export const TILE_SIZE = 48;
export const MAP_COLS = 15;
export const MAP_ROWS = 11;

export const TILE = {
  EMPTY: 0,
  WALL: 1,
  BLOCK: 2
};

export const DIR = {
  UP: { x: 0, y: -1, key: 'up' },
  DOWN: { x: 0, y: 1, key: 'down' },
  LEFT: { x: -1, y: 0, key: 'left' },
  RIGHT: { x: 1, y: 0, key: 'right' }
};

export const ITEM_TYPE = {
  SPEED: 'speed',
  BOMB: 'bomb',
  POWER: 'power'
};

export const PLAYER_SPEED = 140;
export const ENEMY_SPEED = 80;
export const BOMB_FUSE_MS = 2500;
export const EXPLOSION_DURATION_MS = 400;
export const BLOCK_DESTROY_CHANCE = 0.65;

export const COLORS = {
  floor: 0x5cb85c,
  floorAlt: 0x4cae4c,
  wall: 0x6d4c41,
  block: 0xd4a574,
  player: 0x2196f3,
  enemy: 0xe53935,
  bomb: 0x42a5f5,
  explosion: 0xffeb3b,
  itemSpeed: 0x00e676,
  itemBomb: 0xff5722,
  itemPower: 0xab47bc
};
