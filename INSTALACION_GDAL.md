# 🛠️ Guía de Instalación de GDAL en Windows

**Tu configuración detectada:**
- Python: 3.12.10
- Arquitectura: 64-bit
- Sistema: Windows

## ⚡ Opción 1: Binarios Precompilados (MÁS RÁPIDO - 5 minutos)

### Paso 1: Descargar GDAL Wheel

Abre tu navegador y ve a:
**https://github.com/cgohlke/geospatial-wheels/releases**

Busca y descarga el archivo que coincida con tu versión de Python:
```
GDAL-3.9.3-cp312-cp312-win_amd64.whl
```

**Desglose del nombre:**
- `GDAL-3.9.3` - Versión de GDAL
- `cp312` - Python 3.12
- `win_amd64` - Windows 64-bit

**Link directo (puede expirar):**
https://github.com/cgohlke/geospatial-wheels/releases/download/v2025.1.14/GDAL-3.9.3-cp312-cp312-win_amd64.whl

### Paso 2: Instalar el Wheel Descargado

Abre PowerShell o Command Prompt en el directorio donde descargaste el archivo:

```powershell
# Navega a tu carpeta de Descargas (ajusta la ruta si es diferente)
cd C:\Users\Carlos\Downloads

# Instala el wheel
pip install GDAL-3.9.3-cp312-cp312-win_amd64.whl
```

### Paso 3: Verificar Instalación

```powershell
# Verificar que GDAL se importa correctamente
python -c "from osgeo import gdal; print(f'GDAL {gdal.__version__} instalado correctamente')"

# Verificar que gdal2tiles.py está disponible
python -m osgeo_utils.gdal2tiles --version
```

**Salida esperada:**
```
GDAL 3.9.3 instalado correctamente
3.9.3
```

✅ **Si ves esto, ¡GDAL está instalado!** Pasa a **Ejecutar el Script** abajo.

---

## 🔧 Opción 2: OSGeo4W (MÁS ROBUSTO - 15 minutos)

Si la Opción 1 falla, usa este método:

### Paso 1: Descargar OSGeo4W

Abre tu navegador:
**https://trac.osgeo.org/osgeo4w/**

Descarga:
- `OSGeo4W-v2-setup-x86_64.exe` (para 64-bit)

### Paso 2: Ejecutar Instalador

1. Ejecuta el instalador descargado
2. Selecciona **"Advanced Install"**
3. Next > Next... hasta llegar a "Select Packages"

### Paso 3: Seleccionar Paquetes

En la ventana de paquetes:

1. **Busca** "gdal" en el buscador
2. **Marca** estos paquetes:
   - `gdal` (en Libs)
   - `gdal-python` (en Commandline_Utilities)
   - `python3-gdal` (en Libs)

3. Click en **Next** e instala

### Paso 4: Usar OSGeo4W Shell

Después de la instalación:

1. Abre el menú Inicio
2. Busca **"OSGeo4W Shell"**
3. Click derecho → "Ejecutar como administrador"

En la shell que se abre:

```bash
# Navegar a tu proyecto
cd C:\fuentes\claude\hackaton\hydrosarmonitor

# Verificar GDAL
gdalinfo --version

# Ejecutar script
python tools/process-sar-tiff.py
```

---

## 🚀 Ejecutar el Script de Procesamiento

Una vez GDAL instalado (por Opción 1 o 2):

### Paso 1: Verificar Archivo ZIP

```powershell
# Desde la raíz del proyecto
cd C:\fuentes\claude\hackaton\hydrosarmonitor

# Verificar que el archivo existe
dir src\data\S1A_IW_GRDH*.zip
```

**Deberías ver:**
```
S1A_IW_GRDH_1SDV_20230329T233419_20230329T233444_047865_05C06C_0883.zip
```

### Paso 2: Ejecutar Script

```powershell
python tools/process-sar-tiff.py
```

### Paso 3: Esperar Procesamiento

El script tomará **10-30 minutos** dependiendo de tu CPU. Verás:

```
============================================================
  HydroSAR Monitor - Procesador SAR TIFF → Tiles PNG
============================================================

PASO 1: Verificar dependencias
============================================================

✅ GDAL encontrado: GDAL 3.9.3

PASO 2: Verificar archivo de entrada
============================================================

✅ Archivo encontrado: src/data/S1A_IW_GRDH_*.zip (1024.5 MB)

...

PASO 7: Generar tiles PNG
============================================================

🖼️  Generando tiles PNG...
   Entrada: temp_extracted\measurement\s1a-iw-grd-vv-20230329t233419-047865-05c06c-001.tif
   Salida: src\data\nasa-layers\2023-03-29_sentinel1\tiles
   Zoom levels: 10-15
   Procesos: 4

🚀 Ejecutando: gdal2tiles.py -z 10-15 --processes=4 ...

⏳ Esto puede tomar varios minutos...

[Aquí verás el progreso de GDAL procesando cada zoom level]

✅ Tiles generados correctamente
📊 Total de tiles generados: 18,432

...

============================================================
  ✅ PROCESO COMPLETADO EXITOSAMENTE
============================================================

📁 Tiles generados en: src\data\nasa-layers\2023-03-29_sentinel1\tiles
📄 Metadata: src\data\nasa-layers\2023-03-29_sentinel1\metadata.json
📋 Índice: src\data\nasa-layers\layers-index.json

🚀 Ahora puedes:
   1. Iniciar el servidor: npm start
   2. Abrir la app en el navegador
   3. Activar la capa desde el panel 'Capas SAR'
```

### Paso 4: Verificar Tiles Generados

```powershell
# Verificar que se crearon los tiles
dir src\data\nasa-layers\2023-03-29_sentinel1\tiles

# Deberías ver carpetas:
# 10, 11, 12, 13, 14, 15

# Ver cuántos tiles se generaron
dir /s src\data\nasa-layers\2023-03-29_sentinel1\tiles\*.png | find /c ".png"
```

---

## ⚠️ Troubleshooting

### Error: "GDAL no está instalado"

```powershell
# Verificar que Python puede importar GDAL
python -c "from osgeo import gdal; print(gdal.__version__)"
```

Si falla:
1. Reinstala con Opción 2 (OSGeo4W)
2. Asegúrate de usar OSGeo4W Shell (no CMD normal)

### Error: "No se encontraron archivos .tif"

El ZIP tiene una estructura diferente. Extrae manualmente:

```powershell
cd src\data
tar -xf S1A_IW_GRDH_1SDV_20230329T233419_20230329T233444_047865_05C06C_0883.zip

# Buscar archivos .tif
dir /s *.tif
```

Luego edita `tools/process-sar-tiff.py` línea 84 para ajustar la búsqueda.

### Error: "Memory Error" o "Killed"

Tu PC no tiene suficiente RAM. Reduce zoom levels:

Edita `tools/process-sar-tiff.py` línea 13:

```python
"zoom_levels": "10-12",  # En lugar de "10-15"
```

Esto generará menos tiles pero consumirá menos memoria.

### Error: "Timeout 30 min excedido"

Aumenta el timeout en línea 211:

```python
timeout=3600  # 1 hora
```

---

## ✅ Próximos Pasos

Una vez procesado:

1. **Iniciar servidor:**
   ```powershell
   npm start
   ```

2. **Abrir navegador:**
   ```
   http://localhost:8000
   ```

3. **Activar capa SAR:**
   - Click en botón **"🛰️ Capas SAR"** (esquina derecha)
   - Marcar checkbox **"Sentinel-1A - 29 Marzo 2023"**
   - Ajustar opacidad con slider (60% recomendado)

4. **Verificar visualización:**
   - Deberías ver overlay transparente sobre Lima
   - Zonas claras = alta reflectividad (posible agua)
   - Zonas oscuras = baja reflectividad (terreno seco)

---

## 📚 Documentación Adicional

- [docs/SAR_PROCESSING_GUIDE.md](docs/SAR_PROCESSING_GUIDE.md) - Guía completa
- [tools/README.md](tools/README.md) - Información sobre herramientas
- [CLAUDE.md](CLAUDE.md) - Arquitectura del proyecto

---

**¿Problemas?** Abre un issue en GitHub o revisa los logs del script.

**NASA Space Apps Challenge 2024** 🚀
