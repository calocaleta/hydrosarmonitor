const CACHE_NAME = 'urban-flood-memory-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/css/styles.css',
  '/src/js/script.js',
  '/src/js/map.js',
  '/src/js/alerts.js',
  '/src/js/chatbot.js',
  '/src/js/game.js',
  '/src/js/nasa-earthdata-api.js',
  '/src/data/real-flood-data.js',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet-geosearch@3.11.0/dist/geosearch.css',
  'https://unpkg.com/leaflet-geosearch@3.11.0/dist/geosearch.umd.js'
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
