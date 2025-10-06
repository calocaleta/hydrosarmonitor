// ========================================
// HYDROSAR MONITOR - CHATBOT EDUCATIVO
// ========================================

// Base de conocimiento del chatbot
const CHATBOT_KNOWLEDGE = [
    // SAR y Tecnología
    {
        keywords: ['sar', 'imagen sar', 'radar', 'satelite', 'satélite'],
        responses: [
            'Una imagen SAR (Radar de Apertura Sintética) es una imagen tomada desde satélites que usa radar para ver la superficie de la Tierra, ¡incluso si está nublado o de noche! 🛰️',
            'SAR significa "Synthetic Aperture Radar". Es una tecnología espacial que nos ayuda a detectar inundaciones y cambios en el terreno sin importar el clima. 📡'
        ]
    },
    {
        keywords: ['huayco', 'huaico', 'deslizamiento', 'aluvión'],
        responses: [
            'Un huayco es un flujo violento de agua, lodo y piedras que baja por quebradas. Ocurre por lluvias intensas en zonas montañosas. ⛰️💧',
            'Los huaycos son muy peligrosos. Si hay alerta en tu zona, mantente alejado de quebradas y ríos, y sigue las indicaciones de las autoridades. 🚨'
        ]
    },
    {
        keywords: ['zona de riesgo', 'zona riesgo', 'area peligrosa', 'peligro'],
        responses: [
            'Una zona de riesgo es un área donde hay alta probabilidad de inundaciones o huaycos según datos históricos y predicciones meteorológicas. Las marcamos en rojo o naranja en el mapa. 🗺️',
            'Si ves una zona marcada en rojo en el mapa, significa que hay alto riesgo de eventos como huaycos o inundaciones. ¡Mantente alerta! ⚠️'
        ]
    },
    {
        keywords: ['alerta', 'notificación', 'aviso', 'alarma'],
        responses: [
            '¡Recibiste una alerta porque estás cerca de una zona de riesgo! Es importante que sigas las recomendaciones de seguridad y estés atento a las autoridades. 🚨',
            'Las alertas se activan cuando nuestro sistema detecta que estás en una zona de alto riesgo. Puedes silenciar el sonido, pero mantente informado. 📢'
        ]
    },
    {
        keywords: ['qué hago', 'que hago', 'emergencia', 'evacuar', 'proteger'],
        responses: [
            '🆘 En caso de emergencia:\n1. Mantén la calma\n2. Aléjate de quebradas y ríos\n3. Busca zonas altas\n4. Sigue instrucciones de autoridades\n5. Lleva solo lo esencial',
            'Si hay alerta de huayco: NO cruces ríos crecidos, aléjate de zonas bajas, ten lista una mochila de emergencia y mantente comunicado con tu familia. 📱'
        ]
    },
    {
        keywords: ['lluvia', 'precipitación', 'temporal', 'tormenta'],
        responses: [
            'Las lluvias intensas pueden causar inundaciones y huaycos. Nuestro sistema usa datos SAR de NASA para monitorear zonas afectadas históricamente. 🌧️',
            'Monitoreamos patrones de lluvia desde 2015. Puedes usar el slider temporal en el mapa para ver cómo han cambiado las zonas afectadas. 📊'
        ]
    },
    {
        keywords: ['nasa', 'espacio', 'satelites'],
        responses: [
            'Usamos datos de satélites de NASA para detectar inundaciones. Estos satélites orbitan la Tierra tomando imágenes con radar de alta precisión. 🚀',
            'NASA proporciona datos SAR públicos que nos ayudan a entender mejor los riesgos de inundaciones en nuestras ciudades. ¡Ciencia espacial al servicio de la comunidad! 🌍'
        ]
    },
    {
        keywords: ['reportar', 'reporte', 'informar', 'denunciar'],
        responses: [
            'Puedes reportar una zona afectada usando el botón naranja "Reportar zona afectada". Tu reporte ayuda a alertar a otras personas en la comunidad. 📍',
            '¡Gracias por querer ayudar! Usa el botón de reporte para informar sobre situaciones de riesgo. Incluye una descripción clara de lo que observas. 📝'
        ]
    },
    {
        keywords: ['mapa', 'ubicación', 'ciudad', 'buscar'],
        responses: [
            'Puedes buscar cualquier ciudad usando la barra de búsqueda en el mapa. El mapa te mostrará zonas de riesgo y datos históricos de lluvia. 🔍',
            'Para navegar el mapa: usa el zoom (+/-), el slider temporal para ver diferentes años, y los controles de capas para mostrar u ocultar información. 🗺️'
        ]
    },
    {
        keywords: ['predicción', 'ia', 'inteligencia artificial', 'futuro'],
        responses: [
            'Nuestro modo Predicción IA analiza patrones históricos para estimar zonas de riesgo en los próximos 7 días. ¡Actívalo desde el botón en el mapa! 🤖',
            'La IA analiza años de datos SAR para predecir dónde podrían ocurrir eventos futuros. Es una herramienta de prevención basada en ciencia. 📈'
        ]
    },
    {
        keywords: ['ayuda', 'help', 'asistencia', 'soporte'],
        responses: [
            '¡Estoy aquí para ayudarte! Puedo explicarte sobre:\n• Imágenes SAR\n• Zonas de riesgo\n• Qué hacer en emergencias\n• Cómo usar el mapa\n¿Qué te gustaría saber? 😊',
            'Puedo ayudarte a entender mejor nuestra plataforma. Pregúntame sobre huaycos, alertas, el mapa, o cualquier duda sobre seguridad. 💬'
        ]
    },
    {
        keywords: ['gracias', 'genial', 'excelente', 'bien', 'ok'],
        responses: [
            '¡De nada! Estoy aquí para ayudarte a mantenerte seguro. 😊',
            '¡Me alegra poder ayudarte! Recuerda revisar el mapa regularmente. 🙌',
            '¡Perfecto! Si tienes más preguntas, aquí estaré. 💙'
        ]
    },
    {
        keywords: ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hi', 'hello'],
        responses: [
            '¡Hola! 👋 Soy tu asistente virtual de HydroSAR Monitor. ¿En qué puedo ayudarte hoy?',
            '¡Bienvenido! Estoy aquí para responder tus preguntas sobre alertas de lluvia, huaycos y seguridad. ¿Qué quieres saber? 😊'
        ]
    },
    {
        keywords: ['juego', 'gotas', 'puntos', 'recolectar'],
        responses: [
            '¡El juego "Caza Gotas" te ayuda a aprender sobre zonas de lluvia! Recolecta gotas azules en el mapa para desbloquear información histórica. 💧',
            'Cada gota que recolectas representa datos reales de lluvia. ¡Es educación ambiental divertida! Intenta recolectar 5 gotas. 🎮'
        ]
    }
];

// Respuestas por defecto
const DEFAULT_RESPONSES = [
    'Mmm, no estoy seguro de cómo responder eso. ¿Podrías preguntarlo de otra manera? 🤔',
    'Interesante pregunta. Intenta preguntar sobre: SAR, huaycos, zonas de riesgo, alertas o emergencias. 💡',
    'No tengo información específica sobre eso, pero puedo ayudarte con temas de seguridad, mapas y alertas meteorológicas. 📚'
];

// Mensajes de bienvenida
const WELCOME_MESSAGES = [
    {
        text: '¡Hola! Soy tu asistente virtual de HydroSAR Monitor 🤖',
        isBot: true,
        timestamp: new Date()
    },
    {
        text: 'Puedo ayudarte a entender las alertas, el mapa y qué hacer en caso de emergencia. ¿Qué te gustaría saber? 💬',
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
