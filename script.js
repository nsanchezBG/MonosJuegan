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

    // Elementos del Juego de Preguntas
    const categoryItems = document.querySelectorAll('.category-item');
    const questionText = document.getElementById('question-text');
    const questionIcon = document.getElementById('question-icon');
    const backButton = document.getElementById('back-button');

    // Elementos del Juego de Temporizador
    const playerCountInput = document.getElementById('player-count');
    const timeMinutesInput = document.getElementById('time-minutes');
    const timerContainer = document.getElementById('timer-container');
    const pauseButton = document.getElementById('pause-button');
    const startTimerButton = document.getElementById('start-timer-button');
    
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
    let playerCount = 2;
    let timePerPlayer = 300; // en segundos (5 minutos por defecto)
    let playerTimes = [];
    let currentPlayerIndex = -1; // -1 = juego no iniciado
    let timerInterval = null;
    let isPaused = false;

    // --- 3. FUNCIONES PRINCIPALES ---

    /**
     * Maneja la animación de volteo de tarjeta para cambiar entre pantallas.
     * @param {string} screenKey - La clave de la pantalla a mostrar (ej. 'category').
     */
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

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function buildTimerScreen() {
        timerContainer.innerHTML = '';
        timerContainer.dataset.players = playerCount;
        playerTimes = Array(playerCount).fill(timePerPlayer);
        isPaused = false;
        currentPlayerIndex = -1; // Resetea el estado para un nuevo juego
        pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
        if (timerInterval) clearInterval(timerInterval);

        const createPlayerArea = (i) => {
            const playerArea = document.createElement('div');
            playerArea.classList.add('player-area', `p-${i + 1}`);
            playerArea.dataset.index = i;
            playerArea.innerHTML = `
                <div class="time-display">${formatTime(playerTimes[i])}</div>
                <div class="player-label">Jugador ${i + 1}</div>
            `;
            playerArea.addEventListener('click', handlePlayerTap);
            return playerArea;
        };

        if (playerCount === 3) {
            timerContainer.appendChild(createPlayerArea(0));
            const bottomRow = document.createElement('div');
            bottomRow.id = 'bottom-row';
            bottomRow.appendChild(createPlayerArea(1));
            bottomRow.appendChild(createPlayerArea(2));
            timerContainer.appendChild(bottomRow);
        } else {
            for (let i = 0; i < playerCount; i++) {
                timerContainer.appendChild(createPlayerArea(i));
            }
        }
    }

    function handlePlayerTap(event) {
        if (isPaused) return;
        const tappedIndex = parseInt(event.currentTarget.dataset.index);

        if (playerTimes[tappedIndex] <= 0) return; // No hacer nada si el jugador ya perdió

        if (currentPlayerIndex === -1) { // Primer toque para empezar el juego
            startTimerFor(tappedIndex);
        } else if (tappedIndex === currentPlayerIndex) { // Toque del jugador activo para pasar el turno
            let nextPlayerIndex = (currentPlayerIndex + 1) % playerCount;
            // Saltar jugadores que ya perdieron
            while(playerTimes[nextPlayerIndex] <= 0) {
                nextPlayerIndex = (nextPlayerIndex + 1) % playerCount;
                if (nextPlayerIndex === currentPlayerIndex) { // Todos los demás perdieron
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
        if(playerEl) playerEl.classList.add('active');

        timerInterval = setInterval(() => {
            playerTimes[index]--;
            if(playerEl) playerEl.querySelector('.time-display').textContent = formatTime(playerTimes[index]);
            
            if (playerTimes[index] <= 0) {
                stopCurrentTimer();
                if(playerEl) playerEl.classList.add('loser');
            }
        }, 1000);
    }

    function stopCurrentTimer() {
        clearInterval(timerInterval);
    }

    // --- 6. INICIALIZACIÓN Y EVENT LISTENERS ---

    function init() {
        // Cargar las preguntas para el juego de pareja
        fetch('questions_pareja.json').then(response => response.json())
            .then(data => {
                allQuestions = data;
                Object.keys(allQuestions).forEach(key => { availableQuestions[key] = [...allQuestions[key]]; });
                preselectQuestions();
                console.log("Preguntas de pareja cargadas.");
            }).catch(error => console.error('Error al cargar las preguntas:', error));
        
        // Preparar las pantallas para la animación de volteo
        Object.values(screens).forEach(screen => {
            if (!screen.classList.contains('active')) {
                screen.classList.add('flipped');
            }
        });

        // --- NAVEGACIÓN GLOBAL ---
        screens.start.addEventListener('click', () => showScreen('gameSelection'));
        backToGamesButton.addEventListener('click', () => showScreen('gameSelection'));
        backToGamesFromTimerConfig.addEventListener('click', () => {
            stopCurrentTimer();
            showScreen('gameSelection');
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
        document.getElementById('increment-players').addEventListener('click', () => { if (playerCount < 4) playerCount++; playerCountInput.value = playerCount; });
        document.getElementById('decrement-players').addEventListener('click', () => { if (playerCount > 1) playerCount--; playerCountInput.value = playerCount; });
        document.getElementById('increment-time').addEventListener('click', () => { timeMinutesInput.value = parseInt(timeMinutesInput.value) + 1; });
        document.getElementById('decrement-time').addEventListener('click', () => { if (parseInt(timeMinutesInput.value) > 1) timeMinutesInput.value = parseInt(timeMinutesInput.value) - 1; });
        startTimerButton.addEventListener('click', () => {
            playerCount = parseInt(playerCountInput.value);
            timePerPlayer = parseInt(timeMinutesInput.value) * 60;
            buildTimerScreen();
            showScreen('timer');
        });
        pauseButton.addEventListener('click', () => {
            if (currentPlayerIndex === -1) return; // No hacer nada si el juego no ha empezado
            isPaused = !isPaused;
            if (isPaused) {
                stopCurrentTimer();
                pauseButton.innerHTML = '<i class="fas fa-play"></i>';
            } else {
                startTimerFor(currentPlayerIndex);
                pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
            }
        });

        // --- REGISTRO DEL SERVICE WORKER ---
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./serviceworker.js')
              .then(reg => console.log('Service Worker registrado con éxito.'))
              .catch(err => console.error('Error al registrar el Service Worker:', err));
        }
    }
    
    // Iniciar la aplicación
    init();
});
