// ========================================
// HYDROSAR MONITOR - NASA LAYERS MANAGER
// ========================================
// Sistema de gestión de capas SAR Sentinel-1 con tiles PNG

/**
 * Configuración del gestor de capas NASA
 */
const NASA_LAYERS_CONFIG = {
    indexPath: 'src/data/nasa-layers/layers-index.json',
    cacheKey: 'nasa_layers_cache',
    cacheValidityHours: 24,
    defaultOpacity: 0.6,
    animationDuration: 300
};

/**
 * Variables globales del módulo
 */
let nasaLayersData = {
    layers: [],
    metadata: {}
};
let activeLayers = new Map(); // Map<layerId, L.TileLayer>
let layersLoaded = false;
let panelOpen = false;

// ========================================
// INICIALIZACIÓN
// ========================================

/**
 * Inicializa el sistema de capas NASA
 */
async function initializeNASALayers() {
    console.log('🛰️ Inicializando sistema de capas NASA SAR...');

    // Cargar índice de capas
    await loadLayersIndex();

    // Inicializar UI del panel
    initializePanel();

    // Renderizar lista de capas disponibles
    renderLayersList();

    console.log(`✅ Sistema de capas NASA inicializado (${nasaLayersData.layers.length} capas disponibles)`);
}

/**
 * Carga el índice de capas desde layers-index.json
 */
async function loadLayersIndex() {
    try {
        // Verificar cache primero
        const cached = checkCache();
        if (cached) {
            nasaLayersData = cached;
            console.log(`✅ Índice de capas cargado desde cache (${nasaLayersData.layers.length} capas)`);
            return;
        }

        // Cargar desde servidor
        const response = await fetch(NASA_LAYERS_CONFIG.indexPath);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        nasaLayersData = data;

        // Guardar en cache
        saveToCache(data);

        console.log(`✅ Índice de capas cargado (${nasaLayersData.layers.length} capas)`);
        layersLoaded = true;

    } catch (error) {
        console.error('❌ Error al cargar índice de capas NASA:', error);
        nasaLayersData = { layers: [], metadata: {} };
        layersLoaded = false;
    }
}

/**
 * Verifica y retorna cache si es válido
 */
function checkCache() {
    try {
        const cached = localStorage.getItem(NASA_LAYERS_CONFIG.cacheKey);
        const timestamp = localStorage.getItem(`${NASA_LAYERS_CONFIG.cacheKey}_timestamp`);

        if (cached && timestamp) {
            const hoursSinceCache = (Date.now() - parseInt(timestamp)) / (1000 * 60 * 60);

            if (hoursSinceCache < NASA_LAYERS_CONFIG.cacheValidityHours) {
                return JSON.parse(cached);
            }
        }
    } catch (error) {
        console.warn('⚠️ Error leyendo cache de capas:', error);
    }
    return null;
}

/**
 * Guarda datos en cache
 */
function saveToCache(data) {
    try {
        localStorage.setItem(NASA_LAYERS_CONFIG.cacheKey, JSON.stringify(data));
        localStorage.setItem(`${NASA_LAYERS_CONFIG.cacheKey}_timestamp`, Date.now().toString());
    } catch (error) {
        console.warn('⚠️ No se pudo guardar cache:', error);
    }
}

// ========================================
// UI DEL PANEL
// ========================================

/**
 * Inicializa el panel de control de capas
 */
function initializePanel() {
    const toggleBtn = document.getElementById('nasaPanelToggle');
    const panel = document.getElementById('nasaLayersPanel');

    if (!toggleBtn || !panel) {
        console.warn('⚠️ Panel de capas NASA no encontrado en el DOM');
        return;
    }

    // Event listener para toggle
    toggleBtn.addEventListener('click', togglePanel);

    // Cerrar panel al hacer click fuera
    document.addEventListener('click', (e) => {
        if (panelOpen && !panel.contains(e.target)) {
            closePanel();
        }
    });
}

/**
 * Alterna visibilidad del panel
 */
function togglePanel() {
    if (panelOpen) {
        closePanel();
    } else {
        openPanel();
    }
}

/**
 * Abre el panel
 */
function openPanel() {
    const content = document.getElementById('nasaPanelContent');
    const toggle = document.getElementById('nasaPanelToggle');

    if (content) {
        content.style.display = 'block';
        content.style.animation = `fadeIn ${NASA_LAYERS_CONFIG.animationDuration}ms ease-out`;
    }

    if (toggle) {
        toggle.classList.add('active');
    }

    panelOpen = true;
}

/**
 * Cierra el panel
 */
function closePanel() {
    const content = document.getElementById('nasaPanelContent');
    const toggle = document.getElementById('nasaPanelToggle');

    if (content) {
        content.style.animation = `fadeOut ${NASA_LAYERS_CONFIG.animationDuration}ms ease-out`;
        setTimeout(() => {
            content.style.display = 'none';
        }, NASA_LAYERS_CONFIG.animationDuration);
    }

    if (toggle) {
        toggle.classList.remove('active');
    }

    panelOpen = false;
}

/**
 * Renderiza la lista de capas disponibles
 */
function renderLayersList() {
    const container = document.getElementById('nasaLayersList');

    if (!container) {
        console.warn('⚠️ Contenedor de capas no encontrado');
        return;
    }

    if (nasaLayersData.layers.length === 0) {
        container.innerHTML = `
            <div class="nasa-empty-state">
                <p>📡 No hay capas SAR disponibles</p>
                <small>Ejecuta <code>python tools/process-sar-tiff.py</code> para procesar archivos TIFF</small>
            </div>
        `;
        return;
    }

    // Generar HTML para cada capa
    const layersHTML = nasaLayersData.layers.map(layer => {
        const isActive = activeLayers.has(layer.id);
        const currentOpacity = isActive
            ? Math.round(activeLayers.get(layer.id).options.opacity * 100)
            : Math.round(layer.defaultOpacity * 100);

        return `
            <div class="nasa-layer-item" data-layer-id="${layer.id}">
                <div class="layer-header">
                    <label class="layer-checkbox-label">
                        <input
                            type="checkbox"
                            class="layer-checkbox"
                            data-layer-id="${layer.id}"
                            ${isActive ? 'checked' : ''}
                        >
                        <span class="layer-name">${layer.name}</span>
                    </label>
                    <span class="layer-date">${formatDate(layer.date)}</span>
                </div>

                <div class="layer-controls ${isActive ? '' : 'hidden'}">
                    <div class="opacity-control">
                        <label class="opacity-label">
                            Opacidad: <span class="opacity-value">${currentOpacity}%</span>
                        </label>
                        <input
                            type="range"
                            class="opacity-slider"
                            data-layer-id="${layer.id}"
                            min="0"
                            max="100"
                            value="${currentOpacity}"
                        >
                    </div>

                    <div class="layer-info">
                        <small>🛰️ ${layer.satellite} | 📊 ${layer.type}</small>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = layersHTML;

    // Adjuntar event listeners
    attachLayerEventListeners();
}

/**
 * Formatea fecha para mostrar
 */
function formatDate(dateString) {
    if (!dateString) return 'Fecha desconocida';

    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}

/**
 * Adjunta event listeners a los controles de capas
 */
function attachLayerEventListeners() {
    // Checkboxes de activación/desactivación
    document.querySelectorAll('.layer-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const layerId = e.target.dataset.layerId;

            if (e.target.checked) {
                loadLayer(layerId);
            } else {
                unloadLayer(layerId);
            }
        });
    });

    // Sliders de opacidad
    document.querySelectorAll('.opacity-slider').forEach(slider => {
        slider.addEventListener('input', (e) => {
            const layerId = e.target.dataset.layerId;
            const opacity = parseInt(e.target.value) / 100;

            setLayerOpacity(layerId, opacity);

            // Actualizar valor mostrado
            const valueSpan = e.target.parentElement.querySelector('.opacity-value');
            if (valueSpan) {
                valueSpan.textContent = `${e.target.value}%`;
            }
        });
    });
}

// ========================================
// GESTIÓN DE CAPAS
// ========================================

/**
 * Carga una capa en el mapa
 */
function loadLayer(layerId) {
    const layerConfig = nasaLayersData.layers.find(l => l.id === layerId);

    if (!layerConfig) {
        console.error(`❌ Capa no encontrada: ${layerId}`);
        return;
    }

    // Verificar si ya está cargada
    if (activeLayers.has(layerId)) {
        console.warn(`⚠️ Capa ${layerId} ya está cargada`);
        return;
    }

    console.log(`🚀 Cargando capa: ${layerConfig.name}`);

    try {
        // Crear TileLayer de Leaflet
        const tileLayer = L.tileLayer(layerConfig.tilesPath, {
            minZoom: layerConfig.minZoom,
            maxZoom: layerConfig.maxZoom,
            opacity: layerConfig.defaultOpacity,
            tms: false, // Tiles en formato XYZ estándar
            attribution: `🛰️ ${layerConfig.satellite} - ${layerConfig.date}`,
            errorTileUrl: '', // Tile transparente si falla
            bounds: layerConfig.bounds
        });

        // Agregar al mapa
        tileLayer.addTo(map);
        activeLayers.set(layerId, tileLayer);

        // Mostrar controles
        showLayerControls(layerId);

        console.log(`✅ Capa ${layerId} cargada correctamente`);

        // Notificar al usuario
        showNotification(`Capa "${layerConfig.name}" activada`, 'success');

    } catch (error) {
        console.error(`❌ Error al cargar capa ${layerId}:`, error);
        showNotification(`Error al cargar capa "${layerConfig.name}"`, 'error');
    }
}

/**
 * Descarga una capa del mapa
 */
function unloadLayer(layerId) {
    const tileLayer = activeLayers.get(layerId);

    if (!tileLayer) {
        console.warn(`⚠️ Capa ${layerId} no está activa`);
        return;
    }

    console.log(`🗑️ Descargando capa: ${layerId}`);

    try {
        // Remover del mapa
        map.removeLayer(tileLayer);
        activeLayers.delete(layerId);

        // Ocultar controles
        hideLayerControls(layerId);

        console.log(`✅ Capa ${layerId} removida`);

        const layerConfig = nasaLayersData.layers.find(l => l.id === layerId);
        if (layerConfig) {
            showNotification(`Capa "${layerConfig.name}" desactivada`, 'info');
        }

    } catch (error) {
        console.error(`❌ Error al remover capa ${layerId}:`, error);
    }
}

/**
 * Establece la opacidad de una capa
 */
function setLayerOpacity(layerId, opacity) {
    const tileLayer = activeLayers.get(layerId);

    if (!tileLayer) {
        console.warn(`⚠️ Capa ${layerId} no está activa`);
        return;
    }

    tileLayer.setOpacity(opacity);
}

/**
 * Muestra controles de una capa
 */
function showLayerControls(layerId) {
    const layerItem = document.querySelector(`.nasa-layer-item[data-layer-id="${layerId}"]`);
    if (layerItem) {
        const controls = layerItem.querySelector('.layer-controls');
        if (controls) {
            controls.classList.remove('hidden');
        }
    }
}

/**
 * Oculta controles de una capa
 */
function hideLayerControls(layerId) {
    const layerItem = document.querySelector(`.nasa-layer-item[data-layer-id="${layerId}"]`);
    if (layerItem) {
        const controls = layerItem.querySelector('.layer-controls');
        if (controls) {
            controls.classList.add('hidden');
        }
    }
}

// ========================================
// NOTIFICACIONES
// ========================================

/**
 * Muestra una notificación al usuario
 */
function showNotification(message, type = 'info') {
    // Reutilizar sistema de notificaciones de script.js si existe
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }

    // Fallback: console log
    const emoji = {
        'success': '✅',
        'error': '❌',
        'info': 'ℹ️',
        'warning': '⚠️'
    }[type] || 'ℹ️';

    console.log(`${emoji} ${message}`);
}

// ========================================
// UTILIDADES PÚBLICAS
// ========================================

/**
 * Refresca el índice de capas desde el servidor
 */
async function refreshLayersIndex() {
    console.log('🔄 Refrescando índice de capas...');

    // Limpiar cache
    localStorage.removeItem(NASA_LAYERS_CONFIG.cacheKey);
    localStorage.removeItem(`${NASA_LAYERS_CONFIG.cacheKey}_timestamp`);

    // Recargar
    await loadLayersIndex();
    renderLayersList();

    showNotification('Índice de capas actualizado', 'success');
}

/**
 * Obtiene información de una capa
 */
function getLayerInfo(layerId) {
    return nasaLayersData.layers.find(l => l.id === layerId);
}

/**
 * Verifica si una capa está activa
 */
function isLayerActive(layerId) {
    return activeLayers.has(layerId);
}

/**
 * Obtiene todas las capas activas
 */
function getActiveLayers() {
    return Array.from(activeLayers.keys()).map(id => getLayerInfo(id));
}

// ========================================
// EXPORTAR FUNCIONES GLOBALES
// ========================================

window.NASA_LAYERS_MANAGER = {
    initialize: initializeNASALayers,
    loadLayer,
    unloadLayer,
    setLayerOpacity,
    refreshIndex: refreshLayersIndex,
    getLayerInfo,
    isLayerActive,
    getActiveLayers,
    togglePanel
};

// ========================================
// AUTO-INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    // Esperar a que el mapa esté listo
    const waitForMap = setInterval(() => {
        if (typeof map !== 'undefined' && map) {
            clearInterval(waitForMap);

            // Inicializar con delay de 3 segundos
            setTimeout(async () => {
                await initializeNASALayers();
            }, 3000);
        }
    }, 100);
});

console.log('📡 Módulo NASA Layers Manager cargado');
