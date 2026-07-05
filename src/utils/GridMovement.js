import { TILE_SIZE } from '../config/Constants.js';
import { gridToPixel } from '../map/LevelData.js';

// 게임 시작 후 처음 호출될 때 한 번만 기준 좌표(0,0 타일의 픽셀 중심)를 계산해서 캐싱
let origin = null;

function getOrigin() {
  if (!origin) {
    origin = gridToPixel(0, 0);
  }
  return origin;
}

export function originX() {
  return getOrigin().x;
}

export function originY() {
  return getOrigin().y;
}

// 픽셀 좌표 -> 그 좌표가 속한 타일의 col/row로 변환
export function pixelToCol(x) {
  return Math.round((x - originX()) / TILE_SIZE);
}

export function pixelToRow(y) {
  return Math.round((y - originY()) / TILE_SIZE);
}

export function tileCenter(col, row) {
  return gridToPixel(col, row);
}

// 사각형 히트박스(중심 x,y / 반너비 halfW / 반높이 halfH)의 네 모서리가
// 전부 "막히지 않은" 타일 위에 있는지 검사. 하나라도 막혀있으면 false.
export function canOccupy(x, y, halfW, halfH, isBlockedFn) {
  const epsilon = 0.5; // 타일 경계 부동소수점 오차 보정용 여유값
  const left = x - halfW + epsilon;
  const right = x + halfW - epsilon;
  const top = y - halfH + epsilon;
  const bottom = y + halfH - epsilon;

  const corners = [
    [left, top],
    [right, top],
    [left, bottom],
    [right, bottom]
  ];

  return corners.every(([px, py]) => !isBlockedFn(pixelToCol(px), pixelToRow(py)));
}

// 이동 방향과 수직인 축을 가장 가까운 "레인(타일 중앙선)"으로 부드럽게 당기는 보정 속도
// -> 코너를 돌 때 몸이 벽 모서리에 걸리지 않고 자연스럽게 정렬됨
export function laneCorrectionVelocity(pos, originCoord, speed) {
  const nearestLane = originCoord + Math.round((pos - originCoord) / TILE_SIZE) * TILE_SIZE;
  const diff = nearestLane - pos;

  if (Math.abs(diff) < 0.5) {
    return 0;
  }

  const correctionSpeed = Math.min(Math.abs(diff) * 10, speed);
  return diff > 0 ? correctionSpeed : -correctionSpeed;
}