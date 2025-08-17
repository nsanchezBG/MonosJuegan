document.addEventListener('DOMContentLoaded', () => {
    const screens = { 
        start: document.getElementById('start-screen'), 
        category: document.getElementById('category-screen'), 
        question: document.getElementById('question-screen') 
    };
    const categoryItems = document.querySelectorAll('.category-item');
    const questionText = document.getElementById('question-text');
    const questionIcon = document.getElementById('question-icon');
    const backButton = document.getElementById('back-button');

    let allQuestions = {}; 
    let availableQuestions = {}; 
    let nextQuestions = {};
    
    // CAMBIOS: Configuración actualizada
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
            // Retrasar la eliminación de 'active' para que la transición de opacidad ocurra durante el giro
            setTimeout(() => {
                currentScreen.classList.remove('active');
            }, 300); 
        }

        // Asegurarse de que la pantalla de destino esté lista para ser mostrada
        nextScreen.classList.add('active');
        // Un pequeño retraso para asegurar que 'active' se aplique antes de iniciar la animación de giro
        setTimeout(() => {
            nextScreen.classList.remove('flipped');
        }, 10);
    }

    function pickRandomQuestion(cat) { 
        if (!availableQuestions[cat] || availableQuestions[cat].length === 0) { 
            availableQuestions[cat] = [...allQuestions[cat]]; 
        } 
        const available = availableQuestions[cat]; 
        if (!available || available.length === 0) return "No hay preguntas."; 
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
        
        // Asignar clase de color y asegurar que la tarjeta esté 'volteada' antes de la transición
        screens.question.className = 'screen flipped ' + cat;
        
        showScreen('question'); 
    }
    
    function init() {
        fetch('questions_pareja.json').then(response => response.json()).then(data => {
            allQuestions = data;
            Object.keys(allQuestions).forEach(key => { 
                availableQuestions[key] = [...allQuestions[key]]; 
            });
            preselectQuestions();
            console.log("Preguntas de pareja cargadas.");
        }).catch(error => console.error('Error al cargar las preguntas:', error));
        
        Object.values(screens).forEach(screen => {
            if (!screen.classList.contains('active')) {
                screen.classList.add('flipped');
            }
        });

        screens.start.addEventListener('click', () => {
            showScreen('category');
        });

        categoryItems.forEach(item => item.addEventListener('click', () => {
            displayQuestion(item.dataset.category);
        }));
        
        // CAMBIO CLAVE: Lógica refinada para el botón de regreso
        backButton.addEventListener('click', () => { 
            preselectQuestions();
            showScreen('category'); // La función showScreen ahora maneja todo el volteo
        });

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./serviceworker.js')
              .then(reg => console.log('Service Worker registrado.'))
              .catch(err => console.error('Error al registrar Service Worker:', err));
        }
    }
    init();
});
