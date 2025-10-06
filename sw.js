const CACHE_NAME = 'urban-flood-memory-v3'; // Incrementado para NASA layers
const urlsToCache = [
  '/',
  '/index.html',
  '/src/css/styles.css',
  '/src/css/nasa-layers-panel.css',
  '/src/js/script.js',
  '/src/js/map.js',
  '/src/js/alerts.js',
  '/src/js/chatbot.js',
  '/src/js/game.js',
  '/src/js/nasa-earthdata-api.js',
  '/src/js/nasa-layers-manager.js',
  '/src/data/real-flood-data.js',
  '/src/data/nasa-layers/layers-index.json',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet-geosearch@3.11.0/dist/geosearch.css',
  'https://unpkg.com/leaflet-geosearch@3.11.0/dist/geosearch.umd.js'
];

// Rutas que requieren estrategia de cache especial
const TILE_CACHE_NAME = 'nasa-sar-tiles-v1';
const TILE_URL_PATTERN = /\/nasa-layers\/.*\/tiles\//;

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

// Estrategia de fetch según tipo de recurso
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Estrategia Cache-First para tiles SAR (imágenes grandes)
  if (TILE_URL_PATTERN.test(url)) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request).then((response) => {
            // Guardar tile en cache para uso offline
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // Estrategia Network-First para el resto (HTML, JS, CSS, JSON)
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
