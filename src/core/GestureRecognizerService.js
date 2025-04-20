// src/core/GestureRecognizerService.js
// Импортируем из нашего локального файла
import { Point, QDollarRecognizer, NumPoints } from '../lib/qdollar-recognizer.js'; // <-- ПУТЬ К ЛОКАЛЬНОМУ ФАЙЛУ

class GestureRecognizerService {
    constructor(threshold = 0.85) { // $Q обычно очень точен, порог можно поставить выше
        // Инициализируем $Q Recognizer
        this.recognizer = new QDollarRecognizer();
        this.threshold = threshold;
        this.templatesCount = 0; // Счетчик добавленных шаблонов
        // Выведем константу NumPoints, используемую для ресэмплинга
        console.log(`$Q Recognizer Service Initialized (Resample points: ${NumPoints})`);
    }

    /**
     * Добавляет шаблон жеста в распознаватель.
     * @param {string} name Имя жеста.
     * @param {Array<object|Array>} pointsData Массив точек [{x, y}, ...] или [[x,y], ...].
     */
    addTemplate(name, pointsData) {
        if (!pointsData || pointsData.length === 0) {
            console.warn(`Skipping template "${name}": no points provided.`);
            return;
        }

        // Конвертируем точки в формат Point библиотеки $Q
        // ВАЖНО: $Q использует ID штриха. Для наших одноштриховых жестов ставим ID = 1
        const points = pointsData.map(p => {
            if (Array.isArray(p) && p.length >= 2) {
                return new Point(p[0], p[1], 1); // ID штриха = 1
            } else if (typeof p === 'object' && p !== null && 'x' in p && 'y' in p) {
                return new Point(p.x, p.y, 1);   // ID штриха = 1
            } else {
                console.warn(`Skipping invalid point data in template "${name}":`, p);
                return null;
            }
        }).filter(p => p !== null);

        if (points.length > 1) { // $Q требует минимум 2 точки для обработки
            // Используем метод AddGesture из QDollarRecognizer
            // Он теперь сам создает PointCloud внутри
            this.recognizer.AddGesture(name, points);
            this.templatesCount++;
            console.log(`Template added via Service: ${name} (${points.length} points)`);
        } else {
            console.warn(`Template "${name}" could not be added (requires >= 2 valid points).`);
        }
    }

    /**
     * Распознает жест на основе предоставленного пути пользователя.
     * @param {Array<object>} userPath Массив точек пользователя в формате [{x, y}, ...].
     * @returns {object|null} Объект с результатом { name: string, score: number } или объект с информацией об ошибке/отсутствии совпадения.
     */
    recognize(userPath) {
        // $Q требует минимум 2 точки для распознавания
        if (!userPath || userPath.length < 2) {
            console.log('Recognizer Service: Path too short (requires >= 2 points)');
            return { name: null, score: 0, error: 'Path too short' };
        }

        // Конвертируем путь пользователя в массив Point библиотеки $Q с ID штриха = 1
        const points = userPath.map(p => new Point(p.x, p.y, 1));

        // Проверяем, есть ли шаблоны
        if (this.recognizer.PointClouds.length === 0) {
            console.error('Recognizer Service: No templates loaded!');
            return { name: null, score: 0, error: 'No templates loaded' };
        }

        // Выполняем распознавание
        // Метод Recognize принимает массив Point'ов
        const result = this.recognizer.Recognize(points);

        console.log('Recognizer Service - Raw Result:', result);

        // Проверяем результат и порог уверенности
        // $Q возвращает { Name: '...', Score: ..., Time: ... } при успехе
        // и { Name: 'No match.', Score: 0.0, Time: ... } при неудаче
        if (result && result.Name !== 'No match.' && result.Score >= this.threshold) {
            // Успех! Score в $Q - это 1/d (где d - расстояние), чем ближе к 1.0, тем лучше (макс. 1.0 при d <= 1)
            // Если нужно преобразовать в диапазон [0..1], можно использовать 1 - d, но 1/d (как в коде) тоже показательно.
            // Оставим score как есть (от 0 до 1).
            return { name: result.Name, score: result.Score };
        } else {
            // Если совпадений нет или score низкий
            const lowScoreInfo = (result && result.Name !== 'No match.') ? { name: result.Name, score: result.Score } : null;
            const reason = (result && result.Name === 'No match.') ? 'No match found' : 'Score below threshold';
            return { name: null, score: 0, reason: reason, closestMatch: lowScoreInfo };
        }
    }

    getTemplateCount() {
        return this.templatesCount;
    }
}

// Экспортируем класс
export default GestureRecognizerService;