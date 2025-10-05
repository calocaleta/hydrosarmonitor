# Solución de Problemas: NASA Earthdata API

## 🔴 Problema: "NASA: No disponible"

Si ves el mensaje **"NASA: No disponible"** en la aplicación, significa que la API de NASA Earthdata no pudo conectarse. **La aplicación funciona perfectamente con datos históricos verificados (64 eventos).**

---

## 🔍 Causas Comunes

### 1. **Token de Autenticación Expirado** ⏰

El token de NASA Earthdata tiene una fecha de expiración. El token actual expira el **2025-10-02**.

**Solución:**
1. Ve a: https://urs.earthdata.nasa.gov/users/calocaleta/user_tokens
2. Inicia sesión con las credenciales de NASA Earthdata
3. Genera un nuevo token
4. Copia el nuevo token
5. Reemplaza el token en `src/js/nasa-earthdata-api.js` línea 17:

```javascript
AUTH_TOKEN: 'TU_NUEVO_TOKEN_AQUÍ'
```

### 2. **Restricciones CORS del Navegador** 🌐

La API de NASA puede tener restricciones de CORS que impiden las peticiones directas desde el navegador.

**Solución recomendada: Usar un Backend Proxy**

```javascript
// En lugar de llamar directamente a NASA API:
// fetch('https://cmr.earthdata.nasa.gov/...')

// Llamar a tu backend:
fetch('http://tu-servidor.com/api/nasa-data')
```

**Ejemplo de backend con Node.js:**

```javascript
// server.js
const express = require('express');
const axios = require('axios');
const app = express();

const NASA_TOKEN = process.env.NASA_EARTHDATA_TOKEN;

app.get('/api/nasa-data', async (req, res) => {
  try {
    const response = await axios.get(
      'https://cmr.earthdata.nasa.gov/search/granules.json',
      {
        params: req.query,
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

### 3. **API Temporalmente No Disponible** 🔧

La API de NASA puede estar en mantenimiento o tener problemas temporales.

**Solución:** Esperar unos minutos y recargar la página.

---

## ✅ Verificar Estado de la API

### Opción 1: Consola del Navegador

1. Abre DevTools (F12)
2. Ve a la pestaña **Console**
3. Busca mensajes como:

```
✅ Datos de NASA cargados: 109 eventos
```

o

```
❌ Error cargando datos de NASA Earthdata
```

### Opción 2: Test de Conexión

Abre: http://localhost:61626/tests/test-sar-connection.html

Este test mostrará:
- ✅ Si el módulo NASA está cargado
- ✅ Si la conexión es exitosa
- ❌ Errores específicos

---

## 📊 Funcionamiento Sin NASA API

**La aplicación funciona perfectamente sin la API de NASA.** Usa **64 eventos históricos verificados** de fuentes oficiales:

- **INGEMMET** - Instituto Geológico, Minero y Metalúrgico del Perú
- **INDECI** - Instituto Nacional de Defensa Civil
- **SENAMHI** - Servicio Nacional de Meteorología e Hidrología

### Eventos históricos incluyen:

| Región | Eventos | Años |
|--------|---------|------|
| Amazonas/Bagua | 21 | 2015-2024 |
| Lima | 8 | 2015-2024 |
| Piura | 4 | 2017-2023 |
| Cusco | 3 | 2018-2024 |
| Otros | 28 | 2015-2025 |

**Total: 64 eventos verificados**

---

## 🚀 Alternativa: Google Earth Engine

Para una solución más robusta con procesamiento SAR real:

### 1. Crear cuenta en Google Earth Engine
https://earthengine.google.com/signup/

### 2. Usar Earth Engine API (Python ejemplo)

```python
import ee
ee.Initialize()

# Área de Lima
lima = ee.Geometry.Rectangle([-77.2, -12.3, -76.7, -11.7])

# Buscar Sentinel-1
sentinel1 = ee.ImageCollection('COPERNICUS/S1_GRD') \
  .filterBounds(lima) \
  .filterDate('2023-01-01', '2023-12-31')

# Detectar agua (VH < -20 dB)
water = sentinel1.select('VH').map(lambda img:
  img.lt(-20).selfMask()
)

# Exportar como GeoJSON
water_polygons = water.reduceToVectors(
  geometry=lima,
  scale=10
)
```

### 3. Crear endpoint en tu backend

```javascript
// api/earth-engine-data
app.get('/api/earth-engine-data', async (req, res) => {
  // Ejecutar script de Python con Earth Engine
  // Retornar GeoJSON procesado
  res.json(processedData);
});
```

---

## 🔧 Modo de Desarrollo

Para desarrollar sin depender de NASA API, puedes comentar temporalmente la llamada:

```javascript
// En src/js/map.js, línea ~1614
// Comentar temporalmente:
/*
initializeSARData().then(() => {
    // ...
}).catch(error => {
    // ...
});
*/

// La app funcionará solo con datos históricos
```

---

## 📝 Resumen

| Estado | Descripción | Acción |
|--------|-------------|--------|
| ✅ Datos históricos | 64 eventos verificados | **Siempre funciona** |
| 🟡 NASA API | 109 eventos adicionales | Requiere token válido |
| 🔵 Google Earth Engine | Procesamiento SAR real | Solución recomendada |

**La aplicación es totalmente funcional con datos históricos.** La integración de NASA es un complemento opcional que requiere configuración adicional.

---

## 🆘 Soporte

Si el problema persiste:

1. Revisa la consola del navegador (F12)
2. Ejecuta el test: `/tests/test-sar-connection.html`
3. Verifica que el token no haya expirado
4. Considera usar un backend proxy para evitar CORS

**La app funciona perfectamente sin NASA API usando datos históricos verificados.**
