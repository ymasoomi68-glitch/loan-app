const CACHE_NAME = 'loan-app-v1';
const LOCAL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];
const REMOTE_FILES = [
  'https://cdn.jsdelivr.net/npm/jalaali-js@1.2.6/dist/jalaali.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(LOCAL_FILES).then(() => {
        return Promise.all(
          REMOTE_FILES.map(url => cache.add(url).catch(() => console.log('Failed to cache:', url)))
        );
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => {
      return Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});