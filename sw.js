const CACHE_NAME = 'loan-app-v3';
const LOCAL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];
const REMOTE_FILES = [
  'https://cdn.jsdelivr.net/npm/jalaali-js@1.2.6/dist/jalaali.js',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100;300;400;500;700;900&display=swap'
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

// استراتژی Network First برای اینکه همیشه آخرین نسخه باز شود، اگر آفلاین بود از کش بخواند
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
