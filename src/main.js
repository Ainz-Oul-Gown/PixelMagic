import './style.css'

import { Game, AUTO } from 'phaser'
import GameScene from "./scenes/GameScene.js";

const config = {
  type: AUTO,
  parent: 'game-container', // ID DOM-элемента для игры
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT, // Масштабирование с сохранением пропорций
    autoCenter: Phaser.Scale.CENTER_BOTH // Центрирование игры
  },
  // Добавим фон для canvas на случай, если ассеты не загрузятся
  backgroundColor: '#2d2d2d',
}

const game = new Phaser.Game(config);

