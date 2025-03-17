/**
 * SOYUZ - Творческое объединение
 * Инновационный подход к представлению звука
 */

// Глобальный объект приложения
const SOYUZ = {
    // Аудио компоненты
    audio: {
        context: null,
        analyzer: null,
        gainNode: null,
        dataArray: null,
        bufferLength: null,
        currentTrack: null,
        isPlaying: false,
        progressTimer: null,
        demoMode: false,
        demoProgress: 0,
        
        // Коллекция треков (будет заполнена автоматически)
        tracks: [],
        
        // Пользовательские треки (загруженные)
        userTracks: [],
        
        // Дополнительные свойства
        currentTrackPath: null,
        currentTrackIndex: null,
        
        // Аудио элемент
        element: null
    },
    
    // UI элементы
    ui: {
        // Канвасы для визуализации
        visualizationCanvas: null,
        visualizationCtx: null,
        
        // Плеер
        player: null,
        playBtn: null,
        prevBtn: null,
        nextBtn: null,
        trackInfo: null,
        
        // Загрузка файлов - отключено для посетителей
        uploadZone: null,
        
        // Контейнер файлов
        container: null,
        
        // Анимация
        animationFrameId: null,
        
        // Новые элементы для нового прогрессбара
        progressContainer: null,
        progressBar: null,
        progressMarker: null,
        waveform: null
    },
    
    // Настройки
    settings: {
        colors: {
            primary: '#ffffff',
            accent: '#555555',
            background: '#f8f8f8'
        },
        visualization: {
            sensitivity: 2.5,
            noiseAmount: 0.05,
            gridSize: 20,
            
            // Параметры для случайного смещения визуализаторов
            circleOffsetX: 0,
            circleOffsetY: 0,
            circleScale: 1,
            
            waveOffsetY: 0,
            waveDensity: 1,
            waveCount: 5,
            
            gridOffsetX: 0,
            gridOffsetY: 0,
            gridSize: 30,
            gridDensity: 1
        },
        layout: {
            minMargin: 40,
            itemWidth: 120,
            itemHeight: 145
        },
        chaosLevel: 0.6,
        minSpacing: 50,
        grid: []
    }
};

/**
 * Инициализация приложения
 */
document.addEventListener('DOMContentLoaded', () => {
    // Проверка на какой странице мы находимся
    const isBlogPage = document.body.classList.contains('blog-page');
    
    if (!isBlogPage) {
        // Генерируем случайные параметры для визуализаторов
        generateRandomVisualizationParams();
        
        // Инициализируем аудио контекст
        initAudioContext();
        
        // Получаем ссылки на DOM элементы
        initUI();
        
        // Получаем список аудиофайлов из папки audio
        loadAudioFilesFromDirectory();
        
        // Настраиваем обработчики событий
        setupEventListeners();
        
        // Добавляем аудио элемент
        SOYUZ.audio.element = new Audio();
        
        // После загрузки трека обновляем аудио контекст
        SOYUZ.audio.element.addEventListener('canplay', () => {
            if (SOYUZ.audio.context && SOYUZ.audio.isPlaying) {
                connectAudioElement();
            }
        });
        
        // Генерируем визуализацию для прогрессбара сразу после загрузки страницы
        generateWaveformVisualization();
        
        // Добавляем стили для прогрессбара
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .progress-container {
                cursor: pointer;
            }
            .progress-container:hover .waveform-bar {
                filter: brightness(1.1);
            }
            .progress-marker {
                transition: transform 0.2s ease;
            }
        `;
        document.head.appendChild(styleElement);
    } else {
        // Если мы на странице блога, загружаем посты из папки reports
        loadBlogPosts();
        
        // Проверяем наличие новых постов
        checkForNewBlogPosts();
    }
});

/**
 * Генерирует случайные параметры для визуализаторов
 * при каждом запуске страницы
 */
function generateRandomVisualizationParams() {
    // Случайное смещение для основного кругового визуализатора
    SOYUZ.settings.visualization.circleOffsetX = Math.random() * 0.3 - 0.15; // -15% до +15% от ширины
    SOYUZ.settings.visualization.circleOffsetY = Math.random() * 0.3 - 0.15; // -15% до +15% от высоты
    SOYUZ.settings.visualization.circleScale = 0.8 + Math.random() * 0.4; // 80% до 120% от базового размера
    
    // Случайные параметры для волнового визуализатора
    SOYUZ.settings.visualization.waveOffsetY = Math.random() * 0.5 - 0.25; // смещение по Y
    SOYUZ.settings.visualization.waveDensity = 0.8 + Math.random() * 0.4; // плотность волн
    SOYUZ.settings.visualization.waveCount = 3 + Math.floor(Math.random() * 5); // 3-7 волн
    
    // Случайные параметры для сетки точек
    SOYUZ.settings.visualization.gridOffsetX = Math.random() * 50; // смещение сетки
    SOYUZ.settings.visualization.gridOffsetY = Math.random() * 50; // смещение сетки
    SOYUZ.settings.visualization.gridSize = 20 + Math.floor(Math.random() * 30); // размер ячейки сетки
    SOYUZ.settings.visualization.gridDensity = 0.7 + Math.random() * 0.6; // плотность точек
}

/**
 * Инициализация аудио контекста
 */
function initAudioContext() {
    try {
        // Создаем аудио контекст
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        SOYUZ.audio.context = new AudioContext();
        
        // Создаем анализатор
        SOYUZ.audio.analyzer = SOYUZ.audio.context.createAnalyser();
        SOYUZ.audio.analyzer.fftSize = 2048;
        SOYUZ.audio.bufferLength = SOYUZ.audio.analyzer.frequencyBinCount;
        SOYUZ.audio.dataArray = new Uint8Array(SOYUZ.audio.bufferLength);
        
        // Создаем регулятор громкости
        SOYUZ.audio.gainNode = SOYUZ.audio.context.createGain();
        SOYUZ.audio.gainNode.gain.value = 0.8;
        
        // Соединяем узлы
        SOYUZ.audio.gainNode.connect(SOYUZ.audio.analyzer);
        SOYUZ.audio.analyzer.connect(SOYUZ.audio.context.destination);
        
        console.log('Аудио контекст инициализирован успешно');
    } catch (error) {
        console.error('Ошибка при инициализации аудио контекста:', error);
    }
}

/**
 * Инициализация UI элементов
 */
function initUI() {
    // Канвас для визуализации
    SOYUZ.ui.visualizationCanvas = document.querySelector('.visualizer-canvas');
    
    if (SOYUZ.ui.visualizationCanvas) {
        SOYUZ.ui.visualizationCtx = SOYUZ.ui.visualizationCanvas.getContext('2d');
    }
    
    // Элементы плеера (упрощенная версия - только play/pause и прогрессбар)
    SOYUZ.ui.player = document.querySelector('.audio-player');
    SOYUZ.ui.trackInfo = document.querySelector('.track-title');
    SOYUZ.ui.playBtn = document.querySelector('.player-play');
    
    // Добавляем элементы для нового прогрессбара
    SOYUZ.ui.progressContainer = document.querySelector('.progress-container');
    SOYUZ.ui.progressBar = document.querySelector('.progress-bar');
    SOYUZ.ui.progressMarker = document.querySelector('.progress-marker');
    SOYUZ.ui.waveform = document.querySelector('.waveform');
    
    // Контейнер для аудиофайлов
    SOYUZ.ui.container = document.querySelector('.audio-container');
    
    // Загрузка файлов (скрыта для посетителей)
    SOYUZ.ui.uploadZone = document.querySelector('.upload-dropzone');
    
    // Устанавливаем размеры канваса
    resizeCanvas();
    
    // Создаем аудио элемент, если он еще не существует
    if (!SOYUZ.audio.element) {
        SOYUZ.audio.element = new Audio();
        console.log('Аудио элемент создан');
    }
    
    // Обновляем HTML в плеере для нового дизайна
    updatePlayerHTML();
}

/**
 * Загрузка аудиофайлов из директории audio
 */
function loadAudioFilesFromDirectory() {
    // Для проекта у нас есть прямой доступ к списку файлов в папке audio
    const audioFiles = [
        'it was pretty fun yesterday....mp3',
        'tape 05.mp3',
        '8amb1.mp3',
        'декабрь4.1.mp3',
        'октябрь2.mp3',
        'dismade.mp3',
        'untitled #2.mp3',
        '8feb cliche.mp3',
        'fuckeduptempowguitar.mp3',
        'noise normalised.mp3',
        'weird arpeggios 68 render2.mp3'
    ];
    
    processAudioFiles(audioFiles);
}

/**
 * Обработка найденных аудиофайлов
 */
function processAudioFiles(files) {
    // Очищаем текущие треки
    SOYUZ.audio.tracks = [];
    
    // Создаем треки из файлов
    files.forEach((fileName, index) => {
        const trackName = fileName.replace(/\.[^/.]+$/, ""); // Удаляем расширение файла
        
        // Создаем трек
        SOYUZ.audio.tracks.push({
            id: `track-${index}`,
            title: trackName,
            artist: 'SOYUZ',
            duration: '0:00',
            path: `audio/${fileName}`,
            color: getRandomColor()
        });
    });
    
    // Создаем элементы аудиофайлов
    createAudioFiles();
    
    // Запускаем визуализацию
    startVisualization();
}

/**
 * Генерация случайного цвета 
 * (нейтральных оттенков для соответствия дизайну)
 */
function getRandomColor() {
    // Генерируем цвета в серой гамме для соответствия дизайну
    const hue = Math.floor(Math.random() * 30) - 15 + 220; // Варьируем оттенки серо-синего
    const saturation = 20 + Math.floor(Math.random() * 20); // Небольшая насыщенность
    const lightness = 40 + Math.floor(Math.random() * 20); // Средняя яркость
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Установка обработчиков событий
 */
function setupEventListeners() {
    // Обработчик для кнопки воспроизведения
    if (SOYUZ.ui.playBtn) {
        SOYUZ.ui.playBtn.addEventListener('click', togglePlayback);
    }
    
    // Обработчик для прогрессбара
    if (SOYUZ.ui.progressContainer) {
        SOYUZ.ui.progressContainer.addEventListener('click', seekToPosition);
    }
    
    // Обработчик изменения размера окна
    window.addEventListener('resize', () => {
        resizeCanvas();
        // Небольшая задержка перед перераспределением файлов,
        // чтобы браузер успел обновить размеры контейнера
        setTimeout(() => {
            createAudioFiles(); // Перераспределяем файлы при изменении размера окна
        }, 100);
    });
    
    // Обработчик для перехода между страницами (для фиксации бага с переходом с блога на главную)
    window.addEventListener('pageshow', (event) => {
        // Проверяем, был ли переход с другой страницы с использованием кэша
        if (event.persisted) {
            console.log('Страница восстановлена из кэша - перераспределяем файлы');
            // Перераспределяем файлы с задержкой, чтобы DOM успел обновиться
            setTimeout(() => {
                if (!document.body.classList.contains('blog-page')) {
                    createAudioFiles();
                }
            }, 200);
        }
    });
    
    // Обработчик события timeupdate для аудио элемента
    if (SOYUZ.audio.element) {
        SOYUZ.audio.element.addEventListener('timeupdate', () => {
            // Обновляем прогрессбар
            if (SOYUZ.ui.progressBar && SOYUZ.audio.element.duration) {
                const progress = SOYUZ.audio.element.currentTime / SOYUZ.audio.element.duration * 100;
                SOYUZ.ui.progressBar.style.width = `${progress}%`;
                SOYUZ.ui.progressMarker.style.left = `${progress}%`;
            }
        });
        
        // При завершении трека переходим к следующему
        SOYUZ.audio.element.addEventListener('ended', () => {
            playNextTrack();
        });
        
        // При изменении аудио получаем метаданные
        SOYUZ.audio.element.addEventListener('loadedmetadata', () => {
            // Генерируем визуализацию после загрузки метаданных
            generateWaveformVisualization();
        });
    }
}

/**
 * Создание элементов аудиофайлов с соблюдением отступов
 */
function createAudioFiles() {
    if (!SOYUZ.ui.container) return;
    
    // Очищаем контейнер
    SOYUZ.ui.container.innerHTML = '';
    
    // Получаем размеры контейнера
    const containerWidth = SOYUZ.ui.container.clientWidth || window.innerWidth - 32; // Добавляем запасной вариант
    // Используем высоту окна для расчета при нулевой высоте контейнера
    const containerHeight = SOYUZ.ui.container.clientHeight || window.innerHeight * 0.7;
    
    // Определяем, используем ли мобильное устройство
    const isMobile = window.innerWidth <= 768;
    
    // Размеры элементов (меньше для мобильных)
    const itemWidth = isMobile ? 70 : SOYUZ.settings.layout.itemWidth;
    const itemHeight = isMobile ? 100 : SOYUZ.settings.layout.itemHeight;
    const margin = isMobile ? 15 : SOYUZ.settings.layout.minMargin;
    
    // Создаем массив всех треков
    const allTracks = [...SOYUZ.audio.tracks, ...SOYUZ.audio.userTracks];
    
    // Проверяем, что у нас есть треки для отображения
    if (allTracks.length === 0) {
        console.warn('Нет треков для отображения');
        return;
    }
    
    // Перемешиваем треки для случайного порядка
    const shuffledTracks = shuffleArray([...allTracks]);
    
    // Увеличиваем вертикальное пространство для размещения
    // В 2.5 раза больше высоты контейнера для лучшего распределения по скроллу
    // Минимум 1000px для предотвращения проблем с малой высотой
    const extendedHeight = Math.max(1000, isMobile ? containerHeight * 2.5 : containerHeight * 1.5);
    
    // Устанавливаем минимальную высоту для контейнера, чтобы был скролл
    SOYUZ.ui.container.style.minHeight = `${extendedHeight}px`;
    
    // Выводим отладочную информацию
    console.log(`Размещение аудиофайлов: ${shuffledTracks.length} треков, контейнер ${containerWidth}x${containerHeight}, мобильный режим: ${isMobile}`);
    
    // Разделяем пространство на виртуальные зоны для равномерного распределения
    // Увеличиваем количество вертикальных зон для мобильных устройств
    const verticalZones = isMobile ? 8 : 5; // Увеличиваем с 5 до 8 для мобильных
    const horizontalZones = isMobile ? 2 : 3; // Уменьшаем с 3 до 2 для мобильных
    
    // Количество файлов в зоне = (общее число файлов) / (количество зон)
    const filesPerZone = Math.ceil(shuffledTracks.length / (verticalZones * horizontalZones));
    
    console.log(`Зоны: ${horizontalZones}x${verticalZones}, файлов на зону: ${filesPerZone}`);
    
    // Распределяем файлы по зонам
    let zoneIndex = 0;
    const zoneFiles = Array(verticalZones * horizontalZones).fill().map(() => []);
    
    // Равномерное распределение файлов по зонам
    shuffledTracks.forEach((track, index) => {
        zoneFiles[zoneIndex].push(track);
        if ((index + 1) % filesPerZone === 0 && zoneIndex < zoneFiles.length - 1) {
            zoneIndex++;
        }
    });
    
    // Для каждой зоны создаем файлы в своей области
    zoneFiles.forEach((tracks, zoneIdx) => {
        const verticalIdx = Math.floor(zoneIdx / horizontalZones);
        const horizontalIdx = zoneIdx % horizontalZones;
        
        // Границы зоны
        const zoneStartX = horizontalIdx * (containerWidth / horizontalZones);
        const zoneEndX = (horizontalIdx + 1) * (containerWidth / horizontalZones);
        const zoneStartY = verticalIdx * (extendedHeight / verticalZones);
        const zoneEndY = (verticalIdx + 1) * (extendedHeight / verticalZones);
        
        // Отладочная информация о зоне
        console.log(`Зона ${zoneIdx}: x=${zoneStartX}-${zoneEndX}, y=${zoneStartY}-${zoneEndY}, треков: ${tracks.length}`);
        
        // Создаем файлы в этой зоне
        tracks.forEach(track => {
            const audioFile = createAudioFileElement(track);
            
            // Генерируем случайные координаты в пределах зоны
            // Добавляем отступы от краев зоны
            const zonePadding = isMobile ? 10 : 20;
            const x = zoneStartX + zonePadding + Math.random() * ((zoneEndX - zoneStartX) - itemWidth - 2 * zonePadding);
            const y = zoneStartY + zonePadding + Math.random() * ((zoneEndY - zoneStartY) - itemHeight - 2 * zonePadding);
            
            // Применяем координаты
            audioFile.style.position = 'absolute';
            audioFile.style.left = `${x}px`;
            audioFile.style.top = `${y}px`;
            
            // Добавляем случайный угол поворота
            const randomRotation = isMobile 
                ? (Math.random() * 6 - 3)  // от -3 до +3 градусов для мобильных
                : (Math.random() * 10 - 5); // от -5 до +5 градусов для десктопа
            audioFile.style.transform = `rotate(${randomRotation}deg)`;
            
            // Добавляем элемент в контейнер
            SOYUZ.ui.container.appendChild(audioFile);
        });
    });
    
    // Проверяем наложения и устраняем их (перемещаем накладывающиеся элементы)
    const audioFiles = Array.from(SOYUZ.ui.container.querySelectorAll('.audio-file'));
    
    // Отладочная информация о размещенных файлах
    console.log(`Размещено файлов: ${audioFiles.length}`);
    
    // Функция проверки наложения
    const isOverlapping = (el1, el2) => {
        const rect1 = el1.getBoundingClientRect();
        const rect2 = el2.getBoundingClientRect();
        
        // Учитываем поля
        const minDistance = isMobile ? 40 : 60;
        
        // Центры элементов
        const center1 = {
            x: rect1.left + rect1.width / 2,
            y: rect1.top + rect1.height / 2
        };
        
        const center2 = {
            x: rect2.left + rect2.width / 2,
            y: rect2.top + rect2.height / 2
        };
        
        // Рассчитываем расстояние между центрами
        const distance = Math.sqrt(
            Math.pow(center1.x - center2.x, 2) + 
            Math.pow(center1.y - center2.y, 2)
        );
        
        return distance < minDistance;
    };
    
    // Проверка и исправление наложений
    for (let i = 0; i < audioFiles.length; i++) {
        const currentFile = audioFiles[i];
        
        for (let j = i + 1; j < audioFiles.length; j++) {
            const otherFile = audioFiles[j];
            
            if (isOverlapping(currentFile, otherFile)) {
                // Перемещаем второй файл в свободное место
                const currentLeft = parseFloat(otherFile.style.left);
                const currentTop = parseFloat(otherFile.style.top);
                
                // Выбираем случайное направление для перемещения
                const angle = Math.random() * Math.PI * 2;
                const distance = isMobile ? 70 : 100;
                
                // Рассчитываем новую позицию
                const newLeft = currentLeft + Math.cos(angle) * distance;
                const newTop = currentTop + Math.sin(angle) * distance;
                
                // Проверяем, не выходит ли за границы контейнера
                const validLeft = Math.max(0, Math.min(containerWidth - itemWidth, newLeft));
                const validTop = Math.max(0, Math.min(extendedHeight - itemHeight, newTop));
                
                // Применяем новые координаты
                otherFile.style.left = `${validLeft}px`;
                otherFile.style.top = `${validTop}px`;
            }
        }
    }
}

/**
 * Перемешивание массива (алгоритм Фишера-Йейтса)
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Создание элемента аудиофайла
 */
function createAudioFileElement(track) {
    const audioFile = document.createElement('div');
    audioFile.className = 'audio-file';
    audioFile.dataset.id = track.id;
    audioFile.dataset.path = track.path;
    
    // Определяем цвет для иконки
    const iconColor = track.color || getRandomColor();
    
    audioFile.innerHTML = `
        <div class="audio-file-icon" style="color: ${iconColor}"></div>
        <div class="audio-file-title">${track.title}</div>
    `;
    
    // Добавляем обработчик клика для воспроизведения
    audioFile.addEventListener('click', (e) => {
        playTrack(track.path, track.id, audioFile);
    });
    
    return audioFile;
}

/**
 * Воспроизведение трека по ID
 */
function playTrack(path, id, element) {
    // Проверяем существование аудио элемента
    if (!SOYUZ.audio.element) {
        console.error('Аудио элемент не инициализирован');
        SOYUZ.audio.element = new Audio();
    }

    // Если аудио контекст в состоянии приостановки, возобновляем его
    if (SOYUZ.audio.context && SOYUZ.audio.context.state === 'suspended') {
        SOYUZ.audio.context.resume();
    }
    
    // Если текущий трек совпадает с выбранным и он играет, останавливаем его
    if (SOYUZ.audio.currentTrackPath === path && SOYUZ.audio.isPlaying) {
        SOYUZ.audio.element.pause();
        SOYUZ.audio.isPlaying = false;
        updatePlayButton();
        // Скрываем визуализаторы когда останавливаем трек
        if (SOYUZ.ui.visualizationCanvas) {
            SOYUZ.ui.visualizationCanvas.style.opacity = '0';
        }
        return;
    }
    
    // Сохраняем индекс и путь текущего трека
    SOYUZ.audio.currentTrackIndex = id;
    SOYUZ.audio.currentTrackPath = path;
    
    // Если есть активный элемент, сбрасываем его класс
    const activeFile = document.querySelector('.audio-file.active');
    if (activeFile) {
        activeFile.classList.remove('active');
    }
    
    // Отмечаем текущий элемент как активный
    if (element) {
        element.classList.add('active');
        
        // Прокручиваем контейнер, чтобы выбранный трек был виден
        if (SOYUZ.ui.container) {
            const elementRect = element.getBoundingClientRect();
            const containerRect = SOYUZ.ui.container.getBoundingClientRect();
            
            // Если элемент находится за пределами видимой области контейнера
            if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
                // Прокручиваем контейнер так, чтобы элемент был видим
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
    
    // Устанавливаем источник для аудио элемента
    try {
        SOYUZ.audio.element.src = path;
        
        // Получаем название трека из пути
        const trackName = path.split('/').pop().replace(/\.[^/.]+$/, "");
        
        // Обновляем информацию о треке
        if (SOYUZ.ui.trackInfo) {
            SOYUZ.ui.trackInfo.textContent = trackName;
        }
        
        // Воспроизводим трек
        SOYUZ.audio.element.play().then(() => {
            SOYUZ.audio.isPlaying = true;
            updatePlayButton();
            
            // Показываем визуализаторы при начале воспроизведения
            if (SOYUZ.ui.visualizationCanvas) {
                SOYUZ.ui.visualizationCanvas.style.opacity = '0.3';
            }
            
            // Подключаем аудио элемент к аудио контексту
            connectAudioElement();
            
            // Генерируем и отображаем визуализацию волны
            generateWaveformVisualization();
            
            // Запускаем обновление прогрессбара
            updateProgressBar();
        }).catch(error => {
            console.error('Ошибка воспроизведения:', error);
            SOYUZ.audio.isPlaying = false;
            updatePlayButton();
        });
    } catch (error) {
        console.error('Ошибка при установке источника или воспроизведении аудио:', error);
    }
}

/**
 * Подключение аудио элемента к аудио контексту
 */
function connectAudioElement() {
    try {
        // Проверяем, что контекст существует
        if (!SOYUZ.audio.context) {
            console.error('Аудио контекст не инициализирован');
            initAudioContext(); // Пытаемся создать контекст, если его нет
            if (!SOYUZ.audio.context) return;
        }
        
        // Проверяем, что элемент существует
        if (!SOYUZ.audio.element) {
            console.error('Аудио элемент не инициализирован');
            SOYUZ.audio.element = new Audio();
        }
        
        // Ключевое изменение: проверяем, был ли уже подключен source
        // Если source уже создан и подключен, не создаем его повторно
        if (!SOYUZ.audio.source) {
            try {
                // Создаем source только один раз при первом воспроизведении
                SOYUZ.audio.source = SOYUZ.audio.context.createMediaElementSource(SOYUZ.audio.element);
                // Подключаем источник к узлу усиления
                SOYUZ.audio.source.connect(SOYUZ.audio.gainNode);
                console.log('Аудио элемент успешно подключен к контексту');
            } catch (error) {
                console.error('Ошибка при создании MediaElementSource:', error);
            }
        }
    } catch (error) {
        console.error('Ошибка при подключении аудио элемента:', error);
    }
}

/**
 * Обновление иконки кнопки воспроизведения
 */
function updatePlayButton() {
    if (SOYUZ.ui.playBtn) {
        SOYUZ.ui.playBtn.innerHTML = SOYUZ.audio.isPlaying ? '❚❚' : '▶';
    }
}

/**
 * Переключение воспроизведения/паузы
 */
function togglePlayback() {
    if (!SOYUZ.audio.currentTrackPath && SOYUZ.audio.tracks.length > 0) {
        // Если ничего не воспроизводится, запускаем первый трек
        const firstTrack = SOYUZ.audio.tracks[0];
        playTrack(firstTrack.path, firstTrack.id, document.querySelector(`.audio-file[data-id="${firstTrack.id}"]`));
        return;
    }
    
    if (SOYUZ.audio.isPlaying) {
        SOYUZ.audio.element.pause();
        SOYUZ.audio.isPlaying = false;
        // Скрываем визуализаторы при паузе
        if (SOYUZ.ui.visualizationCanvas) {
            SOYUZ.ui.visualizationCanvas.style.opacity = '0';
        }
    } else {
        SOYUZ.audio.element.play();
        SOYUZ.audio.isPlaying = true;
        // Показываем визуализаторы при воспроизведении
        if (SOYUZ.ui.visualizationCanvas) {
            SOYUZ.ui.visualizationCanvas.style.opacity = '0.3';
        }
    }
    
    updatePlayButton();
}

/**
 * Воспроизведение предыдущего трека
 */
function playPreviousTrack() {
    const allTracks = [...SOYUZ.audio.tracks, ...SOYUZ.audio.userTracks];
    
    if (allTracks.length === 0) return;
    
    let currentIndex = -1;
    
    // Находим индекс текущего трека
    if (SOYUZ.audio.currentTrackIndex) {
        currentIndex = allTracks.findIndex(t => t.id === SOYUZ.audio.currentTrackIndex);
    }
    
    // Если текущий трек не найден или это первый трек, берем последний
    const prevIndex = (currentIndex <= 0) ? allTracks.length - 1 : currentIndex - 1;
    const prevTrack = allTracks[prevIndex];
    
    // Воспроизводим предыдущий трек
    playTrack(prevTrack.path, prevTrack.id, document.querySelector(`.audio-file[data-id="${prevTrack.id}"]`));
}

/**
 * Воспроизведение следующего трека
 */
function playNextTrack() {
    const allTracks = [...SOYUZ.audio.tracks, ...SOYUZ.audio.userTracks];
    
    if (allTracks.length === 0) return;
    
    let currentIndex = -1;
    
    // Находим индекс текущего трека
    if (SOYUZ.audio.currentTrackIndex) {
        currentIndex = allTracks.findIndex(t => t.id === SOYUZ.audio.currentTrackIndex);
    }
    
    // Вычисляем индекс следующего трека
    const nextIndex = (currentIndex < 0 || currentIndex >= allTracks.length - 1) ? 0 : currentIndex + 1;
    const nextTrack = allTracks[nextIndex];
    
    // Воспроизводим следующий трек
    playTrack(nextTrack.path, nextTrack.id, document.querySelector(`.audio-file[data-id="${nextTrack.id}"]`));
}

/**
 * Установка правильных размеров канваса
 */
function resizeCanvas() {
    if (!SOYUZ.ui.visualizationCanvas) return;
    
    // Устанавливаем размер канваса равным размеру окна
    SOYUZ.ui.visualizationCanvas.width = window.innerWidth;
    SOYUZ.ui.visualizationCanvas.height = window.innerHeight;
}

/**
 * Запуск визуализации
 */
function startVisualization() {
    if (!SOYUZ.ui.visualizationCanvas || !SOYUZ.ui.visualizationCtx) return;
    
    // Добавляем стиль для скрытия канваса по умолчанию
    SOYUZ.ui.visualizationCanvas.style.opacity = '0';
    SOYUZ.ui.visualizationCanvas.style.transition = 'opacity 0.5s ease';
    
    // Функция отрисовки фрейма
    function draw() {
        // Если не играет музыка, устанавливаем прозрачность в 0 для скрытия визуализаторов
        if (!SOYUZ.audio.isPlaying) {
            if (SOYUZ.ui.visualizationCanvas.style.opacity !== '0') {
                SOYUZ.ui.visualizationCanvas.style.opacity = '0';
            }
        } else {
            // Если играет музыка, показываем визуализаторы
            if (SOYUZ.ui.visualizationCanvas.style.opacity !== '0.3') {
                SOYUZ.ui.visualizationCanvas.style.opacity = '0.3';
            }
        }
        
        // Очищаем канвас
        SOYUZ.ui.visualizationCtx.clearRect(0, 0, SOYUZ.ui.visualizationCanvas.width, SOYUZ.ui.visualizationCanvas.height);
        
        // Получаем время для анимации
        const time = Date.now() * 0.001;
        
        // Рисуем дополнительные визуализаторы на заднем плане
        // Удаляем вызов drawWaveVisualizer, оставляем только сетку точек
        drawGridVisualizer(time);
        
        // Рисуем основной круг в центре
        drawVisualizerCircle(time);
        
        // Планируем следующий фрейм
        SOYUZ.ui.animationFrameId = requestAnimationFrame(draw);
    }
    
    // Запускаем отрисовку
    draw();
}

/**
 * Отрисовка сетки точек (второй дополнительный визуализатор)
 */
function drawGridVisualizer(time) {
    const ctx = SOYUZ.ui.visualizationCtx;
    const width = SOYUZ.ui.visualizationCanvas.width;
    const height = SOYUZ.ui.visualizationCanvas.height;
    
    // Получаем параметры из случайно сгенерированных настроек
    const gridSize = SOYUZ.settings.visualization.gridSize;
    const dotSize = 2 * SOYUZ.settings.visualization.gridDensity; // Увеличиваем размер точек с 1 до 2
    const offsetX = SOYUZ.settings.visualization.gridOffsetX;
    const offsetY = SOYUZ.settings.visualization.gridOffsetY;
    
    // Количество точек по горизонтали и вертикали
    const columns = Math.ceil(width / gridSize);
    const rows = Math.ceil(height / gridSize);
    
    // Для каждой точки в сетке
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            // Координаты точки с учетом случайного смещения
            const x = j * gridSize + gridSize / 2 + offsetX % gridSize;
            const y = i * gridSize + gridSize / 2 + offsetY % gridSize;
            
            // Расстояние от центра экрана (нормализованное)
            const centerX = width / 2;
            const centerY = height / 2;
            const distanceFromCenter = Math.sqrt(
                Math.pow((x - centerX) / width, 2) + 
                Math.pow((y - centerY) / height, 2)
            );
            
            // Модуляция в зависимости от времени и расстояния
            let sizeMod = 0.5 + 0.5 * Math.sin(time + distanceFromCenter * 10);
            
            // Если воспроизводится музыка, модулируем размер точки в зависимости от данных аудио
            if (SOYUZ.audio.isPlaying && SOYUZ.audio.dataArray) {
                const dataIndex = Math.floor(distanceFromCenter * SOYUZ.audio.bufferLength);
                if (dataIndex < SOYUZ.audio.bufferLength) {
                    const audioValue = SOYUZ.audio.dataArray[dataIndex] / 255;
                    sizeMod = 0.5 + audioValue * 1.5;
                }
            }
            
            // Размер и непрозрачность точки - увеличиваем непрозрачность
            const finalSize = dotSize * sizeMod;
            const opacity = 0.1 + 0.15 * sizeMod; // Увеличиваем с 0.05+0.1 до 0.1+0.15
            
            // Отрисовка точки
            ctx.beginPath();
            ctx.arc(x, y, finalSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
            ctx.fill();
        }
    }
}

/**
 * Рисование круговой визуализации
 */
function drawVisualizerCircle(time) {
    const ctx = SOYUZ.ui.visualizationCtx;
    const width = SOYUZ.ui.visualizationCanvas.width;
    const height = SOYUZ.ui.visualizationCanvas.height;
    
    // Получаем смещение из случайно сгенерированных параметров
    const offsetX = width * SOYUZ.settings.visualization.circleOffsetX;
    const offsetY = height * SOYUZ.settings.visualization.circleOffsetY;
    const scale = SOYUZ.settings.visualization.circleScale;
    
    // Центр экрана с учетом смещения
    const centerX = width / 2 + offsetX;
    const centerY = height / 2 + offsetY;
    
    // Размер круга с учетом масштаба
    const baseRadius = Math.min(width, height) * 0.2 * scale;
    
    // Если воспроизводится музыка, получаем данные спектра
    if (SOYUZ.audio.isPlaying && SOYUZ.audio.analyzer) {
        SOYUZ.audio.analyzer.getByteFrequencyData(SOYUZ.audio.dataArray);
    }
    
    // Рисуем круг
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Количество точек по кругу
    const numPoints = 80;
    
    // Рисуем частотный анализ по кругу
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        
        // Получаем амплитуду для текущего угла
        let amplitude = 0;
        
        if (SOYUZ.audio.isPlaying && SOYUZ.audio.dataArray) {
            // Берем данные из анализатора
            const dataIndex = Math.floor(i * SOYUZ.audio.bufferLength / numPoints);
            amplitude = SOYUZ.audio.dataArray[dataIndex] / 255.0; // Нормализуем от 0 до 1
        } else {
            // Демо-режим: создаем простую анимацию
            amplitude = 0.2 + 0.1 * Math.sin(time * 2 + i * 0.2);
        }
        
        // Радиус для текущей точки
        const radius = baseRadius + baseRadius * 0.3 * amplitude;
        
        // Координаты точки
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        // Рисуем линию от центра к точке
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        
        // Цвет зависит от амплитуды и времени (в серой гамме)
        const hue = 220; // Используем синевато-серый оттенок
        const saturation = 10 + amplitude * 20; // Низкая насыщенность
        const lightness = 30 + amplitude * 30; // Средняя яркость
        
        ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${amplitude * 0.5})`;
        ctx.lineWidth = 2 + amplitude * 3;
        ctx.stroke();
        
        // Рисуем точку
        ctx.beginPath();
        ctx.arc(x, y, 2 + amplitude * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${amplitude * 0.7})`;
        ctx.fill();
    }
}

// Создаем новую функцию для обновления HTML плеера
function updatePlayerHTML() {
    if (!SOYUZ.ui.player) return;
    
    // Новая структура плеера
    SOYUZ.ui.player.innerHTML = `
        <div class="player-controls">
            <button class="player-button player-play" aria-label="Воспроизвести">▶</button>
            <div class="progress-container">
                <div class="waveform"></div>
                <div class="progress-bar"></div>
                <div class="progress-marker"></div>
            </div>
            <div class="track-info">
                <span class="track-title">Выберите трек</span>
            </div>
        </div>
    `;
    
    // Обновляем ссылки на новые элементы
    SOYUZ.ui.playBtn = document.querySelector('.player-play');
    SOYUZ.ui.trackInfo = document.querySelector('.track-title');
    SOYUZ.ui.progressContainer = document.querySelector('.progress-container');
    SOYUZ.ui.progressBar = document.querySelector('.progress-bar');
    SOYUZ.ui.progressMarker = document.querySelector('.progress-marker');
    SOYUZ.ui.waveform = document.querySelector('.waveform');
    
    // Добавляем обработчик для кнопки play/pause
    if (SOYUZ.ui.playBtn) {
        SOYUZ.ui.playBtn.addEventListener('click', togglePlayback);
    }
    
    // Добавляем обработчик для прогрессбара
    if (SOYUZ.ui.progressContainer) {
        SOYUZ.ui.progressContainer.addEventListener('click', seekToPosition);
        
        // Добавляем визуальный эффект при наведении на прогрессбар
        SOYUZ.ui.progressContainer.addEventListener('mouseover', function() {
            this.style.cursor = 'pointer';
            if (SOYUZ.ui.waveform) {
                SOYUZ.ui.waveform.style.opacity = '0.8';
            }
        });
        
        SOYUZ.ui.progressContainer.addEventListener('mouseout', function() {
            if (SOYUZ.ui.waveform) {
                SOYUZ.ui.waveform.style.opacity = '0.5';
            }
        });
    }
}

// Функция для перемотки трека
function seekToPosition(e) {
    if (!SOYUZ.audio.element || !SOYUZ.audio.currentTrackPath) return;
    
    const rect = SOYUZ.ui.progressContainer.getBoundingClientRect();
    const clickPos = (e.clientX - rect.left) / rect.width;
    
    // Проверяем, что clickPos находится в допустимом диапазоне (0-1)
    if (clickPos < 0 || clickPos > 1) return;
    
    console.log(`Перемотка на позицию: ${Math.round(clickPos * 100)}%`);
    
    // Устанавливаем текущую позицию воспроизведения
    const seekTime = SOYUZ.audio.element.duration * clickPos;
    SOYUZ.audio.element.currentTime = seekTime;
    
    // Обновляем визуально прогрессбар
    const progress = seekTime / SOYUZ.audio.element.duration * 100;
    SOYUZ.ui.progressBar.style.width = `${progress}%`;
    SOYUZ.ui.progressMarker.style.left = `${progress}%`;
    
    // Анимируем маркер для обратной связи
    if (SOYUZ.ui.progressMarker) {
        SOYUZ.ui.progressMarker.style.transform = 'scale(1.5)';
        setTimeout(() => {
            if (SOYUZ.ui.progressMarker) {
                SOYUZ.ui.progressMarker.style.transform = 'scale(1)';
            }
        }, 200);
    }
    
    // Если трек был на паузе, воспроизведение автоматически не начнется
    // Можно добавить опцию для автоматического воспроизведения при перемотке
    if (!SOYUZ.audio.isPlaying) {
        SOYUZ.audio.element.play()
            .then(() => {
                SOYUZ.audio.isPlaying = true;
                updatePlayButton();
                // Показываем визуализаторы при начале воспроизведения
                if (SOYUZ.ui.visualizationCanvas) {
                    SOYUZ.ui.visualizationCanvas.style.opacity = '0.3';
                }
            })
            .catch(error => {
                console.error('Ошибка при запуске воспроизведения после перемотки:', error);
            });
    }
}

// Добавляем новую функцию для обновления прогрессбара
function updateProgressBar() {
    if (!SOYUZ.ui.progressBar || !SOYUZ.audio.element) return;
    
    // Если есть активный трек
    if (SOYUZ.audio.currentTrackPath) {
        // Вычисляем прогресс воспроизведения
        const progress = SOYUZ.audio.element.currentTime / SOYUZ.audio.element.duration * 100;
        
        // Обновляем прогрессбар
        SOYUZ.ui.progressBar.style.width = `${progress}%`;
        
        // Обновляем маркер позиции
        SOYUZ.ui.progressMarker.style.left = `${progress}%`;
        
        // Запрашиваем следующее обновление
        requestAnimationFrame(updateProgressBar);
    }
}

// Добавляем функцию для создания визуализации волны трека
function generateWaveformVisualization() {
    if (!SOYUZ.ui.waveform || !SOYUZ.audio.analyzer) return;
    
    // Очищаем предыдущую визуализацию
    SOYUZ.ui.waveform.innerHTML = '';
    
    // Увеличиваем количество полос для прогрессбара
    const barsCount = 150; // Увеличиваем с 60 до 150 для более частых линий
    
    for (let i = 0; i < barsCount; i++) {
        const bar = document.createElement('div');
        bar.className = 'waveform-bar';
        
        // Генерируем случайную высоту для каждой полосы
        // (в реальной реализации здесь можно использовать настоящие данные из анализатора)
        const height = 10 + Math.random() * 70;
        bar.style.height = `${height}%`;
        
        // Добавляем полосу в контейнер
        SOYUZ.ui.waveform.appendChild(bar);
    }
}

/**
 * Загрузка постов блога из папки reports
 */
function loadBlogPosts() {
    // В реальном приложении здесь будет AJAX-запрос к серверу
    // для получения списка файлов из папки reports
    // Но в нашем случае мы имитируем этот процесс
    
    // Для демонстрации создадим запрос к серверу
    fetch('reports/')
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error('Не удалось получить список файлов из папки reports');
        })
        .then(html => {
            // Парсим HTML-ответ для получения списка файлов
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = Array.from(doc.querySelectorAll('a'));
            
            // Фильтруем только файлы .txt
            const txtFiles = links
                .map(link => link.getAttribute('href'))
                .filter(href => href && href.endsWith('.txt'))
                .map(href => decodeURIComponent(href));
            
            console.log('Найдены txt файлы:', txtFiles);
            
            // Загружаем содержимое каждого файла
            return Promise.all(txtFiles.map(filename => 
                fetch(`reports/${filename}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Не удалось загрузить файл ${filename}`);
                        }
                        return response.text();
                    })
                    .then(content => {
                        // Получаем дату из имени файла или времени создания
                        const fileStats = {
                            name: filename,
                            // Получаем временную метку из имени файла если оно в формате timestamp_title.txt
                            // иначе используем текущую дату
                            timestamp: extractTimestampFromFilename(filename) || Date.now()
                        };
                        return {
                            filename,
                            content,
                            timestamp: fileStats.timestamp
                        };
                    })
                    .catch(error => {
                        console.error(`Ошибка при загрузке файла ${filename}:`, error);
                        return null;
                    })
            ));
        })
        .then(postsData => {
            // Фильтруем null значения от ошибок
            const validPosts = postsData.filter(post => post !== null);
            
            // Сортируем посты по дате (от новых к старым)
            validPosts.sort((a, b) => b.timestamp - a.timestamp);
            
            console.log('Загружены посты:', validPosts);
            
            // Генерируем HTML для каждого поста
            const blogArticlesContainer = document.querySelector('.blog-articles');
            if (blogArticlesContainer) {
                // Очищаем текущие посты
                blogArticlesContainer.innerHTML = '';
                
                if (validPosts.length > 0) {
                    // Добавляем каждый пост в контейнер
                    validPosts.forEach(post => {
                        const article = createBlogPostElement(post);
                        blogArticlesContainer.appendChild(article);
                    });
                } else {
                    // Если нет постов, показываем тестовые посты
                    displayDefaultBlogPosts();
                }
            }
        })
        .catch(error => {
            console.error('Ошибка при загрузке постов блога:', error);
            
            // В случае ошибки, показываем тестовые посты
            displayDefaultBlogPosts();
        });
}

/**
 * Извлечение временной метки из имени файла
 * Ожидаемый формат: timestamp_title.txt
 */
function extractTimestampFromFilename(filename) {
    // Получаем только имя файла без пути
    const basename = filename.split('/').pop();
    
    // Проверяем начинается ли имя файла с числа 
    // (временной метки в миллисекундах)
    const timestampMatch = basename.match(/^(\d+)_/);
    
    if (timestampMatch && timestampMatch[1]) {
        const timestamp = parseInt(timestampMatch[1]);
        // Проверяем, что timestamp - валидная временная метка
        // (должна быть не раньше 2000 года и не позже 2100 года)
        const year2000 = 946684800000; // 01.01.2000 00:00:00
        const year2100 = 4102444800000; // 01.01.2100 00:00:00
        
        if (timestamp >= year2000 && timestamp <= year2100) {
            console.log(`Извлечена временная метка из файла ${basename}: ${new Date(timestamp).toISOString()}`);
            return timestamp;
        }
    }
    
    console.log(`Не удалось извлечь временную метку из файла ${basename}, используем текущее время`);
    return null;
}

/**
 * Создание элемента поста блога из данных файла
 */
function createBlogPostElement(postData) {
    // Разделяем содержимое на заголовок (первая строка) и текст (остальное)
    const lines = postData.content.trim().split('\n');
    const title = lines[0] || 'Без заголовка';
    const content = lines.slice(1).join('\n').trim();
    
    // Создаем элемент статьи
    const article = document.createElement('article');
    article.className = 'blog-article';
    
    // Форматируем дату в требуемом формате (с миллисекундами и часовым поясом UTC+1)
    const date = new Date(postData.timestamp);
    
    // Создаем строку даты в формате ДД.ММ.ГГГГ ЧЧ:ММ:СС.ммм (UTC+1)
    const formattedDate = formatDateWithMillisecondsAndTimezone(date);
    
    // Создаем HTML для статьи
    article.innerHTML = `
        <header class="article-header">
            <time class="article-date">${formattedDate}</time>
            <h2 class="article-title">${title}</h2>
        </header>
        <div class="article-content">
            ${formatContent(content)}
        </div>
    `;
    
    return article;
}

/**
 * Форматирование даты с миллисекундами и часовым поясом UTC+1
 */
function formatDateWithMillisecondsAndTimezone(date) {
    // Добавляем смещение для часового пояса UTC+1 (в миллисекундах)
    const utcPlus1Date = new Date(date.getTime() + (1 * 60 * 60 * 1000));
    
    // Получаем компоненты даты
    const day = utcPlus1Date.getUTCDate().toString().padStart(2, '0');
    const month = (utcPlus1Date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = utcPlus1Date.getUTCFullYear();
    const hours = utcPlus1Date.getUTCHours().toString().padStart(2, '0');
    const minutes = utcPlus1Date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = utcPlus1Date.getUTCSeconds().toString().padStart(2, '0');
    const milliseconds = utcPlus1Date.getUTCMilliseconds().toString().padStart(3, '0');
    
    // Формируем строку в формате ДД.ММ.ГГГГ ЧЧ:ММ:СС.ммм (UTC+1)
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}.${milliseconds} (UTC+1)`;
}

/**
 * Форматирование содержимого поста в HTML
 */
function formatContent(content) {
    // Разделяем текст на параграфы по пустым строкам
    const paragraphs = content.split('\n\n');
    
    // Оборачиваем каждый параграф в тег <p>
    return paragraphs
        .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
        .join('');
}

/**
 * Отображение тестовых постов блога при ошибке загрузки
 */
function displayDefaultBlogPosts() {
    const blogArticlesContainer = document.querySelector('.blog-articles');
    if (!blogArticlesContainer) return;
    
    // Оставляем текущие посты, которые уже есть в HTML
    console.log('Используем встроенные посты блога');
}

/**
 * Проверка наличия новых постов в блоге при каждом запуске страницы
 */
function checkForNewBlogPosts() {
    // Получаем список всех txt-файлов в папке reports
    fetch('reports/')
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error('Не удалось получить список файлов из папки reports');
        })
        .then(html => {
            // Парсим HTML-ответ для получения списка файлов
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = Array.from(doc.querySelectorAll('a'));
            
            // Фильтруем только файлы .txt
            const txtFiles = links
                .map(link => link.getAttribute('href'))
                .filter(href => href && href.endsWith('.txt'))
                .map(href => decodeURIComponent(href));
            
            // Получаем последнюю дату проверки из localStorage
            const lastCheck = localStorage.getItem('lastBlogCheck') || 0;
            
            // Проверяем, есть ли новые файлы
            let hasNewPosts = false;
            let latestTimestamp = parseInt(lastCheck);
            
            txtFiles.forEach(filename => {
                const timestamp = extractTimestampFromFilename(filename);
                if (timestamp && timestamp > parseInt(lastCheck)) {
                    hasNewPosts = true;
                    // Обновляем самую позднюю временную метку
                    if (timestamp > latestTimestamp) {
                        latestTimestamp = timestamp;
                    }
                }
            });
            
            // Сохраняем текущее время проверки в localStorage
            localStorage.setItem('lastBlogCheck', Date.now().toString());
            
            // Если есть новые посты, показываем уведомление
            if (hasNewPosts) {
                showNewPostsNotification();
            }
            
            console.log(`Проверка новых постов: ${hasNewPosts ? 'Найдены новые посты!' : 'Новых постов нет'}`);
        })
        .catch(error => {
            console.error('Ошибка при проверке новых постов:', error);
        });
}

/**
 * Показывает уведомление о новых постах
 */
function showNewPostsNotification() {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'new-posts-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <h3>new text available</h3>
            <button class="close-notification">✕</button>
        </div>
    `;
    
    // Добавляем стили для уведомления
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .new-posts-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #ffffff;
            border-left: 4px solid #555555;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            padding: 15px;
            max-width: 300px;
            z-index: 1000;
            font-family: var(--main-font);
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            0% { transform: translateX(100%); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
        }
        
        .notification-content h3 {
            margin: 0 0 10px 0;
            font-family: var(--mono-font);
            font-size: 1.1rem;
        }
        
        .notification-content p {
            margin: 0;
            font-size: 0.9rem;
            line-height: 1.4;
        }
        
        .close-notification {
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            color: #555555;
        }
        
        .close-notification:hover {
            color: #000000;
        }
    `;
    
    document.head.appendChild(styleElement);
    document.body.appendChild(notification);
    
    // Добавляем обработчик для закрытия уведомления
    notification.querySelector('.close-notification').addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        
        // Добавляем стиль для анимации исчезновения
        const slideOutStyle = document.createElement('style');
        slideOutStyle.textContent = `
            @keyframes slideOut {
                0% { transform: translateX(0); opacity: 1; }
                100% { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(slideOutStyle);
        
        // Удаляем элемент после окончания анимации
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Автоматически скрываем уведомление через 10 секунд
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.querySelector('.close-notification').click();
        }
    }, 10000);
} 