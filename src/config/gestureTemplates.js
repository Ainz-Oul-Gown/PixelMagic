// src/config/gestureTemplates.js

// Определяем шаблоны как простой массив данных
// Используем формат {x, y} для точек, так как он более читаем
const gestureTemplates = [
    {
        name: 'vertical_line',
        points: [
            { x: 0, y: 0 },
            { x: 0, y: 100 }
        ]
    },
    {
        name: 'circle',
        points: (() => { // Самовызывающаяся функция для генерации точек круга
            const circlePoints = [];
            const radius = 50;
            const numPoints = 16;
            for (let i = 0; i < numPoints; i++) {
                const angle = (Math.PI * 2 * i) / numPoints;
                circlePoints.push({
                    x: Math.round(radius * Math.cos(angle)), // Округлим для чистоты
                    y: Math.round(radius * Math.sin(angle))
                });
            }
            // Добавим первую точку в конец для замкнутости
            circlePoints.push({ x: circlePoints[0].x, y: circlePoints[0].y });
            return circlePoints;
        })()
    },
    {
        name: 'checkmark',
        points: [
            { x: 0, y: 0 },
            { x: 50, y: 50 },
            { x: 100, y: 20 }
        ]
    },
    {
        name: 'horizontal_line',
        points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 }
        ]
    }
    // --- Добавляйте сюда новые шаблоны ---
];

// Экспортируем массив шаблонов
export default gestureTemplates;