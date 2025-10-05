# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HydroSAR Monitor is a fully functional web application for monitoring rainfall and flood risks in urban areas using NASA SAR (Synthetic Aperture Radar) data. The application is a Progressive Web App (PWA) with features including real-time alerts, AI predictions, citizen reporting, and educational gamification.

**Tech Stack:** Vanilla HTML/CSS/JavaScript with Leaflet.js for mapping (no build system required)

## Running Locally

```bash
# Option 1: Direct file opening
# Open index.html in a browser

# Option 2: Local server (recommended for full PWA features)
npx serve .
# or
python -m http.server 8000
# or use VS Code Live Server extension
```

The app requires an internet connection for:
- Leaflet.js CDN
- OpenStreetMap tiles
- Leaflet-Geosearch plugin

## Architecture

### File Structure

```
├── index.html           # Main HTML structure with all UI elements
├── styles.css           # Global styles, themes, animations
├── script.js            # Theme system, notifications, form handling
├── map.js              # Leaflet map, SAR data visualization, LOD system
├── alerts.js           # Risk zones, geolocation, alerts, citizen reports
├── chatbot.js          # Educational AI chatbot with knowledge base
├── game.js             # Gamification system (drop collection mini-game)
├── sw.js               # Service worker for PWA offline support
├── manifest.json       # PWA manifest
└── PWA_CONVERSION_GUIDE.md  # Detailed PWA/APK conversion instructions
```

### Module Organization

The codebase uses a **modular vanilla JS architecture** where each JavaScript file is responsible for a specific feature domain. All modules are loaded via `<script>` tags in [index.html](index.html:148-152) and initialize automatically via `DOMContentLoaded` events.

**Initialization order:**
1. [script.js](script.js) - Theme system (immediate)
2. [map.js](map.js) - Leaflet map initialization (on DOM ready)
3. [alerts.js](alerts.js) - Alert system (2s delay to wait for map)
4. [chatbot.js](chatbot.js) - Chatbot UI (2.5s delay)
5. [game.js](game.js) - Game system (3s delay)

## Core Features

### 1. Interactive Leaflet Map ([map.js](map.js))

**Key configuration:** `MAP_CONFIG` (map.js:6-13)
- Initial view: Lima, Peru [-12.0464, -77.0428]
- Zoom range: 6-18
- Timeline: 2015-2025

**SAR Data Visualization:**
- Data generated procedurally via `generateInitialMicrozones()` (map.js:42-107)
- ~2,400 pre-generated microzone polygons across Lima districts
- LOD (Level of Detail) system with 3 zoom levels:
  - **Regional** (zoom 6-10): Large areas ~1.5km
  - **District** (zoom 11-13): Medium areas ~150m
  - **Microzone** (zoom 14+): Small areas ~8m
- Dynamic loading based on viewport and zoom (`loadDataForCurrentZoom()` at map.js:337)

**Timeline Controls:**
- Slider control (map.js:741-796) for navigating years 2015-2025
- **Cumulative mode** (default): Shows all data from 2015 to selected year with progressive opacity
- **Year-specific mode**: Shows only data from selected year
- Opacity calculation based on data age (older = more transparent)

**AI Prediction Mode:**
- Toggle button (map.js:934-959) to show/hide predicted risk zones
- Uses `PREDICTION_DATA` (map.js:113-117) - currently simulated
- Displays probability-based risk polygons (high/medium/low)

**Search Integration:**
- Uses Leaflet-Geosearch with OpenStreetMap Nominatim provider
- `centerMapOnCity()` function (map.js:1223-1263) called from search form
- Generates SAR data for searched location via `loadSARDataForLocation()` (map.js:603)

### 2. Real-Time Alert System ([alerts.js](alerts.js))

**Risk Zone Rendering:**
- `RISK_ZONES` array (alerts.js:23-57) defines active risk areas
- Animated polygons with pulsing borders (CSS animations)
- Three alert levels: high (red), medium (orange), low (yellow)
- Rendered via `renderRiskZones()` (alerts.js:150-168)

**User Location & Alerts:**
- Geolocation via `getUserLocation()` (alerts.js:100-141)
- Falls back to simulated location (Lima center) if GPS unavailable
- `checkUserInRiskZone()` (alerts.js:243-264) runs every 30 seconds
- Alert radius: 1000 meters (configurable in `ALERT_CONFIG`)

**Alert Notifications:**
- Visual notification overlay with sound (`showRiskAlert()` at alerts.js:293)
- Browser notification API integration (alerts.js:466-496)
- Looping alert sound (base64-encoded WAV)
- Sound toggle and "View in map" buttons

**Citizen Reporting:**
- Floating orange button (`createReportButton()` at alerts.js:505)
- Modal form with incident type, description, GPS coordinates
- Reports stored in `window.citizenReports` array
- Markers added to map via `addReportMarker()` (alerts.js:694)
- Share functionality via Web Share API

### 3. Educational Chatbot ([chatbot.js](chatbot.js))

**Knowledge Base:**
- 14 topic categories in `CHATBOT_KNOWLEDGE` (chatbot.js:6-107)
- Topics: SAR technology, huaycos, risk zones, emergencies, NASA data, etc.
- Keyword-based matching with accent normalization
- Multiple responses per topic (randomly selected)

**UI Components:**
- Floating button with badge counter
- WhatsApp-style chat interface
- Typing indicator with animated dots
- Message history persistence during session

**Integration Points:**
- `addBotMessage(message)` - Programmatically send bot messages
- `notifyNewAlert(zoneName)` - Alert integration hook
- Called from game.js when achievements unlock

### 4. Gamification System ([game.js](game.js))

**Drop Collection Game:**
- Goal: Collect 5 water drops to unlock achievement
- Drop spawning in 8 predefined Lima zones (`DROP_LOCATIONS`)
- Max 8 active drops, respawn every 5 seconds
- Drop lifetime: 15 seconds before expiration

**Game Controls:**
- Toggle button in map (top-left)
- Drop counter overlay
- Click drops to collect

**Achievement System:**
- Modal with confetti animation on goal completion
- Stats display: total drops, zones explored
- Reset and replay functionality
- Unlocks "hidden historical data" narrative reward

### 5. Theme System ([script.js](script.js))

**Theme Persistence:**
- `initializeTheme()` (script.js:19-27) reads from localStorage
- Falls back to system preference (`prefers-color-scheme`)
- Watches for system theme changes (script.js:154-159)

**Color Schemes:**
- Three schemes: blue (default), green, purple
- Defined via CSS custom properties in [styles.css](styles.css)
- Attributes: `data-theme` (light/dark) and `data-scheme` (color) on `<html>`

**Notifications:**
- `showNotification(message, type)` (script.js:218-250)
- Types: info, success, warning, error
- 3-second auto-dismiss with slide animations

## Data Flow

### SAR Data Generation
1. `generateInitialMicrozones()` creates 2,400 polygons on app load
2. Data stored in `SAR_DATA` object keyed by year
3. `loadDataForCurrentZoom()` filters and renders based on:
   - Current map viewport bounds
   - Zoom level (determines LOD)
   - Selected year and cumulative mode

### Alert Flow
1. User location obtained via GPS or fallback
2. `checkUserInRiskZone()` calculates distance to risk zone centers
3. If within 1000m radius → trigger alert
4. Visual notification + sound + browser notification
5. Alert persists until user dismisses or leaves zone

### Search Flow
1. User submits form → `handleSearch()` (script.js:170)
2. Calls `window.centerMapOnCity(cityName)`
3. Nominatim geocoding lookup
4. Map centers on result
5. `loadSARDataForLocation()` generates nearby microzone data

## Key Functions Reference

### Map Module (map.js)
- `initializeMap()` (line 126) - Main initialization
- `loadDataForCurrentZoom()` (line 337) - Dynamic data loading
- `createSARPolygon(data, year)` (line 658) - Creates styled polygon
- `updateLayerOpacityByYear(year)` (line 846) - Temporal filtering
- `togglePredictionMode()` (line 964) - AI prediction toggle

### Alerts Module (alerts.js)
- `initializeAlertSystem()` (line 69) - Setup
- `checkUserInRiskZone()` (line 243) - Location checking
- `createAlertNotification(zone)` (line 316) - Alert UI
- `submitReport(event)` (line 654) - Citizen report submission

### Chatbot Module (chatbot.js)
- `initializeChatbot()` (line 142) - Setup
- `getBotResponse(userMessage)` (line 377) - Keyword matching
- `sendMessage()` (line 335) - User message handler
- `addBotMessage(message)` (line 418) - External message injection

### Game Module (game.js)
- `toggleGame()` (line 115) - Start/stop game
- `spawnDrops()` (line 207) - Generate collectible drops
- `collectDrop()` (line 283) - Handle drop collection
- `unlockAchievement()` (line 425) - Goal completion

## PWA Features

**Service Worker ([sw.js](sw.js)):**
- Caches app shell (HTML, CSS, JS, external libs)
- Offline fallback support
- Cache-first strategy for static assets

**Manifest ([manifest.json](manifest.json)):**
- App name, icons, theme colors
- Display mode: standalone
- Start URL and scope configured

**Installation:**
- PWA installable on mobile/desktop
- For Android APK: See [PWA_CONVERSION_GUIDE.md](PWA_CONVERSION_GUIDE.md:229-314)

## Integration with Real NASA Data

Currently uses simulated SAR data. To integrate real NASA data:

**API Endpoints to consider:**
- NASA Earthdata: https://earthdata.nasa.gov/
- Sentinel-1 SAR: https://scihub.copernicus.eu/
- Alaska Satellite Facility: https://search.asf.alaska.edu/

**Expected GeoJSON format:**
```javascript
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": { "type": "Polygon", "coordinates": [...] },
    "properties": {
      "intensity": 0.85,
      "date": "2024-03-15",
      "type": "flood",
      "source": "Sentinel-1"
    }
  }]
}
```

**Integration point:** Replace `SAR_DATA` generation with API calls in `loadSARData()` (see comments at map.js:1136-1208)

## Styling Conventions

- CSS organized by feature sections with `/* ========== */` headers
- Custom properties for theming (avoid hardcoded colors)
- Animations defined in CSS (not JavaScript) for performance
- Mobile-first responsive design (breakpoints: 480px, 768px)
- Accessibility: ARIA labels, focus states, reduced-motion support

## Code Conventions

- Functions use JSDoc-style comments
- Sections separated by `// ========` comment blocks
- Global functions exposed via `window` object for inter-module communication
- Event listeners added in dedicated init functions
- Console logging for debugging (can be stripped in production)

## Important Notes

- No build system or package.json - keep it lightweight
- All dependencies loaded via CDN
- Service worker requires HTTPS in production
- Geolocation requires user permission
- Browser notification requires explicit user consent
- Sound autoplay may be blocked (user must interact first)
