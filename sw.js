const CACHE_NAME = 'nc-cache-v2';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/main.js',
  '/manifest.json',
  '/nightclub.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Utility: stale-while-revalidate for same-origin resources, network-first for API
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // navigation: app-shell
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then(cached => cached || fetch(req).catch(() => caches.match('/index.html')))
    );
    return;
  }

  // API requests (widget proxy) -> network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return response;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // static assets: stale-while-revalidate
  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(response => {
        if (response && response.ok) {
          caches.open(CACHE_NAME).then(cache => cache.put(req, response.clone()));
        }
        return response.clone ? response : new Response(response.body, response);
      }).catch(() => null);

      return cached || network;
    })
  );
});

// message handler to trigger skipWaiting from the page when updating
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});