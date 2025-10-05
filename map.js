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
let currentYear = MAP_CONFIG.timelineEnd; // Iniciar en 2025 para mostrar todos los datos
let predictionMode = false;

// Función para generar microzonas iniciales automáticamente
function generateInitialMicrozones() {
    const zones = {
        2015: [],
        2018: [],
        2020: [],
        2023: [],
        2024: []
    };

    // Áreas de Lima donde generar microzonas (distritos vulnerables)
    const limaAreas = [
        { name: 'San Juan de Lurigancho', lat: -12.0050, lng: -77.0050 },
        { name: 'Villa El Salvador', lat: -12.2050, lng: -76.9350 },
        { name: 'Comas', lat: -11.9380, lng: -77.0460 },
        { name: 'Ate', lat: -12.0450, lng: -76.9550 },
        { name: 'San Martín de Porres', lat: -12.0050, lng: -77.0850 },
        { name: 'Chorrillos', lat: -12.1650, lng: -77.0150 },
        { name: 'Los Olivos', lat: -11.9920, lng: -77.0640 },
        { name: 'Independencia', lat: -11.9920, lng: -77.0540 },
        { name: 'Villa María del Triunfo', lat: -12.1650, lng: -76.9350 },
        { name: 'Puente Piedra', lat: -11.8650, lng: -77.0750 },
        { name: 'Carabayllo', lat: -11.8750, lng: -77.0350 },
        { name: 'Lurigancho-Chosica', lat: -11.9450, lng: -76.8550 },
        { name: 'Rímac', lat: -12.0250, lng: -77.0450 },
        { name: 'El Agustino', lat: -12.0450, lng: -77.0150 },
        { name: 'Santa Anita', lat: -12.0550, lng: -76.9750 },
        { name: 'La Victoria', lat: -12.0650, lng: -77.0250 }
    ];

    // Generar microzonas para cada año
    Object.keys(zones).forEach(year => {
        const yearNum = parseInt(year);
        const type = yearNum >= 2023 ? 'recent' : 'historical';
        const numZonesPerArea = 30; // 30 microzonas por área (16 áreas × 30 × 5 años = 2400 microzonas iniciales)

        limaAreas.forEach(area => {
            for (let i = 0; i < numZonesPerArea; i++) {
                // Offset aleatorio dentro del distrito (500m radius)
                const offset = 0.005;
                const lat = area.lat + (Math.random() - 0.5) * offset * 2;
                const lng = area.lng + (Math.random() - 0.5) * offset * 2;

                // Tamaño ultra pequeño (5-30 metros)
                const size = 0.00005 + Math.random() * 0.00025;
                const intensity = 0.3 + Math.random() * 0.6;

                // Crear polígono simple de 3-4 vértices
                const numVert = Math.random() > 0.5 ? 3 : 4;
                const coords = [];
                for (let v = 0; v < numVert; v++) {
                    const angle = (Math.PI * 2 * v) / numVert + Math.random() * 0.3;
                    const dist = size * (0.8 + Math.random() * 0.4);
                    coords.push([
                        lat + Math.cos(angle) * dist,
                        lng + Math.sin(angle) * dist
                    ]);
                }

                zones[year].push({ coords, intensity, type });
            }
        });
    });

    return zones;
}

// Generar datos SAR con microzonas automáticamente
const SAR_DATA = generateInitialMicrozones();

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

    // Cargar TODOS los datos históricos disponibles por defecto
    loadAllSARData();

    // Inicializar controles adicionales
    initializeTimelineSlider();
    initializePredictionButton();

    // Event listeners para cargar datos cuando el mapa se mueve
    addMapMovementListeners();

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

    // Escuchar evento de búsqueda completada
    map.on('geosearch/showlocation', function(result) {
        const location = result.location;
        console.log('📍 Búsqueda completada:', location.label);

        // Generar y mostrar datos SAR para la ubicación buscada
        loadSARDataForLocation(location.y, location.x, location.label);
    });
}

/**
 * Añade listeners para detectar movimiento del mapa y cargar datos dinámicamente
 */
function addMapMovementListeners() {
    let moveTimeout;

    // Evento cuando el usuario termina de mover el mapa
    map.on('moveend', function() {
        // Usar timeout para evitar múltiples llamadas
        clearTimeout(moveTimeout);
        moveTimeout = setTimeout(() => {
            const center = map.getCenter();
            const zoom = map.getZoom();

            // Solo generar datos si el zoom es suficiente (nivel de detalle)
            if (zoom >= 11) {
                loadSARDataForViewport();
            }
        }, 500); // Esperar 500ms después de que termine el movimiento
    });

    // También escuchar el evento de zoom
    map.on('zoomend', function() {
        const zoom = map.getZoom();

        if (zoom >= 11) {
            clearTimeout(moveTimeout);
            moveTimeout = setTimeout(() => {
                loadSARDataForViewport();
            }, 300);
        }
    });
}

/**
 * Carga datos SAR para el área visible actual del mapa
 */
function loadSARDataForViewport() {
    const bounds = map.getBounds();
    const center = bounds.getCenter();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    // Calcular el área del viewport
    const latDiff = ne.lat - sw.lat;
    const lngDiff = ne.lng - sw.lng;

    // Generar MUCHAS microzonas pequeñas (50-100 por viewport)
    const numPolygons = Math.floor(Math.random() * 51) + 50; // 50-100 microzonas
    const yearsToGenerate = [2015, 2018, 2020, 2023, 2024];

    for (let i = 0; i < numPolygons; i++) {
        const year = yearsToGenerate[Math.floor(Math.random() * yearsToGenerate.length)];
        const type = year >= 2023 ? 'recent' : 'historical';
        const intensity = 0.3 + Math.random() * 0.6; // 0.3 - 0.9

        // Generar coordenadas aleatorias dentro del viewport
        const lat = sw.lat + Math.random() * latDiff;
        const lng = sw.lng + Math.random() * lngDiff;

        // Tamaño ULTRA pequeño para microzonas específicas (5-30 metros)
        const size = 0.00005 + Math.random() * 0.00025; // ~5-30 metros

        // Crear formas más irregulares para microzonas
        const coords = createMicrozonePolygon(lat, lng, size);

        const data = { coords, intensity, type };
        const polygon = createSARPolygon(data, year);

        // Agregar el polígono a la capa correspondiente
        if (type === 'historical') {
            layerGroups.historical.addLayer(polygon);
        } else {
            layerGroups.recent.addLayer(polygon);
        }
    }

    console.log(`📊 ${numPolygons} microzonas SAR generadas para el viewport`);
}

/**
 * Crea un polígono irregular para representar una microzona
 * @param {number} lat - Latitud central
 * @param {number} lng - Longitud central
 * @param {number} baseSize - Tamaño base
 * @returns {Array} Array de coordenadas
 */
function createMicrozonePolygon(lat, lng, baseSize) {
    // Generar entre 4-6 vértices para formas más irregulares
    const numVertices = Math.floor(Math.random() * 3) + 4; // 4-6 vértices
    const coords = [];
    const angleStep = (Math.PI * 2) / numVertices;

    for (let i = 0; i < numVertices; i++) {
        const angle = angleStep * i + (Math.random() - 0.5) * 0.5;
        const distance = baseSize * (0.7 + Math.random() * 0.6); // Variación en distancia

        const latOffset = Math.cos(angle) * distance;
        const lngOffset = Math.sin(angle) * distance;

        coords.push([lat + latOffset, lng + lngOffset]);
    }

    return coords;
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
 * Carga TODOS los datos SAR disponibles (todos los años)
 */
function loadAllSARData() {
    // Limpiar capas existentes
    layerGroups.historical.clearLayers();
    layerGroups.recent.clearLayers();

    // Cargar todos los años disponibles en SAR_DATA
    Object.keys(SAR_DATA).forEach(year => {
        SAR_DATA[year].forEach(data => {
            const polygon = createSARPolygon(data, parseInt(year));

            if (data.type === 'historical') {
                layerGroups.historical.addLayer(polygon);
            } else {
                layerGroups.recent.addLayer(polygon);
            }
        });
    });

    console.log('📊 Todos los datos SAR históricos cargados');
}

/**
 * Carga datos SAR simulados para una ubicación específica
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @param {string} locationName - Nombre de la ubicación
 */
function loadSARDataForLocation(lat, lng, locationName) {
    // Generar microzonas SAR alrededor de la ubicación
    const offset = 0.01; // Radio de búsqueda de 1km

    // Generar MUCHAS microzonas pequeñas (20-40)
    const yearsToGenerate = [2015, 2018, 2020, 2023, 2024];
    const numPolygons = Math.floor(Math.random() * 21) + 20; // 20-40 microzonas

    let generatedData = [];

    for (let i = 0; i < numPolygons; i++) {
        const year = yearsToGenerate[Math.floor(Math.random() * yearsToGenerate.length)];
        const type = year >= 2023 ? 'recent' : 'historical';
        const intensity = 0.3 + Math.random() * 0.6; // 0.3 - 0.9

        // Generar coordenadas aleatorias cerca de la ubicación
        const latOffset = (Math.random() - 0.5) * offset * 2;
        const lngOffset = (Math.random() - 0.5) * offset * 2;

        // Tamaño ULTRA pequeño (5-30 metros)
        const size = 0.00005 + Math.random() * 0.00025;

        // Crear polígono irregular para microzona
        const centerLat = lat + latOffset;
        const centerLng = lng + lngOffset;
        const coords = createMicrozonePolygon(centerLat, centerLng, size);

        const data = { coords, intensity, type };
        const polygon = createSARPolygon(data, year);

        if (type === 'historical') {
            layerGroups.historical.addLayer(polygon);
        } else {
            layerGroups.recent.addLayer(polygon);
        }

        generatedData.push({ year, intensity: (intensity * 100).toFixed(0) });
    }

    // Mostrar notificación con información
    if (generatedData.length > 0) {
        const message = `📍 ${locationName}: Se encontraron ${generatedData.length} microzonas afectadas`;
        showTemporaryNotification(message);
        console.log('📊 Datos generados:', generatedData);
    } else {
        showTemporaryNotification(`📍 ${locationName}: No se encontraron datos de inundación`);
    }
}

/**
 * Crea un polígono SAR con estilos y popup
 * @param {Object} data - Datos del polígono
 * @param {number} year - Año del dato
 * @returns {L.Polygon} Polígono de Leaflet
 */
function createSARPolygon(data, year) {
    // Todos los polígonos son azul, con opacidad basada en intensidad
    const blueColor = '#2563eb'; // Azul vibrante
    const baseOpacity = data.intensity * 0.7;

    const polygon = L.polygon(data.coords, {
        color: blueColor,
        fillColor: blueColor,
        fillOpacity: baseOpacity,
        weight: 1, // Borde muy delgado (1 pixel)
        opacity: 0.4, // Borde semi-transparente
        className: 'sar-polygon' // Para animaciones CSS
    });

    // Guardar el año y datos en el polígono para uso posterior
    polygon.options.year = year;
    polygon.options.baseIntensity = data.intensity;

    // Aplicar animación de "gota que se desparrama" cuando se añade al mapa
    polygon.on('add', function() {
        animateDropSplash(polygon);
    });

    // Popup con información
    const popupContent = `
        <div class="sar-popup">
            <strong>Zona de Inundación</strong><br>
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
 * Anima un polígono con efecto de gota que se desparrama
 * @param {L.Polygon} polygon - Polígono a animar
 */
function animateDropSplash(polygon) {
    const element = polygon._path;
    if (!element) return;

    // Efecto inicial: la gota cae y se expande
    element.style.animation = 'none';
    element.offsetHeight; // Forzar reflow

    // Aplicar animación de expansión
    element.style.animation = 'dropSplash 1.2s ease-out';

    // Luego aplicar animación de pulso sutil en el borde
    setTimeout(() => {
        element.style.animation = 'borderPulse 3s ease-in-out infinite';
    }, 1200);
}

/**
 * Detiene la animación de un polígono
 * @param {L.Polygon} polygon - Polígono a detener animación
 */
function stopPolygonAnimation(polygon) {
    const element = polygon._path;
    if (element) {
        element.style.animation = 'none';
    }
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
                    <span class="timeline-year" id="timeline-year">${MAP_CONFIG.timelineEnd}</span>
                </div>
                <div class="timeline-slider-container">
                    <input
                        type="range"
                        id="timeline-slider"
                        class="timeline-slider"
                        min="${MAP_CONFIG.timelineStart}"
                        max="${MAP_CONFIG.timelineEnd}"
                        value="${MAP_CONFIG.timelineEnd}"
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

    // Aplicar transparencia progresiva basada en antigüedad
    updateLayerOpacityByYear(year);

    // Feedback visual
    showTemporaryNotification(`Mostrando datos hasta ${year}`);
}

/**
 * Actualiza la opacidad de todas las capas basado en el año seleccionado
 * Los datos más antiguos se ven más transparentes
 * @param {number} endYear - Año final del rango
 */
function updateLayerOpacityByYear(endYear) {
    const startYear = MAP_CONFIG.timelineStart;
    const yearRange = endYear - startYear;
    const blueColor = '#2563eb'; // Mismo azul para todos

    // Función helper para actualizar capas
    const updateLayer = (layer) => {
        const layerYear = layer.options.year;

        if (layerYear <= endYear) {
            // Calcular opacidad progresiva (más antiguo = más transparente)
            const yearDiff = endYear - layerYear;
            const ageFactor = yearRange > 0 ? 1 - (yearDiff / yearRange) : 1;

            // Opacidad: 0.15 (muy antiguo) a 0.7 (reciente)
            const baseOpacity = 0.15 + (ageFactor * 0.55);
            const fillOpacity = layer.options.baseIntensity * baseOpacity;

            // Opacidad del borde: más sutil para datos antiguos
            const borderOpacity = 0.2 + (ageFactor * 0.4);

            layer.setStyle({
                color: blueColor,
                fillColor: blueColor,
                fillOpacity: fillOpacity,
                opacity: borderOpacity,
                weight: 1
            });

            // Mostrar el layer con animación
            if (!map.hasLayer(layer)) {
                layer.addTo(map);
                // Re-animar cuando reaparece
                setTimeout(() => animateDropSplash(layer), 50);
            }
        } else {
            // Ocultar capas del futuro con fade out
            if (map.hasLayer(layer)) {
                stopPolygonAnimation(layer);
                map.removeLayer(layer);
            }
        }
    };

    // Actualizar ambas capas
    layerGroups.historical.eachLayer(updateLayer);
    layerGroups.recent.eachLayer(updateLayer);
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

// ========================================
// FUNCIÓN PÚBLICA PARA BÚSQUEDA DESDE FORMULARIO
// ========================================

/**
 * Centra el mapa en una ciudad y carga datos SAR
 * Esta función es llamada desde script.js cuando se usa el formulario
 * @param {string} cityName - Nombre de la ciudad a buscar
 */
window.centerMapOnCity = async function(cityName) {
    if (!map) {
        console.error('El mapa aún no está inicializado');
        return;
    }

    try {
        // Usar el provider de GeoSearch para buscar la ubicación
        const provider = new GeoSearch.OpenStreetMapProvider();
        const results = await provider.search({ query: cityName });

        if (results && results.length > 0) {
            const result = results[0];
            const lat = result.y;
            const lng = result.x;

            // Centrar el mapa en la ubicación
            map.setView([lat, lng], 13);

            // Agregar marcador temporal
            const marker = L.marker([lat, lng]).addTo(map);
            marker.bindPopup(`<strong>${result.label}</strong>`).openPopup();

            // Generar y cargar datos SAR para esta ubicación
            loadSARDataForLocation(lat, lng, result.label);

            // Remover el marcador después de 5 segundos
            setTimeout(() => {
                map.removeLayer(marker);
            }, 5000);

            console.log('✅ Ciudad encontrada:', result.label);
        } else {
            console.warn('❌ No se encontraron resultados para:', cityName);
            showTemporaryNotification(`No se encontró: ${cityName}`);
        }
    } catch (error) {
        console.error('Error al buscar ciudad:', error);
        showTemporaryNotification('Error al realizar la búsqueda');
    }
};

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Verificar que el contenedor del mapa existe
    if (document.getElementById('map-container')) {
        initializeMap();
    }
});

// Log de carga
console.log('🗺️ Módulo de mapa cargado');
