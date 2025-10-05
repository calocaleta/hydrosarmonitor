// ========================================
// HYDROSAR MONITOR - SISTEMA DE ALERTAS
// ========================================

// Configuración de alertas
const ALERT_CONFIG = {
    checkInterval: 30000, // Verificar cada 30 segundos
    soundEnabled: true,
    notificationDuration: 0, // 0 = persistente hasta que el usuario la cierre
    geolocationTimeout: 10000,
    alertRadius: 1000 // metros de radio para considerar "dentro de zona"
};

// Variables globales
let userLocation = null;
let activeAlerts = [];
let riskZones = [];
let alertSound = null;
let soundPlaying = false;
let reportMarkers = [];

// Zonas de riesgo activas (simuladas)
const RISK_ZONES = [
    {
        id: 'zone-1',
        name: 'Quebrada Huaycoloro',
        coords: [[-12.0464, -77.0528], [-12.0464, -77.0428], [-12.0364, -77.0428], [-12.0364, -77.0528]],
        center: [-12.0414, -77.0478],
        level: 'high', // high, medium, low
        type: 'huayco',
        description: 'Zona en riesgo de huayco. Mantente alerta.',
        lastUpdate: '2025-10-04T14:30:00',
        active: true
    },
    {
        id: 'zone-2',
        name: 'Sector Ventanilla',
        coords: [[-12.0564, -77.0628], [-12.0564, -77.0528], [-12.0464, -77.0528], [-12.0464, -77.0628]],
        center: [-12.0514, -77.0578],
        level: 'medium',
        type: 'inundacion',
        description: 'Riesgo de inundación por acumulación de lluvias.',
        lastUpdate: '2025-10-04T13:00:00',
        active: true
    },
    {
        id: 'zone-3',
        name: 'Quebrada Canto Grande',
        coords: [[-12.0264, -77.0328], [-12.0264, -77.0228], [-12.0164, -77.0228], [-12.0164, -77.0328]],
        center: [-12.0214, -77.0278],
        level: 'high',
        type: 'huayco',
        description: 'Alto riesgo de deslizamiento y flujo de lodo.',
        lastUpdate: '2025-10-04T15:00:00',
        active: true
    }
];

// Sonido de alerta (embebido en base64 - beep corto)
const ALERT_SOUND_BASE64 = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHWyz6+OiUxELTKXh8bllHgU2jdXzzn0pBSh+zPLaizsIGGS57OihUQ0MUqvk77RpJAUuhM/z1YU1BxtmvOzkmFENDFGq5O+zaiQFLoTP89WFNQcbZrzs5JhRDQxRquTvs2okBS6Ez/PVhTUHG2a87OSYTw4NT6jj8LVoIwU0iNHz0n8rBSh+zPLaizsIF2O47OaeSRELTqbh8bhlHgU2jdXzzn0pBSh+zPLaizsIF2O47OaeSRELTqbh8bhlHgU2jdXzzn0pBSh+zPLaizsIF2O47OaeSRELTqbh8bhlHgU2jdXzzn0pBSh+zPLaizsIF2O47OaeSRELTqbh8bhlHgU2jdXzzn0pBSh+zPLaizsIF2O47OaeSRELTqbh8bhlHgU2jdXzzn0pBSh+zPLaizsIF2O47OaeSRELTqbh8bhlHgU2jdXzzn0pBSh+zPLaizsIF2O47OaeSRELTqbh8bhlHgU2jdXzzn0pBSh+zPLaizsIF2O47OaeSRELTqbh8bhlHgU2jdXzzn0pBSh+zPLaizsIF2O47OaeSRELTqbh8bhlHgU2jdXzzn0pBSh+zPLaizsIF2O47OaeSRELTqbh8bhlHgU2jdXzzn0pBSh+zPLaizsIF2O47OaeSRELTqbh8bhlHgU2jdXzzn0pBSh+zPLaizsIF2O47OaeSRELTqbh8bhlHgU2jdXzzn0pBSh+zPLaizsIF2O47OaeSRELTqbh8bhlHgU2jdXzzn0pBSh+zPLaizsIF2O47OaeSRELTqbh8bhlHgU2jdXzzn0pBSh+zPLaizsIF2O47OaeSRELTqbh8bhlHgU2jdXzzn0pBSh+zPLaizsIF2O47OaeSRELTqbh8bhlHgU2jdXzzn0pBSh+zPLaizsIF2O47OaeSRELTqbh8bhlHgU2jdXzzn0pBSh+zPLaizsIF2O47OaeSRELTqbh8bhlHgU2jdXzzn0pBSh+zPLaizsIF2O47OaeSRELTqbh8bhlHgU2jdXzzn0pBSh+zPLaizsIF2O47OaeSRELTqbh8bhlHgU2jdXzzn0pBSh+zPLaizsIF2O47OaeSRELTqbh8Q==';

// ========================================
// INICIALIZACIÓN
// ========================================

/**
 * Inicializa el sistema de alertas
 */
function initializeAlertSystem() {
    console.log('🚨 Inicializando sistema de alertas...');

    // Crear sonido de alerta
    createAlertSound();

    // Obtener ubicación del usuario
    getUserLocation();

    // Renderizar zonas de riesgo en el mapa
    renderRiskZones();

    // Crear botón flotante de reporte (deshabilitado - ahora está en el mapa)
    // createReportButton();

    // Verificar alertas periódicamente
    setInterval(checkUserInRiskZone, ALERT_CONFIG.checkInterval);

    // Verificación inicial después de 3 segundos
    setTimeout(checkUserInRiskZone, 3000);

    console.log('✅ Sistema de alertas inicializado');
}

// ========================================
// GEOLOCALIZACIÓN
// ========================================

/**
 * Obtiene la ubicación del usuario
 */
function getUserLocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                console.log('📍 Ubicación del usuario:', userLocation);

                // Verificar si está en zona de riesgo
                checkUserInRiskZone();
            },
            (error) => {
                console.warn('⚠️ No se pudo obtener la ubicación:', error.message);
                // Usar ubicación simulada para demo (Lima, Perú)
                userLocation = {
                    lat: -12.0414,
                    lng: -77.0478,
                    accuracy: 100,
                    simulated: true
                };
                console.log('📍 Usando ubicación simulada para demo');
                checkUserInRiskZone();
            },
            {
                timeout: ALERT_CONFIG.geolocationTimeout,
                enableHighAccuracy: true
            }
        );
    } else {
        console.warn('⚠️ Geolocalización no disponible');
        // Usar ubicación simulada
        userLocation = {
            lat: -12.0414,
            lng: -77.0478,
            accuracy: 100,
            simulated: true
        };
    }
}

// ========================================
// ZONAS DE RIESGO EN EL MAPA
// ========================================

/**
 * Renderiza las zonas de riesgo en el mapa
 */
function renderRiskZones() {
    if (typeof map === 'undefined') {
        console.warn('⚠️ Mapa no disponible aún, reintentando...');
        setTimeout(renderRiskZones, 1000);
        return;
    }

    RISK_ZONES.forEach(zone => {
        if (zone.active) {
            const polygon = createRiskZonePolygon(zone);
            riskZones.push({
                zone: zone,
                polygon: polygon
            });
        }
    });

    console.log(`🗺️ ${riskZones.length} zonas de riesgo renderizadas`);
}

/**
 * Crea un polígono de zona de riesgo en el mapa
 * @param {Object} zone - Datos de la zona
 * @returns {L.Polygon} Polígono de Leaflet
 */
function createRiskZonePolygon(zone) {
    const colors = {
        high: '#dc2626',    // Rojo
        medium: '#f59e0b',  // Naranja
        low: '#fbbf24'      // Amarillo
    };

    const polygon = L.polygon(zone.coords, {
        color: colors[zone.level],
        fillColor: colors[zone.level],
        fillOpacity: 0.3,
        weight: 3,
        opacity: 0.8,
        className: `risk-zone risk-zone-${zone.level}`
    });

    // Popup con información de riesgo
    const icon = zone.type === 'huayco' ? '⚠️' : '🌊';
    const levelText = {
        high: 'ALTO',
        medium: 'MEDIO',
        low: 'BAJO'
    };

    const popupContent = `
        <div class="risk-popup">
            <div class="risk-popup-header ${zone.level}">
                <span class="risk-icon">${icon}</span>
                <strong>ZONA DE RIESGO ${levelText[zone.level]}</strong>
            </div>
            <div class="risk-popup-body">
                <h3>${zone.name}</h3>
                <p><strong>${zone.description}</strong></p>
                <p class="risk-type">Tipo: ${zone.type === 'huayco' ? 'Huayco/Deslizamiento' : 'Inundación'}</p>
                <p class="risk-update">Actualizado: ${formatDate(zone.lastUpdate)}</p>
                <div class="risk-actions">
                    <button onclick="shareRiskZone('${zone.id}')" class="btn-share-risk">
                        📤 Compartir alerta
                    </button>
                </div>
            </div>
        </div>
    `;

    polygon.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'risk-zone-popup'
    });

    // Tooltip simple
    polygon.bindTooltip(`${icon} ${zone.name} - Riesgo ${levelText[zone.level]}`, {
        sticky: true,
        className: 'risk-tooltip'
    });

    // Añadir al mapa
    polygon.addTo(map);

    return polygon;
}

// ========================================
// VERIFICACIÓN DE USUARIO EN ZONA DE RIESGO
// ========================================

/**
 * Verifica si el usuario está en una zona de riesgo
 */
function checkUserInRiskZone() {
    if (!userLocation) {
        console.log('⏳ Esperando ubicación del usuario...');
        return;
    }

    const userInRisk = [];

    RISK_ZONES.forEach(zone => {
        if (zone.active && isUserInZone(userLocation, zone)) {
            userInRisk.push(zone);
        }
    });

    if (userInRisk.length > 0 && activeAlerts.length === 0) {
        // Usuario entró en zona de riesgo
        showRiskAlert(userInRisk);
    } else if (userInRisk.length === 0 && activeAlerts.length > 0) {
        // Usuario salió de zona de riesgo
        clearRiskAlerts();
    }
}

/**
 * Verifica si el usuario está dentro de una zona
 * @param {Object} userLoc - Ubicación del usuario
 * @param {Object} zone - Zona de riesgo
 * @returns {boolean}
 */
function isUserInZone(userLoc, zone) {
    // Usar la función de Leaflet para verificar si el punto está dentro del polígono
    const point = L.latLng(userLoc.lat, userLoc.lng);
    const polygon = L.polygon(zone.coords);

    // Calcular distancia al centro de la zona
    const center = L.latLng(zone.center);
    const distance = point.distanceTo(center);

    // Considerar dentro si está a menos de ALERT_RADIUS metros
    return distance < ALERT_CONFIG.alertRadius;
}

// ========================================
// NOTIFICACIONES VISUALES Y SONORAS
// ========================================

/**
 * Muestra alerta de riesgo al usuario
 * @param {Array} zones - Zonas de riesgo detectadas
 */
function showRiskAlert(zones) {
    console.log('🚨 ALERTA: Usuario en zona de riesgo!', zones);

    // Reproducir sonido
    if (ALERT_CONFIG.soundEnabled) {
        playAlertSound();
    }

    // Mostrar notificación visual
    zones.forEach(zone => {
        const alert = createAlertNotification(zone);
        activeAlerts.push(alert);
    });

    // Solicitar permiso para notificaciones del navegador
    requestNotificationPermission(zones[0]);
}

/**
 * Crea una notificación visual de alerta
 * @param {Object} zone - Zona de riesgo
 * @returns {HTMLElement}
 */
function createAlertNotification(zone) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert-notification alert-${zone.level}`;
    alertDiv.id = `alert-${zone.id}`;

    const icon = zone.type === 'huayco' ? '⚠️' : '🌊';
    const levelText = {
        high: 'CRÍTICA',
        medium: 'MODERADA',
        low: 'PREVENTIVA'
    };

    alertDiv.innerHTML = `
        <div class="alert-header">
            <span class="alert-icon-large">🚨</span>
            <div class="alert-title">
                <strong>ALERTA METEOROLÓGICA ${levelText[zone.level]}</strong>
                <span class="alert-zone-name">${zone.name}</span>
            </div>
            <button class="alert-close" onclick="closeAlert('${zone.id}')" aria-label="Cerrar alerta">
                ×
            </button>
        </div>
        <div class="alert-body">
            <p class="alert-message">
                <strong>${icon} ${zone.description}</strong>
            </p>
            <p class="alert-warning">
                Estás en una zona de riesgo. Mantente alerta y sigue las indicaciones de las autoridades.
            </p>
        </div>
        <div class="alert-actions">
            <button onclick="toggleAlertSound()" class="btn-toggle-sound" id="btn-sound-toggle">
                ${ALERT_CONFIG.soundEnabled ? '🔇 Silenciar' : '🔊 Activar sonido'}
            </button>
            <button onclick="viewZoneDetails('${zone.id}')" class="btn-view-details">
                📍 Ver en mapa
            </button>
        </div>
    `;

    document.body.appendChild(alertDiv);

    // Animación de entrada
    setTimeout(() => alertDiv.classList.add('show'), 100);

    return alertDiv;
}

/**
 * Cierra una alerta específica
 * @param {string} zoneId - ID de la zona
 */
function closeAlert(zoneId) {
    const alertElement = document.getElementById(`alert-${zoneId}`);
    if (alertElement) {
        alertElement.classList.remove('show');
        setTimeout(() => alertElement.remove(), 300);
    }

    activeAlerts = activeAlerts.filter(alert => alert.id !== `alert-${zoneId}`);

    if (activeAlerts.length === 0) {
        stopAlertSound();
    }
}

/**
 * Limpia todas las alertas
 */
function clearRiskAlerts() {
    activeAlerts.forEach(alert => alert.remove());
    activeAlerts = [];
    stopAlertSound();
}

/**
 * Muestra detalles de la zona en el mapa
 * @param {string} zoneId - ID de la zona
 */
function viewZoneDetails(zoneId) {
    const riskZone = riskZones.find(rz => rz.zone.id === zoneId);
    if (riskZone && typeof map !== 'undefined') {
        map.setView(riskZone.zone.center, 14);
        riskZone.polygon.openPopup();
    }
}

// ========================================
// SONIDO DE ALERTA
// ========================================

/**
 * Crea el objeto de audio para alertas
 */
function createAlertSound() {
    alertSound = new Audio(ALERT_SOUND_BASE64);
    alertSound.loop = true;
    alertSound.volume = 0.5;
}

/**
 * Reproduce el sonido de alerta
 */
function playAlertSound() {
    if (alertSound && ALERT_CONFIG.soundEnabled && !soundPlaying) {
        alertSound.play().catch(err => {
            console.warn('No se pudo reproducir el sonido:', err);
        });
        soundPlaying = true;
    }
}

/**
 * Detiene el sonido de alerta
 */
function stopAlertSound() {
    if (alertSound && soundPlaying) {
        alertSound.pause();
        alertSound.currentTime = 0;
        soundPlaying = false;
    }
}

/**
 * Alterna el sonido de alerta
 */
function toggleAlertSound() {
    ALERT_CONFIG.soundEnabled = !ALERT_CONFIG.soundEnabled;

    const button = document.getElementById('btn-sound-toggle');
    if (button) {
        button.textContent = ALERT_CONFIG.soundEnabled ? '🔇 Silenciar' : '🔊 Activar sonido';
    }

    if (ALERT_CONFIG.soundEnabled) {
        playAlertSound();
    } else {
        stopAlertSound();
    }
}

// ========================================
// NOTIFICACIONES DEL NAVEGADOR
// ========================================

/**
 * Solicita permiso para notificaciones
 * @param {Object} zone - Zona de riesgo
 */
function requestNotificationPermission(zone) {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                sendBrowserNotification(zone);
            }
        });
    } else if (Notification.permission === 'granted') {
        sendBrowserNotification(zone);
    }
}

/**
 * Envía notificación del navegador
 * @param {Object} zone - Zona de riesgo
 */
function sendBrowserNotification(zone) {
    const notification = new Notification('🚨 Alerta de Riesgo - HydroSAR', {
        body: `${zone.description}\nZona: ${zone.name}`,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">⚠️</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">🚨</text></svg>',
        tag: `risk-${zone.id}`,
        requireInteraction: true
    });

    notification.onclick = () => {
        window.focus();
        viewZoneDetails(zone.id);
        notification.close();
    };
}

// ========================================
// BOTÓN DE REPORTE CIUDADANO
// ========================================

/**
 * Crea el botón flotante de reporte
 */
function createReportButton() {
    const button = document.createElement('button');
    button.className = 'report-floating-button';
    button.innerHTML = `
        <span class="report-icon">⚠️</span>
        <span class="report-text">Reportar zona afectada</span>
    `;
    button.onclick = openReportForm;

    document.body.appendChild(button);
}

/**
 * Abre el formulario de reporte
 */
function openReportForm() {
    // Verificar si ya existe
    if (document.getElementById('report-modal')) {
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'report-modal';
    modal.id = 'report-modal';

    const currentLat = userLocation ? userLocation.lat.toFixed(6) : '...';
    const currentLng = userLocation ? userLocation.lng.toFixed(6) : '...';

    modal.innerHTML = `
        <div class="report-modal-content">
            <div class="report-modal-header">
                <h2>📢 Reportar Zona Afectada</h2>
                <button class="report-modal-close" onclick="closeReportForm()">×</button>
            </div>
            <div class="report-modal-body">
                <form id="report-form" onsubmit="submitReport(event)">
                    <div class="form-group">
                        <label for="reporter-name">Nombre (opcional)</label>
                        <input
                            type="text"
                            id="reporter-name"
                            class="form-input"
                            placeholder="Ej: Juan Pérez"
                        >
                    </div>

                    <div class="form-group">
                        <label for="incident-type">Tipo de incidente *</label>
                        <select id="incident-type" class="form-input" required>
                            <option value="">Seleccionar...</option>
                            <option value="huayco">Huayco / Deslizamiento</option>
                            <option value="inundacion">Inundación</option>
                            <option value="lluvia-intensa">Lluvia intensa</option>
                            <option value="derrumbe">Derrumbe</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="incident-description">Descripción del incidente *</label>
                        <textarea
                            id="incident-description"
                            class="form-textarea"
                            rows="4"
                            placeholder="Describe brevemente lo que está ocurriendo..."
                            required
                        ></textarea>
                    </div>

                    <div class="form-group">
                        <label>📍 Ubicación (detectada automáticamente)</label>
                        <div class="location-display">
                            <input
                                type="text"
                                id="report-lat"
                                class="form-input-small"
                                value="${currentLat}"
                                readonly
                            >
                            <input
                                type="text"
                                id="report-lng"
                                class="form-input-small"
                                value="${currentLng}"
                                readonly
                            >
                            <button type="button" onclick="refreshLocation()" class="btn-refresh-location">
                                🔄
                            </button>
                        </div>
                        <small class="form-help">
                            ${userLocation?.simulated ? '⚠️ Ubicación simulada para demo' : '✓ Ubicación GPS actual'}
                        </small>
                    </div>

                    <div class="form-actions">
                        <button type="button" onclick="closeReportForm()" class="btn-cancel">
                            Cancelar
                        </button>
                        <button type="submit" class="btn-submit">
                            ✅ Enviar reporte
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Animación de entrada
    setTimeout(() => modal.classList.add('show'), 100);
}

/**
 * Cierra el formulario de reporte
 */
function closeReportForm() {
    const modal = document.getElementById('report-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Actualiza la ubicación en el formulario
 */
function refreshLocation() {
    const latInput = document.getElementById('report-lat');
    const lngInput = document.getElementById('report-lng');

    latInput.value = '...';
    lngInput.value = '...';

    getUserLocation();

    setTimeout(() => {
        if (userLocation) {
            latInput.value = userLocation.lat.toFixed(6);
            lngInput.value = userLocation.lng.toFixed(6);
        }
    }, 1000);
}

/**
 * Envía el reporte
 * @param {Event} event - Evento del formulario
 */
function submitReport(event) {
    event.preventDefault();

    const report = {
        id: 'report-' + Date.now(),
        timestamp: new Date().toISOString(),
        reporter: document.getElementById('reporter-name').value || 'Anónimo',
        type: document.getElementById('incident-type').value,
        description: document.getElementById('incident-description').value,
        location: {
            lat: parseFloat(document.getElementById('report-lat').value),
            lng: parseFloat(document.getElementById('report-lng').value)
        }
    };

    // Guardar en consola (en producción, enviar a API)
    console.log('📝 Nuevo reporte recibido:', report);

    // Guardar en array local
    if (!window.citizenReports) {
        window.citizenReports = [];
    }
    window.citizenReports.push(report);

    // Añadir marcador al mapa
    if (typeof map !== 'undefined') {
        addReportMarker(report);
    }

    // Cerrar formulario
    closeReportForm();

    // Mostrar mensaje de éxito
    showSuccessMessage('✅ Tu reporte fue enviado. Gracias por colaborar.');
}

/**
 * Añade un marcador de reporte al mapa
 * @param {Object} report - Datos del reporte
 */
function addReportMarker(report) {
    const icon = L.divIcon({
        className: 'report-marker-icon',
        html: '<div class="report-marker">📍</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });

    const marker = L.marker([report.location.lat, report.location.lng], {
        icon: icon
    });

    const popupContent = `
        <div class="report-popup">
            <h3>📢 Reporte Ciudadano</h3>
            <p><strong>Tipo:</strong> ${report.type}</p>
            <p><strong>Reportado por:</strong> ${report.reporter}</p>
            <p><strong>Descripción:</strong> ${report.description}</p>
            <p class="report-time">⏰ ${formatDate(report.timestamp)}</p>
        </div>
    `;

    marker.bindPopup(popupContent);
    marker.addTo(map);

    reportMarkers.push(marker);
}

// ========================================
// UTILIDADES
// ========================================

/**
 * Formatea una fecha
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string}
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Muestra mensaje de éxito
 * @param {string} message - Mensaje a mostrar
 */
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;

    document.body.appendChild(successDiv);

    setTimeout(() => successDiv.classList.add('show'), 100);

    setTimeout(() => {
        successDiv.classList.remove('show');
        setTimeout(() => successDiv.remove(), 300);
    }, 4000);
}

/**
 * Comparte una zona de riesgo
 * @param {string} zoneId - ID de la zona
 */
function shareRiskZone(zoneId) {
    const zone = RISK_ZONES.find(z => z.id === zoneId);
    if (!zone) return;

    const shareData = {
        title: 'Alerta de Riesgo - HydroSAR',
        text: `⚠️ ${zone.name}: ${zone.description}`,
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(err => console.log('Error al compartir:', err));
    } else {
        // Fallback: copiar al portapapeles
        navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        showSuccessMessage('📋 Enlace copiado al portapapeles');
    }
}

// ========================================
// INICIALIZACIÓN AUTOMÁTICA
// ========================================

// Esperar a que el DOM y el mapa estén listos
document.addEventListener('DOMContentLoaded', () => {
    // Esperar 2 segundos para que el mapa se inicialice
    setTimeout(initializeAlertSystem, 2000);
});

// Exponer funciones globalmente
window.closeAlert = closeAlert;
window.toggleAlertSound = toggleAlertSound;
window.viewZoneDetails = viewZoneDetails;
window.openReportForm = openReportForm;
window.closeReportForm = closeReportForm;
window.submitReport = submitReport;
window.refreshLocation = refreshLocation;
window.shareRiskZone = shareRiskZone;

console.log('🚨 Módulo de alertas cargado');
