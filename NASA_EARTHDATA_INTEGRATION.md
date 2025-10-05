# Integración con NASA Earthdata API

## ✅ Implementación Completada

La aplicación ahora está integrada con **NASA Earthdata API** para obtener datos reales de Sentinel-1 SAR.

---

## 🔑 Autenticación

**Token actual configurado:**
```
Usuario: calocaleta
Válido hasta: 2025-10-02 (aprox. 5 meses)
```

⚠️ **IMPORTANTE**: El token está hardcodeado en `nasa-earthdata-api.js` para pruebas. En producción, debes:
1. Mover el token a variables de entorno
2. Implementar un backend que maneje la autenticación
3. Nunca exponer el token en el código frontend

---

## 🛰️ Cómo Funciona

### 1. Búsqueda de Datos

La aplicación busca granules de Sentinel-1 en la API CMR (Common Metadata Repository) de NASA:

```javascript
// Endpoint
https://cmr.earthdata.nasa.gov/search/granules.json

// Parámetros
- bounding_box: Lima, Perú (-77.2,-12.3,-76.7,-11.7)
- temporal: Rango de fechas (ej: 2023-01-01 a 2023-12-31)
- provider: ASF (Alaska Satellite Facility - proveedor de Sentinel-1)
- page_size: 50 resultados máximo
```

### 2. Flujo de Datos

```
1. App carga → Intenta NASA Earthdata API
2. API responde con granules de Sentinel-1
3. Granules se procesan y convierten a eventos
4. Si API falla → Fallback a datos históricos verificados
5. Datos se muestran en el mapa
```

### 3. Procesamiento

⚠️ **NOTA IMPORTANTE**: Actualmente, la integración:
- ✅ Busca y lista granules de Sentinel-1
- ✅ Extrae metadatos (ubicación, fecha, ID)
- ❌ **NO** descarga las imágenes SAR reales
- ❌ **NO** procesa píxeles para detectar agua

Para **detección real de inundaciones**, necesitarías:
1. Descargar las imágenes GeoTIFF de Sentinel-1
2. Procesarlas con algoritmos SAR (VH/VV polarization)
3. Aplicar umbralización para detectar agua
4. Generar polígonos de áreas inundadas

---

## 📊 Datos Disponibles

### Granules de Sentinel-1

Cada granule contiene:
- **ID del granule**: Identificador único
- **Coordenadas**: Bounding box de la imagen
- **Fecha**: Timestamp de captura
- **Metadata**: Información técnica del satélite

### Limitaciones Actuales

1. **Sin procesamiento SAR**: Los "eventos" generados son estimaciones basadas en la presencia de granules, no en análisis real de imágenes

2. **Intensidad por defecto**: Todos los eventos tienen intensidad 0.5 porque no se analiza la imagen real

3. **Verificación pendiente**: Los datos están marcados como `verified: false` hasta que se implemente procesamiento real

---

## 🚀 Próximos Pasos (Para Detección Real)

### Opción 1: Google Earth Engine (Recomendado)

**Por qué?**
- Procesamiento en la nube (no descargas imágenes)
- Algoritmos de detección de agua pre-implementados
- Gratis para investigación

**Cómo?**
1. Crear cuenta: https://earthengine.google.com/signup/
2. Usar Earth Engine API desde un backend Node.js/Python
3. Aplicar algoritmos de detección de agua
4. Retornar polígonos procesados

**Ejemplo de código EE (Python):**
```python
import ee
ee.Initialize()

# Área de Lima
lima = ee.Geometry.Rectangle([-77.2, -12.3, -76.7, -11.7])

# Buscar Sentinel-1
sentinel1 = ee.ImageCollection('COPERNICUS/S1_GRD') \
  .filterBounds(lima) \
  .filterDate('2023-01-01', '2023-12-31') \
  .filter(ee.Filter.eq('instrumentMode', 'IW'))

# Detectar agua (VH < -20 dB típicamente indica agua)
water = sentinel1.select('VH').map(lambda img:
  img.lt(-20).selfMask()
)

# Convertir a polígonos
water_polygons = water.reduceToVectors(
  geometry=lima,
  scale=10
)
```

### Opción 2: Descargar y Procesar Localmente

**Herramientas necesarias:**
- **GDAL**: Para leer GeoTIFF
- **SNAP**: ESA Sentinel Application Platform
- **Python**: rasterio, numpy, scikit-image

**Flujo:**
1. Descargar granules con `asf_search` Python
2. Procesar con SNAP Toolbox
3. Aplicar filtros de detección de agua
4. Generar GeoJSON con áreas inundadas

---

## 🔍 Monitoreo de la API

### Ver Console del Navegador

Abre DevTools (F12) y busca estos logs:

```
🛰️ Intentando cargar datos de NASA Earthdata API...
📅 Consultando año 2023...
📡 URL de búsqueda: https://cmr.earthdata.nasa.gov/search/granules...
✅ Encontrados X granules de Sentinel-1
📊 Procesando X granules...
✅ Datos de NASA Earthdata cargados
```

### Errores Comunes

**1. Token expirado:**
```
❌ Error en la API: 401 Unauthorized
```
**Solución**: Renovar token en https://urs.earthdata.nasa.gov/users/calocaleta/user_tokens

**2. Sin granules encontrados:**
```
⚠️ No hay granules en la respuesta
```
**Posibles causas**:
- Fechas fuera de rango (Sentinel-1 desde 2014)
- Área sin cobertura
- Filtros muy restrictivos

**3. CORS error:**
```
❌ Blocked by CORS policy
```
**Solución**: Necesitas un backend proxy para hacer las peticiones

---

## 📁 Archivos Modificados

1. ✅ `nasa-earthdata-api.js` - Módulo de integración con API
2. ✅ `map.js` - Carga datos de API al iniciar
3. ✅ `index.html` - Carga el nuevo script
4. ✅ `real-flood-data.js` - Datos históricos como fallback

---

## 🔐 Seguridad

### ⚠️ ADVERTENCIAS

1. **Token expuesto**: El token está en el código frontend
   - Cualquiera puede verlo en DevTools
   - Puede usarse para hacer peticiones a tu nombre
   - Límite de cuota puede agotarse

2. **Solución recomendada**:
   ```
   Frontend → Tu Backend → NASA API
              (con token)
   ```

3. **Implementación backend (Node.js ejemplo)**:
   ```javascript
   // server.js
   const express = require('express');
   const axios = require('axios');
   const app = express();

   const NASA_TOKEN = process.env.NASA_EARTHDATA_TOKEN;

   app.get('/api/sentinel1', async (req, res) => {
     const { startDate, endDate } = req.query;

     try {
       const response = await axios.get(
         'https://cmr.earthdata.nasa.gov/search/granules.json',
         {
           params: {
             bounding_box: '-77.2,-12.3,-76.7,-11.7',
             temporal: `${startDate},${endDate}`,
             provider: 'ASF'
           },
           headers: {
             'Authorization': `Bearer ${NASA_TOKEN}`
           }
         }
       );

       res.json(response.data);
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });

   app.listen(3000);
   ```

---

## 📚 Referencias

1. **NASA CMR API Docs**: https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html
2. **Earthdata Login**: https://urs.earthdata.nasa.gov/
3. **ASF DAAC (Sentinel-1)**: https://asf.alaska.edu/
4. **UN-SPIDER Flood Mapping**: https://www.un-spider.org/advisory-support/recommended-practices/recommended-practice-google-earth-engine-flood-mapping

---

## ✅ Estado Actual

- ✅ Integración con NASA Earthdata API funcional
- ✅ Búsqueda de granules Sentinel-1
- ✅ Fallback a datos históricos
- ✅ Manejo de errores
- ⚠️ Procesamiento SAR real pendiente
- ⚠️ Backend para seguridad recomendado

**Para producción**, considera implementar Google Earth Engine para procesamiento real de imágenes SAR.
