document.addEventListener('DOMContentLoaded', () => {
    // --- 1. REFERENCIAS A ELEMENTOS DEL DOM ---
    const screens = { 
        start: document.getElementById('start-screen'), 
        gameSelection: document.getElementById('game-selection-screen'),
        category: document.getElementById('category-screen'), 
        timerConfig: document.getElementById('timer-config-screen'),
        question: document.getElementById('question-screen'),
        timer: document.getElementById('timer-screen')
    };

    // Elementos de Navegación
    const gameItems = document.querySelectorAll('.game-item');
    const backToGamesButton = document.getElementById('back-to-games-button');
    const backToGamesFromTimerConfig = document.getElementById('back-to-games-from-timer-config');
    const backToConfigFromTimer = document.getElementById('back-to-config-from-timer');

    // Elementos del Juego de Preguntas
    const categoryItems = document.querySelectorAll('.category-item');
    const questionText = document.getElementById('question-text');
    const questionIcon = document.getElementById('question-icon');
    const backButton = document.getElementById('back-button');

    // Elementos del Juego de Temporizador
    const playerCountDisplay = document.getElementById('player-count-display');
    const timeMinutesInput = document.getElementById('time-minutes');
    const timerContainer = document.getElementById('timer-container');
    const pauseButton = document.getElementById('pause-button');
    const startTimerButton = document.getElementById('start-timer-button');
    const playerConfigsContainer = document.getElementById('player-configs-container');

    // --- 2. ESTADO Y VARIABLES DE LOS JUEGOS ---

    // Juego de Preguntas
    let allQuestions = {}; 
    let availableQuestions = {}; 
    let nextQuestions = {};
    const innerIcons = { 
        elespejonegro: 'IconoEspejoInner.png', 
        equipoaprueba: 'IconoEquipoInner.png', 
        fuego: 'IconoFuegoInner.png' 
    };

    // Juego de Temporizador
    const colorPalette = ['#B49FDC', '#C5EBFE', '#FEFD97', '#A5F8CE', '#FEC9A7', '#F197C0'];
    let players = []; // Array de objetos { name: string, color: string }
    let timePerPlayer = 300;
    let currentPlayerIndex = -1;
    let timerInterval = null;
    let isPaused = false;

    // --- 3. FUNCIONES PRINCIPALES ---

    function showScreen(screenKey) {
        const currentScreen = document.querySelector('.screen.active');
        const nextScreen = screens[screenKey];

        if (currentScreen && currentScreen !== nextScreen) {
            currentScreen.classList.add('flipped');
            setTimeout(() => {
                currentScreen.classList.remove('active');
            }, 300); 
        }

        nextScreen.classList.add('active');
        setTimeout(() => {
            nextScreen.classList.remove('flipped');
        }, 10);
    }

    // --- 4. FUNCIONES DEL JUEGO DE PREGUNTAS ---

    function pickRandomQuestion(cat) { 
        if (!availableQuestions[cat] || availableQuestions[cat].length === 0) { 
            availableQuestions[cat] = [...allQuestions[cat]]; 
        } 
        const available = availableQuestions[cat]; 
        if (!available || available.length === 0) return "No hay más preguntas en esta categoría."; 
        const idx = Math.floor(Math.random() * available.length); 
        return available.splice(idx, 1)[0]; 
    }

    function preselectQuestions() { 
        Object.keys(allQuestions).forEach(cat => { 
            nextQuestions[cat] = pickRandomQuestion(cat); 
        }); 
    }

    function displayQuestion(cat) { 
        const q = nextQuestions[cat]; 
        questionText.textContent = q; 
        questionIcon.src = innerIcons[cat]; 
        screens.question.className = 'screen flipped ' + cat;
        showScreen('question'); 
    }

    // --- 5. FUNCIONES DEL JUEGO DE TEMPORIZADOR ---

    function renderPlayerConfigs() {
        playerConfigsContainer.innerHTML = '';
        players.forEach((player, index) => {
            const configRow = document.createElement('div');
            configRow.classList.add('player-config-row');

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.classList.add('player-name-input');
            nameInput.placeholder = `Nombre Jugador ${index + 1} (Opcional)`;
            nameInput.value = player.name;
            nameInput.addEventListener('input', (e) => {
                players[index].name = e.target.value;
            });

            const paletteDiv = document.createElement('div');
            paletteDiv.classList.add('color-palette');
            colorPalette.forEach(color => {
                const swatch = document.createElement('div');
                swatch.classList.add('color-swatch');
                swatch.style.backgroundColor = color;
                if (color === player.color) {
                    swatch.classList.add('selected');
                }
                swatch.addEventListener('click', () => {
                    players[index].color = color;
                    renderPlayerConfigs();
                });
                paletteDiv.appendChild(swatch);
            });
            
            configRow.appendChild(nameInput);
            configRow.appendChild(paletteDiv);
            playerConfigsContainer.appendChild(configRow);
        });
    }

    function updatePlayerCount(newCount) {
        playerCountDisplay.value = newCount;
        while (players.length < newCount) {
            players.push({ 
                name: '', 
                color: colorPalette[players.length % colorPalette.length] 
            });
        }
        while (players.length > newCount) {
            players.pop();
        }
        renderPlayerConfigs();
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function buildTimerScreen() {
        timerContainer.innerHTML = '';
        timerContainer.dataset.players = players.length;
        playerTimes = Array(players.length).fill(timePerPlayer);
        isPaused = false;
        currentPlayerIndex = -1;
        pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
        backToConfigFromTimer.classList.remove('visible');
        if (timerInterval) clearInterval(timerInterval);

        const createPlayerArea = (i) => {
            const playerArea = document.createElement('div');
            playerArea.classList.add('player-area');
            playerArea.dataset.index = i;
            playerArea.style.backgroundColor = players[i].color;
            playerArea.innerHTML = `
                <div class="time-display">${formatTime(playerTimes[i])}</div>
                <div class="player-label">${players[i].name || `Jugador ${i + 1}`}</div>
            `;
            playerArea.addEventListener('click', handlePlayerTap);
            return playerArea;
        };

        if (players.length === 3) {
            timerContainer.appendChild(createPlayerArea(0));
            const bottomRow = document.createElement('div');
            bottomRow.id = 'bottom-row';
            bottomRow.appendChild(createPlayerArea(1));
            bottomRow.appendChild(createPlayerArea(2));
            timerContainer.appendChild(bottomRow);
        } else {
            for (let i = 0; i < players.length; i++) {
                timerContainer.appendChild(createPlayerArea(i));
            }
        }
    }

    function handlePlayerTap(event) {
        if (isPaused) return;
        const tappedIndex = parseInt(event.currentTarget.dataset.index);

        if (playerTimes[tappedIndex] <= 0) return;

        if (currentPlayerIndex === -1) {
            startTimerFor(tappedIndex);
        } else if (tappedIndex === currentPlayerIndex) {
            let nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
            while (playerTimes[nextPlayerIndex] <= 0) {
                nextPlayerIndex = (nextPlayerIndex + 1) % players.length;
                if (nextPlayerIndex === currentPlayerIndex) {
                    stopCurrentTimer();
                    return;
                }
            }
            startTimerFor(nextPlayerIndex);
        }
    }

    function startTimerFor(index) {
        stopCurrentTimer();
        currentPlayerIndex = index;
        
        document.querySelectorAll('.player-area').forEach(el => el.classList.remove('active'));
        const playerEl = timerContainer.querySelector(`[data-index="${index}"]`);
        if (playerEl) playerEl.classList.add('active');

        timerInterval = setInterval(() => {
            playerTimes[index]--;
            if (playerEl) playerEl.querySelector('.time-display').textContent = formatTime(playerTimes[index]);
            
            if (playerTimes[index] <= 0) {
                stopCurrentTimer();
                if (playerEl) playerEl.classList.add('loser');
            }
        }, 1000);
    }

    function stopCurrentTimer() {
        clearInterval(timerInterval);
    }

    // --- 6. INICIALIZACIÓN Y EVENT LISTENERS ---

    function init() {
        fetch('questions_pareja.json').then(response => response.json())
            .then(data => {
                allQuestions = data;
                Object.keys(allQuestions).forEach(key => { availableQuestions[key] = [...allQuestions[key]]; });
                preselectQuestions();
                console.log("Preguntas de pareja cargadas.");
            }).catch(error => console.error('Error al cargar las preguntas:', error));
        
        Object.values(screens).forEach(screen => {
            if (!screen.classList.contains('active')) {
                screen.classList.add('flipped');
            }
        });

        // --- NAVEGACIÓN GLOBAL ---
        screens.start.addEventListener('click', () => showScreen('gameSelection'));
        backToGamesButton.addEventListener('click', () => showScreen('gameSelection'));
        backToGamesFromTimerConfig.addEventListener('click', () => showScreen('gameSelection'));
        backToConfigFromTimer.addEventListener('click', () => {
            stopCurrentTimer();
            showScreen('timerConfig');
        });
        
        gameItems.forEach(item => {
            item.addEventListener('click', () => {
                const game = item.dataset.game;
                if (game === 'pareja') {
                    showScreen('category');
                } else if (game === 'timer') {
                    showScreen('timerConfig');
                }
            });
        });
        
        // --- EVENT LISTENERS DEL JUEGO DE PREGUNTAS ---
        categoryItems.forEach(item => item.addEventListener('click', () => {
            displayQuestion(item.dataset.category);
        }));
        
        backButton.addEventListener('click', () => { 
            preselectQuestions();
            showScreen('category'); 
        });

        // --- EVENT LISTENERS DEL JUEGO DE TEMPORIZADOR ---
        document.getElementById('increment-players').addEventListener('click', () => { if (players.length < 4) updatePlayerCount(players.length + 1); });
        document.getElementById('decrement-players').addEventListener('click', () => { if (players.length > 1) updatePlayerCount(players.length - 1); });
        document.getElementById('increment-time').addEventListener('click', () => { timeMinutesInput.value = parseInt(timeMinutesInput.value) + 1; });
        document.getElementById('decrement-time').addEventListener('click', () => { if (parseInt(timeMinutesInput.value) > 1) timeMinutesInput.value = parseInt(timeMinutesInput.value) - 1; });
        startTimerButton.addEventListener('click', () => {
            timePerPlayer = parseInt(timeMinutesInput.value) * 60;
            buildTimerScreen();
            showScreen('timer');
        });
        pauseButton.addEventListener('click', () => {
            if (currentPlayerIndex === -1) return;
            isPaused = !isPaused;
            if (isPaused) {
                stopCurrentTimer();
                pauseButton.innerHTML = '<i class="fas fa-play"></i>';
                backToConfigFromTimer.classList.add('visible');
            } else {
                startTimerFor(currentPlayerIndex);
                pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
                backToConfigFromTimer.classList.remove('visible');
            }
        });

        updatePlayerCount(2); // Inicializar la config del timer con 2 jugadores por defecto

        // --- REGISTRO DEL SERVICE WORKER ---
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./serviceworker.js')
              .then(reg => console.log('Service Worker registrado con éxito.'))
              .catch(err => console.error('Error al registrar el Service Worker:', err));
        }
    }
    
    init();
});
