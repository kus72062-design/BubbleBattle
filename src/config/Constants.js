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
  POWER: 'power',
  // ★ 추가: 스테이지 전용 1회용 아이템
  NEEDLE: 'needle'
};

export const PLAYER_SPEED = 140;
export const ENEMY_SPEED = 80;
export const BOMB_FUSE_MS = 2500;
export const EXPLOSION_DURATION_MS = 400;
export const BLOCK_DESTROY_CHANCE = 0.65;

// ★ 추가: 폭탄 위력(십자 팔 길이) 최대치. 0이면 설치 칸 1칸만 폭발(1x1)
export const MAX_BOMB_POWER = 6;

// ★ 추가: 블록 파괴 시 아이템이 드랍될 확률(%)
export const ITEM_DROP_CHANCE = 35;

// ★ 추가: trapped 상태 지속 시간 (이 시간이 지나면 사망)
export const TRAPPED_DURATION_MS = 4000;

// ★ 추가: 스테이지 클리어 후 다음 스테이지로 자동 전환되기까지의 대기 시간
export const STAGE_CLEAR_DELAY_MS = 2500;

// ★ 추가: 총 스테이지 수
export const TOTAL_STAGES = 5;

// ★ 추가: 적 AI 방향 재판단 주기(ms) - 플레이어 추적 반응성을 위해 기존보다 짧게
export const ENEMY_DECISION_INTERVAL_MS = 500;

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
  itemPower: 0xab47bc,
  // ★ 추가
  itemNeedle: 0xffffff,
  trapBubble: 0x81d4fa
};