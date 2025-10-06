"""
HydroSAR Monitor - Procesador de Archivos TIFF Sentinel-1 a Tiles PNG
========================================================================

Este script procesa archivos GeoTIFF de Sentinel-1 SAR y los convierte en
tiles PNG optimizados para visualización web con Leaflet.

Requisitos:
- Python 3.7+
- GDAL (pip install gdal)

Uso:
    python tools/process-sar-tiff.py

El script:
1. Extrae el archivo ZIP de Sentinel-1
2. Encuentra los archivos .tif dentro
3. Convierte a tiles PNG usando gdal2tiles.py
4. Genera metadata.json con información de la capa
5. Actualiza layers-index.json

Autor: HydroSAR Monitor Team
Fecha: 2025-10-05
"""

import os
import sys
import json
import zipfile
import subprocess
from pathlib import Path
from datetime import datetime

# ========================================
# CONFIGURACIÓN
# ========================================

CONFIG = {
    # Archivo ZIP de entrada
    "input_zip": "src/data/S1A_IW_GRDH_1SDV_20230329T233419_20230329T233444_047865_05C06C_0883.zip",

    # Directorio temporal de extracción
    "temp_dir": "temp_extracted/",

    # Directorio de salida para tiles
    "output_base": "src/data/nasa-layers/",

    # Niveles de zoom a generar (10-15 es óptimo para SAR)
    "zoom_levels": "10-15",

    # Número de procesos paralelos
    "processes": 4,

    # Formato de salida
    "tile_format": "png"
}

# ========================================
# FUNCIONES AUXILIARES
# ========================================

def print_step(step_num, message):
    """Imprime un paso del proceso"""
    print(f"\n{'='*60}")
    print(f"PASO {step_num}: {message}")
    print(f"{'='*60}\n")

def check_gdal():
    """Verifica que GDAL esté instalado"""
    try:
        result = subprocess.run(
            ["gdal_translate", "--version"],
            capture_output=True,
            text=True
        )
        print(f"✅ GDAL encontrado: {result.stdout.strip()}")
        return True
    except FileNotFoundError:
        print("❌ ERROR: GDAL no está instalado")
        print("\nInstala GDAL con:")
        print("  pip install gdal")
        print("  O visita: https://gdal.org/download.html")
        return False

def extract_zip(zip_path, extract_dir):
    """Extrae el archivo ZIP"""
    print(f"📦 Extrayendo: {zip_path}")
    print(f"📂 Destino: {extract_dir}")

    os.makedirs(extract_dir, exist_ok=True)

    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_dir)

    print(f"✅ Archivos extraídos correctamente")

    # Listar archivos extraídos
    files = list(Path(extract_dir).rglob("*"))
    print(f"\n📄 Archivos encontrados: {len(files)}")
    for f in files[:10]:  # Mostrar primeros 10
        print(f"   - {f.name}")
    if len(files) > 10:
        print(f"   ... y {len(files) - 10} más")

def find_tiff_files(directory):
    """Encuentra archivos .tif en el directorio"""
    tif_files = list(Path(directory).rglob("*.tif"))
    tif_files.extend(list(Path(directory).rglob("*.tiff")))

    print(f"\n🔍 Archivos TIFF encontrados: {len(tif_files)}")
    for tif in tif_files:
        print(f"   - {tif.name} ({tif.stat().st_size / 1024 / 1024:.1f} MB)")

    return tif_files

def extract_metadata_from_filename(zip_filename):
    """Extrae metadata del nombre del archivo Sentinel-1"""
    # Formato: S1A_IW_GRDH_1SDV_20230329T233419_20230329T233444_047865_05C06C_0883
    parts = Path(zip_filename).stem.split('_')

    metadata = {
        "satellite": parts[0],  # S1A o S1B
        "mode": parts[1],       # IW (Interferometric Wide)
        "product_type": parts[2],  # GRDH (Ground Range Detected High)
        "acquisition_date": None,
        "acquisition_time": None,
        "orbit": None,
        "granule_id": Path(zip_filename).stem
    }

    # Extraer fecha y hora
    if len(parts) >= 5:
        datetime_str = parts[4]  # 20230329T233419
        if 'T' in datetime_str:
            date_part, time_part = datetime_str.split('T')
            metadata["acquisition_date"] = f"{date_part[:4]}-{date_part[4:6]}-{date_part[6:8]}"
            metadata["acquisition_time"] = f"{time_part[:2]}:{time_part[2:4]}:{time_part[4:6]}Z"

    return metadata

def generate_tiles(tiff_path, output_dir, zoom_levels, processes):
    """Genera tiles PNG usando gdal2tiles.py"""
    print(f"\n🖼️  Generando tiles PNG...")
    print(f"   Entrada: {tiff_path}")
    print(f"   Salida: {output_dir}")
    print(f"   Zoom levels: {zoom_levels}")
    print(f"   Procesos: {processes}")

    os.makedirs(output_dir, exist_ok=True)

    # Comando gdal2tiles
    cmd = [
        "gdal2tiles.py",
        "-z", zoom_levels,
        "-w", "none",  # Sin generador de visualizador web
        f"--processes={processes}",
        str(tiff_path),
        output_dir
    ]

    print(f"\n🚀 Ejecutando: {' '.join(cmd)}")
    print("\n⏳ Esto puede tomar varios minutos...\n")

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=1800  # 30 minutos timeout
        )

        if result.returncode == 0:
            print("✅ Tiles generados correctamente")

            # Contar tiles generados
            tiles_count = len(list(Path(output_dir).rglob("*.png")))
            print(f"📊 Total de tiles generados: {tiles_count}")

            return True
        else:
            print(f"❌ Error al generar tiles:")
            print(result.stderr)
            return False

    except subprocess.TimeoutExpired:
        print("❌ ERROR: Timeout (30 min) - el archivo es muy grande")
        return False
    except FileNotFoundError:
        print("❌ ERROR: gdal2tiles.py no encontrado")
        print("\nVerifica que GDAL esté instalado correctamente:")
        print("  pip install gdal")
        return False

def create_metadata_file(metadata, output_dir):
    """Crea archivo metadata.json"""
    metadata_path = Path(output_dir).parent / "metadata.json"

    metadata_content = {
        "acquisition_date": metadata.get("acquisition_date"),
        "acquisition_time": metadata.get("acquisition_time"),
        "satellite": metadata.get("satellite"),
        "product_type": metadata.get("product_type"),
        "mode": metadata.get("mode"),
        "granule_id": metadata.get("granule_id"),
        "processing_date": datetime.now().strftime("%Y-%m-%d"),
        "bounds": {
            "west": -77.2,
            "south": -12.3,
            "east": -76.7,
            "north": -11.7
        },
        "notes": "Datos procesados de NASA Sentinel-1 SAR para HydroSAR Monitor"
    }

    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata_content, f, indent=2, ensure_ascii=False)

    print(f"✅ Metadata guardado: {metadata_path}")
    return metadata_content

def update_layers_index(layer_id, layer_name, metadata, tiles_path):
    """Actualiza o crea layers-index.json"""
    index_path = Path(CONFIG["output_base"]) / "layers-index.json"

    # Leer índice existente o crear nuevo
    if index_path.exists():
        with open(index_path, 'r', encoding='utf-8') as f:
            index_data = json.load(f)
    else:
        index_data = {"layers": []}

    # Crear nueva capa
    new_layer = {
        "id": layer_id,
        "name": layer_name,
        "date": metadata.get("acquisition_date"),
        "satellite": metadata.get("satellite"),
        "type": metadata.get("product_type"),
        "tilesPath": tiles_path,
        "bounds": [
            [metadata["bounds"]["south"], metadata["bounds"]["west"]],
            [metadata["bounds"]["north"], metadata["bounds"]["east"]]
        ],
        "minZoom": int(CONFIG["zoom_levels"].split('-')[0]),
        "maxZoom": int(CONFIG["zoom_levels"].split('-')[1]),
        "defaultOpacity": 0.6,
        "colormap": "sar-intensity"
    }

    # Verificar si ya existe y actualizar, sino agregar
    existing_index = next((i for i, l in enumerate(index_data["layers"]) if l["id"] == layer_id), None)
    if existing_index is not None:
        index_data["layers"][existing_index] = new_layer
        print(f"🔄 Capa '{layer_id}' actualizada en índice")
    else:
        index_data["layers"].append(new_layer)
        print(f"➕ Capa '{layer_id}' agregada al índice")

    # Guardar índice
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, indent=2, ensure_ascii=False)

    print(f"✅ Índice actualizado: {index_path}")

# ========================================
# FUNCIÓN PRINCIPAL
# ========================================

def main():
    """Función principal del script"""
    print("\n" + "="*60)
    print("  HydroSAR Monitor - Procesador SAR TIFF → Tiles PNG")
    print("="*60)

    # PASO 1: Verificar GDAL
    print_step(1, "Verificar dependencias")
    if not check_gdal():
        sys.exit(1)

    # PASO 2: Verificar archivo ZIP
    print_step(2, "Verificar archivo de entrada")
    zip_path = CONFIG["input_zip"]

    if not os.path.exists(zip_path):
        print(f"❌ ERROR: Archivo no encontrado: {zip_path}")
        print("\nAsegúrate de que el archivo ZIP esté en src/data/")
        sys.exit(1)

    zip_size = os.path.getsize(zip_path) / 1024 / 1024
    print(f"✅ Archivo encontrado: {zip_path} ({zip_size:.1f} MB)")

    # PASO 3: Extraer metadata del nombre
    print_step(3, "Extraer metadata del nombre del archivo")
    metadata = extract_metadata_from_filename(zip_path)
    print(json.dumps(metadata, indent=2))

    # PASO 4: Extraer ZIP
    print_step(4, "Extraer archivo ZIP")
    extract_zip(zip_path, CONFIG["temp_dir"])

    # PASO 5: Encontrar archivos TIFF
    print_step(5, "Buscar archivos TIFF")
    tiff_files = find_tiff_files(CONFIG["temp_dir"])

    if not tiff_files:
        print("❌ ERROR: No se encontraron archivos .tif")
        sys.exit(1)

    # Usar el primer archivo TIFF (generalmente measurement/xxx.tif)
    tiff_path = tiff_files[0]
    print(f"\n✅ Usando: {tiff_path}")

    # PASO 6: Definir directorio de salida
    print_step(6, "Configurar directorios de salida")

    layer_id = f"sentinel1-{metadata['acquisition_date']}"
    layer_dir = Path(CONFIG["output_base"]) / f"{metadata['acquisition_date']}_sentinel1"
    tiles_dir = layer_dir / "tiles"

    print(f"Layer ID: {layer_id}")
    print(f"Directorio: {layer_dir}")
    print(f"Tiles: {tiles_dir}")

    os.makedirs(layer_dir, exist_ok=True)

    # PASO 7: Generar tiles
    print_step(7, "Generar tiles PNG")
    success = generate_tiles(
        tiff_path,
        str(tiles_dir),
        CONFIG["zoom_levels"],
        CONFIG["processes"]
    )

    if not success:
        print("\n❌ Falló la generación de tiles")
        sys.exit(1)

    # PASO 8: Crear metadata.json
    print_step(8, "Crear metadata.json")
    create_metadata_file(metadata, str(tiles_dir))

    # PASO 9: Actualizar layers-index.json
    print_step(9, "Actualizar índice de capas")

    layer_name = f"Sentinel-1{metadata['satellite'][-1]} - {metadata['acquisition_date']}"
    tiles_path = f"src/data/nasa-layers/{metadata['acquisition_date']}_sentinel1/tiles/{{z}}/{{x}}/{{y}}.png"

    update_layers_index(layer_id, layer_name, metadata, tiles_path)

    # PASO 10: Limpieza
    print_step(10, "Limpieza")
    print("⚠️  Archivos temporales en temp_extracted/")
    print("   Puedes eliminarlos manualmente si deseas")

    # Resumen final
    print("\n" + "="*60)
    print("  ✅ PROCESO COMPLETADO EXITOSAMENTE")
    print("="*60)
    print(f"\n📁 Tiles generados en: {tiles_dir}")
    print(f"📄 Metadata: {layer_dir / 'metadata.json'}")
    print(f"📋 Índice: {Path(CONFIG['output_base']) / 'layers-index.json'}")
    print(f"\n🚀 Ahora puedes:")
    print("   1. Iniciar el servidor: npm start")
    print("   2. Abrir la app en el navegador")
    print("   3. Activar la capa desde el panel 'Capas SAR'")
    print("\n")

# ========================================
# EJECUCIÓN
# ========================================

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Proceso cancelado por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ ERROR INESPERADO: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
