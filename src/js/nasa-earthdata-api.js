// ========================================
// NASA EARTHDATA API INTEGRATION
// ========================================
// Integración con Common Metadata Repository (CMR) API
// para obtener datos reales de Sentinel-1 SAR

/**
 * Configuración de la API de NASA Earthdata
 */
const NASA_CONFIG = {
    // CMR Search API endpoint
    CMR_SEARCH_URL: 'https://cmr.earthdata.nasa.gov/search/granules.json',

    // Token de autenticación (Bearer token de Earthdata Login)
    // IMPORTANTE: En producción, este token debe estar en variables de entorno
    // y manejarse desde un backend seguro
    AUTH_TOKEN: 'eyJ0eXAiOiJKV1QiLCJvcmlnaW4iOiJFYXJ0aGRhdGEgTG9naW4iLCJzaWciOiJlZGxqd3RwdWJrZXlfb3BzIiwiYWxnIjoiUlMyNTYifQ.eyJ0eXBlIjoiVXNlciIsInVpZCI6ImNhbG9jYWxldGEiLCJleHAiOjE3NjQ4MjIyNjMsImlhdCI6MTc1OTYzODI2MywiaXNzIjoiaHR0cHM6Ly91cnMuZWFydGhkYXRhLm5hc2EuZ292IiwiaWRlbnRpdHlfcHJvdmlkZXIiOiJlZGxfb3BzIiwiYWNyIjoiZWRsIiwiYXNzdXJhbmNlX2xldmVsIjozfQ.kF6CBYwxI9WWB3iSrU4C9WGeG0fglyVc1LFlsbtD_VkFMunTDtZSdFIpwrQp4c0BngNbjqkay58hNo7_mLaMgoZ97VQ_u7J7d3Sadh9DUdOIFpGwKBQVliBtXaKk_3TBUPo7Az94r_qyPIocjXJ2zXHYl6CS0zxu78oipo8WvEqiSDy9ytbHQDQ7yy051_2AkVACSTfb3XtezLKBj9aZKwf9QtAva5J5mAs6vFpV4zDySYsGzUOG_axAvzqZaQGnkWMR3kpUH7yA-JIx_n9R8PO2GcnvJ3LIswv64GfsWAyFAp7qqXa948WWn5bxSA8CSAsIvg1SHeRCZFFLlhqF7Q',

    // Bounding box de Lima, Perú (aproximado)
    LIMA_BBOX: {
        west: -77.2,
        south: -12.3,
        east: -76.7,
        north: -11.7
    },

    // Short names de colecciones Sentinel-1 en NASA
    // Nota: Sentinel-1 está principalmente en ASF DAAC
    SENTINEL_1_COLLECTIONS: [
        'SENTINEL-1A_SLC',
        'SENTINEL-1B_SLC',
        'SENTINEL-1A_GRD',
        'SENTINEL-1B_GRD'
    ]
};

/**
 * Busca datos de Sentinel-1 para Lima, Perú
 * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
 * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
 * @returns {Promise<Object>} Datos de la API
 */
async function searchSentinel1Data(startDate, endDate) {
    try {
        console.log(`🛰️ Buscando datos Sentinel-1 para Lima (${startDate} - ${endDate})`);

        // Construir parámetros de búsqueda
        const params = new URLSearchParams({
            // Bounding box de Lima
            bounding_box: `${NASA_CONFIG.LIMA_BBOX.west},${NASA_CONFIG.LIMA_BBOX.south},${NASA_CONFIG.LIMA_BBOX.east},${NASA_CONFIG.LIMA_BBOX.north}`,

            // Rango temporal
            temporal: `${startDate}T00:00:00Z,${endDate}T23:59:59Z`,

            // Proveedor (ASF DAAC para Sentinel-1)
            provider: 'ASF',

            // Número de resultados
            page_size: 50
        });

        const url = `${NASA_CONFIG.CMR_SEARCH_URL}?${params}`;

        console.log('📡 URL de búsqueda:', url);

        // Hacer petición con autenticación
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${NASA_CONFIG.AUTH_TOKEN}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Sin detalles');
            console.error(`❌ NASA API Error ${response.status}:`, errorText);

            // Errores comunes
            if (response.status === 401) {
                throw new Error('Token de NASA expirado o inválido');
            } else if (response.status === 403) {
                throw new Error('Acceso denegado a NASA Earthdata');
            } else if (response.status === 404) {
                throw new Error('Endpoint de NASA no encontrado');
            } else {
                throw new Error(`NASA API error ${response.status}: ${response.statusText}`);
            }
        }

        const data = await response.json();
        console.log(`✅ Encontrados ${data.feed?.entry?.length || 0} granules de Sentinel-1`);

        return data;

    } catch (error) {
        console.error('❌ Error al buscar datos Sentinel-1:', error.message || error);
        // Re-lanzar con mensaje mejorado
        throw new Error(`NASA API: ${error.message || 'Error de conexión'}`);
    }
}

/**
 * Procesa granules de Sentinel-1 y extrae información de inundación
 * Nota: Este es un procesamiento simplificado. En producción, necesitarías
 * descargar las imágenes SAR y procesarlas con algoritmos de detección de agua.
 * @param {Object} cmrResponse - Respuesta de CMR API
 * @returns {Array} Array de eventos de inundación detectados
 */
function processSentinel1Granules(cmrResponse) {
    const events = [];

    if (!cmrResponse.feed || !cmrResponse.feed.entry) {
        console.warn('⚠️ No hay granules en la respuesta');
        return events;
    }

    const granules = cmrResponse.feed.entry;
    console.log(`📊 Procesando ${granules.length} granules...`);

    granules.forEach(granule => {
        try {
            // Extraer información básica
            const title = granule.title || 'Sin título';
            const timeStart = granule.time_start;
            const timeEnd = granule.time_end;

            // Extraer coordenadas del polígono
            const boxes = granule.boxes || [];

            if (boxes.length > 0) {
                const box = boxes[0].split(' '); // "south west north east"

                // Crear evento básico
                // NOTA: En producción, aquí descargarías y procesarías la imagen SAR
                // para determinar si realmente hay agua/inundación
                const event = {
                    name: `Granule Sentinel-1 - ${title.substring(0, 30)}`,
                    coords: [
                        [parseFloat(box[0]), parseFloat(box[1])],
                        [parseFloat(box[2]), parseFloat(box[1])],
                        [parseFloat(box[2]), parseFloat(box[3])],
                        [parseFloat(box[0]), parseFloat(box[3])]
                    ],
                    intensity: 0.5, // Valor por defecto - requiere procesamiento real
                    type: 'recent',
                    dataType: 'flood',
                    source: 'Sentinel-1 (NASA Earthdata)',
                    verified: false, // No verificado sin procesamiento SAR
                    rawData: {
                        granuleId: granule.id,
                        timeStart: timeStart,
                        timeEnd: timeEnd,
                        producerGranuleId: granule.producer_granule_id
                    }
                };

                events.push(event);
            }
        } catch (err) {
            console.warn('⚠️ Error procesando granule:', err);
        }
    });

    console.log(`✅ Procesados ${events.length} eventos de ${granules.length} granules`);
    return events;
}

/**
 * Obtiene datos de inundación de NASA Earthdata para múltiples años
 * OPTIMIZADO: Peticiones en paralelo con Promise.all() + timeouts + cache
 * @param {Array<number>} years - Array de años a consultar
 * @returns {Promise<Object>} Objeto con datos por año
 */
async function fetchNASAFloodData(years = [2023, 2024, 2025]) {
    console.log(`🚀 Consultando ${years.length} años en paralelo...`);

    // Verificar cache primero
    const cacheKey = 'nasa_sar_data_cache';
    const cacheTimestampKey = 'nasa_sar_cache_timestamp';
    const cacheValidityHours = 24; // Cache válido por 24 horas

    try {
        const cachedData = localStorage.getItem(cacheKey);
        const cacheTimestamp = localStorage.getItem(cacheTimestampKey);

        if (cachedData && cacheTimestamp) {
            const hoursSinceCache = (Date.now() - parseInt(cacheTimestamp)) / (1000 * 60 * 60);
            if (hoursSinceCache < cacheValidityHours) {
                console.log(`✅ Usando datos en cache (${hoursSinceCache.toFixed(1)}h desde última consulta)`);
                return JSON.parse(cachedData);
            } else {
                console.log('⚠️ Cache expirado, consultando API...');
            }
        }
    } catch (error) {
        console.warn('⚠️ Error leyendo cache:', error);
    }

    // Crear promesas para todos los años EN PARALELO
    const yearPromises = years.map(async (year) => {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        try {
            // Timeout de 5 segundos por petición
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 5000)
            );

            const dataPromise = searchSentinel1Data(startDate, endDate)
                .then(cmrResponse => processSentinel1Granules(cmrResponse));

            const events = await Promise.race([dataPromise, timeoutPromise]);

            console.log(`✅ ${year}: ${events.length} eventos`);
            return { year, events };

        } catch (error) {
            console.error(`❌ Error en ${year}:`, error.message);
            return { year, events: [] };
        }
    });

    // Ejecutar todas las peticiones en paralelo
    const results = await Promise.all(yearPromises);

    // Convertir resultados a objeto
    const floodData = {};
    results.forEach(({ year, events }) => {
        floodData[year] = events;
    });

    // Guardar en cache
    try {
        localStorage.setItem(cacheKey, JSON.stringify(floodData));
        localStorage.setItem(cacheTimestampKey, Date.now().toString());
        console.log('💾 Datos guardados en cache');
    } catch (error) {
        console.warn('⚠️ No se pudo guardar cache:', error);
    }

    return floodData;
}

/**
 * Función principal para cargar datos de NASA Earthdata
 * Combina datos históricos con datos de la API
 */
async function loadNASAEarthdataFloodData() {
    console.log('🚀 Iniciando carga de datos de NASA Earthdata...');

    try {
        // Intentar cargar datos de años recientes desde la API
        const apiData = await fetchNASAFloodData([2023, 2024, 2025]);

        // Combinar con datos históricos verificados
        const combinedData = { ...window.REAL_FLOOD_DATA };

        // Agregar datos de la API a los años correspondientes
        Object.keys(apiData).forEach(year => {
            if (apiData[year].length > 0) {
                if (!combinedData[year]) {
                    combinedData[year] = [];
                }
                combinedData[year] = combinedData[year].concat(apiData[year]);
                console.log(`✅ Agregados ${apiData[year].length} granules para ${year}`);
            }
        });

        console.log('✅ Datos de NASA Earthdata cargados correctamente');
        return combinedData;

    } catch (error) {
        console.error('❌ Error al cargar datos de NASA Earthdata:', error);
        console.log('⚠️ Usando solo datos históricos verificados');
        return window.REAL_FLOOD_DATA;
    }
}

// ========================================
// NOTA: API DE NASA TEMPORALMENTE DESACTIVADA
// ========================================
// Razón: El token de autenticación ha expirado
// Para reactivar:
// 1. Ve a https://urs.earthdata.nasa.gov/users/calocaleta/user_tokens
// 2. Genera un nuevo token
// 3. Reemplaza AUTH_TOKEN en línea 17
// 4. Descomenta el bloque window.NASA_EARTHDATA_API abajo

// Exportar funciones
window.NASA_EARTHDATA_API = {
    searchSentinel1Data,
    processSentinel1Granules,
    fetchNASAFloodData,
    loadNASAEarthdataFloodData
};
console.log('📡 Módulo NASA Earthdata API cargado');

// Log para desarrollo
console.log('📡 NASA Earthdata API cargada');
console.log('⚠️ Nota: Si la API falla (CORS/Token expirado), la app usa datos históricos verificados');
console.log('   → Para renovar token: https://urs.earthdata.nasa.gov/users/calocaleta/user_tokens');
console.log('   → Para reactivar: Genera nuevo token en https://urs.earthdata.nasa.gov/');
