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
let minHumidityThreshold = 0.5; // Umbral mínimo de humedad (50% por defecto)
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

// Función para generar microzonas iniciales automáticamente
function generateInitialMicrozones() {
    const zones = {
        2015: [],
        2018: [],
        2020: [],
        2023: [],
        2024: [],
        2025: []
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

                // Generar intensidad con distribución sesgada hacia valores altos
                const intensityRoll = Math.random();
                const intensity = intensityRoll < 0.7 ? 0.6 + Math.random() * 0.4 : 0.3 + Math.random() * 0.3;

                // Determinar tipo de dato: 60% inundación, 40% humedad de suelo
                const dataType = Math.random() < 0.6 ? 'flood' : 'moisture';

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

                zones[year].push({ coords, intensity, type, dataType });
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
        // HUMEDAD DE SUELO: Escala de grises (más oscuro = más humedad)
        const grayValue = Math.floor(100 + (data.intensity * 100)); // 100-200 rango
        color = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
    } else {
        // INUNDACIÓN: Celeste a azul (más oscuro = más reciente)
        color = isRecent ? '#2563eb' : '#60a5fa'; // Azul oscuro (reciente) vs celeste (antiguo)
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
    const yearBgColor = isMoistureType ? '#6b7280' : (isRecent ? '#2563eb' : '#60a5fa');

    // Popup con diseño minimalista
    const popupContent = `
        <div class="sar-popup-minimal">
            <div class="popup-humidity">
                <span class="popup-percentage">${(data.intensity * 100).toFixed(0)}%</span>
                <span class="popup-drop">${icon}</span>
            </div>
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
                    <span class="timeline-icon">📅</span>
                    <span class="timeline-title">Línea temporal</span>
                    <span class="timeline-year" id="timeline-year">${MAP_CONFIG.timelineEnd}</span>
                </div>
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
                        <span class="humidity-value" id="humidity-value">50%</span>
                    </div>
                    <input
                        type="range"
                        id="humidity-slider"
                        class="humidity-slider"
                        min="0"
                        max="100"
                        value="50"
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
            `;

            L.DomEvent.disableClickPropagation(container);

            // Event listeners
            setTimeout(() => {
                const slider = document.getElementById('timeline-slider');
                const cumulativeToggle = document.getElementById('cumulative-toggle');
                const humiditySlider = document.getElementById('humidity-slider');
                const showFlood = document.getElementById('show-flood');
                const showMoisture = document.getElementById('show-moisture');

                slider.addEventListener('input', handleTimelineChange);
                cumulativeToggle.addEventListener('click', toggleCumulativeMode);
                humiditySlider.addEventListener('input', handleHumidityChange);
                showFlood.addEventListener('change', toggleDataTypeVisibility);
                showMoisture.addEventListener('change', toggleDataTypeVisibility);
            }, 100);

            return container;
        }
    });

    map.addControl(new sliderControl());
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

        // Determinar color según antigüedad (azul = reciente, celeste = antiguo)
        const isRecent = layerYear >= 2023;
        const color = isRecent ? '#2563eb' : '#60a5fa';

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
                    opacity: 0.4,
                    weight: 1
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
                    opacity: 0.4,
                    weight: 1
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
