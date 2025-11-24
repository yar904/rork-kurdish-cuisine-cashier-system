const CACHE_NAME = 'tapse-v4';
const OFFLINE_URL = '/';

const STATIC_CACHE = [
  '/',
  '/landing',
  '/menu',
  '/staff-login',
];

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching static assets');
      return cache.addAll(STATIC_CACHE).catch(err => {
        console.error('[ServiceWorker] Cache addAll error:', err);
      });
    })
  );
  
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (event.request.url.includes('supabase.co')) {
    return;
  }

  if (event.request.url.includes('/api/') || 
      event.request.url.includes('openai.com') ||
      event.request.url.includes('toolkit.rork.com')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(
            JSON.stringify({ 
              error: 'offline', 
              message: 'You are offline. Some features may not be available.' 
            }),
            { 
              headers: { 'Content-Type': 'application/json' },
              status: 503 
            }
          );
        })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          return caches.match(OFFLINE_URL);
        });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
