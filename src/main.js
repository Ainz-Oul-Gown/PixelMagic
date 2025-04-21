import './style.css'
import GameScene from "./scenes/GameScene.js";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  scene: [GameScene], // Пока только одна сцена
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  backgroundColor: '#2d2d2d'
};

// src/main.js
async function initializeYandexSDK() {
  try {
    console.log('>>> Перед YaGames.init()'); // <-- НОВЫЙ ЛОГ
    const ysdk = await YaGames.init();
    console.log('>>> ПОСЛЕ YaGames.init()', ysdk); // <-- НОВЫЙ ЛОГ

    window.ysdk = ysdk;
    console.log('Яндекс Игры SDK успешно инициализирован!');

    console.log('>>> Перед new Phaser.Game()'); // <-- НОВЫЙ ЛОГ
    const game = new Phaser.Game(config);
    console.log('>>> ПОСЛЕ new Phaser.Game()', game); // <-- НОВЫЙ ЛОГ

    console.log('Игра Phaser создана.');

  } catch (error) {
    console.error('>>> ОШИБКА в initializeYandexSDK:', error); // <-- Улучшенный лог ошибки
    // Попробуйте залогировать и тип ошибки
    console.error('>>> Тип ошибки:', Object.prototype.toString.call(error));
    // Если есть stack trace, он тоже важен
    if (error instanceof Error) {
      console.error('>>> Stack:', error.stack);
    }
  }
}
// Добавьте лог и перед вызовом функции
console.log(">>> Вызов initializeYandexSDK()...");
initializeYandexSDK();

const game = new Phaser.Game(config);

