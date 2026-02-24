
const CACHE_NAME = 'texflow-v3-stable';

// Assets internos críticos
const PRE_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './index.tsx',
  './App.tsx',
  './types.ts',
  './constants.ts'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRE_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null)
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignorar pedidos que não sejam GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Estratégia: Cache First para Fontes e CDN
  if (url.origin.includes('fonts.googleapis.com') || 
      url.origin.includes('fonts.gstatic.com') || 
      url.origin.includes('esm.sh') ||
      url.origin.includes('tailwindcss.com')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const toCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache));
          return response;
        });
      })
    );
    return;
  }

  // Estratégia: Network First (com Fallback para Cache) para o resto
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const toCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(res => res || caches.match('./index.html')))
  );
});
