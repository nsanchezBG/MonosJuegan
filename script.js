document.addEventListener('DOMContentLoaded', () => {
    // CAMBIO: Añadida la nueva pantalla de selección de juegos
    const screens = { 
        start: document.getElementById('start-screen'), 
        gameSelection: document.getElementById('game-selection-screen'),
        category: document.getElementById('category-screen'), 
        question: document.getElementById('question-screen') 
    };

    // NUEVO: Elementos de la nueva pantalla
    const gameItems = document.querySelectorAll('.game-item');
    const backToGamesButton = document.getElementById('back-to-games-button');

    // Elementos existentes
    const categoryItems = document.querySelectorAll('.category-item');
    const questionText = document.getElementById('question-text');
    const questionIcon = document.getElementById('question-icon');
    const backButton = document.getElementById('back-button');

    let allQuestions = {}; 
    let availableQuestions = {}; 
    let nextQuestions = {};
    
    const innerIcons = { 
        elespejonegro: 'IconoEspejoInner.png', 
        equipoaprueba: 'IconoEquipoInner.png', 
        fuego: 'IconoFuegoInner.png' 
    };

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

    function pickRandomQuestion(cat) { 
        if (!availableQuestions[cat] || availableQuestions[cat].length === 0) { availableQuestions[cat] = [...allQuestions[cat]]; } 
        const available = availableQuestions[cat]; 
        if (!available || available.length === 0) return "No hay preguntas."; 
        const idx = Math.floor(Math.random() * available.length); 
        return available.splice(idx, 1)[0]; 
    }

    function preselectQuestions() { 
        Object.keys(allQuestions).forEach(cat => { nextQuestions[cat] = pickRandomQuestion(cat); }); 
    }

    function displayQuestion(cat) { 
        const q = nextQuestions[cat]; 
        questionText.textContent = q; 
        questionIcon.src = innerIcons[cat]; 
        screens.question.className = 'screen flipped ' + cat;
        showScreen('question'); 
    }
    
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

        // --- LÓGICA DE NAVEGACIÓN REESTRUCTURADA ---

        // 1. De Inicio a Selección de Juego
        screens.start.addEventListener('click', () => {
            showScreen('gameSelection');
        });

        // 2. De Selección de Juego al Lobby del Juego (Categorías)
        gameItems.forEach(item => {
            item.addEventListener('click', () => {
                const game = item.dataset.game;
                if (game === 'pareja') {
                    showScreen('category');
                }
                // Aquí podrías añadir lógica para otros juegos en el futuro
            });
        });

        // 3. De Categorías a la Pregunta (Bucle interno del juego)
        categoryItems.forEach(item => item.addEventListener('click', () => {
            displayQuestion(item.dataset.category);
        }));
        
        // 4. De la Pregunta de vuelta a Categorías (Bucle interno del juego)
        backButton.addEventListener('click', () => { 
            preselectQuestions();
            showScreen('category'); 
        });

        // 5. Del Lobby del Juego (Categorías) de vuelta a Selección de Juego
        backToGamesButton.addEventListener('click', () => {
            showScreen('gameSelection');
        });

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./serviceworker.js')
              .then(reg => console.log('Service Worker registrado.'))
              .catch(err => console.error('Error al registrar Service Worker:', err));
        }
    }
    init();
});
