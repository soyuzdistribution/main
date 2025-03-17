class CassettePlayer {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.tracks = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.demoInterval = null;
        
        // Создаем узлы для аудио эффектов (в демо-режиме не используются)
        this.compressor = this.audioContext.createDynamicsCompressor();
        this.equalizer = {
            low: this.audioContext.createBiquadFilter(),
            mid: this.audioContext.createBiquadFilter(),
            high: this.audioContext.createBiquadFilter()
        };
        
        this.setupAudioNodes();
        this.setupUI();
        this.loadTracks();
        this.setupEventListeners();
    }

    setupAudioNodes() {
        // В демо-режиме настройка эквалайзера и компрессора не влияет на звук,
        // но оставляем их для демонстрации интерфейса
        this.equalizer.low.type = 'lowshelf';
        this.equalizer.low.frequency.value = 320;
        
        this.equalizer.mid.type = 'peaking';
        this.equalizer.mid.frequency.value = 1000;
        this.equalizer.mid.Q.value = 0.5;
        
        this.equalizer.high.type = 'highshelf';
        this.equalizer.high.frequency.value = 3200;

        // Настройки компрессора
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 0;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0.0001;
        this.compressor.release.value = 0.125;
    }

    setupUI() {
        // Находим все элементы управления
        this.playBtn = document.querySelector('.play-btn');
        this.stopBtn = document.querySelector('.stop-btn');
        this.prevBtn = document.querySelector('.prev-btn');
        this.nextBtn = document.querySelector('.next-btn');
        this.bypassBtn = document.querySelector('.bypass-btn');
        
        this.inputGain = document.querySelector('.input-gain input');
        this.outputGain = document.querySelector('.output-gain input');
        this.eqLow = document.querySelector('#low');
        this.eqMid = document.querySelector('#mid');
        this.eqHigh = document.querySelector('#high');
        
        this.player = document.querySelector('.player-body');
        this.wireLeft = document.querySelector('.wire-left');
        this.wireRight = document.querySelector('.wire-right');
        this.vuMeter = document.querySelector('.meter-needle');
        
        this.nowPlaying = document.querySelector('.now-playing');
        this.progressBar = document.querySelector('.progress');
    }

    async loadTracks() {
        const cassettesContainer = document.querySelector('.cassettes-container');
        
        // Используем демо-треки вместо запроса к API
        const demoTracks = [
            { file: 'Демо трек 1.mp3', color: 'hsl(20, 70%, 70%)' },
            { file: 'Демо трек 2.mp3', color: 'hsl(120, 70%, 70%)' },
            { file: 'Демо трек 3.mp3', color: 'hsl(200, 70%, 70%)' },
            { file: 'Демо трек 4.mp3', color: 'hsl(260, 70%, 70%)' },
            { file: 'Демо трек 5.mp3', color: 'hsl(320, 70%, 70%)' },
            { file: 'Ретро микс.mp3', color: 'hsl(40, 70%, 70%)' }
        ];
        
        try {
            // Очищаем контейнер перед добавлением кассет
            cassettesContainer.innerHTML = '';
            
            // Используем демо-треки
            this.tracks = demoTracks;
            
            // Создаем кассеты для каждого трека
            this.tracks.forEach((track, index) => {
                const cassette = document.createElement('div');
                cassette.className = 'cassette';
                cassette.style.backgroundColor = track.color;
                
                const title = document.createElement('div');
                title.className = 'cassette-title';
                title.textContent = track.file.replace('.mp3', '');
                cassette.appendChild(title);
                
                const holes = document.createElement('div');
                holes.className = 'cassette-holes';
                
                const hole1 = document.createElement('div');
                hole1.className = 'cassette-hole';
                const hole2 = document.createElement('div');
                hole2.className = 'cassette-hole';
                
                holes.appendChild(hole1);
                holes.appendChild(hole2);
                cassette.appendChild(holes);
                
                cassette.dataset.index = index;
                cassette.addEventListener('click', () => this.selectTrack(index));
                cassettesContainer.appendChild(cassette);
            });
            
            // Инициализируем начальное положение проигрывателя
            setTimeout(() => this.resetPlayerPosition(), 100);
            
        } catch (error) {
            console.error('Ошибка при загрузке треков:', error);
            this.nowPlaying.textContent = 'Ошибка при загрузке треков';
        }
    }

    setupEventListeners() {
        // Кнопки управления воспроизведением
        this.playBtn.addEventListener('click', () => this.togglePlay());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        
        // Компрессор и эквалайзер
        this.inputGain.addEventListener('input', (e) => this.updateCompressor('threshold', e.target.value));
        this.outputGain.addEventListener('input', (e) => this.updateCompressor('knee', e.target.value));
        this.bypassBtn.addEventListener('click', () => this.toggleBypass());
        
        this.eqLow.addEventListener('input', (e) => this.updateEQ('low', e.target.value));
        this.eqMid.addEventListener('input', (e) => this.updateEQ('mid', e.target.value));
        this.eqHigh.addEventListener('input', (e) => this.updateEQ('high', e.target.value));

        // Обработчик для крутилок компрессора
        const knobs = document.querySelectorAll('.knob input');
        knobs.forEach(input => {
            let isDragging = false;
            let startAngle = 0;
            let currentAngle = 0;
            const knobBody = input.parentElement.querySelector('.knob-body');

            input.addEventListener('mousedown', (e) => {
                isDragging = true;
                const rect = input.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
                currentAngle = parseInt(input.value) * 2.7 - 135; // Преобразуем значение в угол
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;

                const rect = input.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
                const angleDiff = angle - startAngle;
                let newAngle = currentAngle + (angleDiff * 180 / Math.PI);

                // Ограничиваем угол от -135 до 135 градусов
                newAngle = Math.max(-135, Math.min(135, newAngle));
                
                // Преобразуем угол в значение от 0 до 100
                const value = Math.round((newAngle + 135) / 2.7);
                input.value = value;

                // Поворачиваем индикатор
                knobBody.style.transform = `rotate(${newAngle}deg)`;

                // Обновляем параметры компрессора
                if (input.parentElement.classList.contains('input-gain')) {
                    this.updateCompressor('threshold', value);
                } else {
                    this.updateCompressor('knee', value);
                }

                e.preventDefault();
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
        });
    }

    selectTrack(index) {
        this.currentTrackIndex = index;
        const trackName = this.tracks[index].file.replace('.mp3', '');
        this.nowPlaying.textContent = trackName;
        
        // Для демо-режима просто запускаем анимацию без попытки загрузить файл
        this.animatePlayer(index);
        
        // Эмулируем воспроизведение
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Запускаем фоновую анимацию VU-метра для демонстрации
        this.isPlaying = true;
        this.playBtn.textContent = '⏸';
        
        // Эмулируем прогресс воспроизведения
        this.startDemoProgress();
    }
    
    startDemoProgress() {
        // Останавливаем предыдущий интервал, если он был
        if (this.demoInterval) {
            clearInterval(this.demoInterval);
        }
        
        // Сбрасываем прогресс
        this.progressBar.style.width = '0%';
        let progress = 0;
        
        // Запускаем эмуляцию прогресса
        this.demoInterval = setInterval(() => {
            if (!this.isPlaying) {
                clearInterval(this.demoInterval);
                return;
            }
            
            progress += 0.1;
            if (progress >= 100) {
                clearInterval(this.demoInterval);
                this.nextTrack();
                return;
            }
            
            this.progressBar.style.width = `${progress}%`;
            
            // Анимируем VU-метр случайными значениями
            const reduction = Math.random() * 12;
            const angle = 45 - (reduction * 3);
            const limitedAngle = Math.min(Math.max(-45, angle), 45);
            this.vuMeter.style.transform = `rotate(${limitedAngle}deg)`;
            
        }, 100);
    }
    
    animatePlayer(index) {
        const cassettes = document.querySelectorAll('.cassette');
        const targetCassette = cassettes[index];
        const cassetteRect = targetCassette.getBoundingClientRect();
        const containerRect = document.querySelector('.container').getBoundingClientRect();
        const controlsRect = document.querySelector('.controls').getBoundingClientRect();
        
        // Вычисляем позицию относительно контейнера
        const targetLeft = (cassetteRect.left - containerRect.left);
        this.player.style.left = `${targetLeft + (cassetteRect.width / 2)}px`;
        this.player.style.top = `${cassetteRect.bottom - containerRect.top + 20}px`;
        
        // Вычисляем длину и угол проводов
        this.updateWires();
    }
    
    resetPlayerPosition() {
        const controlsRect = document.querySelector('.controls').getBoundingClientRect();
        const containerRect = document.querySelector('.container').getBoundingClientRect();
        
        // Возвращаем проигрыватель в центр над панелью управления
        this.player.style.left = '50%';
        this.player.style.top = `${controlsRect.top - containerRect.top - 50}px`;
        
        // Обновляем провода
        this.updateWires();
    }
    
    updateWires() {
        const playerRect = this.player.getBoundingClientRect();
        const controlsRect = document.querySelector('.controls').getBoundingClientRect();
        const containerRect = document.querySelector('.container').getBoundingClientRect();
        
        // Точки соединения проводов с проигрывателем
        const playerLeftX = playerRect.left + playerRect.width * 0.25;
        const playerRightX = playerRect.left + playerRect.width * 0.75;
        const playerBottomY = playerRect.bottom;
        
        // Точки соединения с панелью управления
        const controlLeftX = controlsRect.left + controlsRect.width * 0.4;
        const controlRightX = controlsRect.left + controlsRect.width * 0.6;
        const controlTopY = controlsRect.top;
        
        // Рассчитываем параметры для левого провода
        const leftDx = playerLeftX - controlLeftX;
        const leftDy = playerBottomY - controlTopY;
        const leftLength = Math.sqrt(leftDx * leftDx + leftDy * leftDy);
        const leftAngle = Math.atan2(leftDy, leftDx) * (180 / Math.PI);
        
        // Рассчитываем параметры для правого провода
        const rightDx = playerRightX - controlRightX;
        const rightDy = playerBottomY - controlTopY;
        const rightLength = Math.sqrt(rightDx * rightDx + rightDy * rightDy);
        const rightAngle = Math.atan2(rightDy, rightDx) * (180 / Math.PI);
        
        // Позиционируем левый провод
        this.wireLeft.style.height = `${leftLength}px`;
        this.wireLeft.style.bottom = `${containerRect.bottom - controlTopY}px`;
        this.wireLeft.style.right = `${containerRect.right - controlLeftX}px`;
        this.wireLeft.style.transform = `rotate(${leftAngle}deg)`;
        
        // Позиционируем правый провод
        this.wireRight.style.height = `${rightLength}px`;
        this.wireRight.style.bottom = `${containerRect.bottom - controlTopY}px`;
        this.wireRight.style.left = `${controlRightX - containerRect.left}px`;
        this.wireRight.style.transform = `rotate(${rightAngle - 180}deg)`;
    }

    togglePlay() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        if (this.isPlaying) {
            this.isPlaying = false;
            this.playBtn.textContent = '▶';
            // Для демо просто останавливаем анимацию
            if (this.demoInterval) {
                clearInterval(this.demoInterval);
            }
        } else {
            this.isPlaying = true;
            this.playBtn.textContent = '⏸';
            // Возобновляем эмуляцию прогресса
            this.startDemoProgress();
        }
    }

    stop() {
        this.isPlaying = false;
        this.playBtn.textContent = '▶';
        
        // Для демо останавливаем анимацию
        if (this.demoInterval) {
            clearInterval(this.demoInterval);
        }
        
        // Сбрасываем прогресс
        this.progressBar.style.width = '0%';
        
        // Возвращаем проигрыватель в исходное положение
        this.resetPlayerPosition();
    }

    previousTrack() {
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
        this.selectTrack(this.currentTrackIndex);
    }

    nextTrack() {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
        this.selectTrack(this.currentTrackIndex);
    }

    updateCompressor(param, value) {
        const normalizedValue = value / 100;
        switch (param) {
            case 'threshold':
                this.compressor.threshold.value = -60 + (normalizedValue * 60);
                break;
            case 'knee':
                this.compressor.knee.value = normalizedValue * 40;
                break;
        }
    }

    updateEQ(band, value) {
        const normalizedValue = (value - 50) / 50 * 15; // от -15 до +15 dB
        this.equalizer[band].gain.value = Math.pow(10, normalizedValue / 20);
    }

    toggleBypass() {
        const isBypassed = this.bypassBtn.classList.toggle('active');
        
        // В демо-режиме только переключаем класс кнопки
        // Эмулируем изменение VU-метра при изменении bypass
        if (isBypassed) {
            // VU-метр показывает меньше компрессии в режиме bypass
            this.vuMeter.style.transform = 'rotate(30deg)';
        } else {
            // VU-метр показывает больше компрессии без bypass
            this.vuMeter.style.transform = 'rotate(0deg)';
        }
    }

    updateVUMeter() {
        // В демо-режиме метод updateVUMeter не используется,
        // так как VU-метр обновляется в startDemoProgress
    }

    updateProgress() {
        // В демо-режиме метод updateProgress не используется,
        // так как прогресс обновляется в startDemoProgress
    }
}

// Инициализация плеера при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    new CassettePlayer();
}); 