# 🛠️ Tools - HydroSAR Monitor

Herramientas de procesamiento para HydroSAR Monitor.

## 📁 Contenido

### `process-sar-tiff.py`

Script automatizado para convertir archivos GeoTIFF de Sentinel-1 SAR en tiles PNG para visualización web.

**Uso:**

```bash
python tools/process-sar-tiff.py
```

**Requisitos:**
- Python 3.7+
- GDAL (con gdal2tiles.py)

**Instalación GDAL:**

Windows (recomendado):
```bash
# Descargar OSGeo4W: https://trac.osgeo.org/osgeo4w/
# Ejecutar instalador y seleccionar "gdal" y "python3-gdal"
```

Linux/Mac:
```bash
# Ubuntu/Debian
sudo apt-get install gdal-bin python3-gdal

# macOS
brew install gdal
```

**Lo que hace el script:**

1. ✅ Extrae archivo ZIP de Sentinel-1
2. ✅ Encuentra archivos GeoTIFF (.tif)
3. ✅ Genera tiles PNG (zoom 10-15)
4. ✅ Crea metadata.json
5. ✅ Actualiza layers-index.json

**Configuración:**

Editar líneas 11-22 en `process-sar-tiff.py`:

```python
CONFIG = {
    "input_zip": "src/data/S1A_IW_GRDH_*.zip",  # Tu archivo
    "zoom_levels": "10-15",                      # Niveles de zoom
    "processes": 4                               # Procesos paralelos
}
```

**Documentación completa:**

Ver [docs/SAR_PROCESSING_GUIDE.md](../docs/SAR_PROCESSING_GUIDE.md) para guía detallada.

---

## 🚀 Inicio Rápido

### Paso 1: Obtener Datos Sentinel-1

Descargar producto GRD de:
- https://search.asf.alaska.edu/

### Paso 2: Colocar en src/data/

```bash
hydrosarmonitor/
└── src/
    └── data/
        └── S1A_IW_GRDH_*.zip  # Tu archivo aquí
```

### Paso 3: Ejecutar Script

```bash
python tools/process-sar-tiff.py
```

### Paso 4: Iniciar App

```bash
npm start
```

### Paso 5: Activar Capa

1. Abrir http://localhost:8000
2. Click en "🛰️ Capas SAR"
3. Marcar checkbox de tu capa
4. Ajustar opacidad

---

## ⚠️ Troubleshooting

**"GDAL no está instalado"**
```bash
# Verificar instalación
gdal_translate --version

# Reinstalar si es necesario
```

**"No se encontraron archivos .tif"**
```bash
# Verificar contenido del ZIP
unzip -l src/data/S1A_IW_GRDH_*.zip | grep .tif
```

**"Memory Error"**
```python
# Reducir zoom levels en CONFIG (línea 13):
"zoom_levels": "10-12"  # En lugar de "10-15"
```

---

## 📚 Más Información

- [SAR Processing Guide](../docs/SAR_PROCESSING_GUIDE.md)
- [CLAUDE.md](../CLAUDE.md)
- [NASA Earthdata Integration](../docs/NASA_EARTHDATA_INTEGRATION.md)

**NASA Space Apps Challenge 2024** 🚀
