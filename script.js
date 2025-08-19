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

    // --- 2. ESTADO Y VARIABLES DE LOS JUEGOS ---
    // Juego de Preguntas
    let allQuestions = {}, availableQuestions = {}, nextQuestions = {};
    const innerIcons = { elespejonegro: 'IconoEspejoInner.png', equipoaprueba: 'IconoEquipoInner.png', fuego: 'IconoFuegoInner.png' };

    // Juego de Temporizador
    const colorPalette = ['#B49FDC', '#C5EBFE', '#FEFD97', '#A5F8CE', '#FEC9A7', '#F197C0'];
    let players = [], timePerPlayer = 300, currentPlayerIndex = -1, timerInterval = null, isPaused = false;

    // --- 3. FUNCIONES PRINCIPALES ---
    function showScreen(screenKey) {
        const currentScreen = document.querySelector('.screen.active');
        const nextScreen = screens[screenKey];
        if (currentScreen && currentScreen !== nextScreen) {
            currentScreen.classList.add('flipped');
            setTimeout(() => currentScreen.classList.remove('active'), 300);
        }
        nextScreen.classList.add('active');
        setTimeout(() => nextScreen.classList.remove('flipped'), 10);
    }

    // --- 4. FUNCIONES DEL JUEGO DE PREGUNTAS ---
    function pickRandomQuestion(cat) { 
        if (!availableQuestions[cat] || availableQuestions[cat].length === 0) availableQuestions[cat] = [...allQuestions[cat]];
        const available = availableQuestions[cat];
        if (!available || available.length === 0) return "No hay más preguntas.";
        const idx = Math.floor(Math.random() * available.length);
        return available.splice(idx, 1)[0];
    }
    function preselectQuestions() { Object.keys(allQuestions).forEach(cat => nextQuestions[cat] = pickRandomQuestion(cat)); }
    function displayQuestion(cat) {
        const q = nextQuestions[cat];
        document.getElementById('question-text').textContent = q;
        document.getElementById('question-icon').src = innerIcons[cat];
        screens.question.className = 'screen flipped ' + cat;
        showScreen('question');
    }

    // --- 5. FUNCIONES DEL JUEGO DE TEMPORIZADOR ---
    function renderPlayerConfigs() {
        const container = document.getElementById('player-configs-container');
        container.innerHTML = '';
        players.forEach((player, index) => {
            const configRow = document.createElement('div');
            configRow.className = 'player-config-row';
            const nameInput = document.createElement('input');
            nameInput.className = 'player-name-input';
            nameInput.placeholder = `Nombre Jugador ${index + 1} (Opcional)`;
            nameInput.value = player.name;
            nameInput.oninput = (e) => players[index].name = e.target.value;
            const paletteDiv = document.createElement('div');
            paletteDiv.className = 'color-palette';
            colorPalette.forEach(color => {
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.style.backgroundColor = color;
                if (color === player.color) swatch.classList.add('selected');
                swatch.onclick = () => { players[index].color = color; renderPlayerConfigs(); };
                paletteDiv.appendChild(swatch);
            });
            configRow.appendChild(nameInput);
            configRow.appendChild(paletteDiv);
            container.appendChild(configRow);
        });
    }
    function updatePlayerCount(newCount) {
        document.getElementById('player-count-display').value = newCount;
        while (players.length < newCount) players.push({ name: '', color: colorPalette[players.length % colorPalette.length] });
        while (players.length > newCount) players.pop();
        renderPlayerConfigs();
    }
    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    function buildTimerScreen() {
        const container = document.getElementById('timer-container');
        container.innerHTML = '';
        container.dataset.players = players.length;
        playerTimes = Array(players.length).fill(timePerPlayer);
        isPaused = false;
        currentPlayerIndex = -1;
        document.getElementById('pause-button').innerHTML = '<i class="fas fa-pause"></i>';
        document.querySelector('.back-to-config').classList.remove('visible');
        if (timerInterval) clearInterval(timerInterval);
        const createPlayerArea = (i) => {
            const area = document.createElement('div');
            area.className = 'player-area';
            area.dataset.index = i;
            area.style.backgroundColor = players[i].color;
            area.innerHTML = `<div class="time-display">${formatTime(playerTimes[i])}</div><div class="player-label">${players[i].name || `Jugador ${i + 1}`}</div>`;
            area.onclick = handlePlayerTap;
            return area;
        };
        if (players.length === 3) {
            container.appendChild(createPlayerArea(0));
            const bottomRow = document.createElement('div');
            bottomRow.id = 'bottom-row';
            bottomRow.appendChild(createPlayerArea(1));
            bottomRow.appendChild(createPlayerArea(2));
            container.appendChild(bottomRow);
        } else {
            for (let i = 0; i < players.length; i++) container.appendChild(createPlayerArea(i));
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
                if (nextPlayerIndex === currentPlayerIndex) { stopCurrentTimer(); return; }
            }
            startTimerFor(nextPlayerIndex);
        }
    }
    function startTimerFor(index) {
        stopCurrentTimer();
        currentPlayerIndex = index;
        document.querySelectorAll('.player-area').forEach(el => el.classList.remove('active'));
        const playerEl = document.querySelector(`.player-area[data-index="${index}"]`);
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
    function stopCurrentTimer() { clearInterval(timerInterval); }

    // --- 6. INICIALIZACIÓN Y EVENT LISTENERS ---
    function init() {
        // Cargar las preguntas para el juego de pareja
        fetch('questions_pareja.json').then(response => {
            if (!response.ok) throw new Error(`Error en el archivo JSON! status: ${response.status}`);
            return response.json();
        }).then(data => {
            allQuestions = data;
            Object.keys(allQuestions).forEach(key => availableQuestions[key] = [...allQuestions[key]]);
            preselectQuestions();
            console.log("Preguntas de pareja cargadas.");
        }).catch(error => console.error('Error al cargar las preguntas:', error));
        
        // Preparar las pantallas para la animación de volteo
        Object.values(screens).forEach(screen => {
            if (!screen.classList.contains('active')) screen.classList.add('flipped');
        });

        // --- NAVEGACIÓN GLOBAL ---
        screens.start.addEventListener('click', () => showScreen('gameSelection'));
        document.querySelectorAll('.back-to-games').forEach(btn => {
            btn.addEventListener('click', () => showScreen('gameSelection'));
        });
        document.querySelector('.back-to-config').addEventListener('click', () => {
            stopCurrentTimer();
            showScreen('timerConfig');
        });
        
        document.querySelectorAll('.game-item').forEach(item => {
            item.addEventListener('click', () => {
                const game = item.dataset.game;
                if (game === 'pareja') showScreen('category');
                else if (game === 'timer') showScreen('timerConfig');
            });
        });
        
        // --- LISTENERS DEL JUEGO DE PREGUNTAS ---
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => displayQuestion(item.dataset.category));
        });
        document.querySelector('.back-to-categories').addEventListener('click', () => { 
            preselectQuestions();
            showScreen('category'); 
        });

        // --- LISTENERS DEL JUEGO DE TEMPORIZADOR ---
        document.getElementById('increment-players').addEventListener('click', () => { if (players.length < 4) updatePlayerCount(players.length + 1); });
        document.getElementById('decrement-players').addEventListener('click', () => { if (players.length > 1) updatePlayerCount(players.length - 1); });
        document.getElementById('increment-time').addEventListener('click', () => { document.getElementById('time-minutes').value = parseInt(document.getElementById('time-minutes').value) + 1; });
        document.getElementById('decrement-time').addEventListener('click', () => { if (parseInt(document.getElementById('time-minutes').value) > 1) document.getElementById('time-minutes').value = parseInt(document.getElementById('time-minutes').value) - 1; });
        document.getElementById('start-timer-button').addEventListener('click', () => {
            timePerPlayer = parseInt(document.getElementById('time-minutes').value) * 60;
            buildTimerScreen();
            showScreen('timer');
        });
        document.getElementById('pause-button').addEventListener('click', () => {
            if (currentPlayerIndex === -1) return;
            isPaused = !isPaused;
            const pauseBtn = document.getElementById('pause-button');
            const backBtn = document.querySelector('.back-to-config');
            if (isPaused) {
                stopCurrentTimer();
                pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                backBtn.classList.add('visible');
            } else {
                startTimerFor(currentPlayerIndex);
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                backBtn.classList.remove('visible');
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
    
    // Iniciar la aplicación
    init();
});
