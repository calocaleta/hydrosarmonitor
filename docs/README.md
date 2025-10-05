# 🌧️ HydroSAR Monitor - Explorador de Lluvias

Sistema de visualización de datos SAR de NASA para monitoreo de lluvias e inundaciones urbanas con predicción por IA.

![Version](https://img.shields.io/badge/version-4.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Características

### ✅ Implementadas

- **Mapa Interactivo con Leaflet.js**
  - Vista centrada en Lima, Perú (configurable)
  - Controles de zoom y pantalla completa
  - Búsqueda de localidades por nombre

- **Capas SAR (Radar de Apertura Sintética)**
  - Capa histórica (2015-2022): datos de lluvias pasadas
  - Capa reciente (2023-2025): datos actuales
  - Activación/desactivación independiente de capas
  - Visualización con intensidad variable

- **Slider Temporal**
  - Navegación por años (2015-2025)
  - Actualización dinámica de capas según año seleccionado
  - Indicador visual del año activo

- **Modo Predicción IA**
  - Activación con un clic
  - Visualización de zonas de riesgo (próximos 7 días)
  - Clasificación por nivel de riesgo: Alto, Medio, Bajo
  - Probabilidades calculadas por IA

- **🚨 Sistema de Alertas en Tiempo Real** (NUEVO)
  - Detección automática de zonas de riesgo activas
  - Polígonos animados con bordes pulsantes
  - 3 zonas de ejemplo: Huaycoloro, Ventanilla, Canto Grande
  - Clasificación por nivel: Alto, Medio, Bajo
  - Popups informativos con detalles de riesgo

- **🔔 Notificaciones Visuales y Sonoras** (NUEVO)
  - Geolocalización del usuario (GPS)
  - Alerta automática si está en zona de riesgo
  - Notificación flotante con información crítica
  - Sonido de alerta (beep) con control de volumen
  - Botón para silenciar/activar sonido
  - Notificaciones del navegador (con permiso)
  - Botón "Ver en mapa" para ubicar la zona

- **📢 Reporte Ciudadano de Emergencias** (NUEVO)
  - Botón flotante naranja "Reportar zona afectada"
  - Formulario con validación:
    - Nombre del usuario (opcional)
    - Tipo de incidente (huayco, inundación, lluvia intensa, etc.)
    - Descripción detallada
    - Coordenadas GPS automáticas
  - Marcadores en el mapa con reportes ciudadanos
  - Almacenamiento local de reportes
  - Mensaje de confirmación de envío
  - Función de compartir alertas

- **💬 Chatbot Educativo con IA** (NUEVO)
  - Asistente virtual activado por botón flotante
  - Base de conocimiento con 14 categorías temáticas
  - Respuestas sobre SAR, huaycos, emergencias, mapas
  - Sistema de palabras clave inteligente
  - Interfaz tipo mensajería (WhatsApp/Messenger)
  - Indicador de escritura animado
  - Historial de conversación persistente
  - Integrado con tema claro/oscuro
  - Notificaciones de alertas vía chat

- **🎮 Minijuego "Caza Gotas"** (NUEVO)
  - Modo interactivo para educación ambiental
  - Gotas animadas en zonas de lluvia del mapa
  - Sistema de recolección por click
  - Contador de gotas en tiempo real
  - Objetivo: 5 gotas para desbloquear logro
  - Efectos visuales: ripple, bounce, confetti
  - Modal de logro con estadísticas
  - Integración con chatbot para feedback
  - Gamificación para engagement juvenil

- **Sistema de Temas**
  - Modo claro/oscuro
  - 3 esquemas de color: Azul, Verde, Morado
  - Persistencia en localStorage
  - Detección automática de preferencias del sistema

- **Diseño Responsivo y Accesible**
  - Optimizado para móviles, tablets y desktop
  - Controles adaptativos según tamaño de pantalla
  - Botones grandes para adultos mayores
  - Colores de alto contraste
  - Soporte para lectores de pantalla
  - Rendimiento optimizado para dispositivos móviles

## 📋 Requisitos

### Mínimos
- Navegador moderno con soporte para ES6+
- Conexión a internet (para cargar Leaflet.js y tiles de OpenStreetMap)

### Recomendados
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Resolución mínima: 320x568 (iPhone SE)

## 🛠️ Instalación y Uso

### Opción 1: Abrir directamente
```bash
# Clonar o descargar el repositorio
git clone <repository-url>
cd hydrosarmonitor

# Abrir index.html en un navegador
# No requiere servidor web para pruebas básicas
```

### Opción 2: Servidor local (recomendado)
```bash
# Usando Python 3
python -m http.server 8000

# Usando Node.js con npx
npx serve .

# Usando VS Code
# Instalar extensión "Live Server" y hacer clic derecho > "Open with Live Server"
```

Luego abrir en el navegador: `http://localhost:8000`

## 📁 Estructura de Archivos

```
hydrosarmonitor/
│
├── index.html              # Estructura HTML principal
├── styles.css              # Estilos globales + tema + mapa + alertas
├── script.js               # Lógica de UI (tema, formulario, notificaciones)
├── map.js                  # Lógica del mapa Leaflet y capas SAR
├── alerts.js               # Sistema de alertas y reportes ciudadanos
│
├── CLAUDE.md               # Guía para Claude Code
├── PWA_CONVERSION_GUIDE.md # Guía de conversión a PWA/APK
└── README.md               # Este archivo
```

## 🗺️ Uso del Mapa

### Búsqueda de Localidades
1. Escribir el nombre de la ciudad en el formulario superior
2. Hacer clic en "Consultar historial"
3. El mapa se centrará automáticamente en la ubicación

### Navegación Temporal
1. Usar el slider en la esquina inferior izquierda
2. Mover entre 2015 y 2025 para ver datos históricos
3. Las capas se actualizan automáticamente

### Control de Capas
1. Usar el panel en la esquina superior derecha
2. Activar/desactivar "Históricas" o "Recientes"
3. Los checkboxes permiten combinar visualizaciones

### Modo Predicción IA
1. Hacer clic en "Activar Predicción IA" (esquina superior izquierda)
2. Se mostrarán polígonos amarillos con zonas de riesgo
3. Hacer clic en las zonas para ver detalles de probabilidad
4. Desactivar para volver a la vista normal

## 🚨 Sistema de Alertas

### Zonas de Riesgo Automáticas
Al cargar la aplicación, verás automáticamente:
- **Polígonos rojos/naranjas** pulsantes en el mapa
- Zonas activas: Quebrada Huaycoloro, Ventanilla, Canto Grande
- Hacer clic o hover sobre las zonas para ver detalles
- Botón "Compartir alerta" en cada zona

### Notificaciones de Alerta
Si estás dentro de una zona de riesgo:
1. **Permiso de ubicación**: El navegador pedirá acceso a tu GPS
2. **Alerta visual**: Aparecerá una notificación flotante roja
3. **Sonido de alerta**: Beep automático (configurable)
4. **Controles disponibles**:
   - 🔇 Silenciar/Activar sonido
   - 📍 Ver en mapa (te lleva a la zona)
   - × Cerrar alerta

### Reportar Zona Afectada
1. **Botón flotante naranja** en la esquina inferior derecha
2. Click para abrir el formulario
3. **Completar datos**:
   - Nombre (opcional)
   - Tipo de incidente (obligatorio)
   - Descripción detallada (obligatorio)
   - Ubicación GPS (automática, se puede actualizar)
4. Click en "Enviar reporte"
5. **Confirmación**: Mensaje de éxito + marcador en el mapa
6. Los reportes se muestran como 📍 en el mapa

### Permisos Necesarios
- **Geolocalización**: Para detectar si estás en zona de riesgo
- **Notificaciones**: Para alertas del navegador (opcional)
- **Audio**: Para reproducir sonido de alerta

## 🎨 Personalización Visual

### Cambiar Tema
- Hacer clic en el botón sol/luna (esquina superior derecha)
- El tema se guarda automáticamente en localStorage

### Cambiar Esquema de Color
- Usar los botones circulares de colores
- Opciones: Azul (default), Verde, Morado
- Afecta todos los elementos de la interfaz

## 🔌 Integración con Datos Reales

### Datos SAR Simulados vs. Reales

Actualmente el sistema usa datos simulados para demostración. Para integrar datos reales de NASA:

#### 1. API de NASA Earthdata
```javascript
// En map.js, reemplazar SAR_DATA con:
async function fetchRealSARData(year, bounds) {
    const response = await fetch(
        `https://earthdata.nasa.gov/api/sar-data?year=${year}&bbox=${bounds}`
    );
    const data = await response.json();
    return data.features; // GeoJSON format
}
```

#### 2. Formato GeoJSON Esperado
```json
{
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[-77.05, -12.05], ...]]
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
```

#### 3. Endpoints Recomendados
- **Sentinel-1 SAR**: https://scihub.copernicus.eu/
- **NASA Alaska Satellite Facility**: https://search.asf.alaska.edu/
- **Google Earth Engine**: https://earthengine.google.com/

Ver comentarios en `map.js` (líneas 630-700) para más detalles.

## 🤖 Modelo de Predicción IA

### Integración con Backend
```javascript
// Ejemplo de endpoint de predicción
async function fetchPredictions(location) {
    const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            location: location,
            historicalData: getHistoricalData()
        })
    });
    return await response.json();
}
```

### Modelo Sugerido
- **TensorFlow.js**: Para predicciones en el navegador
- **PyTorch/Keras**: En backend con API REST
- **Input**: Series temporales de datos SAR
- **Output**: Probabilidades de riesgo por zona geográfica

## 📱 Conversión a PWA y APK

Ver archivo [PWA_CONVERSION_GUIDE.md](PWA_CONVERSION_GUIDE.md) para instrucciones completas de:
- Conversión a Progressive Web App
- Generación de APK para Android
- Despliegue en Google Play Store

## 🧪 Desarrollo

### Modificar Datos SAR Simulados
Editar el objeto `SAR_DATA` en `map.js`:

```javascript
const SAR_DATA = {
    2024: [
        {
            coords: [[-12.042, -77.044], ...],
            intensity: 0.85,  // 0.0 - 1.0
            type: 'recent'    // 'historical' o 'recent'
        }
    ]
};
```

### Cambiar Vista Inicial del Mapa
Editar `MAP_CONFIG` en `map.js`:

```javascript
const MAP_CONFIG = {
    initialView: [-12.0464, -77.0428], // [latitud, longitud]
    initialZoom: 11,                   // 6-18
    timelineStart: 2015,
    timelineEnd: 2025
};
```

### Personalizar Colores de Capas
En `createSARPolygon()` (map.js):

```javascript
const color = isHistorical ? '#808080' : '#4299e1'; // Cambiar colores
```

## 🐛 Troubleshooting

### El mapa no se carga
- Verificar consola del navegador (F12)
- Comprobar conexión a internet
- Verificar que Leaflet.js se cargó correctamente

### Las capas no se muestran
- Verificar que los checkboxes estén activados
- Comprobar que el año seleccionado tenga datos
- Revisar objeto `SAR_DATA` en map.js

### La búsqueda de ciudades no funciona
- Requiere conexión a internet (usa Nominatim de OpenStreetMap)
- Probar con nombres de ciudades conocidos
- Verificar en consola si hay errores de red

### El tema no se guarda
- Verificar que localStorage esté habilitado
- Comprobar configuración de privacidad del navegador
- Intentar en modo normal (no incógnito)

## 📄 Licencia

MIT License - Libre para uso personal y comercial

## 👥 Contribuciones

Contribuciones bienvenidas! Por favor:
1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 🙏 Agradecimientos

- **NASA** - Por datos SAR públicos
- **Leaflet.js** - Librería de mapas
- **OpenStreetMap** - Tiles y datos geográficos
- **Leaflet-Geosearch** - Plugin de búsqueda

## 📞 Contacto

Para soporte o preguntas, abrir un Issue en GitHub.

---

**Versión 2.0** - Sistema completo de visualización SAR con predicción IA
