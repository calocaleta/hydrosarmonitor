# 🛰️ Guía de Procesamiento SAR - Sentinel-1 a Tiles PNG

Guía completa para procesar archivos GeoTIFF de Sentinel-1 SAR y convertirlos en tiles PNG optimizados para visualización web en HydroSAR Monitor.

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Requisitos Previos](#requisitos-previos)
- [Instalación de GDAL](#instalación-de-gdal)
- [Procesamiento Paso a Paso](#procesamiento-paso-a-paso)
- [Uso del Script Automatizado](#uso-del-script-automatizado)
- [Estructura de Archivos Generados](#estructura-de-archivos-generados)
- [Integración con la Aplicación](#integración-con-la-aplicación)
- [Troubleshooting](#troubleshooting)

## 📖 Descripción General

### ¿Qué son los Tiles PNG?

Los tiles PNG son pequeñas imágenes (256x256 píxeles típicamente) que dividen un mapa grande en cuadrados pequeños organizados por niveles de zoom. Esto permite:

- ✅ Carga progresiva (solo tiles visibles)
- ✅ Archivos pequeños (10-50KB cada uno)
- ✅ Compatible con navegadores web
- ✅ Rendimiento excelente en móviles
- ✅ Soporte nativo en Leaflet.js

### Productos Sentinel-1 Soportados

- **GRD (Ground Range Detected)**: Producto calibrado, multi-looked (recomendado)
- **SLC (Single Look Complex)**: Producto sin procesar (requiere procesamiento adicional)

Formatos soportados:
- `.tif` / `.tiff` (GeoTIFF)
- `.zip` (archivo comprimido con GeoTIFF dentro)

## 🔧 Requisitos Previos

### Software Necesario

1. **Python 3.7+**
   ```bash
   python --version
   # Python 3.10.0 o superior
   ```

2. **GDAL** (Geospatial Data Abstraction Library)
   - Incluye `gdal2tiles.py` para generar tiles
   - Ver sección de instalación abajo

3. **Espacio en Disco**
   - Archivo TIFF: ~1GB
   - Tiles generados: ~100-500MB (depende de zoom levels)
   - Temporal: ~2GB disponibles

## 📦 Instalación de GDAL

### Opción 1: Windows (Recomendada)

**Instalar con OSGeo4W:**

1. Descargar OSGeo4W: https://trac.osgeo.org/osgeo4w/
2. Ejecutar el instalador
3. Seleccionar "Advanced Install"
4. Buscar y seleccionar: `gdal`, `python3-gdal`
5. Completar instalación

**Verificar instalación:**
```bash
# Abrir OSGeo4W Shell
gdal_translate --version
# GDAL 3.7.0, released 2023/04/30

gdal2tiles.py --version
# GDAL 3.7.0
```

### Opción 2: Windows con pip

```bash
pip install gdal
# O con versión específica:
pip install gdal==3.7.0
```

⚠️ **Nota:** La instalación con pip puede fallar en Windows. Se recomienda OSGeo4W.

### Opción 3: macOS

```bash
# Con Homebrew
brew install gdal

# Verificar
gdal_translate --version
```

### Opción 4: Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install gdal-bin python3-gdal

# Verificar
gdal_translate --version
```

## 🚀 Procesamiento Paso a Paso

### Paso 1: Obtener Datos Sentinel-1

**Fuentes oficiales:**

1. **Alaska Satellite Facility (ASF)** (Recomendado)
   - URL: https://search.asf.alaska.edu/
   - Productos: Sentinel-1 GRD/SLC
   - Registro gratuito con NASA Earthdata
   - Descarga directa en navegador

2. **Copernicus Open Access Hub**
   - URL: https://scihub.copernicus.eu/
   - Requiere cuenta ESA
   - API disponible

**Filtros recomendados:**
- Producto: GRD
- Modo: IW (Interferometric Wide)
- Polarización: VV+VH
- Área: Lima, Perú (o tu región de interés)
- Fecha: Coincidiendo con eventos de inundación

### Paso 2: Preparar Archivo

1. **Colocar el archivo ZIP en el directorio correcto:**

```bash
# Estructura inicial
hydrosarmonitor/
└── src/
    └── data/
        └── S1A_IW_GRDH_1SDV_20230329T233419_20230329T233444_047865_05C06C_0883.zip
```

2. **Extraer manualmente (opcional):**

Si prefieres verificar el contenido antes:

```bash
cd src/data
unzip S1A_IW_GRDH*.zip
# Buscar archivos .tif en subdirectorios (usualmente en measurement/)
```

### Paso 3: Ejecutar Script Automatizado

El script `process-sar-tiff.py` automatiza todo el proceso:

```bash
# Desde la raíz del proyecto
python tools/process-sar-tiff.py
```

**El script realizará:**

1. ✅ Extraer archivo ZIP
2. ✅ Encontrar archivos .tif
3. ✅ Generar tiles PNG (zoom 10-15)
4. ✅ Crear metadata.json
5. ✅ Actualizar layers-index.json

**Salida esperada:**

```
============================================================
  HydroSAR Monitor - Procesador SAR TIFF → Tiles PNG
============================================================

============================================================
PASO 1: Verificar dependencias
============================================================

✅ GDAL encontrado: GDAL 3.7.0

============================================================
PASO 2: Verificar archivo de entrada
============================================================

✅ Archivo encontrado: src/data/S1A_IW_GRDH_*.zip (1024.5 MB)

...

============================================================
  ✅ PROCESO COMPLETADO EXITOSAMENTE
============================================================

📁 Tiles generados en: src/data/nasa-layers/2023-03-29_sentinel1/tiles
📄 Metadata: src/data/nasa-layers/2023-03-29_sentinel1/metadata.json
📋 Índice: src/data/nasa-layers/layers-index.json

🚀 Ahora puedes:
   1. Iniciar el servidor: npm start
   2. Abrir la app en el navegador
   3. Activar la capa desde el panel 'Capas SAR'
```

### Paso 4: Procesamiento Manual (Alternativa)

Si prefieres ejecutar comandos manualmente:

```bash
# 1. Extraer ZIP
cd src/data
unzip S1A_IW_GRDH_*.zip

# 2. Encontrar archivo TIFF
find . -name "*.tif"
# Ejemplo: ./measurement/s1a-iw-grd-vv-20230329t233419-047865-05c06c-001.tif

# 3. Generar tiles
gdal2tiles.py \
  -z 10-15 \
  --processes=4 \
  measurement/s1a-iw-grd-vv-*.tif \
  nasa-layers/2023-03-29_sentinel1/tiles/

# 4. Verificar tiles generados
ls nasa-layers/2023-03-29_sentinel1/tiles/
# Deberías ver directorios: 10/ 11/ 12/ 13/ 14/ 15/
```

## 📂 Estructura de Archivos Generados

```
src/data/nasa-layers/
├── layers-index.json                 # Registro de todas las capas
├── 2023-03-29_sentinel1/            # Una carpeta por fecha
│   ├── metadata.json                # Info de la capa
│   └── tiles/                       # Tiles PNG
│       ├── 10/                      # Zoom level 10
│       │   ├── 512/
│       │   │   ├── 1024.png
│       │   │   ├── 1025.png
│       │   │   └── ...
│       │   └── 513/
│       ├── 11/                      # Zoom level 11
│       │   └── ...
│       ├── 12/
│       ├── 13/
│       ├── 14/
│       └── 15/
└── 2024-XX-XX_sentinel1/            # Futuras capas
    └── ...
```

### Tamaños Típicos

| Zoom Level | Tiles Generados | Tamaño Aprox. |
|------------|-----------------|---------------|
| 10         | ~50             | 2 MB          |
| 11         | ~150            | 8 MB          |
| 12         | ~400            | 20 MB         |
| 13         | ~1,200          | 60 MB         |
| 14         | ~4,000          | 180 MB        |
| 15         | ~15,000         | 600 MB        |
| **Total**  | **~20,000**     | **~870 MB**   |

⚠️ **Advertencia GitHub:** GitHub tiene límite de 100MB por archivo. Considera:
- Usar Git LFS para tiles
- Hospedar tiles en CDN externo (Cloudflare R2, AWS S3)
- Limitar zoom levels a 10-13 para reducir tamaño

## 🔗 Integración con la Aplicación

### 1. Verificar layers-index.json

El script actualiza automáticamente este archivo:

```json
{
  "layers": [
    {
      "id": "sentinel1-2023-03-29",
      "name": "Sentinel-1A - 29 Marzo 2023",
      "date": "2023-03-29",
      "satellite": "S1A",
      "type": "GRDH",
      "tilesPath": "src/data/nasa-layers/2023-03-29_sentinel1/tiles/{z}/{x}/{y}.png",
      "bounds": [[-12.3, -77.2], [-11.7, -76.7]],
      "minZoom": 10,
      "maxZoom": 15,
      "defaultOpacity": 0.6,
      "colormap": "sar-intensity"
    }
  ]
}
```

### 2. Iniciar Servidor

```bash
npm start
# O
npx serve . -l 8000
```

### 3. Abrir Navegador

```
http://localhost:8000
```

### 4. Activar Capa

1. Buscar botón **"🛰️ Capas SAR"** en la esquina derecha del mapa
2. Click para abrir panel
3. Marcar checkbox de la capa "Sentinel-1A - 29 Marzo 2023"
4. Ajustar opacidad con slider (60% por defecto)
5. Ver overlay transparente en el mapa

## 🐛 Troubleshooting

### Error: "GDAL no está instalado"

```bash
# Verificar instalación
gdal_translate --version

# Si falla, reinstalar con OSGeo4W (Windows)
# O con brew/apt según tu sistema operativo
```

### Error: "No se encontraron archivos .tif"

El ZIP puede tener estructura diferente. Verificar manualmente:

```bash
unzip -l S1A_IW_GRDH_*.zip | grep .tif
# Buscar rutas de archivos TIFF
```

Modificar script en línea 84-85 para ajustar búsqueda.

### Error: "Memory Error" o "Timeout"

Archivo TIFF muy grande. Reducir zoom levels:

```python
# En process-sar-tiff.py, línea 13:
"zoom_levels": "10-13",  # En lugar de "10-15"
```

O procesar en partes:

```bash
# Primero zooms bajos
gdal2tiles.py -z 10-12 input.tif output/

# Luego zooms altos
gdal2tiles.py -z 13-15 input.tif output/
```

### Tiles no se ven en el mapa

1. **Verificar rutas:**
   ```javascript
   // En consola del navegador
   console.log(window.NASA_LAYERS_MANAGER?.getLayerInfo('sentinel1-2023-03-29'))
   ```

2. **Verificar errores de carga:**
   ```javascript
   // Abrir DevTools > Network
   // Filtrar por ".png"
   // Verificar que tiles se cargan sin error 404
   ```

3. **Verificar bounds:**
   - Asegurarse que el mapa esté centrado en Lima, Perú
   - Zoom entre 10-15
   - Bounds en `layers-index.json` deben cubrir Lima

### Opacidad no funciona

Verificar que `opacity-slider` tenga event listener:

```javascript
// En consola
document.querySelectorAll('.opacity-slider').length
// Debe ser > 0
```

## 📚 Recursos Adicionales

### Documentación GDAL

- **gdal2tiles:** https://gdal.org/programs/gdal2tiles.html
- **GeoTIFF:** https://gdal.org/drivers/raster/gtiff.html

### Sentinel-1 SAR

- **Guía de productos:** https://sentinels.copernicus.eu/web/sentinel/user-guides/sentinel-1-sar
- **ASF Data Search:** https://search.asf.alaska.edu/
- **Toolbox SNAP:** https://step.esa.int/main/toolboxes/snap/

### Leaflet TileLayers

- **Documentación:** https://leafletjs.com/reference.html#tilelayer
- **Tiles XYZ:** https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames

## 🔄 Agregar Nuevas Capas

Para procesar archivos adicionales de diferentes fechas:

1. **Descargar nuevo archivo Sentinel-1** (diferente fecha)

2. **Actualizar ruta en `process-sar-tiff.py`:**

```python
# Línea 11
"input_zip": "src/data/S1A_IW_GRDH_1SDV_20240315T233419_*.zip",
```

3. **Ejecutar script:**

```bash
python tools/process-sar-tiff.py
```

4. **El script automáticamente:**
   - Crea carpeta `2024-03-15_sentinel1/`
   - Genera tiles
   - Agrega entrada a `layers-index.json`

5. **Refrescar app:**
   - En el panel "Capas SAR", click "🔄 Actualizar lista"
   - Nueva capa aparecerá disponible

## ⚙️ Configuración Avanzada

### Cambiar Niveles de Zoom

Editar `process-sar-tiff.py` línea 13:

```python
"zoom_levels": "8-12",  # Menos tiles, archivos más ligeros
```

### Cambiar Número de Procesos

Línea 16:

```python
"processes": 8,  # Más procesos = más rápido (requiere más RAM)
```

### Cambiar Bounds por Defecto

Línea 286 en `process-sar-tiff.py`:

```python
"bounds": {
    "west": -77.5,   # Ajustar según tu región
    "south": -12.5,
    "east": -76.5,
    "north": -11.5
}
```

---

## 🎉 ¡Listo!

Con esta guía deberías poder procesar cualquier archivo Sentinel-1 GRD y visualizarlo como capa overlay transparente en HydroSAR Monitor.

Si encuentras problemas, revisa la sección de [Troubleshooting](#troubleshooting) o abre un issue en el repositorio.

**Desarrollado para NASA Space Apps Challenge 2024** 🚀
