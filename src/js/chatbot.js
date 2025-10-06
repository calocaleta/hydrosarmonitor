// ========================================
// HYDROSAR MONITOR - EDUCATIONAL CHATBOT
// ========================================

// Chatbot knowledge base
const CHATBOT_KNOWLEDGE = [
    // SAR and Technology
    {
        keywords: ['sar', 'imagen sar', 'radar', 'satelite', 'satélite', 'satellite', 'synthetic aperture'],
        responses: [
            'A SAR (Synthetic Aperture Radar) image is an image taken from satellites that uses radar to see Earth\'s surface, even if it\'s cloudy or nighttime! 🛰️',
            'SAR stands for "Synthetic Aperture Radar". It\'s a space technology that helps us detect floods and terrain changes regardless of weather conditions. 📡'
        ]
    },
    {
        keywords: ['huayco', 'huaico', 'deslizamiento', 'aluvión', 'debris flow', 'landslide', 'mudslide'],
        responses: [
            'A debris flow is a violent flow of water, mud and rocks that descends through ravines. It occurs due to intense rainfall in mountainous areas. ⛰️💧',
            'Debris flows are very dangerous. If there\'s an alert in your area, stay away from ravines and rivers, and follow authorities\' instructions. 🚨'
        ]
    },
    {
        keywords: ['zona de riesgo', 'zona riesgo', 'area peligrosa', 'peligro', 'risk zone', 'danger zone', 'hazard'],
        responses: [
            'A risk zone is an area where there\'s high probability of floods or debris flows based on historical data and weather predictions. We mark them in red or orange on the map. 🗺️',
            'If you see a zone marked in red on the map, it means there\'s high risk of events like debris flows or floods. Stay alert! ⚠️'
        ]
    },
    {
        keywords: ['alerta', 'notificación', 'aviso', 'alarma', 'alert', 'notification', 'warning'],
        responses: [
            'You received an alert because you\'re near a risk zone! It\'s important that you follow safety recommendations and stay informed from authorities. 🚨',
            'Alerts are activated when our system detects you\'re in a high-risk zone. You can mute the sound, but stay informed. 📢'
        ]
    },
    {
        keywords: ['qué hago', 'que hago', 'emergencia', 'evacuar', 'proteger', 'what do i do', 'emergency', 'evacuate'],
        responses: [
            '🆘 In case of emergency:\n1. Stay calm\n2. Move away from ravines and rivers\n3. Seek high ground\n4. Follow authorities\' instructions\n5. Take only essentials',
            'If there\'s a debris flow alert: DO NOT cross swollen rivers, move away from low areas, have an emergency backpack ready and stay in contact with your family. 📱'
        ]
    },
    {
        keywords: ['lluvia', 'precipitación', 'temporal', 'tormenta', 'rain', 'rainfall', 'storm'],
        responses: [
            'Heavy rainfall can cause floods and debris flows. Our system uses NASA SAR data to monitor historically affected zones. 🌧️',
            'We monitor rainfall patterns since 2015. You can use the timeline slider on the map to see how affected zones have changed. 📊'
        ]
    },
    {
        keywords: ['nasa', 'espacio', 'satelites', 'space', 'satellites'],
        responses: [
            'We use NASA satellite data to detect floods. These satellites orbit Earth taking images with high-precision radar. 🚀',
            'NASA provides public SAR data that helps us better understand flood risks in our cities. Space science serving the community! 🌍'
        ]
    },
    {
        keywords: ['reportar', 'reporte', 'informar', 'denunciar', 'report', 'inform'],
        responses: [
            'You can report an affected area using the orange "Report affected area" button. Your report helps alert other people in the community. 📍',
            'Thanks for wanting to help! Use the report button to inform about risk situations. Include a clear description of what you observe. 📝'
        ]
    },
    {
        keywords: ['mapa', 'ubicación', 'ciudad', 'buscar', 'map', 'location', 'city', 'search'],
        responses: [
            'You can search any city using the search bar on the map. The map will show you risk zones and historical rainfall data. 🔍',
            'To navigate the map: use zoom (+/-), the timeline slider to see different years, and layer controls to show or hide information. 🗺️'
        ]
    },
    {
        keywords: ['predicción', 'ia', 'inteligencia artificial', 'futuro', 'prediction', 'ai', 'artificial intelligence', 'future'],
        responses: [
            'Our AI Prediction mode analyzes historical patterns to estimate risk zones for the next 7 days. Activate it from the button on the map! 🤖',
            'The AI analyzes years of SAR data to predict where future events might occur. It\'s a prevention tool based on science. 📈'
        ]
    },
    {
        keywords: ['ayuda', 'help', 'asistencia', 'soporte', 'assistance', 'support'],
        responses: [
            'I\'m here to help! I can explain about:\n• SAR Images\n• Risk zones\n• What to do in emergencies\n• How to use the map\nWhat would you like to know? 😊',
            'I can help you better understand our platform. Ask me about debris flows, alerts, the map, or any safety questions. 💬'
        ]
    },
    {
        keywords: ['gracias', 'genial', 'excelente', 'bien', 'ok', 'thanks', 'thank you', 'great', 'excellent', 'good'],
        responses: [
            'You\'re welcome! I\'m here to help you stay safe. 😊',
            'I\'m glad I could help! Remember to check the map regularly. 🙌',
            'Perfect! If you have more questions, I\'ll be here. 💙'
        ]
    },
    {
        keywords: ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hi', 'hello', 'hey'],
        responses: [
            'Hello! 👋 I\'m your HydroSAR Monitor virtual assistant. How can I help you today?',
            'Welcome! I\'m here to answer your questions about rainfall alerts, debris flows and safety. What would you like to know? 😊'
        ]
    },
    {
        keywords: ['juego', 'gotas', 'puntos', 'recolectar', 'game', 'drops', 'points', 'collect'],
        responses: [
            'The "Drop Hunter" game helps you learn about rainfall zones! Collect blue drops on the map to unlock historical information. 💧',
            'Each drop you collect represents real rainfall data. It\'s fun environmental education! Try to collect 5 drops. 🎮'
        ]
    }
];

// Default responses
const DEFAULT_RESPONSES = [
    'Hmm, I\'m not sure how to answer that. Could you ask it in a different way? 🤔',
    'Interesting question. Try asking about: SAR, debris flows, risk zones, alerts or emergencies. 💡',
    'I don\'t have specific information about that, but I can help you with safety topics, maps and weather alerts. 📚'
];

// Welcome messages
const WELCOME_MESSAGES = [
    {
        text: 'Hello! I\'m your HydroSAR Monitor virtual assistant 🤖',
        isBot: true,
        timestamp: new Date()
    },
    {
        text: 'I can help you understand the alerts, the map and what to do in case of emergency. What would you like to know? 💬',
        isBot: true,
        timestamp: new Date()
    }
];

// Variables globales
let chatOpen = false;
let conversationHistory = [];
let typingTimeout = null;

// ========================================
// INICIALIZACIÓN
// ========================================

/**
 * Inicializa el chatbot
 */
function initializeChatbot() {
    console.log('💬 Inicializando chatbot educativo...');

    // Crear botón flotante (deshabilitado - ahora está en el mapa)
    // createChatButton();

    // Inicializar historial
    conversationHistory = [...WELCOME_MESSAGES];

    console.log('✅ Chatbot inicializado');
}

// ========================================
// INTERFAZ DE USUARIO
// ========================================

/**
 * Crea el botón flotante del chat
 */
function createChatButton() {
    const button = document.createElement('button');
    button.className = 'chat-floating-button';
    button.id = 'chat-button';
    button.innerHTML = `
        <span class="chat-icon">💬</span>
        <span class="chat-text">Ayuda IA</span>
        <span class="chat-badge" id="chat-badge" style="display: none;">1</span>
    `;
    button.onclick = toggleChat;

    document.body.appendChild(button);
}

/**
 * Alterna visibilidad del chat
 */
function toggleChat() {
    if (chatOpen) {
        closeChat();
    } else {
        openChat();
    }
}

/**
 * Abre la ventana de chat
 */
function openChat() {
    // Verificar si ya existe
    if (document.getElementById('chat-container')) {
        return;
    }

    chatOpen = true;

    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';
    chatContainer.id = 'chat-container';

    chatContainer.innerHTML = `
        <div class="chat-header">
            <div class="chat-header-info">
                <div class="chat-avatar">🤖</div>
                <div class="chat-header-text">
                    <h3>Asistente HydroSAR</h3>
                    <span class="chat-status">● En línea</span>
                </div>
            </div>
            <button class="chat-close" onclick="closeChat()" aria-label="Cerrar chat">×</button>
        </div>
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-input-container">
            <input
                type="text"
                class="chat-input"
                id="chat-input"
                placeholder="Escribe tu pregunta..."
                autocomplete="off"
            >
            <button class="chat-send" id="chat-send" onclick="sendMessage()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
            </button>
        </div>
    `;

    // Agregar al contenedor del mapa en lugar de body
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
        mapContainer.appendChild(chatContainer);
    } else {
        document.body.appendChild(chatContainer);
    }

    // Animación de entrada
    setTimeout(() => chatContainer.classList.add('show'), 100);

    // Renderizar historial
    renderMessages();

    // Focus en input
    setTimeout(() => document.getElementById('chat-input').focus(), 300);

    // Event listeners
    const input = document.getElementById('chat-input');
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
            sendMessage();
        }
    });

    // Ocultar badge
    const badge = document.getElementById('chat-badge');
    if (badge) badge.style.display = 'none';
}

/**
 * Cierra la ventana de chat
 */
function closeChat() {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
        chatContainer.classList.remove('show');
        setTimeout(() => {
            chatContainer.remove();
            chatOpen = false;
        }, 300);
    }
}

/**
 * Renderiza los mensajes del chat
 */
function renderMessages() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = '';

    conversationHistory.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${msg.isBot ? 'bot' : 'user'}`;

        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        bubble.textContent = msg.text;

        const time = document.createElement('div');
        time.className = 'chat-time';
        time.textContent = formatTime(msg.timestamp);

        messageDiv.appendChild(bubble);
        messageDiv.appendChild(time);
        messagesContainer.appendChild(messageDiv);
    });

    // Scroll al final
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Muestra indicador de escritura
 */
function showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot';
    typingDiv.id = 'typing-indicator';

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble typing';
    bubble.innerHTML = '<span></span><span></span><span></span>';

    typingDiv.appendChild(bubble);
    messagesContainer.appendChild(typingDiv);

    // Scroll al final
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Oculta indicador de escritura
 */
function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

// ========================================
// PROCESAMIENTO DE MENSAJES
// ========================================

/**
 * Envía un mensaje del usuario
 */
function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    // Agregar mensaje del usuario
    conversationHistory.push({
        text: message,
        isBot: false,
        timestamp: new Date()
    });

    // Limpiar input
    input.value = '';

    // Renderizar
    renderMessages();

    // Mostrar typing
    showTypingIndicator();

    // Procesar respuesta con delay
    setTimeout(() => {
        const response = getBotResponse(message);
        hideTypingIndicator();

        conversationHistory.push({
            text: response,
            isBot: true,
            timestamp: new Date()
        });

        renderMessages();
    }, 800 + Math.random() * 700); // Delay aleatorio 0.8-1.5s
}

/**
 * Obtiene respuesta del bot según palabras clave
 * @param {string} userMessage - Mensaje del usuario
 * @returns {string} Respuesta del bot
 */
function getBotResponse(userMessage) {
    const messageLower = userMessage.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Eliminar acentos

    // Buscar coincidencias en la base de conocimiento
    for (const entry of CHATBOT_KNOWLEDGE) {
        for (const keyword of entry.keywords) {
            if (messageLower.includes(keyword)) {
                // Retornar respuesta aleatoria del conjunto
                const randomIndex = Math.floor(Math.random() * entry.responses.length);
                return entry.responses[randomIndex];
            }
        }
    }

    // Si no hay coincidencia, respuesta por defecto
    const randomIndex = Math.floor(Math.random() * DEFAULT_RESPONSES.length);
    return DEFAULT_RESPONSES[randomIndex];
}

// ========================================
// UTILIDADES
// ========================================

/**
 * Formatea timestamp
 * @param {Date} date - Fecha a formatear
 * @returns {string}
 */
function formatTime(date) {
    return date.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Agrega mensaje del bot programáticamente
 * @param {string} message - Mensaje a agregar
 */
function addBotMessage(message) {
    conversationHistory.push({
        text: message,
        isBot: true,
        timestamp: new Date()
    });

    if (chatOpen) {
        renderMessages();
    } else {
        // Mostrar badge si chat cerrado
        const badge = document.getElementById('chat-badge');
        if (badge) {
            badge.style.display = 'flex';
            const count = parseInt(badge.textContent) || 0;
            badge.textContent = count + 1;
        }
    }
}

/**
 * Sugerencias rápidas (opcional - para futuras mejoras)
 */
function showQuickSuggestions() {
    const suggestions = [
        '¿Qué es SAR?',
        '¿Qué hago en emergencia?',
        'Ver zonas de riesgo',
        'Cómo reportar'
    ];

    // Implementación futura: botones de sugerencias rápidas
}

// ========================================
// INTEGRACIÓN CON SISTEMA DE ALERTAS
// ========================================

/**
 * Notifica al usuario sobre nueva alerta vía chatbot
 * @param {string} zoneName - Nombre de la zona
 */
function notifyNewAlert(zoneName) {
    const alertMessage = `🚨 Se ha detectado una alerta activa en ${zoneName}. ¿Necesitas información sobre qué hacer en caso de emergencia?`;
    addBotMessage(alertMessage);
}

// ========================================
// INICIALIZACIÓN AUTOMÁTICA
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeChatbot, 2500);
});

// Exponer funciones globalmente
window.toggleChat = toggleChat;
window.closeChat = closeChat;
window.sendMessage = sendMessage;
window.addBotMessage = addBotMessage;
window.notifyNewAlert = notifyNewAlert;

console.log('💬 Módulo de chatbot cargado');
