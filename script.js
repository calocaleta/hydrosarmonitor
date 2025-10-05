// ========================================
// URBAN FLOOD MEMORY - SCRIPT PRINCIPAL
// ========================================

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeColorScheme();
    initializeEventListeners();
});

// ========================================
// GESTIÓN DE TEMA (CLARO/OSCURO)
// ========================================

/**
 * Inicializa el tema desde localStorage o usa el preferido del sistema
 */
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Si hay tema guardado, usarlo; si no, usar preferencia del sistema
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');

    setTheme(theme);
}

/**
 * Establece el tema en el documento
 * @param {string} theme - 'light' o 'dark'
 */
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

/**
 * Alterna entre tema claro y oscuro
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    setTheme(newTheme);

    // Feedback visual suave
    playToggleAnimation();
}

/**
 * Animación visual al cambiar tema
 */
function playToggleAnimation() {
    const themeButton = document.getElementById('themeToggle');
    themeButton.style.transform = 'rotate(360deg)';

    setTimeout(() => {
        themeButton.style.transform = '';
    }, 300);
}

// ========================================
// GESTIÓN DE ESQUEMA DE COLOR
// ========================================

/**
 * Inicializa el esquema de color desde localStorage
 */
function initializeColorScheme() {
    const savedScheme = localStorage.getItem('colorScheme') || 'blue';

    setColorScheme(savedScheme);
    updateActiveColorButton(savedScheme);
}

/**
 * Establece el esquema de color en el documento
 * @param {string} scheme - 'blue', 'green' o 'purple'
 */
function setColorScheme(scheme) {
    document.documentElement.setAttribute('data-scheme', scheme);
    localStorage.setItem('colorScheme', scheme);
}

/**
 * Actualiza el botón activo del selector de color
 * @param {string} scheme - Esquema activo
 */
function updateActiveColorButton(scheme) {
    // Remover clase active de todos los botones
    document.querySelectorAll('.color-option').forEach(button => {
        button.classList.remove('active');
    });

    // Agregar clase active al botón seleccionado
    const activeButton = document.querySelector(`.color-option[data-scheme="${scheme}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

/**
 * Cambia el esquema de color
 * @param {string} scheme - Nuevo esquema
 */
function changeColorScheme(scheme) {
    setColorScheme(scheme);
    updateActiveColorButton(scheme);

    // Feedback visual
    playColorChangeAnimation(scheme);
}

/**
 * Animación al cambiar color
 * @param {string} scheme - Esquema seleccionado
 */
function playColorChangeAnimation(scheme) {
    const button = document.querySelector(`.color-option[data-scheme="${scheme}"]`);

    button.style.transform = 'scale(1.3)';
    setTimeout(() => {
        button.style.transform = '';
    }, 200);
}

// ========================================
// EVENT LISTENERS
// ========================================

/**
 * Inicializa todos los event listeners
 */
function initializeEventListeners() {
    // Botón de cambio de tema
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', toggleTheme);

    // Botones de esquema de color
    const colorButtons = document.querySelectorAll('.color-option');
    colorButtons.forEach(button => {
        button.addEventListener('click', () => {
            const scheme = button.getAttribute('data-scheme');
            changeColorScheme(scheme);
        });
    });

    // Formulario de búsqueda
    const searchForm = document.getElementById('searchForm');
    searchForm.addEventListener('submit', handleSearch);

    // Escuchar cambios en preferencia de tema del sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Solo cambiar si el usuario no ha establecido preferencia manual
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

// ========================================
// MANEJO DEL FORMULARIO DE BÚSQUEDA
// ========================================

/**
 * Maneja el envío del formulario de búsqueda
 * @param {Event} e - Evento del formulario
 */
function handleSearch(e) {
    e.preventDefault();

    const cityInput = document.getElementById('cityInput');
    const city = cityInput.value.trim();

    if (!city) {
        showNotification('Por favor ingresa una ciudad', 'warning');
        return;
    }

    // Feedback visual: deshabilitar botón mientras "busca"
    const button = e.target.querySelector('.search-button');
    const originalText = button.innerHTML;

    button.disabled = true;
    button.innerHTML = `
        <svg class="button-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        Buscando...
    `;

    // Centrar el mapa en la ciudad buscada
    if (typeof window.centerMapOnCity === 'function') {
        window.centerMapOnCity(city);

        setTimeout(() => {
            button.disabled = false;
            button.innerHTML = originalText;
            showNotification(`Mostrando datos SAR para: ${city}`, 'info');
        }, 1000);
    } else {
        // Fallback si el mapa aún no está cargado
        setTimeout(() => {
            button.disabled = false;
            button.innerHTML = originalText;
            showNotification(`Buscando datos para: ${city}`, 'info');
        }, 1500);
    }
}

/**
 * Muestra una notificación temporal
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'info', 'success', 'warning', 'error'
 */
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Estilos inline (se pueden mover a CSS si se desea)
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        backgroundColor: 'var(--accent-primary)',
        color: 'white',
        fontSize: '0.9rem',
        fontWeight: '500',
        boxShadow: '0 4px 16px var(--shadow)',
        zIndex: '1000',
        animation: 'slideDown 0.3s ease',
        maxWidth: '90%',
        textAlign: 'center'
    });

    document.body.appendChild(notification);

    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// ANIMACIONES CSS DINÁMICAS
// ========================================

// Agregar keyframes para notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }

    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

// ========================================
// UTILIDADES ADICIONALES
// ========================================

/**
 * Detecta si el dispositivo es táctil
 * @returns {boolean}
 */
function isTouchDevice() {
    return (('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0));
}

/**
 * Obtiene el tema actual
 * @returns {string} 'light' o 'dark'
 */
function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
}

/**
 * Obtiene el esquema de color actual
 * @returns {string} 'blue', 'green' o 'purple'
 */
function getCurrentColorScheme() {
    return document.documentElement.getAttribute('data-scheme') || 'blue';
}

// ========================================
// EXPORTAR FUNCIONES PARA USO GLOBAL
// ========================================

// Hacer funciones disponibles globalmente para debugging o extensiones futuras
window.urbanFloodMemory = {
    toggleTheme,
    setTheme,
    changeColorScheme,
    getCurrentTheme,
    getCurrentColorScheme,
    isTouchDevice
};

// Log de inicialización (solo en desarrollo)
console.log('🌧️ Urban Flood Memory cargado correctamente');
console.log('Tema actual:', getCurrentTheme());
console.log('Esquema de color:', getCurrentColorScheme());

// ========================================
// REGISTRO DE SERVICE WORKER (PWA)
// ========================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('✅ Service Worker registrado:', registration.scope);
            })
            .catch((error) => {
                console.log('❌ Error al registrar Service Worker:', error);
            });
    });
}
