# 📱 Guía de Conversión a PWA y APK - Urban Flood Memory

Esta guía detalla los pasos necesarios para convertir la aplicación web en una Progressive Web App (PWA) y posteriormente en una aplicación APK para Android.

---

## 🌐 PASO 1: Convertir a PWA (Progressive Web App)

### 1.1 Crear el Manifest (manifest.json)

Crear un archivo `manifest.json` en la raíz del proyecto:

```json
{
  "name": "Urban Flood Memory - Explorador de Lluvias",
  "short_name": "Flood Memory",
  "description": "Consulta el historial de lluvias e inundaciones en tu localidad",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f0f4f8",
  "theme_color": "#3182ce",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/screenshot1.png",
      "sizes": "540x720",
      "type": "image/png"
    },
    {
      "src": "/screenshots/screenshot2.png",
      "sizes": "540x720",
      "type": "image/png"
    }
  ],
  "categories": ["weather", "utilities", "navigation"],
  "lang": "es-ES"
}
```

### 1.2 Actualizar index.html

Agregar al `<head>` de `index.html`:

```html
<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json">

<!-- Theme color -->
<meta name="theme-color" content="#3182ce">

<!-- Apple Touch Icons -->
<link rel="apple-touch-icon" href="/icons/icon-192x192.png">
<link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png">

<!-- Apple Splash Screens (opcional) -->
<link rel="apple-touch-startup-image" href="/splash/splash-640x1136.png">

<!-- iOS Meta Tags -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Flood Memory">
```

### 1.3 Crear Service Worker (sw.js)

Crear archivo `sw.js` en la raíz:

```javascript
const CACHE_NAME = 'urban-flood-memory-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación y limpieza de caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia: Network First, falling back to Cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonar respuesta para guardar en cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Si falla la red, usar cache
        return caches.match(event.request);
      })
  );
});
```

### 1.4 Registrar Service Worker en script.js

Agregar al final de `script.js`:

```javascript
// ========================================
// REGISTRO DE SERVICE WORKER (PWA)
// ========================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('✅ Service Worker registrado:', registration.scope);
            })
            .catch((error) => {
                console.log('❌ Error al registrar Service Worker:', error);
            });
    });
}
```

### 1.5 Crear Iconos

Necesitas crear iconos en diferentes tamaños. Puedes usar herramientas como:

- **PWA Asset Generator**: https://github.com/elegantapp/pwa-asset-generator
- **RealFaviconGenerator**: https://realfavicongenerator.net/
- **PWA Builder**: https://www.pwabuilder.com/

Comando con pwa-asset-generator:

```bash
npx pwa-asset-generator logo.png ./icons --background "#3182ce" --padding "10%"
```

### 1.6 Probar la PWA

1. Servir la aplicación con HTTPS (requisito para PWA):
   ```bash
   npx serve -s . --ssl-cert
   # o usar Live Server de VSCode con HTTPS
   ```

2. Abrir Chrome DevTools > Application > Manifest
3. Verificar que todos los campos estén correctos
4. En Application > Service Workers, verificar que esté registrado
5. Probar en móvil y agregar a pantalla de inicio

---

## 📦 PASO 2: Convertir PWA a APK

### Opción A: PWA Builder (Recomendado - Más Fácil)

1. **Subir la PWA a un servidor con HTTPS**
   - Puede ser GitHub Pages, Netlify, Vercel, Firebase Hosting, etc.

2. **Ir a PWA Builder**
   - Visitar: https://www.pwabuilder.com/

3. **Generar APK**
   - Ingresar la URL de la PWA
   - Click en "Start"
   - Seleccionar "Android" en la pestaña de plataformas
   - Click en "Generate Package"
   - Descargar el APK

4. **Firmar y distribuir**
   - El APK generado puede subirse a Google Play Store
   - O distribuirse directamente como APK

### Opción B: Bubblewrap (Control Total)

Bubblewrap es la herramienta oficial de Google para convertir PWA a APK.

1. **Instalar Bubblewrap**
   ```bash
   npm install -g @bubblewrap/cli
   ```

2. **Instalar JDK 8+ y Android SDK**
   ```bash
   # Verificar instalación
   java -version
   ```

3. **Inicializar proyecto**
   ```bash
   bubblewrap init --manifest https://tu-dominio.com/manifest.json
   ```

4. **Construir APK**
   ```bash
   bubblewrap build
   ```

5. **Resultado**
   - El APK estará en `/app-release-signed.apk`

### Opción C: Trusted Web Activity (TWA) Manual

1. **Crear proyecto Android en Android Studio**

2. **Agregar dependencia TWA**

   En `build.gradle`:
   ```gradle
   implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
   ```

3. **Configurar AndroidManifest.xml**
   ```xml
   <activity
       android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
       android:label="@string/app_name">
       <intent-filter>
           <action android:name="android.intent.action.MAIN" />
           <category android:name="android.intent.category.LAUNCHER" />
       </intent-filter>
   </activity>
   ```

4. **Crear asset_statements.json en el servidor**
   ```json
   [{
     "relation": ["delegate_permission/common.handle_all_urls"],
     "target": {
       "namespace": "android_app",
       "package_name": "com.tuapp.floodmemory",
       "sha256_cert_fingerprints": ["SHA256_FINGERPRINT"]
     }
   }]
   ```

5. **Compilar y firmar APK**

---

## 🚀 PASO 3: Hosting y Despliegue

### Opciones de Hosting Gratuito para PWA:

#### GitHub Pages
```bash
# 1. Crear repositorio en GitHub
# 2. Subir archivos
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/usuario/flood-memory.git
git push -u origin main

# 3. Activar GitHub Pages en Settings > Pages
# URL: https://usuario.github.io/flood-memory/
```

#### Netlify
```bash
# Método 1: Drag & Drop en netlify.com
# Método 2: CLI
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

#### Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

#### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## ✅ Checklist de PWA

Antes de generar el APK, verificar:

- [ ] Manifest.json está completo y validado
- [ ] Service Worker está registrado y funcional
- [ ] Todos los iconos están generados (72px a 512px)
- [ ] La app funciona offline (básico)
- [ ] HTTPS habilitado en el servidor
- [ ] Meta tags de PWA en el HTML
- [ ] Theme color configurado
- [ ] Prueba en Lighthouse (score >90)
- [ ] Prueba de instalación en móvil
- [ ] Splash screens para iOS (opcional)

---

## 🔧 Mejoras Adicionales

### 1. Notificaciones Push

Agregar en `sw.js`:

```javascript
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png'
  };

  event.waitUntil(
    self.registration.showNotification('Urban Flood Memory', options)
  );
});
```

### 2. Sincronización en Background

```javascript
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-flood-data') {
    event.waitUntil(syncFloodData());
  }
});
```

### 3. Compartir API

En `script.js`:

```javascript
async function shareFloodData(city) {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Urban Flood Memory',
                text: `Consulta datos de lluvias en ${city}`,
                url: window.location.href
            });
        } catch (err) {
            console.log('Error al compartir:', err);
        }
    }
}
```

---

## 📚 Recursos Útiles

- **PWA Documentation**: https://web.dev/progressive-web-apps/
- **PWA Builder**: https://www.pwabuilder.com/
- **Bubblewrap**: https://github.com/GoogleChromeLabs/bubblewrap
- **Workbox** (Service Worker Library): https://developers.google.com/web/tools/workbox
- **Lighthouse**: https://developers.google.com/web/tools/lighthouse
- **PWA Asset Generator**: https://github.com/elegantapp/pwa-asset-generator
- **Trusted Web Activity**: https://developer.chrome.com/docs/android/trusted-web-activity/

---

## 🎯 Resumen de Pasos Rápidos

1. ✅ Crear `manifest.json`
2. ✅ Crear `sw.js` (Service Worker)
3. ✅ Generar iconos (72px - 512px)
4. ✅ Actualizar `index.html` con links del manifest
5. ✅ Registrar Service Worker en `script.js`
6. ✅ Hostear en servidor HTTPS
7. ✅ Probar con Lighthouse
8. ✅ Usar PWA Builder o Bubblewrap para generar APK
9. ✅ Probar APK en dispositivo Android
10. ✅ Publicar en Google Play Store (opcional)

¡Con estos pasos tendrás tu aplicación web convertida en una PWA instalable y lista para ser distribuida como APK! 🚀
