const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Раздача статических файлов
app.use(express.static(__dirname));

// Функция для сканирования MP3 файлов
function scanForMp3Files() {
    const audioDir = path.join(__dirname, 'audio');
    
    // Создаем папку audio если её нет
    if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir);
    }
    
    try {
        const files = fs.readdirSync(audioDir);
        return files
            .filter(file => file.toLowerCase().endsWith('.mp3'))
            .map(file => ({
                file: file,
                // Генерируем случайный цвет в формате HSL
                color: `hsl(${Math.random() * 360}, 70%, 70%)`
            }));
    } catch (error) {
        console.error('Ошибка при сканировании MP3 файлов:', error);
        return [];
    }
}

// API endpoint для получения списка треков
app.get('/api/tracks', (req, res) => {
    const tracks = scanForMp3Files();
    res.json(tracks);
});

// Маршрут для главной страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log('Доступные MP3 файлы:', scanForMp3Files().map(t => t.file).join(', '));
}); 