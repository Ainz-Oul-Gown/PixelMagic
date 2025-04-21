// src/scenes/GameScene.js
import Phaser from 'phaser';
// УДАЛЯЕМ импорт библиотеки распознавания отсюда
// import { OneDollarRecognizer, Point } from '$1-recognizer';
// ИМПОРТИРУЕМ наш сервис и шаблоны
import GestureRecognizerService from '../core/GestureRecognizerService'; // <-- Укажите правильный путь
import gestureTemplates from '../config/gestureTemplates'; // <-- Укажите правильный путь

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.isDrawing = false;
        this.currentPath = []; // Массив объектов {x, y}
        this.graphics = null;
        this.debugText = null;

        // ССЫЛКА на сервис распознавания (создадим его в create)
        this.gestureRecognizer = null;

        this.ysdk = window.ysdk;
    }

    // УДАЛЯЕМ метод createGestureTemplates из GameScene

    preload() {
        // ... (загрузка ассетов остается такой же) ...
        this.load.image('forest-bg', './assets/images/forest_background.png');
        this.load.image('tree', './assets/images/tree.png');
        this.load.image('flower', './assets/images/flower.png');
    }

    create() {
        // --- ИНИЦИАЛИЗАЦИЯ СЕРВИСА И ЗАГРУЗКА ШАБЛОНОВ ---
        this.gestureRecognizer = new GestureRecognizerService(0.75); // Создаем экземпляр сервиса, можно передать порог

        // Загружаем шаблоны из файла конфигурации в сервис
        gestureTemplates.forEach(template => {
            this.gestureRecognizer.addTemplate(template.name, template.points);
        });
        // -------------------------------------------------

        const { width, height } = this.scale;
        this.add.image(width * 0.5, height * 0.5, 'forest-bg');

        this.graphics = this.add.graphics().setDepth(10);
        this.setupInputHandlers(); // Настройка ввода остается здесь

        this.debugText = this.add.text(10, 10, 'Нарисуйте жест...', {
            font: '16px Arial', fill: '#ffffff', backgroundColor: 'rgba(0,0,0,0.5)'
        }).setDepth(20);

        console.log('Игровая сцена создана, сервис распознавания готов.');

        // ----- ВЫЗОВ YANDEX SDK LOADING API -----
        // Сообщаем Яндексу, что игра загрузилась и готова
        if (this.ysdk && this.ysdk.features.LoadingAPI) {
            this.ysdk.features.LoadingAPI.ready();
            console.log('Сообщение LoadingAPI.ready() отправлено.');
        } else {
            console.warn('YSДК или LoadingAPI не доступен, не могу отправить ready().');
        }
        // -----------------------------------------

    }

    // Метод update остается без изменений (если он был)
    update(time, delta) {
        // ...
    }

    // Метод setupInputHandlers остается почти без изменений,
    // он по-прежнему собирает this.currentPath и вызывает recognizeGesture
    setupInputHandlers() {
        // ... (код pointerdown, pointermove) ...
        this.input.on('pointerdown', (pointer) => {
            this.isDrawing = true;
            this.currentPath = [{ x: pointer.x, y: pointer.y }];
            this.graphics.clear();
            this.graphics.lineStyle(4, 0xffffff, 1);
            this.graphics.beginPath();
            this.graphics.moveTo(pointer.x, pointer.y);
            this.debugText.setText('Рисование...');
        });

        this.input.on('pointermove', (pointer) => {
            if (this.isDrawing) {
                const point = { x: pointer.x, y: pointer.y };
                const lastPoint = this.currentPath[this.currentPath.length - 1];
                const dx = point.x - lastPoint.x;
                const dy = point.y - lastPoint.y;
                if ((dx * dx + dy * dy) > 16) {
                    this.currentPath.push(point);
                    this.graphics.lineTo(point.x, point.y);
                    this.graphics.strokePath();
                    this.graphics.moveTo(point.x, point.y);
                }
                
            }
        });


        const handlePointerUp = (pointer) => {
            if (!this.isDrawing) return;
            this.isDrawing = false;
            // Добавляем последнюю точку
            const lastPoint = { x: pointer.x, y: pointer.y };
            // Проверяем, не совпадает ли она с предыдущей
            if (this.currentPath.length > 0) {
                const prevPoint = this.currentPath[this.currentPath.length - 1];
                if (prevPoint.x !== lastPoint.x || prevPoint.y !== lastPoint.y) {
                    this.currentPath.push(lastPoint);
                    this.graphics.lineTo(lastPoint.x, lastPoint.y);
                    this.graphics.strokePath();
                }
            } else {
                this.currentPath.push(lastPoint); // Если это была единственная точка (клик)
            }


            console.log('Путь закончен, точек:', this.currentPath.length);

            // Вызываем наш метод распознавания, который теперь использует сервис
            this.recognizeGesture(this.currentPath);
        };

        this.input.on('pointerup', handlePointerUp);
        this.input.on('pointerupoutside', handlePointerUp);
    }


    // --- ОБНОВЛЯЕМ МЕТОД РАСПОЗНАВАНИЯ В СЦЕНЕ ---
    // Этот метод теперь просто вызывает сервис и обрабатывает результат
    recognizeGesture(path) {
        // Вызываем метод recognize нашего сервиса
        const result = this.gestureRecognizer.recognize(path);

        console.log('GameScene - Recognizer Result:', result); // Лог результата от сервиса

        let recognizedSpell = null;
        // Позиция по умолчанию - конец жеста
        let spellPosition = path.length > 0 ? path[path.length - 1] : { x: this.scale.width / 2, y: this.scale.height / 2 }; // Безопасное значение по умолчанию


        if (result && result.name) { // Проверяем, что сервис вернул имя (т.е. распознал выше порога)
            recognizedSpell = result.name;
            const scorePercent = (result.score * 100).toFixed(1);
            this.debugText.setText(`Распознано: ${recognizedSpell} (${scorePercent}%)`);
            console.log(`GameScene - Распознано: ${recognizedSpell} (Score: ${scorePercent}%)`);

            // Расчет центра для круга (эта логика остается в сцене, т.к. связана с позиционированием эффекта)
            if (recognizedSpell === 'circle' && path.length > 1) {
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                path.forEach(p => {
                    minX = Math.min(minX, p.x);
                    minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x);
                    maxY = Math.max(maxY, p.y);
                });
                // Рассчитываем центр ограничивающего прямоугольника
                spellPosition = { x: minX + (maxX - minX) / 2, y: minY + (maxY - minY) / 2 };
            }

        } else {
            // Обработка нераспознанного жеста или ошибки от сервиса
            const failReason = result.closestMatch ? `(ближайший: ${result.closestMatch.name} ${(result.closestMatch.score * 100).toFixed(1)}%)` : (result.error || '');
            this.debugText.setText(`Жест не распознан ${failReason}`);
            console.log(`GameScene - Жест не распознан ${failReason}`);
        }


        // Вызов эффекта или очистка рисунка
        if (recognizedSpell) {
            this.castSpell(recognizedSpell, spellPosition); // Метод каста остается в сцене
        } else {
            this.clearDrawingSoon(); // Метод очистки остается в сцене
        }
    }
    // ------------------------------------


    // Метод castSpell остается БЕЗ ИЗМЕНЕНИЙ, он отвечает за игровые эффекты
    castSpell(spellName, position) {
        // ... (полностью копируем код castSpell из предыдущего ответа) ...
        console.log(`GameScene - Кастуем заклинание: ${spellName} в точке (${position.x.toFixed(0)}, ${position.y.toFixed(0)})`);
        this.graphics.clear(); // Очищаем жест

        let message = '';

        if (spellName === 'vertical_line') {
            const tree = this.add.sprite(position.x, position.y, 'tree');
            tree.setOrigin(0.5, 1);
            tree.setScale(0.1);
            this.tweens.add({ targets: tree, scaleX: 0.2, scaleY: 0.2, duration: 300, ease: 'Power2' });
            message = 'Дерево создано!';
        } else if (spellName === 'circle') {
            const flower = this.add.sprite(position.x, position.y, 'flower');
            flower.setOrigin(0.5, 0.5);
            flower.setScale(0.1);
            this.tweens.add({ targets: flower, scaleX: 0.6, scaleY: 0.6, angle: 360, duration: 400, ease: 'Back.easeOut' });
            message = 'Цветок расцвел!';
        } else if (spellName === 'checkmark') {
            message = 'Галочка подтверждена!';
            const checkEffect = this.add.circle(position.x, position.y, 5, 0x00ff00, 0.8).setDepth(15);
            this.tweens.add({ targets: checkEffect, radius: 30, alpha: 0, duration: 300, ease: 'Expo.easeOut', onComplete: () => { checkEffect.destroy(); } });
        } else if (spellName === 'horizontal_line') {
            message = 'Горизонтальная линия!';
            // Логика отрисовки линии может остаться здесь, так как она использует this.currentPath
            if (this.currentPath.length >= 2) {
                const startPoint = this.currentPath[0];
                const endPoint = this.currentPath[this.currentPath.length-1];
                const lineEffect = this.add.line(0, 0, startPoint.x, startPoint.y, endPoint.x, endPoint.y, 0xffff00, 0.7);
                lineEffect.setOrigin(0,0).setLineWidth(3).setDepth(15);
                this.tweens.add({ targets: lineEffect, alpha: 0, duration: 500, delay: 200, ease: 'Linear', onComplete: () => { lineEffect.destroy(); } });
            }
        } else {
            message = `Неизвестное заклинание: ${spellName}`;
        }

        if (message) {
            console.log("GameScene - " + message);
            this.debugText.setText(message);
            this.time.delayedCall(1500, () => {
                if (this.debugText.text === message) {
                    this.debugText.setText('Нарисуйте жест...');
                }
            });
        }
    }

    // Метод clearDrawingSoon остается без изменений
    clearDrawingSoon() {
        this.time.delayedCall(500, () => {
            this.graphics.clear();
            // Условие сброса текста можно упростить или убрать, если сервис уже пишет результат
            if (this.debugText.text.includes('не распознан')) {
                this.time.delayedCall(1000, () => { // Даем чуть больше времени на чтение "не распознан"
                    if (this.debugText.text.includes('не распознан')) { // Проверяем снова, вдруг пользователь уже рисует
                        this.debugText.setText('Нарисуйте жест...');
                    }
                });
            } else if (!this.debugText.text.includes('Распознано') && !this.debugText.text.includes('создано') && !this.debugText.text.includes('расцвел') && !this.debugText.text.includes('подтверждена') && !this.debugText.text.includes('линия')) {
                // Если нет сообщения об успехе, сбрасываем
                this.debugText.setText('Нарисуйте жест...');
            }
        });
    }
}