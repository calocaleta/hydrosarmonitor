# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HydroSAR Monitor** is a Progressive Web App (PWA) for monitoring rainfall and urban floods using NASA SAR (Synthetic Aperture Radar) data from Sentinel-1. Built for the NASA Space Apps Challenge 2024, it features real-time alerts, historical verified flood data (60+ events in Peru 2015-2025), educational chatbot, gamification, and citizen reporting.

**Tech Stack:** Vanilla HTML/CSS/JavaScript (ES6+) with Leaflet.js - no build system or frameworks required.

## Development Commands

```bash
# Start local development server
npm start
# or
npm run dev
# or
npx serve . -l 8000
# or
python -m http.server 8000

# No build, test, or lint commands - project uses vanilla JS
```

Open http://localhost:8000 after starting the server.

## Architecture Overview

### Modular Vanilla JavaScript Design

The app uses a **module-based architecture** where each JavaScript file handles a specific feature domain. All modules load via `<script>` tags in [index.html](index.html) and initialize automatically on `DOMContentLoaded`.

**Initialization Sequence:**
1. **[src/data/real-flood-data.js](src/data/real-flood-data.js)** - Loads 60+ verified historical flood events
2. **[src/js/nasa-earthdata-api.js](src/js/nasa-earthdata-api.js)** - NASA Earthdata API integration (loads asynchronously)
3. **[src/js/script.js](src/js/script.js)** - Theme system, color schemes, notifications (immediate)
4. **[src/js/map.js](src/js/map.js)** - Leaflet map, SAR visualization, timeline controls (on DOM ready)
5. **[src/js/alerts.js](src/js/alerts.js)** - Alert system, geolocation, citizen reports (2s delay)
6. **[src/js/chatbot.js](src/js/chatbot.js)** - Educational chatbot with knowledge base (2.5s delay)
7. **[src/js/game.js](src/js/game.js)** - Gamification drop collection system (3s delay)

### Data Flow Architecture

**Primary Data Sources:**
```
1. Real Historical Data (60+ verified events)
   └── src/data/real-flood-data.js
   └── Sources: INGEMMET, INDECI, SENAMHI (Peru)

2. NASA Earthdata API (Sentinel-1 SAR)
   └── src/js/nasa-earthdata-api.js
   └── Fetches Sentinel-1 granules from CMR API
   └── Fallback to historical data if API fails

3. User-Generated Data
   └── Citizen reports (stored in window.citizenReports)
   └── Game achievements (localStorage)
```

**Data Processing Flow:**
```
App Load
  ├→ Load historical data immediately (REAL_FLOOD_DATA)
  ├→ Fetch NASA data asynchronously
  │   ├→ Success: Merge with historical data
  │   └→ Failure: Use only historical data
  └→ Render on map based on:
      ├→ Current zoom level (LOD system)
      ├→ Selected year (timeline slider)
      ├→ Viewport bounds (dynamic loading)
      └→ Data type filters (flood/moisture)
```

### Core Module Responsibilities

**1. Map Module ([src/js/map.js](src/js/map.js:1))**

Primary visualization engine with Level of Detail (LOD) system:

- **LOD Configuration:**
  - Regional (zoom 6-10): Large areas ~1.5km
  - District (zoom 11-13): Medium areas ~150m
  - Microzone (zoom 14+): Small areas ~8m

- **Key Functions:**
  - `initializeSARData()` (line 55) - Loads NASA + historical data
  - `loadDataForCurrentZoom()` (line 337+) - Dynamic LOD-based rendering
  - `createSARPolygon()` (line 658+) - Styled polygon creation
  - `centerMapOnCity()` (line 1223+) - Geocoding search integration

- **Timeline System:**
  - Cumulative mode (default): Shows all data from 2015 to selected year
  - Year-specific mode: Shows only selected year's data
  - Opacity decreases for older data (temporal visualization)

**2. Alert System ([src/js/alerts.js](src/js/alerts.js:1))**

Real-time risk monitoring and citizen reporting:

- **Risk Zones:** Defined in `RISK_ZONES` array (line 23-57)
- **Geolocation:** `getUserLocation()` checks GPS, falls back to Lima
- **Alert Check:** `checkUserInRiskZone()` runs every 30 seconds (1000m radius)
- **Notifications:** Visual overlay + browser notification + audio alert
- **Citizen Reports:**
  - Form validation with GPS coordinates
  - Stored in `window.citizenReports` array
  - Map markers via `addReportMarker()` (line 694+)

**3. Chatbot Module ([src/js/chatbot.js](src/js/chatbot.js:1))**

Educational AI assistant with 14 topic categories:

- **Knowledge Base:** `CHATBOT_KNOWLEDGE` (line 6-107)
  - Topics: SAR tech, huaycos, emergencies, flood zones, etc.
  - Keyword matching with accent normalization
- **Integration Points:**
  - `addBotMessage(message)` - External message injection
  - `notifyNewAlert(zoneName)` - Alert system integration
  - Called from game.js on achievement unlock

**4. Game Module ([src/js/game.js](src/js/game.js:1))**

Gamification for user engagement:

- **Drop Collection:** 8 predefined Lima zones in `DROP_LOCATIONS`
- **Mechanics:** 5-second spawn rate, 15-second drop lifetime
- **Goal:** Collect 5 drops to unlock achievement
- **Rewards:** Confetti animation + chatbot notification + "unlock historical data" narrative

**5. NASA Integration ([src/js/nasa-earthdata-api.js](src/js/nasa-earthdata-api.js:1))**

⚠️ **Important Limitations:**
- Currently fetches Sentinel-1 granule metadata only
- Does NOT download/process actual SAR images
- Intensity values are estimated (default 0.5)
- For real flood detection, needs Google Earth Engine or local processing

**Current Implementation:**
- Searches CMR API for Sentinel-1 granules over Peru
- Converts granules to event polygons
- Token hardcoded (⚠️ security issue - needs backend in production)

**6. NASA Layers Manager ([src/js/nasa-layers-manager.js](src/js/nasa-layers-manager.js:1))**

System for managing SAR tile overlays from processed Sentinel-1 GeoTIFF files:

- **Tile Loading:** L.TileLayer integration with Leaflet for PNG tiles
- **Layer Index:** `layers-index.json` registry of available layers
- **UI Panel:** Collapsible sidebar with layer checkboxes and opacity sliders
- **Cache Strategy:** localStorage cache (24h validity) + Service Worker
- **Key Functions:**
  - `loadLayer(layerId)` - Adds tile overlay to map
  - `unloadLayer(layerId)` - Removes tile overlay
  - `setLayerOpacity(layerId, opacity)` - Adjusts transparency
  - `refreshIndex()` - Reloads layers registry

**Tile Structure:**
```
nasa-layers/
├── layers-index.json
└── YYYY-MM-DD_sentinel1/
    ├── metadata.json
    └── tiles/{z}/{x}/{y}.png
```

### Inter-Module Communication

Modules communicate via `window` object global functions:

```javascript
// Map module exposes
window.centerMapOnCity(cityName)
window.loadSARDataForLocation(lat, lon)

// Alert module exposes
window.checkUserInRiskZone()
window.showRiskAlert(zone)

// Chatbot module exposes
window.addBotMessage(message)
window.notifyNewAlert(zoneName)

// Game module exposes
window.toggleGame()
window.collectDrop(dropId)
```

## Critical Implementation Details

### 1. Service Worker & PWA

- **Service Worker Location:** MUST be in root ([sw.js](sw.js:1)), NOT in src/
- **Cache Strategy:** Cache-first for static assets, network-first for data
- **Offline Support:** Caches app shell (HTML/CSS/JS/CDN libs)
- **Installation:** Shows install prompt on desktop/mobile browsers
- **APK Conversion:** See [docs/PWA_CONVERSION_GUIDE.md](docs/PWA_CONVERSION_GUIDE.md)

### 2. Real Flood Data Format

Events in [src/data/real-flood-data.js](src/data/real-flood-data.js):

```javascript
{
  name: 'Desborde Río Rímac - Huachipa',
  coords: [[-11.9450, -76.9350], ...],  // Polygon vertices
  intensity: 0.95,                        // 0.0-1.0
  type: 'flood',                          // 'flood' or 'debris_flow'
  dataType: 'flood',                      // For filtering
  source: 'Río Rímac',                    // Source river/cause
  verified: true                          // Verified by official sources
}
```

**60+ verified events covering:**
- Amazonas/Bagua: 21 events (Ríos Marañón, Utcubamba)
- Lima: 8 events (Río Rímac, Chosica, Ate)
- Piura: 4 events (El Niño Costero 2017, Ciclón Yaku 2023)
- Cusco: 3 events (Valle Sagrado, Machu Picchu)
- Additional 30+ events across Peru

### 3. Theme System Architecture

- **Storage:** localStorage with system preference fallback
- **Attributes:** `data-theme` (light/dark), `data-scheme` (blue/green/purple) on `<html>`
- **CSS Variables:** All colors via custom properties in [src/css/styles.css](src/css/styles.css)
- **Initialization:** Immediate in [src/js/script.js](src/js/script.js:19-27) to prevent FOUC

### 4. Map Performance Optimizations

**LOD System prevents rendering all data at once:**

```javascript
// Only load data visible in current viewport
const bounds = map.getBounds();
const visibleData = filterDataByBounds(data, bounds);

// Only render appropriate detail level
const lodLevel = getLODLevel(map.getZoom());
const filteredData = filterDataByLOD(visibleData, lodLevel);
```

**Event listeners optimize re-rendering:**
- `moveend` - Load data when pan/zoom stops
- Debouncing prevents excessive API calls
- Position cache prevents polygon overlap per year

## Common Development Tasks

### Adding New Historical Flood Events

Edit [src/data/real-flood-data.js](src/data/real-flood-data.js):

```javascript
const REAL_FLOOD_EVENTS = {
  2024: [
    // Add new event here
    {
      name: 'Your Event Name',
      coords: [[lat1, lon1], [lat2, lon2], ...],  // Min 3 points
      intensity: 0.85,                             // 0.0-1.0
      type: 'flood',                               // or 'debris_flow'
      dataType: 'flood',
      source: 'River/Cause Name',
      verified: true
    }
  ]
}
```

Data auto-loads on next refresh, no build step needed.

### Modifying Map Initial View

Edit `MAP_CONFIG` in [src/js/map.js](src/js/map.js:6-13):

```javascript
const MAP_CONFIG = {
  initialView: [-12.0464, -77.0428],  // [lat, lon]
  initialZoom: 11,                     // 6-18
  minZoom: 6,
  maxZoom: 18,
  timelineStart: 2015,
  timelineEnd: 2025
};
```

### Adding Chatbot Knowledge Topics

Edit `CHATBOT_KNOWLEDGE` in [src/js/chatbot.js](src/js/chatbot.js:6-107):

```javascript
{
  keywords: ['keyword1', 'keyword2', 'variación'],
  responses: [
    'Response option 1 with multiple sentences.',
    'Response option 2 - bot randomly selects one.'
  ]
}
```

Keywords match with accent normalization (busqueda = búsqueda).

### Customizing Alert Risk Zones

Edit `RISK_ZONES` in [src/js/alerts.js](src/js/alerts.js:23-57):

```javascript
{
  name: 'Zone Name',
  coords: [[lat1, lon1], [lat2, lon2], ...],
  center: [centerLat, centerLon],
  level: 'high',  // 'high', 'medium', 'low'
  description: 'Risk description',
  recommendation: 'Safety recommendation'
}
```

Alert radius (1000m) configurable in `ALERT_CONFIG`.

### Processing Sentinel-1 SAR Files to Tiles

To add new SAR overlay layers from GeoTIFF files:

**1. Download Sentinel-1 GRD product** from ASF (https://search.asf.alaska.edu/)

**2. Place ZIP file in `src/data/`**

**3. Update script path** in [tools/process-sar-tiff.py](tools/process-sar-tiff.py:11):
```python
"input_zip": "src/data/S1A_IW_GRDH_1SDV_YYYYMMDDTHHMMSS_*.zip"
```

**4. Run processing script:**
```bash
python tools/process-sar-tiff.py
```

**5. Script automatically:**
- Extracts GeoTIFF from ZIP
- Generates PNG tiles (zoom 10-15)
- Creates metadata.json
- Updates layers-index.json

**6. Refresh app** and activate layer from "🛰️ Capas SAR" panel

See [docs/SAR_PROCESSING_GUIDE.md](docs/SAR_PROCESSING_GUIDE.md) for full guide.

## Important Constraints

### What NOT to Change

1. **[index.html](index.html) structure** - Breaks module initialization order
2. **[manifest.json](manifest.json)** - PWA config, changes affect installation
3. **Service Worker location** - MUST be in root for proper scope
4. **[src/data/real-flood-data.js](src/data/real-flood-data.js)** - Verified historical data (only add, don't remove)

### Security Considerations

⚠️ **NASA API Token Issue:**
- Currently hardcoded in [src/js/nasa-earthdata-api.js](src/js/nasa-earthdata-api.js)
- Visible in browser DevTools
- **Production Solution:** Implement backend proxy:
  ```
  Frontend → Your Backend (with env token) → NASA API
  ```
- See [docs/NASA_EARTHDATA_INTEGRATION.md](docs/NASA_EARTHDATA_INTEGRATION.md) for details

### Dependencies (CDN-loaded)

All external dependencies load from CDN (no npm install):
- Leaflet.js 1.9.4 (maps)
- Leaflet-Geosearch 3.11.0 (search)
- Google Fonts Poppins (typography)

If CDN fails, app won't work. Consider vendoring for offline-first production.

## Debugging Tips

### Map Issues

```javascript
// Check in browser console
console.log('SAR Data:', window.SAR_DATA);
console.log('Total events:', Object.values(window.SAR_DATA || {}).flat().length);
console.log('Current zoom:', map.getZoom());
console.log('LOD level:', getLODLevel(map.getZoom()));
```

### Service Worker Issues

```javascript
// Check SW registration
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Registered SWs:', regs);
});

// Force SW update
navigator.serviceWorker.getRegistration().then(reg => {
  reg.update();
});
```

### Data Loading Issues

Check console for loading sequence:
```
🛰️ Cargando datos de NASA Earthdata API...
✅ Datos de NASA cargados: X eventos
⚠️ Usando solo datos históricos verificados (if NASA fails)
```

## Project-Specific Conventions

### Code Style

- **Variables:** camelCase
- **Constants:** UPPER_SNAKE_CASE
- **Functions:** Descriptive names, JSDoc for public APIs
- **Comments:** Spanish for UI text, English for technical comments
- **Section Markers:** `// ========== SECTION NAME ==========`

### File Organization

```
src/
├── js/          # One module per feature domain
├── css/         # Global styles (no CSS modules)
└── data/        # Static verified data only
```

### Module Pattern

Each module follows:
```javascript
// ========== MODULE NAME ==========

// Constants
const CONFIG = { ... };

// Functions
function initModule() { ... }

// Auto-initialize
document.addEventListener('DOMContentLoaded', initModule);

// Expose to window if needed by other modules
window.moduleFunction = () => { ... };
```

## Testing & Verification

### Manual Testing Checklist

Before committing changes:
- [ ] Test in Chrome, Firefox, Safari
- [ ] Test on mobile (iOS Safari, Android Chrome)
- [ ] Verify PWA installs correctly
- [ ] Check offline mode (disable network in DevTools)
- [ ] Test theme switching (light/dark, all color schemes)
- [ ] Verify geolocation permission flow
- [ ] Check console for errors
- [ ] Test timeline slider (2015-2025)
- [ ] Verify citizen report submission

### Performance

Run Lighthouse audit:
- Target: Performance > 90
- PWA installability: Pass
- Accessibility: > 95

## Additional Documentation

- **[README.md](README.md)** - User-facing documentation, features, quick start
- **[docs/README.md](docs/README.md)** - Technical documentation (Spanish)
- **[docs/NASA_EARTHDATA_INTEGRATION.md](docs/NASA_EARTHDATA_INTEGRATION.md)** - API integration details
- **[docs/SAR_PROCESSING_GUIDE.md](docs/SAR_PROCESSING_GUIDE.md)** - Complete guide to process Sentinel-1 GeoTIFF to PNG tiles
- **[docs/PWA_CONVERSION_GUIDE.md](docs/PWA_CONVERSION_GUIDE.md)** - APK conversion guide
- **[docs/DATOS_REALES.md](docs/DATOS_REALES.md)** - Historical data documentation
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines, commit conventions
