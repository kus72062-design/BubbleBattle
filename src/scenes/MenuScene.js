import * as Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0a1628);

    this.add.text(width / 2, height * 0.28, 'BUBBLE BATTLE', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '42px',
      fontStyle: 'bold',
      color: '#42a5f5'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.42, '크레이지 아케이드 스타일', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '18px',
      color: '#90caf9'
    }).setOrigin(0.5);

    const startText = this.add.text(width / 2, height * 0.58, 'ENTER 키로 시작', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '22px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1
    });

    this.add.text(width / 2, height * 0.72, '이동: 방향키 / WASD  |  물풍선: Space / Z', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '14px',
      color: '#78909c'
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.78, '모든 적을 처치하면 승리!', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '14px',
      color: '#78909c'
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-ENTER', () => {
      this.scene.start('GameScene');
    });

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
  }
}
