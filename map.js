// ========================================
// HYDROSAR MONITOR - MAPA INTERACTIVO
// ========================================

// Configuración inicial del mapa
const MAP_CONFIG = {
    initialView: [-12.0464, -77.0428], // Lima, Perú
    initialZoom: 11,
    minZoom: 6,
    maxZoom: 18,
    timelineStart: 2015,
    timelineEnd: 2025
};

// Variables globales
let map;
let layerGroups = {
    historical: null,
    recent: null,
    prediction: null
};
let currentYear = new Date().getFullYear();
let predictionMode = false;

// Datos simulados SAR (en producción, estos vendrían de la API de NASA)
const SAR_DATA = {
    // Estructura: año -> array de polígonos con coordenadas e intensidad
    2015: [
        { coords: [[-12.05, -77.05], [-12.05, -77.04], [-12.04, -77.04], [-12.04, -77.05]], intensity: 0.6, type: 'historical' },
        { coords: [[-12.06, -77.06], [-12.06, -77.05], [-12.05, -77.05], [-12.05, -77.06]], intensity: 0.4, type: 'historical' }
    ],
    2018: [
        { coords: [[-12.045, -77.048], [-12.045, -77.038], [-12.035, -77.038], [-12.035, -77.048]], intensity: 0.8, type: 'historical' },
        { coords: [[-12.055, -77.055], [-12.055, -77.045], [-12.045, -77.045], [-12.045, -77.055]], intensity: 0.7, type: 'historical' }
    ],
    2020: [
        { coords: [[-12.04, -77.05], [-12.04, -77.04], [-12.03, -77.04], [-12.03, -77.05]], intensity: 0.5, type: 'historical' }
    ],
    2023: [
        { coords: [[-12.048, -77.046], [-12.048, -77.036], [-12.038, -77.036], [-12.038, -77.046]], intensity: 0.9, type: 'recent' },
        { coords: [[-12.058, -77.056], [-12.058, -77.046], [-12.048, -77.046], [-12.048, -77.056]], intensity: 0.75, type: 'recent' }
    ],
    2024: [
        { coords: [[-12.042, -77.044], [-12.042, -77.034], [-12.032, -77.034], [-12.032, -77.044]], intensity: 0.85, type: 'recent' },
        { coords: [[-12.052, -77.054], [-12.052, -77.044], [-12.042, -77.044], [-12.042, -77.054]], intensity: 0.7, type: 'recent' }
    ]
};

// Datos de predicción (zonas de riesgo)
const PREDICTION_DATA = [
    { coords: [[-12.046, -77.048], [-12.046, -77.038], [-12.036, -77.038], [-12.036, -77.048]], risk: 'high', probability: 0.85 },
    { coords: [[-12.056, -77.058], [-12.056, -77.048], [-12.046, -77.048], [-12.046, -77.058]], risk: 'medium', probability: 0.65 },
    { coords: [[-12.04, -77.06], [-12.04, -77.05], [-12.03, -77.05], [-12.03, -77.06]], risk: 'medium', probability: 0.55 }
];

// ========================================
// INICIALIZACIÓN DEL MAPA
// ========================================

/**
 * Inicializa el mapa de Leaflet
 */
function initializeMap() {
    // Crear mapa
    map = L.map('map-container', {
        center: MAP_CONFIG.initialView,
        zoom: MAP_CONFIG.initialZoom,
        minZoom: MAP_CONFIG.minZoom,
        maxZoom: MAP_CONFIG.maxZoom,
        zoomControl: false // Lo añadimos manualmente en mejor posición
    });

    // Añadir capa base (OpenStreetMap)
    const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    });
    baseLayer.addTo(map);

    // Control de zoom personalizado
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Control de fullscreen
    addFullscreenControl();

    // Inicializar grupos de capas
    layerGroups.historical = L.layerGroup().addTo(map);
    layerGroups.recent = L.layerGroup().addTo(map);
    layerGroups.prediction = L.layerGroup();

    // Control de capas
    addLayerControl();

    // Buscador de localidades
    addSearchControl();

    // Cargar datos del año actual
    loadSARData(currentYear);

    // Inicializar controles adicionales
    initializeTimelineSlider();
    initializePredictionButton();

    console.log('🗺️ Mapa inicializado correctamente');
}

// ========================================
// CONTROLES DEL MAPA
// ========================================

/**
 * Añade control de pantalla completa
 */
function addFullscreenControl() {
    const fullscreenControl = L.Control.extend({
        options: {
            position: 'topright'
        },
        onAdd: function(map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-fullscreen');
            const button = L.DomUtil.create('a', 'leaflet-control-fullscreen-button', container);
            button.innerHTML = '⛶';
            button.title = 'Pantalla completa';
            button.href = '#';

            L.DomEvent.on(button, 'click', function(e) {
                L.DomEvent.preventDefault(e);
                toggleFullscreen();
            });

            return container;
        }
    });

    map.addControl(new fullscreenControl());
}

/**
 * Alterna pantalla completa
 */
function toggleFullscreen() {
    const mapContainer = document.getElementById('map-container');

    if (!document.fullscreenElement) {
        mapContainer.requestFullscreen().then(() => {
            setTimeout(() => map.invalidateSize(), 100);
        });
    } else {
        document.exitFullscreen().then(() => {
            setTimeout(() => map.invalidateSize(), 100);
        });
    }
}

/**
 * Añade control de capas
 */
function addLayerControl() {
    const layerControl = L.Control.extend({
        options: {
            position: 'topright'
        },
        onAdd: function(map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control layer-control-panel');

            container.innerHTML = `
                <div class="layer-control-header">Capas SAR</div>
                <label class="layer-control-item">
                    <input type="checkbox" id="layer-historical" checked>
                    <span class="layer-label">
                        <span class="layer-color" style="background: rgba(128, 128, 128, 0.5);"></span>
                        Históricas (antes 2023)
                    </span>
                </label>
                <label class="layer-control-item">
                    <input type="checkbox" id="layer-recent" checked>
                    <span class="layer-label">
                        <span class="layer-color" style="background: rgba(66, 153, 225, 0.5);"></span>
                        Recientes (2023+)
                    </span>
                </label>
            `;

            // Prevenir propagación de eventos del mapa
            L.DomEvent.disableClickPropagation(container);

            // Event listeners para los checkboxes
            setTimeout(() => {
                document.getElementById('layer-historical').addEventListener('change', toggleHistoricalLayer);
                document.getElementById('layer-recent').addEventListener('change', toggleRecentLayer);
            }, 100);

            return container;
        }
    });

    map.addControl(new layerControl());
}

/**
 * Añade control de búsqueda (usando Leaflet-Geosearch)
 */
function addSearchControl() {
    // Provider de OpenStreetMap Nominatim
    const provider = new GeoSearch.OpenStreetMapProvider();

    const searchControl = new GeoSearch.GeoSearchControl({
        provider: provider,
        style: 'bar',
        showMarker: true,
        showPopup: false,
        autoClose: true,
        retainZoomLevel: false,
        animateZoom: true,
        keepResult: true,
        searchLabel: 'Buscar localidad...'
    });

    map.addControl(searchControl);
}

// ========================================
// MANEJO DE CAPAS SAR
// ========================================

/**
 * Carga y renderiza datos SAR para un año específico
 * @param {number} year - Año a cargar
 */
function loadSARData(year) {
    // Limpiar capas existentes
    layerGroups.historical.clearLayers();
    layerGroups.recent.clearLayers();

    // Cargar datos de años anteriores y del año seleccionado
    for (let y = MAP_CONFIG.timelineStart; y <= year; y++) {
        if (SAR_DATA[y]) {
            SAR_DATA[y].forEach(data => {
                const polygon = createSARPolygon(data, y);

                if (data.type === 'historical') {
                    layerGroups.historical.addLayer(polygon);
                } else {
                    layerGroups.recent.addLayer(polygon);
                }
            });
        }
    }

    console.log(`📊 Datos SAR cargados para el año ${year}`);
}

/**
 * Crea un polígono SAR con estilos y popup
 * @param {Object} data - Datos del polígono
 * @param {number} year - Año del dato
 * @returns {L.Polygon} Polígono de Leaflet
 */
function createSARPolygon(data, year) {
    const isHistorical = data.type === 'historical';

    const color = isHistorical ? '#808080' : '#4299e1';
    const opacity = data.intensity * 0.6;

    const polygon = L.polygon(data.coords, {
        color: color,
        fillColor: color,
        fillOpacity: opacity,
        weight: 2,
        opacity: 0.8
    });

    // Popup con información
    const popupContent = `
        <div class="sar-popup">
            <strong>${isHistorical ? 'Lluvia Histórica' : 'Lluvia Reciente'}</strong><br>
            <strong>Año:</strong> ${year}<br>
            <strong>Intensidad:</strong> ${(data.intensity * 100).toFixed(0)}%<br>
            <span style="font-size: 0.85em; color: #666;">Datos SAR - NASA</span>
        </div>
    `;
    polygon.bindPopup(popupContent);

    // Tooltip al pasar el mouse
    polygon.bindTooltip(`${year} - ${(data.intensity * 100).toFixed(0)}% intensidad`, {
        sticky: true
    });

    return polygon;
}

/**
 * Alterna visibilidad de capa histórica
 */
function toggleHistoricalLayer(e) {
    if (e.target.checked) {
        map.addLayer(layerGroups.historical);
    } else {
        map.removeLayer(layerGroups.historical);
    }
}

/**
 * Alterna visibilidad de capa reciente
 */
function toggleRecentLayer(e) {
    if (e.target.checked) {
        map.addLayer(layerGroups.recent);
    } else {
        map.removeLayer(layerGroups.recent);
    }
}

// ========================================
// SLIDER TEMPORAL
// ========================================

/**
 * Inicializa el slider de línea temporal
 */
function initializeTimelineSlider() {
    const sliderControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
        onAdd: function(map) {
            const container = L.DomUtil.create('div', 'timeline-control');

            container.innerHTML = `
                <div class="timeline-header">
                    <span class="timeline-icon">📅</span>
                    <span class="timeline-title">Línea temporal</span>
                    <span class="timeline-year" id="timeline-year">${currentYear}</span>
                </div>
                <div class="timeline-slider-container">
                    <input
                        type="range"
                        id="timeline-slider"
                        class="timeline-slider"
                        min="${MAP_CONFIG.timelineStart}"
                        max="${MAP_CONFIG.timelineEnd}"
                        value="${currentYear}"
                        step="1"
                    >
                    <div class="timeline-labels">
                        <span>${MAP_CONFIG.timelineStart}</span>
                        <span>${MAP_CONFIG.timelineEnd}</span>
                    </div>
                </div>
            `;

            L.DomEvent.disableClickPropagation(container);

            // Event listener para el slider
            setTimeout(() => {
                const slider = document.getElementById('timeline-slider');
                slider.addEventListener('input', handleTimelineChange);
            }, 100);

            return container;
        }
    });

    map.addControl(new sliderControl());
}

/**
 * Maneja cambios en el slider temporal
 * @param {Event} e - Evento del slider
 */
function handleTimelineChange(e) {
    const year = parseInt(e.target.value);
    currentYear = year;

    // Actualizar display del año
    document.getElementById('timeline-year').textContent = year;

    // Recargar datos SAR para el nuevo año
    loadSARData(year);

    // Feedback visual
    showTemporaryNotification(`Mostrando datos hasta ${year}`);
}

// ========================================
// MODO PREDICCIÓN IA
// ========================================

/**
 * Inicializa el botón de predicción IA
 */
function initializePredictionButton() {
    const predictionControl = L.Control.extend({
        options: {
            position: 'topleft'
        },
        onAdd: function(map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control prediction-control');

            const button = L.DomUtil.create('button', 'prediction-button', container);
            button.id = 'prediction-toggle';
            button.innerHTML = `
                <svg class="prediction-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
                <span>Activar Predicción IA</span>
            `;

            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.on(button, 'click', togglePredictionMode);

            return container;
        }
    });

    map.addControl(new predictionControl());
}

/**
 * Alterna el modo de predicción
 */
function togglePredictionMode() {
    predictionMode = !predictionMode;
    const button = document.getElementById('prediction-toggle');

    if (predictionMode) {
        // Activar predicción
        showPredictionLayer();
        button.classList.add('active');
        button.innerHTML = `
            <svg class="prediction-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <span>Desactivar Predicción</span>
        `;

        showNotification('Predicción generada por IA basada en datos históricos SAR', 'info', 5000);
    } else {
        // Desactivar predicción
        hidePredictionLayer();
        button.classList.remove('active');
        button.innerHTML = `
            <svg class="prediction-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <span>Activar Predicción IA</span>
        `;
    }
}

/**
 * Muestra la capa de predicción
 */
function showPredictionLayer() {
    layerGroups.prediction.clearLayers();

    PREDICTION_DATA.forEach(zone => {
        const polygon = createPredictionPolygon(zone);
        layerGroups.prediction.addLayer(polygon);
    });

    map.addLayer(layerGroups.prediction);
}

/**
 * Oculta la capa de predicción
 */
function hidePredictionLayer() {
    map.removeLayer(layerGroups.prediction);
}

/**
 * Crea un polígono de zona de riesgo
 * @param {Object} zone - Datos de la zona de riesgo
 * @returns {L.Polygon} Polígono de predicción
 */
function createPredictionPolygon(zone) {
    const colors = {
        high: '#fbbf24',    // Amarillo/naranja
        medium: '#fcd34d',  // Amarillo claro
        low: '#fde68a'      // Amarillo muy claro
    };

    const polygon = L.polygon(zone.coords, {
        color: colors[zone.risk],
        fillColor: colors[zone.risk],
        fillOpacity: 0.4,
        weight: 3,
        opacity: 0.8,
        className: 'prediction-polygon'
    });

    // Popup con información de riesgo
    const riskText = {
        high: 'Alto',
        medium: 'Medio',
        low: 'Bajo'
    };

    const popupContent = `
        <div class="prediction-popup">
            <strong>🤖 Predicción IA - Próximos 7 días</strong><br>
            <strong>Nivel de riesgo:</strong> ${riskText[zone.risk]}<br>
            <strong>Probabilidad:</strong> ${(zone.probability * 100).toFixed(0)}%<br>
            <span style="font-size: 0.85em; color: #666;">
                Basado en análisis de patrones históricos SAR
            </span>
        </div>
    `;
    polygon.bindPopup(popupContent);

    // Tooltip
    polygon.bindTooltip(`Riesgo ${riskText[zone.risk]} - ${(zone.probability * 100).toFixed(0)}%`, {
        sticky: true
    });

    return polygon;
}

// ========================================
// UTILIDADES
// ========================================

/**
 * Muestra una notificación temporal
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación
 * @param {number} duration - Duración en ms
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Reutilizar la función de notificaciones del script.js
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        // Fallback si no existe
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

/**
 * Notificación rápida (tooltip temporal)
 * @param {string} message - Mensaje
 */
function showTemporaryNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'map-notification';
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// ========================================
// INTEGRACIÓN CON BÚSQUEDA DE CIUDADES
// ========================================

/**
 * Centra el mapa en una ciudad específica
 * @param {string} cityName - Nombre de la ciudad
 */
function centerMapOnCity(cityName) {
    // Esta función será llamada desde script.js cuando se busque una ciudad
    const provider = new GeoSearch.OpenStreetMapProvider();

    provider.search({ query: cityName }).then(results => {
        if (results && results.length > 0) {
            const result = results[0];
            map.setView([result.y, result.x], 12);

            // Añadir marcador temporal
            const marker = L.marker([result.y, result.x])
                .addTo(map)
                .bindPopup(`<strong>${result.label}</strong>`)
                .openPopup();

            setTimeout(() => map.removeLayer(marker), 5000);
        }
    });
}

// Exponer función globalmente para uso desde script.js
window.centerMapOnCity = centerMapOnCity;

// ========================================
// COMENTARIOS PARA INTEGRACIÓN CON DATOS REALES
// ========================================

/*
INTEGRACIÓN CON DATOS SAR REALES DE NASA:

1. API de datos SAR:
   - Usar NASA Earthdata: https://earthdata.nasa.gov/
   - APIs como Sentinel-1 SAR para detección de inundaciones
   - Ejemplo endpoint: https://earthdata.nasa.gov/eosdis/daacs/asf

2. Estructura recomendada:

   async function fetchRealSARData(year, bounds) {
       const response = await fetch(`/api/sar-data?year=${year}&bbox=${bounds}`);
       const data = await response.json();
       return data.features; // GeoJSON format
   }

3. Formato GeoJSON esperado:

   {
       "type": "FeatureCollection",
       "features": [
           {
               "type": "Feature",
               "geometry": {
                   "type": "Polygon",
                   "coordinates": [[[-77.05, -12.05], [-77.04, -12.05], ...]]
               },
               "properties": {
                   "intensity": 0.85,
                   "date": "2024-03-15",
                   "type": "flood",
                   "source": "Sentinel-1"
               }
           }
       ]
   }

4. Reemplazar loadSARData():

   async function loadSARData(year) {
       const bounds = map.getBounds();
       const data = await fetchRealSARData(year, bounds);

       data.forEach(feature => {
           const polygon = L.geoJSON(feature, {
               style: {
                   color: feature.properties.type === 'historical' ? '#808080' : '#4299e1',
                   fillOpacity: feature.properties.intensity * 0.6
               }
           });

           if (feature.properties.type === 'historical') {
               layerGroups.historical.addLayer(polygon);
           } else {
               layerGroups.recent.addLayer(polygon);
           }
       });
   }

5. Modelo de predicción IA:
   - Endpoint: POST /api/predict
   - Body: { location: [lat, lng], historicalData: [...] }
   - Response: { predictions: [...], confidence: 0.85 }

   async function fetchPredictions(location) {
       const response = await fetch('/api/predict', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ location })
       });
       return await response.json();
   }
*/

// ========================================
// INICIALIZACIÓN AUTOMÁTICA
// ========================================

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Verificar que el contenedor del mapa existe
    if (document.getElementById('map-container')) {
        initializeMap();
    }
});

// Log de carga
console.log('🗺️ Módulo de mapa cargado');
