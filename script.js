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
    
    // --- Configuración de la nueva versión ---
    const innerIcons = { 
        elespejonegro: 'IconoEspejoInner.png', 
        equipoaprueba: 'IconoEquipoInner.png', 
        fuegoyseduccion: 'IconoFuegoInner.png' 
    };

    function showScreen(screenKey) {
        const currentScreen = document.querySelector('.screen.active');
        const nextScreen = screens[screenKey];

        if (currentScreen && currentScreen !== nextScreen) {
            currentScreen.classList.add('flipped');
            // Retrasar la eliminación de 'active' para que la transición de opacidad funcione
            setTimeout(() => {
                currentScreen.classList.remove('active');
            }, 300); 
        }

        nextScreen.classList.add('active');
        // Un pequeño retraso para que el navegador aplique 'active' antes de voltear
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
        screens.question.className = 'screen flipped ' + cat; // Asegurarse de que esté volteada antes de mostrarla
        
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
        
        // Al iniciar, todas las pantallas no activas deben estar 'volteadas'
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
        
        backButton.addEventListener('click', () => { 
            preselectQuestions(); 
            // Reiniciar la clase de la pantalla de pregunta para la próxima vez
            screens.question.className = 'screen flipped';
            showScreen('category'); 
        });

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./serviceworker.js')
              .then(reg => console.log('Service Worker registrado.'))
              .catch(err => console.error('Error al registrar Service Worker:', err));
        }
    }
    init();
});
