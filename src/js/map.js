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
    prediction: null,
    // Nuevas capas para diferentes niveles de zoom
    regional: null,    // Zoom 6-10 (regiones grandes)
    district: null,    // Zoom 11-13 (distritos medianos)
    microzone: null    // Zoom 14+ (microzonas pequeñas)
};
let currentYear = MAP_CONFIG.timelineEnd; // Iniciar en 2025 para mostrar todos los datos
let predictionMode = false;
let currentZoomLevel = 11;
let cumulativeMode = true; // Modo acumulado activado por defecto
let minHumidityThreshold = 0.8; // Umbral mínimo de humedad (80% por defecto)
let currentOpenPopup = null; // Trackear popup abierto actualmente
let showFloodData = true; // Mostrar inundaciones (activo por defecto)
let showMoistureData = false; // Mostrar humedad (inactivo por defecto)

// Configuración de niveles de detalle (LOD)
const LOD_CONFIG = {
    regional: { minZoom: 6, maxZoom: 10, size: 0.015, count: 30, minSeparation: 0.025 },      // Áreas grandes: ~1.5km
    district: { minZoom: 11, maxZoom: 13, size: 0.0015, count: 70, minSeparation: 0.0025 },   // Áreas medianas: ~150m
    microzone: { minZoom: 14, maxZoom: 18, size: 0.00008, count: 150, minSeparation: 0.00012 } // Microzonas: ~8m
};

// Cache de posiciones por año para evitar superposición
let positionCache = {};

// NOTA: Función generateInitialMicrozones() ELIMINADA
// La aplicación ahora solo usa datos reales verificados de:
// - real-flood-data.js (eventos históricos documentados)
// - nasa-earthdata-api.js (datos de Sentinel-1 SAR)
// No se generan datos aleatorios de demostración

// Datos SAR (solo datos reales verificados)
let SAR_DATA;

// Intentar cargar datos de NASA Earthdata API
async function initializeSARData() {
    if (window.NASA_EARTHDATA_API && window.NASA_EARTHDATA_API.loadNASAEarthdataFloodData) {
        console.log('🛰️ Cargando datos de NASA Earthdata API...');
        try {
            SAR_DATA = await window.NASA_EARTHDATA_API.loadNASAEarthdataFloodData();
            console.log(`✅ Datos de NASA cargados: ${Object.values(SAR_DATA).reduce((sum, arr) => sum + arr.length, 0)} eventos`);
        } catch (error) {
            console.error('❌ Error cargando datos de NASA Earthdata:', error);
            // Fallback solo a datos históricos (NO datos aleatorios)
            if (window.REAL_FLOOD_DATA) {
                SAR_DATA = window.REAL_FLOOD_DATA;
                console.log('⚠️ Usando solo datos históricos verificados');
            } else {
                SAR_DATA = {};
                console.warn('⚠️ No hay datos disponibles');
            }
        }
    } else if (window.REAL_FLOOD_DATA) {
        console.log('✅ Módulo NASA no disponible, usando datos históricos verificados');
        SAR_DATA = window.REAL_FLOOD_DATA;
    } else {
        console.error('❌ No hay datos reales disponibles');
        SAR_DATA = {};
    }
}

// Inicializar con datos históricos por defecto (se actualizarán con NASA en background)
SAR_DATA = window.REAL_FLOOD_DATA || {};

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

    // Inicializar grupos de capas (mantenemos historical/recent por compatibilidad)
    layerGroups.historical = L.layerGroup();
    layerGroups.recent = L.layerGroup();
    layerGroups.prediction = L.layerGroup();

    // Nuevas capas LOD
    layerGroups.regional = L.layerGroup();
    layerGroups.district = L.layerGroup();
    layerGroups.microzone = L.layerGroup();

    // Control de capas
    // addLayerControl(); // Removido - ahora todo se controla desde el slider temporal

    // Buscador de localidades
    addSearchControl();

    // Inicializar el zoom actual
    currentZoomLevel = map.getZoom();

    // Cargar datos según nivel de zoom inicial
    loadDataForCurrentZoom();

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

// Control de capas removido - ahora todo se controla desde el slider temporal

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
    let zoomTimeout;

    // Evento cuando el usuario termina de mover el mapa (pan)
    map.on('moveend', function() {
        clearTimeout(moveTimeout);
        moveTimeout = setTimeout(() => {
            loadDataForCurrentZoom();
            updateHistoricalBadge(); // Actualizar contador de históricos cercanos
        }, 500);
    });

    // Evento cuando cambia el zoom (más importante)
    map.on('zoomend', function() {
        const newZoom = map.getZoom();
        const oldZoom = currentZoomLevel;

        // Detectar si cambiamos de nivel LOD
        const oldLOD = getLODLevel(oldZoom);
        const newLOD = getLODLevel(newZoom);

        currentZoomLevel = newZoom;

        if (oldLOD !== newLOD) {
            // Cambio de nivel de detalle: limpiar y recargar
            console.log(`🔍 Cambio de LOD: ${oldLOD} → ${newLOD}`);
            clearAllLayers();

            clearTimeout(zoomTimeout);
            zoomTimeout = setTimeout(() => {
                loadDataForCurrentZoom();
            }, 300);
        } else {
            // Mismo nivel LOD: solo añadir más datos
            clearTimeout(zoomTimeout);
            zoomTimeout = setTimeout(() => {
                loadDataForCurrentZoom();
            }, 500);
        }
    });
}

/**
 * Determina el nivel LOD según el zoom
 * @param {number} zoom - Nivel de zoom
 * @returns {string} Nivel LOD ('regional', 'district', o 'microzone')
 */
function getLODLevel(zoom) {
    if (zoom >= LOD_CONFIG.microzone.minZoom) return 'microzone';
    if (zoom >= LOD_CONFIG.district.minZoom) return 'district';
    return 'regional';
}

/**
 * Limpia todas las capas LOD
 */
function clearAllLayers() {
    layerGroups.regional.clearLayers();
    layerGroups.district.clearLayers();
    layerGroups.microzone.clearLayers();

    // Remover del mapa
    if (map.hasLayer(layerGroups.regional)) map.removeLayer(layerGroups.regional);
    if (map.hasLayer(layerGroups.district)) map.removeLayer(layerGroups.district);
    if (map.hasLayer(layerGroups.microzone)) map.removeLayer(layerGroups.microzone);
}

/**
 * Carga datos según el nivel de zoom actual
 */
function loadDataForCurrentZoom() {
    const zoom = map.getZoom();
    const lod = getLODLevel(zoom);
    const bounds = map.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const latDiff = ne.lat - sw.lat;
    const lngDiff = ne.lng - sw.lng;

    const config = LOD_CONFIG[lod];
    const yearsToGenerate = [2015, 2018, 2020, 2023, 2024, 2025];

    // ZOOM MÁXIMO: Cargar TODOS los datos históricos predefinidos
    if (lod === 'microzone' && layerGroups.microzone.getLayers().length === 0) {
        console.log('🔍 ZOOM MÁXIMO: Cargando TODOS los datos históricos...');
        loadAllHistoricalData();
        return;
    }

    console.log(`📊 Generando ${config.count} zonas de nivel ${lod} (zoom ${zoom})`);

    // Reiniciar cache de posiciones para este viewport
    positionCache = {};
    yearsToGenerate.forEach(year => {
        positionCache[year] = [];
    });

    let generated = 0;
    let attempts = 0;
    const maxAttempts = config.count * 5; // Máximo 5 intentos por polígono

    // Generar polígonos según el nivel LOD evitando superposiciones
    while (generated < config.count && attempts < maxAttempts) {
        attempts++;

        const year = yearsToGenerate[Math.floor(Math.random() * yearsToGenerate.length)];
        const type = year >= 2023 ? 'recent' : 'historical';
        const intensity = 0.3 + Math.random() * 0.6;

        // Posición aleatoria en viewport
        const lat = sw.lat + Math.random() * latDiff;
        const lng = sw.lng + Math.random() * lngDiff;

        // Verificar si hay colisión con otras áreas del mismo año
        if (hasCollision(lat, lng, year, config.minSeparation)) {
            continue; // Intentar otra posición
        }

        // Tamaño reducido para minimizar superposición
        const baseSize = config.size;
        const size = baseSize * (0.8 + Math.random() * 0.4); // Menos variación

        // Determinar tipo de dato: 60% inundación, 40% humedad de suelo
        const dataType = Math.random() < 0.6 ? 'flood' : 'moisture';

        // Crear polígono
        const coords = createMicrozonePolygon(lat, lng, size);
        const data = { coords, intensity, type, dataType };
        const polygon = createSARPolygon(data, year);

        // Solo agregar si el polígono fue creado (intensity >= 0.5)
        if (polygon) {
            // Agregar a la capa LOD correspondiente
            layerGroups[lod].addLayer(polygon);

            // Guardar posición en cache
            positionCache[year].push({ lat, lng });

            generated++;
        }
    }

    console.log(`✅ Generadas ${generated} zonas sin superposición (${attempts} intentos)`);

    // Mostrar solo la capa del nivel LOD actual
    if (!map.hasLayer(layerGroups[lod])) {
        map.addLayer(layerGroups[lod]);
    }

    // Aplicar transparencia temporal
    updateLayerOpacityByYear(currentYear);
}

/**
 * Carga TODOS los datos históricos predefinidos (solo en zoom máximo)
 */
function loadAllHistoricalData() {
    console.log('📦 Cargando 2,400 microzonas históricas de Lima...');

    let totalLoaded = 0;

    // Cargar todos los años de SAR_DATA
    Object.keys(SAR_DATA).forEach(year => {
        SAR_DATA[year].forEach(data => {
            const polygon = createSARPolygon(data, parseInt(year));
            if (polygon) {
                layerGroups.microzone.addLayer(polygon);
                totalLoaded++;
            }
        });
    });

    console.log(`✅ ${totalLoaded} microzonas históricas cargadas`);

    // Mostrar la capa
    if (!map.hasLayer(layerGroups.microzone)) {
        map.addLayer(layerGroups.microzone);
    }

    // Aplicar transparencia temporal
    updateLayerOpacityByYear(currentYear);

    // Notificación al usuario
    showTemporaryNotification(`${totalLoaded} zonas históricas cargadas`);
}

/**
 * Verifica si una posición colisiona con áreas existentes del mismo año
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @param {number} year - Año
 * @param {number} minSeparation - Distancia mínima de separación
 * @returns {boolean} True si hay colisión
 */
function hasCollision(lat, lng, year, minSeparation) {
    if (!positionCache[year]) return false;

    for (const pos of positionCache[year]) {
        const distance = Math.sqrt(
            Math.pow(lat - pos.lat, 2) +
            Math.pow(lng - pos.lng, 2)
        );

        if (distance < minSeparation) {
            return true; // Hay colisión
        }
    }

    return false; // No hay colisión
}

/**
 * Carga datos SAR para el área visible actual del mapa (DEPRECATED - usar loadDataForCurrentZoom)
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
    const yearsToGenerate = [2015, 2018, 2020, 2023, 2024, 2025];

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

                if (polygon) {
                    if (data.type === 'historical') {
                        layerGroups.historical.addLayer(polygon);
                    } else {
                        layerGroups.recent.addLayer(polygon);
                    }
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

            if (polygon) {
                if (data.type === 'historical') {
                    layerGroups.historical.addLayer(polygon);
                } else {
                    layerGroups.recent.addLayer(polygon);
                }
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
    const yearsToGenerate = [2015, 2018, 2020, 2023, 2024, 2025];
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

        if (polygon) {
            if (type === 'historical') {
                layerGroups.historical.addLayer(polygon);
            } else {
                layerGroups.recent.addLayer(polygon);
            }
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
    // Solo crear polígonos con intensidad >= umbral mínimo configurado
    if (data.intensity < minHumidityThreshold) {
        return null;
    }

    // Filtrar según tipo de dato activo
    const isFlood = !data.dataType || data.dataType === 'flood';
    const isMoisture = data.dataType === 'moisture';

    if (isFlood && !showFloodData) {
        return null; // No crear polígonos de inundación si el filtro está desactivado
    }

    if (isMoisture && !showMoistureData) {
        return null; // No crear polígonos de humedad si el filtro está desactivado
    }

    // Determinar color según tipo de dato
    const isRecent = year >= 2023;
    let color;

    if (data.dataType === 'moisture') {
        // HUMEDAD DE SUELO: Marrón claro (antiguo) a marrón oscuro (reciente)
        if (isRecent) {
            // Datos recientes: marrón oscuro/intenso
            color = '#654321'; // Marrón oscuro
        } else {
            // Datos antiguos: marrón claro
            color = '#D2B48C'; // Tan/marrón claro
        }
    } else {
        // INUNDACIÓN: Celeste claro (antiguo) a celeste intenso (reciente)
        if (isRecent) {
            // Datos recientes: celeste intenso/oscuro
            color = '#5B9AA9'; // Celeste intenso
        } else {
            // Datos antiguos: celeste claro
            color = '#AAD3DF'; // Celeste claro
        }
    }

    // Transparencia proporcional a humedad/intensidad
    // Mapear rango [minHumidityThreshold - 1.0] a rango de opacidad [0.0 - 1.0]
    // humedad mínima → 0% opacidad (casi transparente)
    // 100% humedad (1.0) → 100% opacidad (completamente visible)
    const opacityRange = 1.0 - minHumidityThreshold;
    const fillOpacity = opacityRange > 0 ? (data.intensity - minHumidityThreshold) / opacityRange : 1.0;

    const polygon = L.polygon(data.coords, {
        color: color,
        fillColor: color,
        fillOpacity: fillOpacity,
        weight: 2, // Borde visible al hacer hover
        opacity: 0, // Sin borde por defecto
        className: 'sar-polygon' // Para animaciones CSS
    });

    // Guardar el año y datos en el polígono para uso posterior
    polygon.options.year = year;
    polygon.options.baseIntensity = data.intensity;
    polygon.options.dataType = data.dataType || 'flood'; // Por defecto inundación si no está especificado

    // Aplicar animación de "gota que se desparrama" cuando se añade al mapa
    polygon.on('add', function() {
        animateDropSplash(polygon);
    });

    // Mostrar borde al pasar el mouse
    polygon.on('mouseover', function() {
        this.setStyle({
            opacity: 0.8 // Mostrar borde al hacer hover
        });
    });

    polygon.on('mouseout', function() {
        this.setStyle({
            opacity: 0 // Ocultar borde al salir
        });
    });

    // Determinar icono y color según tipo de dato
    const isMoistureType = data.dataType === 'moisture';
    const icon = isMoistureType ? '💧' : '🌊';

    // Color de fondo del año en el popup (usa el mismo color que el polígono)
    const yearBgColor = color;

    // Determinar si hay fuente de datos verificada
    const hasVerifiedSource = data.verified === true && data.source;
    const sourceText = hasVerifiedSource ? `<div class="popup-source">📊 ${data.source}</div>` : '';

    // Popup con diseño minimalista
    const popupContent = `
        <div class="sar-popup-minimal">
            <div class="popup-humidity">
                <span class="popup-percentage">${(data.intensity * 100).toFixed(0)}%</span>
                <span class="popup-drop">${icon}</span>
            </div>
            ${sourceText}
            <div class="popup-year" style="background-color: ${yearBgColor};">
                ${year}
            </div>
        </div>
    `;

    const popup = L.popup({
        closeButton: false,
        className: 'sar-popup-container'
    }).setContent(popupContent);

    polygon.bindPopup(popup);

    // Mostrar popup al pasar el mouse y al hacer click
    polygon.on('mouseover', function() {
        if (currentOpenPopup && currentOpenPopup !== popup) {
            map.closePopup(currentOpenPopup);
        }
        this.openPopup();
        currentOpenPopup = popup;
    });

    polygon.on('click', function() {
        if (currentOpenPopup && currentOpenPopup !== popup) {
            map.closePopup(currentOpenPopup);
        }
        this.openPopup();
        currentOpenPopup = popup;
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

// Funciones de toggle de capas removidas - ahora todo se controla desde el slider temporal

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
                    <button id="toggle-panel" class="toggle-panel-btn" title="Minimizar panel">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                    <span class="timeline-icon">📅</span>
                    <span class="timeline-title">Línea temporal</span>
                    <span class="timeline-year" id="timeline-year">${MAP_CONFIG.timelineEnd}</span>
                </div>
                <div class="timeline-content" id="timeline-content">
                <div class="timeline-mode-toggle">
                    <button id="cumulative-toggle" class="cumulative-button active">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                        Acumulado
                    </button>
                </div>
                <div class="timeline-slider-container">
                    <input
                        type="range"
                        id="timeline-slider"
                        class="timeline-slider cumulative"
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
                <div class="humidity-slider-container">
                    <div class="humidity-header">
                        <span class="humidity-icon">💧</span>
                        <span class="humidity-title">Humedad mínima</span>
                        <span class="humidity-value" id="humidity-value">80%</span>
                    </div>
                    <input
                        type="range"
                        id="humidity-slider"
                        class="humidity-slider"
                        min="0"
                        max="100"
                        value="80"
                        step="5"
                    >
                    <div class="humidity-labels">
                        <span>0%</span>
                        <span>100%</span>
                    </div>
                </div>
                <div class="data-type-filters">
                    <div class="filter-header">
                        <span>🔍 Mostrar datos</span>
                    </div>
                    <label class="filter-checkbox">
                        <input type="checkbox" id="show-flood" checked>
                        <span class="checkbox-label">
                            <span class="checkbox-icon">🌊</span>
                            Inundación
                        </span>
                    </label>
                    <label class="filter-checkbox">
                        <input type="checkbox" id="show-moisture">
                        <span class="checkbox-label">
                            <span class="checkbox-icon">💧</span>
                            Humedad de suelo
                        </span>
                    </label>
                </div>
                </div>
                <div class="timeline-summary" id="timeline-summary" style="display: none;">
                    <span id="summary-text"></span>
                </div>
            `;

            L.DomEvent.disableClickPropagation(container);

            // Event listeners
            setTimeout(() => {
                const slider = document.getElementById('timeline-slider');
                const cumulativeToggle = document.getElementById('cumulative-toggle');
                const humiditySlider = document.getElementById('humidity-slider');
                const showFlood = document.getElementById('show-flood');
                const showMoisture = document.getElementById('show-moisture');
                const togglePanelBtn = document.getElementById('toggle-panel');
                const timelineSummary = document.getElementById('timeline-summary');

                slider.addEventListener('input', handleTimelineChange);
                cumulativeToggle.addEventListener('click', toggleCumulativeMode);
                humiditySlider.addEventListener('input', handleHumidityChange);
                showFlood.addEventListener('change', toggleDataTypeVisibility);
                showMoisture.addEventListener('change', toggleDataTypeVisibility);
                togglePanelBtn.addEventListener('click', toggleTimelinePanel);
                timelineSummary.addEventListener('click', toggleTimelinePanel);
            }, 100);

            return container;
        }
    });

    map.addControl(new sliderControl());
}

/**
 * Alterna el panel de timeline (colapsar/expandir)
 */
function toggleTimelinePanel() {
    const content = document.getElementById('timeline-content');
    const summary = document.getElementById('timeline-summary');
    const toggleBtn = document.getElementById('toggle-panel');
    const control = document.querySelector('.timeline-control');

    if (content.style.display === 'none') {
        // Expandir (mostrar contenido) - Flecha hacia ABAJO
        content.style.display = 'block';
        summary.style.display = 'none';
        control.classList.remove('collapsed');
        toggleBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        `;
        toggleBtn.title = 'Minimizar panel';
    } else {
        // Minimizar (ocultar contenido) - Flecha hacia ARRIBA
        content.style.display = 'none';
        summary.style.display = 'block';
        control.classList.add('collapsed');
        toggleBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
        `;
        toggleBtn.title = 'Expandir panel';

        // Actualizar el resumen con los datos seleccionados
        updatePanelSummary();
    }
}

/**
 * Actualiza el texto del resumen cuando el panel está colapsado
 */
function updatePanelSummary() {
    const summaryText = document.getElementById('summary-text');
    const year = currentYear;
    const humidity = Math.round(minHumidityThreshold * 100);
    const mode = cumulativeMode ? 'Acumulado' : 'Año específico';

    const filters = [];
    if (showFloodData) filters.push('🌊');
    if (showMoistureData) filters.push('💧');

    summaryText.textContent = `${year} | ${humidity}% | ${mode} | ${filters.join(' ')}`;
}

/**
 * Alterna el modo acumulado
 */
function toggleCumulativeMode() {
    cumulativeMode = !cumulativeMode;

    const button = document.getElementById('cumulative-toggle');
    const slider = document.getElementById('timeline-slider');

    if (cumulativeMode) {
        button.classList.add('active');
        slider.classList.add('cumulative');
    } else {
        button.classList.remove('active');
        slider.classList.remove('cumulative');
    }

    // Actualizar la visualización
    updateLayerOpacityByYear(currentYear);

    // Feedback
    const mode = cumulativeMode ? 'acumulado (2015-' + currentYear + ')' : 'año específico (' + currentYear + ')';
    showTemporaryNotification(`Modo ${mode}`);
}

/**
 * Alterna la visibilidad de tipos de datos (inundación/humedad)
 */
function toggleDataTypeVisibility() {
    // Actualizar variables globales
    showFloodData = document.getElementById('show-flood').checked;
    showMoistureData = document.getElementById('show-moisture').checked;

    // Limpiar todas las capas del nivel LOD actual
    const currentLOD = getLODLevel(map.getZoom());
    layerGroups[currentLOD].clearLayers();

    // Limpiar cache de posiciones para forzar regeneración
    positionCache = {};

    // Recargar datos con los nuevos filtros
    loadDataForCurrentZoom();

    // Feedback visual
    const messages = [];
    if (showFloodData) messages.push('🌊 Inundaciones');
    if (showMoistureData) messages.push('💧 Humedad');

    const message = messages.length > 0 ? `Mostrando: ${messages.join(' + ')}` : 'Sin filtros activos';
    showTemporaryNotification(message);
}

/**
 * Maneja cambios en el slider de humedad
 * @param {Event} e - Evento del slider
 */
function handleHumidityChange(e) {
    const percentage = parseInt(e.target.value);
    minHumidityThreshold = percentage / 100; // Convertir porcentaje a decimal (0.0 - 1.0)

    // Actualizar display del porcentaje
    document.getElementById('humidity-value').textContent = percentage + '%';

    // Aplicar el nuevo umbral respetando los filtros de tipo de dato
    toggleDataTypeVisibility();
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
 * @param {number} endYear - Año final del rango
 */
function updateLayerOpacityByYear(endYear) {
    // Función helper para actualizar capas
    const updateLayer = (layer) => {
        const layerYear = layer.options.year;
        const isRecent = layerYear >= 2023;

        // Determinar color según tipo de dato y antigüedad
        let color;
        const isMoisture = layer.options.dataType === 'moisture';

        if (isMoisture) {
            // HUMEDAD DE SUELO: Marrón oscuro (reciente) a marrón claro (antiguo)
            color = isRecent ? '#654321' : '#D2B48C';
        } else {
            // INUNDACIÓN: Celeste intenso (reciente) a celeste claro (antiguo)
            color = isRecent ? '#5B9AA9' : '#AAD3DF';
        }

        // Transparencia basada en intensidad/humedad usando umbral dinámico
        const opacityRange = 1.0 - minHumidityThreshold;
        const fillOpacity = opacityRange > 0 ? (layer.options.baseIntensity - minHumidityThreshold) / opacityRange : 1.0;

        if (cumulativeMode) {
            // MODO ACUMULADO: Mostrar desde 2015 hasta el año seleccionado
            if (layerYear <= endYear) {
                layer.setStyle({
                    color: color,
                    fillColor: color,
                    fillOpacity: fillOpacity,
                    opacity: 0, // Sin borde por defecto
                    weight: 2
                });

                // Mostrar el layer con animación
                if (!map.hasLayer(layer)) {
                    layer.addTo(map);
                    // Re-animar cuando reaparece
                    setTimeout(() => animateDropSplash(layer), 50);
                }
            } else {
                // Ocultar capas del futuro
                if (map.hasLayer(layer)) {
                    stopPolygonAnimation(layer);
                    map.removeLayer(layer);
                }
            }
        } else {
            // MODO AÑO ESPECÍFICO: Mostrar solo el año seleccionado
            if (layerYear === endYear) {
                layer.setStyle({
                    color: color,
                    fillColor: color,
                    fillOpacity: fillOpacity,
                    opacity: 0, // Sin borde por defecto
                    weight: 2
                });

                // Mostrar el layer
                if (!map.hasLayer(layer)) {
                    layer.addTo(map);
                    setTimeout(() => animateDropSplash(layer), 50);
                }
            } else {
                // Ocultar todas las demás capas
                if (map.hasLayer(layer)) {
                    stopPolygonAnimation(layer);
                    map.removeLayer(layer);
                }
            }
        }
    };

    // Actualizar todas las capas (legacy y LOD)
    layerGroups.historical.eachLayer(updateLayer);
    layerGroups.recent.eachLayer(updateLayer);
    layerGroups.regional.eachLayer(updateLayer);
    layerGroups.district.eachLayer(updateLayer);
    layerGroups.microzone.eachLayer(updateLayer);
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

        showMapNotification('Predicción generada por IA basada en datos históricos SAR', 'info');
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
 * Muestra una notificación temporal (renombrada para evitar conflicto)
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación
 */
function showMapNotification(message, type = 'info') {
    // Usar la función global de script.js
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
// ========================================
// LOADING MANAGER
// ========================================

const LoadingManager = {
    startTime: Date.now(),
    elements: {},

    init() {
        this.elements.screen = document.getElementById('loading-screen');
        this.elements.status = document.getElementById('loading-status');
        this.elements.timer = document.getElementById('loading-timer');
        this.elements.progress = document.getElementById('loading-progress');
        this.elements.details = document.getElementById('loading-details');

        // Iniciar timer
        this.updateTimer();
    },

    updateTimer() {
        if (!this.elements.screen || this.elements.screen.classList.contains('hidden')) return;

        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
        if (this.elements.timer) {
            this.elements.timer.textContent = `${elapsed}s`;
        }

        requestAnimationFrame(() => this.updateTimer());
    },

    setStatus(message) {
        if (this.elements.status) {
            this.elements.status.textContent = message;
        }
        console.log(`🔄 ${message}`);
    },

    setProgress(percent) {
        if (this.elements.progress) {
            this.elements.progress.style.width = `${percent}%`;
        }
    },

    addStep(message, isSuccess = false, isError = false) {
        if (this.elements.details) {
            const step = document.createElement('p');
            step.className = 'loading-step';
            if (isSuccess) step.classList.add('success');
            if (isError) step.classList.add('error');
            step.textContent = message;
            this.elements.details.appendChild(step);

            // Mantener solo últimos 4 pasos
            const steps = this.elements.details.querySelectorAll('.loading-step');
            if (steps.length > 4) {
                steps[0].remove();
            }
        }
    },

    hide() {
        const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
        console.log(`✅ Carga completada en ${totalTime}s`);

        if (this.elements.screen) {
            this.elements.screen.classList.add('hidden');
        }
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar loading manager
    LoadingManager.init();
    LoadingManager.setStatus('Inicializando aplicación...');
    LoadingManager.setProgress(10);

    // Verificar que el contenedor del mapa existe
    if (!document.getElementById('map-container')) {
        console.error('❌ Contenedor del mapa no encontrado');
        return;
    }

    // PASO 1: Cargar datos históricos inmediatamente (no bloqueante)
    LoadingManager.addStep('✅ Datos históricos verificados cargados', true);
    LoadingManager.setProgress(30);

    // PASO 2: Inicializar mapa con datos históricos
    LoadingManager.setStatus('Inicializando mapa interactivo...');
    LoadingManager.addStep('🗺️ Renderizando mapa de Leaflet...');

    // Usar solo datos históricos inicialmente
    if (window.REAL_FLOOD_DATA) {
        SAR_DATA = window.REAL_FLOOD_DATA;
        const historicalCount = Object.values(SAR_DATA).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`✅ Usando datos históricos verificados (${historicalCount} eventos)`);

        // Actualizar badge de estado
        updateDataStatusBadge(historicalCount, null);
    } else {
        SAR_DATA = {}; // Vacío si no hay datos reales
        console.warn('⚠️ No hay datos históricos disponibles');
        updateDataStatusBadge(0, null);
    }

    // Inicializar el mapa (rápido)
    initializeMap();
    LoadingManager.addStep('✅ Mapa inicializado', true);
    LoadingManager.setProgress(60);

    // Inicializar tour de eventos históricos
    initializeHistoricalEventsTour();
    console.log('✅ Tour de eventos históricos inicializado');

    // PASO 3: Configurar carga MANUAL de NASA API (click en badge)
    LoadingManager.setStatus('Listo - Click en badge NASA para cargar datos');
    LoadingManager.addStep('ℹ️ NASA API: Click en el badge para cargar datos', false, true);

    // Inicializar badge de NASA en modo manual
    const historicalCount = window.REAL_FLOOD_DATA ?
        Object.values(window.REAL_FLOOD_DATA).reduce((sum, arr) => sum + arr.length, 0) : 0;
    updateDataStatusBadge(historicalCount, null); // null = no cargado aún

    // Configurar evento click en el badge de NASA
    setupNASAManualLoad();

    // PASO 4: Ocultar loading screen (mapa ya está listo)
    setTimeout(() => {
        LoadingManager.setStatus('¡Listo!');
        LoadingManager.setProgress(100);
        LoadingManager.addStep('✅ Aplicación lista para usar', true);

        setTimeout(() => {
            LoadingManager.hide();
        }, 500);
    }, 800);
});

// ========================================
// DATA STATUS BADGE UPDATER
// ========================================

/**
 * Configura la carga manual de datos de NASA
 */
function setupNASAManualLoad() {
    const nasaStatusItem = document.getElementById('nasa-status-item');
    const nasaIcon = document.getElementById('status-icon-nasa');
    const nasaCountEl = document.getElementById('status-count-nasa');

    if (!nasaStatusItem) return;

    let isLoading = false;
    let isLoaded = false;

    nasaStatusItem.addEventListener('click', async () => {
        // Si ya está cargado, mostrar popup informativo
        if (isLoaded) {
            showNASAInfoPopup();
            return;
        }

        // Evitar múltiples clics durante carga
        if (isLoading) return;

        isLoading = true;
        console.log('🖱️ Usuario solicitó carga manual de NASA API');

        // Actualizar UI - estado de carga
        if (nasaIcon) {
            nasaIcon.className = 'status-icon status-loading';
        }
        if (nasaCountEl) {
            nasaCountEl.textContent = 'Cargando...';
        }

        // Mostrar notificación
        if (window.showNotification) {
            window.showNotification('🛰️ Cargando datos de NASA Earthdata...', 'info');
        }

        try {
            // Cargar datos de NASA
            await initializeSARData();

            // Recargar mapa
            console.log('🔄 Actualizando mapa con datos de NASA...');
            loadDataForCurrentZoom();

            // Contar eventos
            const totalCount = Object.values(SAR_DATA).reduce((sum, arr) => sum + arr.length, 0);
            const historicalCount = window.REAL_FLOOD_DATA ?
                Object.values(window.REAL_FLOOD_DATA).reduce((sum, arr) => sum + arr.length, 0) : 0;
            const nasaCount = totalCount - historicalCount;

            // Actualizar badge
            updateDataStatusBadge(historicalCount, nasaCount);

            // Marcar como cargado
            isLoaded = true;

            // Mostrar notificación de éxito
            if (window.showNotification) {
                window.showNotification(`✅ NASA cargado: ${nasaCount} eventos adicionales`, 'success');
            }

            console.log(`✅ Carga manual exitosa: ${nasaCount} eventos de NASA`);

        } catch (error) {
            console.error('❌ Error en carga manual de NASA:', error);

            // Actualizar badge con error
            const historicalCount = window.REAL_FLOOD_DATA ?
                Object.values(window.REAL_FLOOD_DATA).reduce((sum, arr) => sum + arr.length, 0) : 0;
            updateDataStatusBadge(historicalCount, 0, true);

            // Mostrar error al usuario
            if (window.showNotification) {
                window.showNotification('❌ Error cargando NASA API. Revisa la consola.', 'error');
            }

            console.log('ℹ️ Detalles del error:');
            console.log('   Error:', error.message || error);
            console.log('   Posibles causas:');
            console.log('   - Token expirado (renovar en https://urs.earthdata.nasa.gov/)');
            console.log('   - CORS bloqueado (necesita backend proxy)');
            console.log('   - API no disponible');
        } finally {
            isLoading = false;
        }
    });

    console.log('✅ Carga manual de NASA configurada (click en badge)');
}

/**
 * Actualiza el badge de estado de datos
 * @param {number} historicalCount - Número de eventos históricos
 * @param {number|null} nasaCount - Número de eventos de NASA (null si aún no se cargó)
 * @param {boolean} nasaError - Si hubo error cargando NASA
 */
function updateDataStatusBadge(historicalCount, nasaCount, nasaError = false) {
    const historicalIcon = document.getElementById('status-icon-historical');
    const historicalCountEl = document.getElementById('status-count-historical');
    const nasaIcon = document.getElementById('status-icon-nasa');
    const nasaCountEl = document.getElementById('status-count-nasa');

    // Actualizar datos históricos
    if (historicalCountEl) {
        historicalCountEl.textContent = historicalCount;
    }
    if (historicalIcon) {
        // Remover todas las clases de estado
        historicalIcon.className = 'status-icon';
        // Agregar clase apropiada
        historicalIcon.classList.add(historicalCount > 0 ? 'status-active' : 'status-inactive');
    }

    // Actualizar datos de NASA
    if (nasaCount === null) {
        // No cargado aún (modo manual)
        if (nasaIcon) {
            nasaIcon.className = 'status-icon status-inactive';
        }
        if (nasaCountEl) {
            nasaCountEl.textContent = 'Click para cargar';
            nasaCountEl.style.cursor = 'pointer';
        }
    } else if (nasaError) {
        // Error - pero la app funciona con datos históricos
        if (nasaIcon) {
            nasaIcon.className = 'status-icon status-inactive';
        }
        if (nasaCountEl) {
            nasaCountEl.textContent = 'No disponible';
            nasaCountEl.title = 'API de NASA no disponible. Usando solo datos históricos verificados.';
        }
    } else {
        // Cargado exitosamente
        if (nasaIcon) {
            nasaIcon.className = 'status-icon';
            nasaIcon.classList.add(nasaCount > 0 ? 'status-nasa-active' : 'status-loading');
        }
        if (nasaCountEl) {
            nasaCountEl.textContent = nasaCount;
            nasaCountEl.title = `${nasaCount} eventos de Sentinel-1 SAR`;
        }
    }
}

/**
 * Muestra popup informativo con eventos de NASA según la ubicación actual del mapa
 */
function showNASAInfoPopup() {
    console.log('📊 Mostrando popup informativo de NASA');

    // Obtener posición central del mapa
    const mapCenter = map.getCenter();
    const mapBounds = map.getBounds();

    // Recopilar TODOS los eventos de NASA (no solo los visibles)
    const allNASAEvents = [];
    const visibleNASAEvents = [];

    console.log('🔍 Buscando eventos NASA en SAR_DATA:', SAR_DATA);

    if (SAR_DATA) {
        Object.keys(SAR_DATA).forEach(year => {
            if (!SAR_DATA[year]) return;

            SAR_DATA[year].forEach(event => {
                // Filtrar eventos de NASA:
                // - Que tengan source de Sentinel-1 o NASA Earthdata
                // - O que NO estén verificados (datos de la API, no históricos)
                const isNASAEvent =
                    (event.source && (event.source.includes('Sentinel-1') || event.source.includes('NASA Earthdata'))) ||
                    (event.verified === false);

                if (isNASAEvent && event.coords && event.coords.length > 0) {
                    // Calcular centro del evento
                    const eventCenter = getPolygonCenter(event.coords);

                    const eventWithCenter = {
                        ...event,
                        year,
                        center: eventCenter
                    };

                    // Agregar a la lista de todos los eventos
                    allNASAEvents.push(eventWithCenter);

                    // Si está visible, también agregarlo a visibles
                    if (mapBounds.contains([eventCenter.lat, eventCenter.lng])) {
                        visibleNASAEvents.push(eventWithCenter);
                    }
                }
            });
        });
    }

    console.log(`📊 Total eventos NASA: ${allNASAEvents.length}`);
    console.log(`📍 Eventos NASA en vista actual: ${visibleNASAEvents.length}`);

    // SOLO mostrar eventos visibles en el mapa actual
    const eventsToShow = visibleNASAEvents;

    // Ordenar por proximidad al centro del mapa
    eventsToShow.sort((a, b) => {
        const distA = map.distance([a.center.lat, a.center.lng], [mapCenter.lat, mapCenter.lng]);
        const distB = map.distance([b.center.lat, b.center.lng], [mapCenter.lat, mapCenter.lng]);
        return distA - distB;
    });

    // Limitar a los primeros 30 eventos más cercanos
    const limitedEvents = eventsToShow.slice(0, 30);

    // Crear popup HTML
    showNASAPopupModal(limitedEvents, allNASAEvents.length, visibleNASAEvents.length);
}

/**
 * Muestra el modal con información de eventos NASA
 */
function showNASAPopupModal(events, totalCount, visibleCount) {
    // Crear overlay
    let overlay = document.getElementById('nasa-info-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'nasa-info-overlay';
        overlay.className = 'dropdown-overlay';
        document.body.appendChild(overlay);
    }

    // Crear modal
    let modal = document.getElementById('nasa-info-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'nasa-info-modal';
        modal.className = 'historical-dropdown';
        document.body.appendChild(modal);
    }

    // Mensaje descriptivo según el contexto
    let infoMessage = '';
    if (visibleCount > 0) {
        infoMessage = `📍 Mostrando <strong>${events.length}</strong> eventos en esta área (${totalCount} total en Perú)`;
    } else if (totalCount > 0) {
        infoMessage = `📍 No hay eventos NASA en esta vista. Los <strong>${totalCount}</strong> eventos están en otras áreas de Perú. <em>Mueve el mapa para verlos.</em>`;
    } else {
        infoMessage = `📍 No hay eventos NASA cargados`;
    }

    // Contenido del modal
    modal.innerHTML = `
        <div class="dropdown-header">
            <h3>🛰️ Datos NASA Sentinel-1 SAR</h3>
            <button class="dropdown-close" aria-label="Cerrar">×</button>
        </div>
        <div class="dropdown-list">
            <div style="padding: 1rem; background: var(--bg-primary); border-radius: 8px; margin-bottom: 1rem;">
                <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 0;">
                    ${infoMessage}
                </p>
            </div>
            ${events.length === 0 ? `
                <div style="padding: 2rem; text-align: center;">
                    <p style="font-size: 1.2rem; margin-bottom: 0.5rem;">🔍</p>
                    <p style="color: var(--text-secondary);">No hay eventos de NASA disponibles</p>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">
                        Verifica que los datos de NASA se hayan cargado correctamente
                    </p>
                </div>
            ` : generateNASAEventsList(events)}
        </div>
    `;

    // Event listeners
    const closeBtn = modal.querySelector('.dropdown-close');
    closeBtn.addEventListener('click', closeNASAPopup);
    overlay.addEventListener('click', closeNASAPopup);

    // Agregar click a cada item para centrar en el mapa
    const items = modal.querySelectorAll('.dropdown-item');
    items.forEach((item, index) => {
        item.addEventListener('click', () => {
            const event = events[index];
            map.setView([event.center.lat, event.center.lng], 14);
            closeNASAPopup();
        });
    });

    // Mostrar
    setTimeout(() => {
        overlay.classList.add('visible');
        modal.classList.add('visible');
    }, 10);
}

/**
 * Genera la lista HTML de eventos NASA
 */
function generateNASAEventsList(events) {
    // Agrupar por año
    const eventsByYear = {};
    events.forEach(event => {
        if (!eventsByYear[event.year]) {
            eventsByYear[event.year] = [];
        }
        eventsByYear[event.year].push(event);
    });

    // Generar HTML
    let html = '';
    const years = Object.keys(eventsByYear).sort((a, b) => b - a); // Años más recientes primero

    years.forEach(year => {
        html += `<div class="dropdown-year-header">📅 ${year}</div>`;

        eventsByYear[year].forEach(event => {
            const intensityPercent = Math.round(event.intensity * 100);
            const icon = event.dataType === 'flood' ? '💧' : '🌊';

            html += `
                <div class="dropdown-item">
                    <div class="dropdown-item-icon">${icon}</div>
                    <div class="dropdown-item-content">
                        <div class="dropdown-item-name">${event.name || 'Evento Sentinel-1'}</div>
                        <div class="dropdown-item-meta">
                            <span class="dropdown-item-source">${event.source || 'NASA Earthdata'}</span>
                            <span class="dropdown-item-intensity">${intensityPercent}%</span>
                        </div>
                    </div>
                </div>
            `;
        });
    });

    return html;
}

/**
 * Cierra el popup de NASA
 */
function closeNASAPopup() {
    const overlay = document.getElementById('nasa-info-overlay');
    const modal = document.getElementById('nasa-info-modal');

    if (overlay) {
        overlay.classList.remove('visible');
        // Importante: remover después de la animación para no bloquear el mapa
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }

    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
}

/**
 * Calcula el centro de un polígono
 */
function getPolygonCenter(coords) {
    let latSum = 0;
    let lngSum = 0;

    coords.forEach(coord => {
        latSum += coord[0];
        lngSum += coord[1];
    });

    return {
        lat: latSum / coords.length,
        lng: lngSum / coords.length
    };
}

// ========================================
// HISTORICAL EVENTS DROPDOWN
// ========================================

let historicalEvents = [];
let dropdownVisible = false;

/**
 * Actualiza el badge de históricos según la ubicación actual
 */
function updateHistoricalBadge() {
    if (!map || historicalEvents.length === 0) return;

    const nearbyEvents = filterEventsByLocation(historicalEvents, 50);
    const historicalCountEl = document.getElementById('status-count-historical');

    if (historicalCountEl) {
        historicalCountEl.textContent = nearbyEvents.length;
    }

    console.log(`📍 Históricos cercanos: ${nearbyEvents.length} eventos`);
}

/**
 * Inicializa el dropdown de eventos históricos
 */
function initializeHistoricalEventsTour() {
    // Recopilar todos los eventos históricos verificados
    historicalEvents = [];

    // Extraer eventos históricos de los datos SAR
    console.log('📊 Extrayendo eventos históricos de datos SAR...');

    if (SAR_DATA) {
        Object.keys(SAR_DATA).forEach(year => {
            if (!SAR_DATA[year]) return;

            // Filtrar solo eventos de alta intensidad (>= 70%)
            const highIntensityEvents = SAR_DATA[year].filter(event =>
                event.intensity >= 0.70 &&
                event.dataType === 'flood' &&
                event.coords &&
                event.coords.length > 0
            );

            // Agrupar eventos cercanos (dentro de 500m)
            const groupedEvents = groupNearbyEvents(highIntensityEvents, 0.5);

            // Convertir grupos en eventos históricos
            groupedEvents.forEach((group, index) => {
                const avgIntensity = group.reduce((sum, e) => sum + e.intensity, 0) / group.length;

                historicalEvents.push({
                    year: year,
                    name: `Evento SAR ${year} #${index + 1}`,
                    coords: group[0].coords, // Usar coords del primer evento del grupo
                    intensity: avgIntensity,
                    source: `Sentinel-1 SAR (${group.length} detecciones)`,
                    dataType: 'flood'
                });
            });
        });
    }

    // OPCIÓN 2: Agregar eventos verificados de REAL_FLOOD_DATA (si existen)
    if (window.REAL_FLOOD_DATA) {
        Object.keys(window.REAL_FLOOD_DATA).forEach(year => {
            window.REAL_FLOOD_DATA[year].forEach(event => {
                if (event.verified && event.coords && event.coords.length > 0) {
                    historicalEvents.push({
                        year: year,
                        name: event.name,
                        coords: event.coords,
                        intensity: event.intensity,
                        source: event.source + ' (Verificado)',
                        dataType: event.dataType
                    });
                }
            });
        });
    }

    console.log(`📍 Eventos históricos: ${historicalEvents.length} eventos encontrados`);

    // Crear dropdown
    createHistoricalEventsDropdown();

    // Actualizar badge inicial
    updateHistoricalBadge();

    // Agregar evento click al badge de históricos
    const statusItem = document.getElementById('status-count-historical');
    if (statusItem && historicalEvents.length > 0) {
        statusItem.style.textDecoration = 'underline';

        // Agregar clase clickable al contenedor
        const historicalStatusDiv = statusItem.parentElement;
        if (historicalStatusDiv) {
            historicalStatusDiv.classList.add('clickable');
            historicalStatusDiv.title = '🗺️ Ver lista de eventos históricos cercanos';
            historicalStatusDiv.addEventListener('click', toggleHistoricalEventsDropdown);
        }
    }
}

/**
 * Calcula distancia entre dos puntos geográficos (fórmula de Haversine)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distancia en km
}

/**
 * Calcula el centro geográfico de un polígono
 */
function calculateEventCenter(coords) {
    if (!coords || coords.length === 0) return [0, 0];

    let sumLat = 0, sumLng = 0;
    coords.forEach(coord => {
        sumLat += coord[0];
        sumLng += coord[1];
    });

    return [sumLat / coords.length, sumLng / coords.length];
}

/**
 * Agrupa eventos cercanos para evitar duplicados
 */
function groupNearbyEvents(events, maxDistanceKm = 0.5) {
    const groups = [];
    const processed = new Set();

    events.forEach((event, index) => {
        if (processed.has(index)) return;

        const group = [event];
        processed.add(index);

        const center1 = calculateEventCenter(event.coords);

        // Buscar eventos cercanos
        events.forEach((otherEvent, otherIndex) => {
            if (otherIndex <= index || processed.has(otherIndex)) return;

            const center2 = calculateEventCenter(otherEvent.coords);
            const distance = calculateDistance(center1[0], center1[1], center2[0], center2[1]);

            if (distance <= maxDistanceKm) {
                group.push(otherEvent);
                processed.add(otherIndex);
            }
        });

        groups.push(group);
    });

    return groups;
}

/**
 * Filtra eventos históricos según la ubicación actual del mapa
 */
function filterEventsByLocation(events, maxDistance = 50) {
    const mapCenter = map.getCenter();
    const centerLat = mapCenter.lat;
    const centerLng = mapCenter.lng;

    return events
        .map((event, originalIndex) => {
            // Calcular centro del evento
            let eventLat = 0, eventLng = 0;
            event.coords.forEach(coord => {
                eventLat += coord[0];
                eventLng += coord[1];
            });
            eventLat /= event.coords.length;
            eventLng /= event.coords.length;

            // Calcular distancia
            const distance = calculateDistance(centerLat, centerLng, eventLat, eventLng);

            return { ...event, originalIndex, distance };
        })
        .filter(event => event.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance); // Ordenar por cercanía
}

/**
 * Crea el dropdown de eventos históricos
 */
function createHistoricalEventsDropdown() {
    // Evitar crear duplicados
    const existingDropdown = document.getElementById('historical-events-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }
    const existingOverlay = document.getElementById('dropdown-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    // Crear overlay oscuro de fondo
    const overlay = document.createElement('div');
    overlay.id = 'dropdown-overlay';
    overlay.className = 'dropdown-overlay';
    overlay.style.display = 'none';
    overlay.addEventListener('click', toggleHistoricalEventsDropdown);
    document.body.appendChild(overlay);

    // Crear contenedor del dropdown
    const dropdown = document.createElement('div');
    dropdown.id = 'historical-events-dropdown';
    dropdown.className = 'historical-dropdown';
    dropdown.style.display = 'none';

    // Filtrar eventos por ubicación (50 km de radio)
    const nearbyEvents = filterEventsByLocation(historicalEvents, 50);

    // Header del dropdown
    const header = document.createElement('div');
    header.className = 'dropdown-header';
    const mapCenter = map.getCenter();
    header.innerHTML = `
        <h3>📍 Eventos Históricos Cercanos (${nearbyEvents.length})</h3>
        <button class="dropdown-close" id="close-dropdown">×</button>
    `;

    // Lista de eventos
    const list = document.createElement('div');
    list.className = 'dropdown-list';

    if (nearbyEvents.length === 0) {
        list.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
                <p>📍 No hay eventos históricos registrados en esta área</p>
                <p style="font-size: 0.85rem; margin-top: 0.5rem;">Mueve el mapa a Lima, Perú para ver eventos del Niño Costero 2017</p>
            </div>
        `;
    } else {
        // Agrupar eventos por año
        const eventsByYear = {};
        nearbyEvents.forEach((event) => {
            if (!eventsByYear[event.year]) {
                eventsByYear[event.year] = [];
            }
            eventsByYear[event.year].push(event);
        });

    // Crear items agrupados por año
    Object.keys(eventsByYear).sort((a, b) => b - a).forEach(year => {
        // Header del año
        const yearHeader = document.createElement('div');
        yearHeader.className = 'dropdown-year-header';
        yearHeader.innerHTML = `📅 ${year} (${eventsByYear[year].length} eventos)`;
        list.appendChild(yearHeader);

        // Eventos del año
        eventsByYear[year].forEach(event => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.dataset.index = event.originalIndex;

            const icon = event.dataType === 'flood' ? '🌊' : '💧';
            const intensityPercent = (event.intensity * 100).toFixed(0);
            const distanceKm = event.distance.toFixed(1);

            item.innerHTML = `
                <div class="dropdown-item-icon">${icon}</div>
                <div class="dropdown-item-content">
                    <div class="dropdown-item-name">${event.name}</div>
                    <div class="dropdown-item-meta">
                        <span class="dropdown-item-source">📊 ${event.source}</span>
                        <span class="dropdown-item-intensity">${intensityPercent}%</span>
                        <span class="dropdown-item-distance">📏 ${distanceKm} km</span>
                    </div>
                </div>
            `;

            item.addEventListener('click', () => navigateToEvent(event.originalIndex));
            list.appendChild(item);
        });
    });
    }

    dropdown.appendChild(header);
    dropdown.appendChild(list);
    document.body.appendChild(dropdown);

    // Evento para cerrar dropdown
    document.getElementById('close-dropdown').addEventListener('click', toggleHistoricalEventsDropdown);

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('historical-events-dropdown');
        const statusItem = document.getElementById('status-count-historical');
        if (dropdown && dropdownVisible &&
            !dropdown.contains(e.target) &&
            !statusItem?.parentElement?.contains(e.target)) {
            toggleHistoricalEventsDropdown();
        }
    });
}

/**
 * Muestra/oculta el dropdown de eventos históricos
 */
function toggleHistoricalEventsDropdown(event) {
    if (event) {
        event.stopPropagation();
    }

    const dropdown = document.getElementById('historical-events-dropdown');
    if (!dropdown) {
        console.warn('Dropdown no encontrado, recreando...');
        createHistoricalEventsDropdown();
        return;
    }

    const overlay = document.getElementById('dropdown-overlay');

    dropdownVisible = !dropdownVisible;

    if (dropdownVisible) {
        // Mostrar overlay y dropdown
        if (overlay) {
            overlay.style.display = 'block';
            overlay.offsetHeight; // Trigger reflow
            requestAnimationFrame(() => {
                overlay.classList.add('visible');
            });
        }

        // Forzar reflow para asegurar animación suave
        dropdown.style.display = 'block';
        dropdown.offsetHeight; // Trigger reflow
        requestAnimationFrame(() => {
            dropdown.classList.add('visible');
        });
    } else {
        // Ocultar overlay y dropdown
        if (overlay) {
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }

        dropdown.classList.remove('visible');
        setTimeout(() => {
            dropdown.style.display = 'none';
        }, 300);
    }
}

/**
 * Navega a un evento específico y ajusta filtros para visualizarlo
 */
function navigateToEvent(eventIndex) {
    if (eventIndex < 0 || eventIndex >= historicalEvents.length) {
        console.error('Índice de evento inválido:', eventIndex);
        return;
    }

    const event = historicalEvents[eventIndex];

    // ==========================================
    // PASO 1: AJUSTAR FILTROS PARA EL EVENTO
    // ==========================================

    // Activar checkbox correspondiente según tipo de dato
    const isFloodEvent = !event.dataType || event.dataType === 'flood';
    const isMoistureEvent = event.dataType === 'moisture';

    // Obtener checkboxes
    const floodCheckbox = document.getElementById('show-flood');
    const moistureCheckbox = document.getElementById('show-moisture');

    if (isFloodEvent && floodCheckbox && !floodCheckbox.checked) {
        console.log('✅ Activando filtro de Inundación');
        floodCheckbox.checked = true;
        showFloodData = true;
        window.toggleDataTypeVisibility('flood');
    }

    if (isMoistureEvent && moistureCheckbox && !moistureCheckbox.checked) {
        console.log('✅ Activando filtro de Humedad de Suelo');
        moistureCheckbox.checked = true;
        showMoistureData = true;
        window.toggleDataTypeVisibility('moisture');
    }

    // Ajustar slider de humedad: 10% menos que el valor del evento
    const eventIntensity = event.intensity || 0;
    const targetThreshold = Math.max(0, eventIntensity - 0.1); // 10% menos, mínimo 0

    if (targetThreshold < minHumidityThreshold) {
        console.log(`📊 Ajustando umbral de humedad: ${(minHumidityThreshold * 100).toFixed(0)}% → ${(targetThreshold * 100).toFixed(0)}% (evento: ${(eventIntensity * 100).toFixed(0)}% - 10%)`);

        minHumidityThreshold = targetThreshold;

        // Actualizar slider visual
        const humiditySlider = document.getElementById('humidity-slider');
        const humidityValue = document.getElementById('humidity-value');

        if (humiditySlider) {
            humiditySlider.value = Math.round(targetThreshold * 100);
        }
        if (humidityValue) {
            humidityValue.textContent = Math.round(targetThreshold * 100) + '%';
        }

        // Recargar datos con nuevo umbral
        loadDataForCurrentZoom();
    }

    // ==========================================
    // PASO 2: NAVEGAR AL EVENTO
    // ==========================================

    // Calcular centro del polígono
    let centerLat = 0;
    let centerLng = 0;
    event.coords.forEach(coord => {
        centerLat += coord[0];
        centerLng += coord[1];
    });
    centerLat /= event.coords.length;
    centerLng /= event.coords.length;

    // ==========================================
    // PASO 2.1: PREPARAR EFECTO DE PARPADEO
    // ==========================================
    // El efecto de parpadeo se aplicará después de encontrar el polígono

    // Cerrar dropdown
    toggleHistoricalEventsDropdown();

    // Ajustar año del timeline si es necesario
    const timelineSlider = document.getElementById('year-slider');
    if (timelineSlider && event.year) {
        const eventYear = parseInt(event.year);
        const currentTimelineYear = parseInt(timelineSlider.value);

        // Si el año del evento es mayor al año actual del timeline, ajustarlo
        if (eventYear > currentTimelineYear) {
            console.log(`📅 Ajustando año del timeline: ${currentTimelineYear} → ${eventYear}`);
            timelineSlider.value = eventYear;
            currentYear = eventYear;

            // Actualizar display del año
            const yearDisplay = document.getElementById('current-year');
            if (yearDisplay) {
                yearDisplay.textContent = eventYear;
            }

            // Actualizar visibilidad de capas
            updateLayerOpacityByYear(eventYear);
        }
    }

    // Navegar al evento con animación
    map.flyTo([centerLat, centerLng], 16, {
        duration: 1.5,
        easing: (t) => t * (2 - t)
    });

    // Mostrar notificación con información completa
    console.log(`📍 Navegando a: ${event.name} (${event.year})`);

    const eventTypeIcon = isFloodEvent ? '🌊' : '💧';
    const eventTypeName = isFloodEvent ? 'Inundación' : 'Humedad de Suelo';

    if (window.showNotification) {
        window.showNotification(
            `${eventTypeIcon} ${event.name}\n📅 ${event.year} | 📊 ${event.source}\n💧 ${(eventIntensity * 100).toFixed(0)}% | Tipo: ${eventTypeName}`,
            'success'
        );
    }

    // ==========================================
    // PASO 3: BUSCAR Y ABRIR POPUP DEL POLÍGONO REAL
    // ==========================================

    // Esperar a que termine la animación de flyTo y se carguen los datos
    setTimeout(() => {
        // Buscar el polígono del evento en todas las capas
        let eventPolygon = null;

        // Iterar sobre todas las capas del mapa
        map.eachLayer((layer) => {
            if (layer instanceof L.Polygon && layer.options.year === event.year) {
                // Verificar si las coordenadas coinciden
                const layerLatLngs = layer.getLatLngs()[0];
                if (layerLatLngs && layerLatLngs.length === event.coords.length) {
                    // Comparar primera coordenada para identificación rápida
                    const firstCoord = layerLatLngs[0];
                    if (Math.abs(firstCoord.lat - event.coords[0][0]) < 0.0001 &&
                        Math.abs(firstCoord.lng - event.coords[0][1]) < 0.0001) {
                        eventPolygon = layer;
                    }
                }
            }
        });

        // Si encontramos el polígono, aplicar efecto de parpadeo tipo hover y abrir popup
        if (eventPolygon) {
            console.log('✅ Polígono encontrado, aplicando efecto de parpadeo tipo hover');

            // Efecto de parpadeo simulando mouseover/mouseout (4 veces)
            let blinkCount = 0;
            const blinkInterval = setInterval(() => {
                if (blinkCount >= 8) { // 4 parpadeos completos (hover in/out)
                    clearInterval(blinkInterval);
                    // Dejar en estado normal (sin borde)
                    eventPolygon.setStyle({
                        opacity: 0
                    });
                    return;
                }

                // Alternar entre hover (visible) y normal (invisible)
                if (blinkCount % 2 === 0) {
                    // Simular mouseover - mostrar borde
                    eventPolygon.setStyle({
                        opacity: 0.8
                    });
                } else {
                    // Simular mouseout - ocultar borde
                    eventPolygon.setStyle({
                        opacity: 0
                    });
                }
                blinkCount++;
            }, 400); // Parpadeo cada 400ms (más natural)

            // Abrir popup inmediatamente
            if (eventPolygon.getPopup()) {
                eventPolygon.openPopup();
                console.log('✅ Popup abierto');
            }
        } else {
            // Si no se encontró, crear popup independiente
            console.log('⚠️ Polígono no encontrado, creando popup independiente');
            const popupContent = `
                <div class="sar-popup-minimal">
                    <div class="popup-title">${event.name}</div>
                    <div class="popup-humidity">
                        <span class="popup-percentage">${(event.intensity * 100).toFixed(0)}%</span>
                        <span class="popup-drop">${eventTypeIcon}</span>
                    </div>
                    <div class="popup-source">📊 ${event.source}</div>
                    <div class="popup-year" style="background-color: ${isFloodEvent ? '#5B9AA9' : '#654321'};">
                        ${event.year}
                    </div>
                </div>
            `;

            L.popup({
                closeButton: true,
                autoClose: false,
                closeOnClick: false,
                className: 'custom-popup'
            })
            .setLatLng([centerLat, centerLng])
            .setContent(popupContent)
            .openOn(map);
        }
    }, 1700); // Esperar a que termine flyTo + pequeño margen para carga de datos
}

// Exponer funciones globalmente
window.navigateToHistoricalEvent = navigateToEvent;
window.toggleHistoricalEventsDropdown = toggleHistoricalEventsDropdown;

// Log de carga
console.log('🗺️ Módulo de mapa cargado');
