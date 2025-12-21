const CACHE_NAME = 'nc-cache-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/main.js',
  '/manifest.json',
  '/nightclub.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(err => {
        console.warn('Some precache assets failed to cache:', err);
        return Promise.all(
          PRECACHE_URLS.map(url => 
            cache.add(url).catch(e => console.warn(`Failed to cache ${url}`, e))
          )
        );
      });
    })
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
      caches.match('/index.html')
        .then(resp => resp || fetch(event.request))
        .catch(err => {
          console.warn('Navigation fetch failed:', err);
          return caches.match('/index.html');
        })
    );
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(resp => {
        if (resp) return resp;
        
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
      .catch(err => {
        console.warn('Fetch failed:', err);
        return caches.match(event.request);
      })
  );
});
