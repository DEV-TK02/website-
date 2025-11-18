// Simple service worker: precache a few assets and serve cache-first for navigation
const CACHE_NAME = 'nc-cache-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/main.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // navigation requests -> return cached index.html (app shell)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then(resp => resp || fetch(event.request))
    );
    return;
  }
  // other requests -> cache-first
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});