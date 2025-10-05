# 🤝 Guía de Contribución

Gracias por tu interés en contribuir a **HydroSAR Monitor**. Este documento proporciona directrices para mantener la calidad y consistencia del proyecto.

## 📋 Tabla de Contenidos

- [Estructura del Proyecto](#estructura-del-proyecto)
- [Configuración del Entorno](#configuración-del-entorno)
- [Convenciones de Código](#convenciones-de-código)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Commits y Pull Requests](#commits-y-pull-requests)
- [Testing](#testing)

## 📁 Estructura del Proyecto

```
hydrosarmonitor/
├── index.html              # HTML principal (NO modificar estructura general)
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker (DEBE estar en raíz)
│
├── src/
│   ├── js/                # Módulos JavaScript
│   ├── css/               # Estilos
│   └── data/              # Datos estáticos
│
├── assets/                # Recursos (iconos, screenshots)
├── docs/                  # Documentación
└── tests/                 # Tests y utilidades
```

### Principios de Organización:

1. **Separación de responsabilidades**: Cada módulo JS tiene una responsabilidad clara
2. **Sin build system**: Mantener simplicidad, sin webpack/babel
3. **CDN-first**: Dependencias externas via CDN
4. **Vanilla JS**: No frameworks pesados (React, Vue, etc.)

## ⚙️ Configuración del Entorno

### Requisitos:

- Navegador moderno (Chrome 90+, Firefox 88+, Safari 14+)
- Editor de código (VS Code recomendado)
- Git

### Setup Rápido:

```bash
# 1. Clonar repositorio
git clone https://github.com/yourusername/hydrosar-monitor.git
cd hydrosar-monitor

# 2. Instalar extensión Live Server en VS Code (opcional)
# O usar servidor local:
npx serve . -l 8000

# 3. Abrir en navegador
open http://localhost:8000
```

### Extensiones VS Code Recomendadas:

- Live Server
- ESLint
- Prettier
- GitLens

## 📝 Convenciones de Código

### JavaScript

```javascript
// ✅ BUENO: Comentarios descriptivos en español
/**
 * Calcula la distancia entre dos puntos geográficos
 * @param {number} lat1 - Latitud punto 1
 * @param {number} lon1 - Longitud punto 1
 * @returns {number} Distancia en kilómetros
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    // ... implementación
}

// ❌ MAL: Sin documentación
function calc(a,b,c,d){const r=6371;return r*2;}
```

**Reglas:**
- Variables en `camelCase`
- Constantes en `UPPER_SNAKE_CASE`
- Funciones descriptivas (no abreviaciones)
- JSDoc para funciones públicas
- Usar `const` y `let`, nunca `var`
- Preferir arrow functions para callbacks
- Separar secciones con comentarios `// ========`

### CSS

```css
/* ✅ BUENO: Variables CSS, estructura clara */
:root {
    --color-primary: #3182ce;
    --spacing-md: 1rem;
}

.card-container {
    padding: var(--spacing-md);
    background: var(--color-primary);
}

/* ❌ MAL: Valores hardcoded, sin estructura */
.x {
    padding: 16px;
    background: #3182ce;
}
```

**Reglas:**
- Usar variables CSS para colores, espaciados, fuentes
- Clases descriptivas en `kebab-case`
- Mobile-first (min-width para breakpoints)
- Evitar `!important` (usar especificidad correcta)
- Agrupar estilos relacionados con comentarios

### HTML

```html
<!-- ✅ BUENO: Semántico, accesible -->
<section class="map-container" aria-label="Mapa interactivo">
    <button
        class="search-button"
        aria-label="Buscar ubicación"
        type="submit">
        Buscar
    </button>
</section>

<!-- ❌ MAL: Divs genéricos, sin accesibilidad -->
<div class="x">
    <div onclick="search()">Click</div>
</div>
```

**Reglas:**
- HTML semántico (`<section>`, `<article>`, `<nav>`)
- ARIA labels para accesibilidad
- Indentación consistente (4 espacios)
- Atributos en orden: class, id, data-*, aria-*

## 🔄 Flujo de Trabajo

### 1. Crear una Issue (Opcional pero Recomendado)

Antes de empezar, crea una issue describiendo:
- **Problema**: ¿Qué bug/limitación existe?
- **Solución**: ¿Qué propones?
- **Alternativas**: ¿Consideraste otras opciones?

### 2. Crear Branch

```bash
# Nombres descriptivos de branches
git checkout -b feature/add-prediction-mode
git checkout -b fix/map-loading-error
git checkout -b docs/update-readme
```

**Prefijos:**
- `feature/` - Nueva funcionalidad
- `fix/` - Corrección de bugs
- `docs/` - Cambios en documentación
- `refactor/` - Refactorización sin cambios funcionales
- `style/` - Cambios de formato/estilo
- `test/` - Agregar tests

### 3. Hacer Cambios

**Antes de modificar código:**

1. Lee la documentación relevante en `/docs`
2. Entiende el módulo que vas a modificar
3. Mantén cambios pequeños y enfocados
4. Prueba en diferentes navegadores

**Archivos que NO debes modificar sin discusión:**
- `index.html` (estructura general)
- `manifest.json` (config PWA)
- `sw.js` (service worker)
- `src/data/real-flood-data.js` (datos verificados)

## 📤 Commits y Pull Requests

### Commits

Usa **mensajes descriptivos** siguiendo convención:

```bash
# ✅ BUENOS commits
git commit -m "Add: filtrado geográfico de eventos históricos"
git commit -m "Fix: error al cargar mapa en Safari iOS"
git commit -m "Update: documentación de integración NASA API"
git commit -m "Refactor: extraer lógica de cálculo de distancias"

# ❌ MAL
git commit -m "fix"
git commit -m "changes"
git commit -m "asdf"
```

**Prefijos:**
- `Add:` - Nueva funcionalidad
- `Fix:` - Corrección de bug
- `Update:` - Actualización de código existente
- `Remove:` - Eliminación de código
- `Refactor:` - Refactorización
- `Docs:` - Cambios en documentación

### Pull Requests

**Template PR:**

```markdown
## 📝 Descripción
Breve descripción de los cambios

## 🎯 Tipo de Cambio
- [ ] Nueva funcionalidad
- [ ] Corrección de bug
- [ ] Documentación
- [ ] Refactorización

## ✅ Checklist
- [ ] El código sigue las convenciones del proyecto
- [ ] Probado en Chrome, Firefox y Safari
- [ ] Probado en mobile (responsive)
- [ ] Documentación actualizada
- [ ] No hay console.log() olvidados
- [ ] Service worker actualizado si cambió archivos

## 📸 Screenshots (si aplica)
[Agregar capturas de pantalla]

## 🧪 Testing
Describe cómo probar los cambios
```

### Review Process:

1. **Crear PR** con template completado
2. **CI checks** (si existen) deben pasar
3. **Code review** de al menos 1 colaborador
4. **Aprobar y merge** por maintainer

## 🧪 Testing

### Manual Testing Checklist:

Antes de crear PR, verifica:

- [ ] **Desktop** (Chrome, Firefox, Safari)
- [ ] **Mobile** (iOS Safari, Android Chrome)
- [ ] **PWA** (instala y verifica offline)
- [ ] **Diferentes resoluciones** (320px a 2560px)
- [ ] **Tema claro/oscuro** funcionan
- [ ] **Geolocalización** (permitir/denegar)
- [ ] **Sin errores en consola**
- [ ] **Performance** (Lighthouse score > 90)

### Testing Features Específicas:

#### Mapa:
```javascript
// Test en consola del navegador
console.log('SAR Data loaded:', window.SAR_DATA ? 'Yes' : 'No');
console.log('Total events:', Object.values(window.SAR_DATA || {}).flat().length);
```

#### Service Worker:
```javascript
// Test SW registration
navigator.serviceWorker.getRegistrations().then(console.log);
```

## 🐛 Reportar Bugs

### Template Issue:

```markdown
**Descripción del Bug:**
Descripción clara del problema

**Pasos para Reproducir:**
1. Ir a '...'
2. Click en '...'
3. Scroll hasta '...'
4. Ver error

**Comportamiento Esperado:**
Lo que debería pasar

**Screenshots:**
Si aplica, agregar capturas

**Entorno:**
- Navegador: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- Versión PWA: [si aplica]
```

## 📚 Recursos Adicionales

- **[docs/README.md](docs/README.md)** - Docs técnicas completas
- **[docs/CLAUDE.md](docs/CLAUDE.md)** - Contexto del proyecto
- **Leaflet Docs**: https://leafletjs.com/reference.html
- **PWA Checklist**: https://web.dev/pwa-checklist/

## ❓ Preguntas

Si tienes preguntas:
1. Revisa la documentación en `/docs`
2. Busca issues similares
3. Crea una nueva issue con label `question`

## 🎉 Reconocimientos

Todos los contribuidores serán reconocidos en el README principal.

---

**¡Gracias por contribuir a HydroSAR Monitor!** 🌊
