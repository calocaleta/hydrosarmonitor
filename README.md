# 🌊 HydroSAR Monitor

Aplicación web progresiva (PWA) para monitoreo de lluvias e inundaciones urbanas usando datos SAR de NASA.

## 📁 Estructura del Proyecto

```
hydrosarmonitor/
├── 📄 index.html              # Archivo HTML principal
├── 📄 manifest.json           # Manifiesto PWA
├── 📄 sw.js                   # Service Worker (debe estar en raíz)
├── 📄 .gitignore             # Archivos ignorados por Git
│
├── 📁 src/                    # Código fuente
│   ├── 📁 js/                # JavaScript modules
│   │   ├── script.js         # Sistema de temas y notificaciones
│   │   ├── map.js            # Mapa Leaflet y visualización SAR
│   │   ├── alerts.js         # Sistema de alertas y zonas de riesgo
│   │   ├── chatbot.js        # Chatbot educativo
│   │   ├── game.js           # Sistema de gamificación
│   │   └── nasa-earthdata-api.js  # Integración NASA Earthdata
│   │
│   ├── 📁 css/               # Estilos
│   │   └── styles.css        # Estilos globales y temas
│   │
│   └── 📁 data/              # Datos históricos
│       └── real-flood-data.js # Eventos de inundación verificados (60+ eventos)
│
├── 📁 assets/                 # Recursos estáticos
│   ├── 📁 icons/             # Iconos PWA (72x72 a 512x512)
│   └── 📁 screenshots/       # Screenshots para PWA
│
├── 📁 docs/                   # Documentación
│   ├── README.md             # Documentación técnica completa
│   ├── CLAUDE.md             # Guía para Claude Code
│   ├── DATOS_REALES.md       # Información sobre datos históricos
│   ├── NASA_EARTHDATA_INTEGRATION.md  # Guía de integración NASA
│   └── PWA_CONVERSION_GUIDE.md        # Guía de conversión a APK
│
└── 📁 tests/                  # Tests y herramientas de desarrollo
    └── test-sar-connection.html  # Test de conexión NASA API

```

## 🚀 Inicio Rápido

### Opción 1: Servidor Local (Recomendado)

```bash
# Usando npx serve
npx serve . -l 8000

# O usando Python
python -m http.server 8000

# O usando VS Code Live Server
# Click derecho en index.html > "Open with Live Server"
```

Luego abre [http://localhost:8000](http://localhost:8000)

### Opción 2: Abrir Directamente

Abre `index.html` directamente en tu navegador (algunas funciones PWA no estarán disponibles).

## 📦 Dependencias

**Todas las dependencias se cargan desde CDN:**
- Leaflet.js 1.9.4 (mapas interactivos)
- Leaflet-Geosearch 3.11.0 (búsqueda geográfica)
- Google Fonts - Poppins

**No requiere:**
- Node.js
- npm install
- Build process
- Bundlers

## 🗺️ Datos Históricos

El proyecto incluye **más de 60 eventos históricos verificados** de inundaciones en Perú (2015-2025):

### Regiones Cubiertas:
- **Amazonas/Bagua**: 21 eventos (Ríos Marañón, Utcubamba, Chiriaco)
- **Lima**: 8 eventos (Río Rímac, Chosica, Ate)
- **Piura**: 4 eventos (El Niño Costero 2017, Ciclón Yaku 2023)
- **Cusco**: 3 eventos (Valle Sagrado, Machu Picchu)
- **Costa, Sierra y Selva**: 30+ eventos adicionales

### Eventos Críticos:
- 🔴 **2017**: El Niño Costero (11 eventos, intensidad hasta 98%)
- 🔴 **2023**: Ciclón Yaku (4 eventos)
- 🟡 **2024**: Crecida histórica Río Amazonas (93%)

Ver [`src/data/real-flood-data.js`](src/data/real-flood-data.js) para detalles completos.

## 🛠️ Tecnologías

- **Frontend**: Vanilla HTML/CSS/JavaScript (ES6+)
- **Mapas**: Leaflet.js
- **PWA**: Service Workers, Web App Manifest
- **APIs**: NASA Earthdata (Sentinel-1 SAR)
- **Estilo**: CSS Variables, CSS Grid, Flexbox
- **Responsive**: Mobile-first design

## 📖 Documentación

- **[docs/README.md](docs/README.md)** - Documentación técnica completa
- **[docs/CLAUDE.md](docs/CLAUDE.md)** - Guía de contexto para Claude Code
- **[docs/DATOS_REALES.md](docs/DATOS_REALES.md)** - Información sobre datos históricos
- **[docs/NASA_EARTHDATA_INTEGRATION.md](docs/NASA_EARTHDATA_INTEGRATION.md)** - Guía integración NASA API
- **[docs/PWA_CONVERSION_GUIDE.md](docs/PWA_CONVERSION_GUIDE.md)** - Conversión a APK Android

## 🎯 Características

### ✅ Implementadas
- 🗺️ Mapa interactivo con visualización SAR
- 📊 60+ eventos históricos verificados (Perú 2015-2025)
- ⚠️ Sistema de alertas geográficas
- 🤖 Chatbot educativo sobre huaycos e inundaciones
- 🎮 Sistema de gamificación (recolección de gotas)
- 📱 PWA instalable (offline-first)
- 🌓 Tema claro/oscuro
- 🔍 Búsqueda geográfica
- 📍 Geolocalización
- 🎨 3 esquemas de color (azul, verde, morado)

### 🔄 Funciones Dinámicas
- **Timeline**: Navegación temporal 2015-2025
- **Filtrado geográfico**: Eventos cercanos (50km radio)
- **LOD (Level of Detail)**: Carga optimizada por zoom
- **Modo predictivo**: Zonas de riesgo futuras (IA)

## 🧪 Testing

```bash
# Abrir test de conexión NASA API
open tests/test-sar-connection.html
```

## 📱 PWA & Instalación

La aplicación es completamente funcional como PWA:

1. **Desktop**: Chrome/Edge mostrarán icono de instalación en barra de direcciones
2. **Android**: "Agregar a pantalla de inicio"
3. **iOS**: Safari > Compartir > "Agregar a pantalla de inicio"

Ver [`docs/PWA_CONVERSION_GUIDE.md`](docs/PWA_CONVERSION_GUIDE.md) para convertir a APK.

## 🌐 Integración NASA API

Para conectar con datos reales de Sentinel-1 SAR:

1. Registrarse en [NASA Earthdata](https://urs.earthdata.nasa.gov/)
2. Obtener credenciales API
3. Ver [`docs/NASA_EARTHDATA_INTEGRATION.md`](docs/NASA_EARTHDATA_INTEGRATION.md)

Actualmente usa datos simulados + históricos verificados.

## 🤝 Contribuir

Este es un proyecto de hackathon. Para contribuir:

1. Fork el repositorio
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add: nueva característica'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Convenciones de Código

- **JavaScript**: Vanilla ES6+, sin frameworks
- **CSS**: Variables CSS, BEM-like naming
- **Comentarios**: JSDoc para funciones importantes
- **Estructura**: Modular, un archivo por feature domain
- **Idioma**: Código en inglés, UI en español

## 🏗️ Arquitectura

### Módulos JavaScript:

1. **[script.js](src/js/script.js)** - Sistema de temas, notificaciones
2. **[map.js](src/js/map.js)** - Leaflet, SAR visualization, timeline
3. **[alerts.js](src/js/alerts.js)** - Alertas, geolocalización, reportes
4. **[chatbot.js](src/js/chatbot.js)** - Chatbot educativo
5. **[game.js](src/js/game.js)** - Gamificación
6. **[nasa-earthdata-api.js](src/js/nasa-earthdata-api.js)** - API NASA

### Inicialización:
Todos los módulos se cargan via `<script>` tags y se inicializan automáticamente con `DOMContentLoaded`.

## 📊 Datos

### Fuentes:
- **INGEMMET** - Instituto Geológico, Minero y Metalúrgico del Perú
- **INDECI** - Instituto Nacional de Defensa Civil
- **SENAMHI** - Servicio Nacional de Meteorología e Hidrología
- **NASA Earthdata** - Sentinel-1 SAR (integración futura)

### Formato:
```javascript
{
  name: 'Desborde Río Rímac - Huachipa',
  coords: [[-11.9450, -76.9350], ...],
  intensity: 0.95,
  type: 'flood',
  source: 'Río Rímac',
  verified: true
}
```

## 🐛 Troubleshooting

**PWA no instala:**
- Verifica que estés usando HTTPS o localhost
- Limpia cache del service worker
- Revisa consola para errores

**Mapa no carga:**
- Verifica conexión a internet (necesita CDN)
- Revisa consola de errores
- Verifica rutas de archivos

**Datos no aparecen:**
- Abre consola y busca errores de carga
- Verifica que `real-flood-data.js` esté cargado
- Revisa filtro de humedad (slider)

## 📄 Licencia

Este proyecto fue desarrollado para el NASA Space Apps Challenge 2024.

## 👥 Equipo

Desarrollado durante el hackathon NASA Space Apps Challenge - Lima, Perú

---

**🌊 HydroSAR Monitor** - Monitoreando el agua desde el espacio
