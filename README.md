# Bubble Battle

크레이지 아케이드 스타일 버블 배틀 게임 (Phaser 3)

## 실행 방법

### 방법 1 — npm (권장)

```bash
npm start
```

브라우저에서 http://localhost:3000 접속

### 방법 2 — Python 내장 서버

```bash
python -m http.server 3000
```

브라우저에서 http://localhost:3000 접속

### 방법 3 — VS Code Live Server

`index.html` 우클릭 → **Open with Live Server**

> ES Module 사용으로 `file://` 직접 열기는 동작하지 않습니다. 반드시 로컬 서버를 사용하세요.

## 조작

| 키 | 동작 |
|---|---|
| 방향키 / WASD | 이동 |
| Space / Z | 물풍선 설치 |
| R | 재시작 (게임 오버 시) |
| Enter | 시작 (메뉴) |

## 목표

- 모든 적을 물풍선 폭발로 처치하면 승리
- 폭발 또는 적에게 닿으면 패배

## 폴더 구조

```
BubbleBattle/
├── index.html
├── package.json
├── README.md
└── src/
    ├── main.js
    ├── config/
    │   └── Constants.js
    ├── map/
    │   └── LevelData.js
    ├── entities/
    │   ├── Player.js
    │   ├── Enemy.js
    │   ├── Bomb.js
    │   └── Item.js
    └── scenes/
        ├── BootScene.js
        ├── MenuScene.js
        └── GameScene.js
```
