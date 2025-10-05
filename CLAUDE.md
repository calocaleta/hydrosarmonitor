# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HydroSAR Monitor is a web application for exploring rainfall and flood history in urban areas using NASA SAR data. Currently a static web application with plans to become a Progressive Web App (PWA) and Android APK.

## Development Setup

This is a vanilla HTML/CSS/JavaScript project with no build system required.

**Running locally:**
- Open [index.html](index.html) in a browser directly, or
- Use a local server: `npx serve .` or VS Code Live Server extension

## Architecture

### Core Structure

The application follows a modular vanilla JavaScript architecture:

- **[index.html](index.html)**: Single-page application layout with theme controls, search form, and map placeholder
- **[script.js](script.js)**: Event-driven JavaScript with organized sections (see script.js:1-342 for full structure)
- **[styles.css](styles.css)**: CSS custom properties for theming with light/dark modes and 3 color schemes (blue, green, purple)

### Key Features

1. **Theme System** (script.js:13-61)
   - Light/dark mode with localStorage persistence
   - System preference detection via `prefers-color-scheme`
   - Functions: `initializeTheme()`, `setTheme()`, `toggleTheme()`

2. **Color Schemes** (script.js:63-126)
   - Three color palettes: blue (default), green, purple
   - CSS custom properties in styles.css:6-61
   - Functions: `setColorScheme()`, `changeColorScheme()`

3. **Search Functionality** (script.js:163-222)
   - City search form with placeholder implementation
   - Currently shows mock results; ready for API integration
   - Function: `handleSearch()` - main entry point for future API calls

4. **Global API** (script.js:329-336)
   - Exported functions available at `window.urbanFloodMemory`
   - Useful for debugging: `urbanFloodMemory.getCurrentTheme()`, etc.

### State Management

- Uses `localStorage` for persistence:
  - `theme`: 'light' or 'dark'
  - `colorScheme`: 'blue', 'green', or 'purple'
- No external state management libraries
- Theme/color state reflected via `data-theme` and `data-scheme` attributes on `<html>`

### Styling System

CSS variables (styles.css:6-61) define all colors/themes:
- Variables change based on `[data-theme]` and `[data-scheme]` attributes
- All components use these variables, enabling instant theme switching
- Responsive breakpoints: 768px (tablet), 480px (mobile)

## Future Development

### PWA Conversion

See [PWA_CONVERSION_GUIDE.md](PWA_CONVERSION_GUIDE.md) for detailed steps. Key files to create:
- `manifest.json`: PWA manifest with app metadata and icons
- `sw.js`: Service worker for offline functionality and caching
- Icon assets in `/icons/` directory (72px to 512px)

To enable PWA:
1. Add service worker registration to script.js (example at PWA_CONVERSION_GUIDE.md:182-198)
2. Create manifest.json (template at PWA_CONVERSION_GUIDE.md:12-88)
3. Update index.html with manifest link and meta tags
4. Host on HTTPS (required for service workers)

### API Integration Point

The `handleSearch()` function (script.js:170-203) is the integration point for NASA SAR data:
- Replace `setTimeout()` mock at script.js:194-202
- Update `updateMapPlaceholder()` to render actual map data
- Consider using Leaflet.js or Google Maps API for mapping

### Converting to APK

After PWA conversion, use:
- **PWA Builder** (recommended): https://www.pwabuilder.com/
- **Bubblewrap CLI**: `npm install -g @bubblewrap/cli`

See PWA_CONVERSION_GUIDE.md:229-314 for complete instructions.

## Code Conventions

- Functions are documented with JSDoc-style comments
- Organized into sections marked by `// ========` headers
- Event listeners centralized in `initializeEventListeners()` (script.js:135-160)
- Notifications use `showNotification(message, type)` for user feedback
- All animations use CSS transitions/keyframes, not JavaScript

## Important Notes

- No package.json or dependencies - keep it lightweight
- Accessibility features: proper ARIA labels, focus states, reduced-motion support (styles.css:567-579)
- Mobile-first: animated drops reduced on mobile for performance (styles.css:551-553)
- The map functionality is currently a placeholder - implementation pending
