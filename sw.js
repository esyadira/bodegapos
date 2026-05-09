const CACHE_NAME = 'bodegapos-v1';

// Archivos a cachear para uso offline
const ASSETS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

// Instalar: guardar archivos en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cachear assets locales (los externos pueden fallar, los ignoramos)
      return cache.addAll(['./index.html']).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activar: limpiar cachés viejas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: responder con caché si hay, si no ir a red
self.addEventListener('fetch', event => {
  // Solo interceptar GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cachear solo respuestas válidas de nuestro propio origen
        if (
          response &&
          response.status === 200 &&
          response.type === 'basic'
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Si estamos offline y pedimos index.html, devolver desde caché
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
