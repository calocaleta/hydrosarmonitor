// ========================================
// HYDROSAR MONITOR - MINIJUEGO "CAZA GOTAS"
// ========================================

// Configuración del juego
const GAME_CONFIG = {
    maxDrops: 8,
    dropLifetime: 15000, // 15 segundos
    spawnInterval: 5000, // Cada 5 segundos
    goalDrops: 5,
    animationDuration: 2000
};

// Variables globales del juego
let gameActive = false;
let dropsCollected = 0;
let activeDrops = [];
let dropMarkers = [];
let spawnTimer = null;
let achievementUnlocked = false;

// Posiciones de gotas (zonas de lluvia simuladas)
const DROP_LOCATIONS = [
    { lat: -12.0464, lng: -77.0428, intensity: 'high' },
    { lat: -12.0514, lng: -77.0478, intensity: 'medium' },
    { lat: -12.0414, lng: -77.0378, intensity: 'high' },
    { lat: -12.0364, lng: -77.0528, intensity: 'low' },
    { lat: -12.0564, lng: -77.0578, intensity: 'medium' },
    { lat: -12.0314, lng: -77.0278, intensity: 'high' },
    { lat: -12.0464, lng: -77.0628, intensity: 'low' },
    { lat: -12.0214, lng: -77.0428, intensity: 'medium' }
];

// ========================================
// INICIALIZACIÓN
// ========================================

/**
 * Inicializa el minijuego
 */
function initializeGame() {
    console.log('🎮 Inicializando minijuego Caza Gotas...');

    // Crear contador de gotas
    createDropCounter();

    // Crear botón de toggle del juego
    createGameToggleButton();

    console.log('✅ Minijuego inicializado (inactivo)');
}

/**
 * Crea el contador de gotas recolectadas
 */
function createDropCounter() {
    const counter = document.createElement('div');
    counter.className = 'drop-counter';
    counter.id = 'drop-counter';
    counter.style.display = 'none';

    counter.innerHTML = `
        <div class="drop-counter-content">
            <span class="drop-counter-icon">💧</span>
            <span class="drop-counter-text">
                <strong id="drops-count">0</strong>/<strong>${GAME_CONFIG.goalDrops}</strong>
            </span>
        </div>
        <div class="drop-counter-label">Gotas recolectadas</div>
    `;

    document.body.appendChild(counter);
}

/**
 * Crea el botón para activar/desactivar el juego
 */
function createGameToggleButton() {
    const button = document.createElement('button');
    button.className = 'game-toggle-button';
    button.id = 'game-toggle';
    button.innerHTML = `
        <span class="game-icon">🎮</span>
        <span class="game-text">Modo Juego</span>
    `;
    button.onclick = toggleGame;

    // Insertar en el mapa como control de Leaflet
    if (typeof map !== 'undefined') {
        const GameControl = L.Control.extend({
            options: {
                position: 'topleft'
            },
            onAdd: function(map) {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control game-control');
                container.appendChild(button);
                L.DomEvent.disableClickPropagation(container);
                return container;
            }
        });

        map.addControl(new GameControl());
    } else {
        setTimeout(createGameToggleButton, 1000);
    }
}

// ========================================
// CONTROL DEL JUEGO
// ========================================

/**
 * Alterna el estado del juego
 */
function toggleGame() {
    if (gameActive) {
        stopGame();
    } else {
        startGame();
    }
}

/**
 * Inicia el juego
 */
function startGame() {
    console.log('🎮 Iniciando modo juego...');

    gameActive = true;

    // Actualizar botón
    const button = document.getElementById('game-toggle');
    if (button) {
        button.classList.add('active');
        button.innerHTML = `
            <span class="game-icon">⏸️</span>
            <span class="game-text">Pausar</span>
        `;
    }

    // Mostrar contador
    const counter = document.getElementById('drop-counter');
    if (counter) {
        counter.style.display = 'block';
        setTimeout(() => counter.classList.add('show'), 100);
    }

    // Mensaje de bienvenida al juego
    showGameNotification('🎮 ¡Modo Juego activado! Recolecta gotas azules en el mapa para desbloquear información histórica.', 'info');

    // Generar primera ola de gotas
    spawnDrops();

    // Iniciar generación periódica
    spawnTimer = setInterval(spawnDrops, GAME_CONFIG.spawnInterval);

    // Notificar al chatbot si está disponible
    if (typeof addBotMessage === 'function') {
        addBotMessage('🎮 ¡Has activado el modo Caza Gotas! Intenta recolectar 5 gotas para desbloquear un logro especial. ¡Buena suerte!');
    }
}

/**
 * Detiene el juego
 */
function stopGame() {
    console.log('🎮 Deteniendo modo juego...');

    gameActive = false;

    // Actualizar botón
    const button = document.getElementById('game-toggle');
    if (button) {
        button.classList.remove('active');
        button.innerHTML = `
            <span class="game-icon">🎮</span>
            <span class="game-text">Modo Juego</span>
        `;
    }

    // Ocultar contador
    const counter = document.getElementById('drop-counter');
    if (counter) {
        counter.classList.remove('show');
        setTimeout(() => counter.style.display = 'none', 300);
    }

    // Limpiar gotas activas
    clearAllDrops();

    // Detener generación
    if (spawnTimer) {
        clearInterval(spawnTimer);
        spawnTimer = null;
    }

    showGameNotification('Modo juego pausado. ¡Vuelve cuando quieras seguir jugando!', 'info');
}

// ========================================
// GENERACIÓN DE GOTAS
// ========================================

/**
 * Genera nuevas gotas en el mapa
 */
function spawnDrops() {
    if (!gameActive || typeof map === 'undefined') return;

    // No generar más si ya hay muchas gotas
    if (activeDrops.length >= GAME_CONFIG.maxDrops) {
        return;
    }

    // Número de gotas a generar (1-3)
    const numDrops = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numDrops && activeDrops.length < GAME_CONFIG.maxDrops; i++) {
        // Seleccionar ubicación aleatoria
        const location = DROP_LOCATIONS[Math.floor(Math.random() * DROP_LOCATIONS.length)];

        // Pequeña variación aleatoria en posición
        const lat = location.lat + (Math.random() - 0.5) * 0.01;
        const lng = location.lng + (Math.random() - 0.5) * 0.01;

        createDrop(lat, lng, location.intensity);
    }
}

/**
 * Crea una gota individual en el mapa
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @param {string} intensity - Intensidad (high, medium, low)
 */
function createDrop(lat, lng, intensity) {
    const dropId = 'drop-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    // Crear ícono animado
    const dropIcon = L.divIcon({
        className: 'drop-marker-container',
        html: `
            <div class="drop-marker ${intensity}" id="${dropId}">
                <div class="drop-icon">💧</div>
                <div class="drop-ripple"></div>
            </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 25]
    });

    // Crear marcador
    const marker = L.marker([lat, lng], {
        icon: dropIcon,
        interactive: true
    });

    // Event: click en la gota
    marker.on('click', () => collectDrop(dropId, marker, lat, lng));

    // Añadir al mapa
    marker.addTo(map);

    // Guardar en arrays
    activeDrops.push(dropId);
    dropMarkers.push({ id: dropId, marker: marker });

    // Auto-eliminar después del lifetime
    setTimeout(() => {
        if (activeDrops.includes(dropId)) {
            removeDrop(dropId, marker, false);
        }
    }, GAME_CONFIG.dropLifetime);
}

/**
 * Recolecta una gota
 * @param {string} dropId - ID de la gota
 * @param {L.Marker} marker - Marcador de Leaflet
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 */
function collectDrop(dropId, marker, lat, lng) {
    if (!activeDrops.includes(dropId)) return;

    console.log('💧 Gota recolectada:', dropId);

    // Incrementar contador
    dropsCollected++;

    // Actualizar UI
    updateDropCounter();

    // Animación de recolección
    const dropElement = document.getElementById(dropId);
    if (dropElement) {
        dropElement.classList.add('collected');
    }

    // Mostrar partículas (opcional - efecto visual)
    showCollectEffect(lat, lng);

    // Mensaje de feedback
    const messages = [
        '💧 ¡Gota recolectada! Datos de lluvia histórica capturados.',
        '🌊 ¡Excelente! Has recolectado información valiosa.',
        '💙 ¡Bien hecho! Cada gota cuenta una historia.',
        '🎯 ¡Increíble! Sigue recolectando datos.'
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    showGameNotification(randomMessage, 'success');

    // Eliminar gota del mapa con delay
    setTimeout(() => {
        removeDrop(dropId, marker, true);
    }, 500);

    // Verificar si alcanzó el objetivo
    if (dropsCollected >= GAME_CONFIG.goalDrops && !achievementUnlocked) {
        unlockAchievement();
    }
}

/**
 * Elimina una gota del mapa
 * @param {string} dropId - ID de la gota
 * @param {L.Marker} marker - Marcador
 * @param {boolean} collected - Si fue recolectada
 */
function removeDrop(dropId, marker, collected) {
    // Remover del array
    activeDrops = activeDrops.filter(id => id !== dropId);
    dropMarkers = dropMarkers.filter(d => d.id !== dropId);

    // Remover del mapa
    if (map) {
        map.removeLayer(marker);
    }

    if (!collected) {
        // La gota desapareció sin ser recolectada
        console.log('💧 Gota expirada:', dropId);
    }
}

/**
 * Limpia todas las gotas activas
 */
function clearAllDrops() {
    dropMarkers.forEach(drop => {
        if (map) {
            map.removeLayer(drop.marker);
        }
    });

    activeDrops = [];
    dropMarkers = [];
}

// ========================================
// EFECTOS VISUALES
// ========================================

/**
 * Muestra efecto de recolección
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 */
function showCollectEffect(lat, lng) {
    if (typeof map === 'undefined') return;

    // Crear círculo que se expande
    const circle = L.circle([lat, lng], {
        color: '#3b82f6',
        fillColor: '#60a5fa',
        fillOpacity: 0.4,
        radius: 50,
        weight: 2
    }).addTo(map);

    // Animar expansión
    let radius = 50;
    const expandInterval = setInterval(() => {
        radius += 30;
        circle.setRadius(radius);
        circle.setStyle({
            fillOpacity: circle.options.fillOpacity * 0.8,
            opacity: circle.options.opacity * 0.8
        });

        if (radius > 200) {
            clearInterval(expandInterval);
            map.removeLayer(circle);
        }
    }, 50);
}

/**
 * Actualiza el contador de gotas
 */
function updateDropCounter() {
    const countElement = document.getElementById('drops-count');
    if (countElement) {
        countElement.textContent = dropsCollected;

        // Animación de pulso
        countElement.style.transform = 'scale(1.5)';
        countElement.style.color = 'var(--accent-primary)';

        setTimeout(() => {
            countElement.style.transform = 'scale(1)';
            countElement.style.color = '';
        }, 300);
    }
}

// ========================================
// SISTEMA DE LOGROS
// ========================================

/**
 * Desbloquea el logro principal
 */
function unlockAchievement() {
    achievementUnlocked = true;

    console.log('🎉 ¡Logro desbloqueado!');

    // Pausar generación de gotas
    stopGame();

    // Mostrar modal de logro
    showAchievementModal();

    // Notificar al chatbot
    if (typeof addBotMessage === 'function') {
        addBotMessage('🎉 ¡Felicidades! Has desbloqueado el historial oculto de lluvias. Ahora puedes ver datos exclusivos en el mapa.');
    }
}

/**
 * Muestra el modal de logro desbloqueado
 */
function showAchievementModal() {
    const modal = document.createElement('div');
    modal.className = 'achievement-modal';
    modal.id = 'achievement-modal';

    modal.innerHTML = `
        <div class="achievement-modal-content">
            <div class="achievement-confetti">🎉</div>
            <div class="achievement-icon">🏆</div>
            <h2 class="achievement-title">¡Felicidades!</h2>
            <p class="achievement-message">
                Has recolectado <strong>${GAME_CONFIG.goalDrops} gotas de lluvia histórica</strong>
            </p>
            <div class="achievement-reward">
                <div class="achievement-reward-icon">🔓</div>
                <p>Has desbloqueado el <strong>Historial Oculto de Lluvias</strong> de tu ciudad</p>
            </div>
            <div class="achievement-stats">
                <div class="stat">
                    <div class="stat-value">${dropsCollected}</div>
                    <div class="stat-label">Gotas totales</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${DROP_LOCATIONS.length}</div>
                    <div class="stat-label">Zonas exploradas</div>
                </div>
            </div>
            <button class="achievement-button" onclick="closeAchievementModal()">
                ¡Genial! Ver mapa
            </button>
            <button class="achievement-button-secondary" onclick="resetGame()">
                Jugar de nuevo
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    setTimeout(() => modal.classList.add('show'), 100);

    // Crear confetti effect (opcional)
    createConfettiEffect();
}

/**
 * Cierra el modal de logro
 */
function closeAchievementModal() {
    const modal = document.getElementById('achievement-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Reinicia el juego
 */
function resetGame() {
    dropsCollected = 0;
    achievementUnlocked = false;

    updateDropCounter();
    closeAchievementModal();

    showGameNotification('¡Juego reiniciado! Intenta superar tu récord.', 'info');

    startGame();
}

/**
 * Crea efecto de confetti
 */
function createConfettiEffect() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd93d', '#ff88dc'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';

            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), 4000);
        }, i * 30);
    }
}

// ========================================
// NOTIFICACIONES DEL JUEGO
// ========================================

/**
 * Muestra notificación del juego
 * @param {string} message - Mensaje
 * @param {string} type - Tipo (success, info, warning)
 */
function showGameNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `game-notification game-notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// INICIALIZACIÓN AUTOMÁTICA
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeGame, 3000);
});

// Exponer funciones globalmente
window.toggleGame = toggleGame;
window.closeAchievementModal = closeAchievementModal;
window.resetGame = resetGame;

console.log('🎮 Módulo de minijuego cargado');
