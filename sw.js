const VERSION = '1.2.0';
const CACHE = 'loan-app-' + VERSION;
const RUNTIME = 'loan-app-runtime';

// فایل‌های خود برنامه
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

// کتابخانه و فونت بیرونی؛ برای کار کردن آفلاین ذخیره می‌شوند
const EXTERNAL = [
  'https://cdn.jsdelivr.net/npm/jalaali-js@1.2.6/dist/jalaali.js'
];
const EXTERNAL_HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(ASSETS.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
    // شکست دانلود کتابخانه بیرونی نباید نصب را خراب کند
    const rt = await caches.open(RUNTIME);
    await Promise.all(EXTERNAL.map((url) =>
      fetch(url, { mode: 'no-cors' }).then((res) => rt.put(url, res)).catch(() => {})
    ));
  })());
  // skipWaiting را عمداً اینجا نمی‌گذاریم تا نصب در گوشی روان‌تر شود
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('loan-app-') && k !== CACHE && k !== RUNTIME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // منابع بیرونی (کتابخانه تاریخ شمسی و فونت): اول کش، همزمان به‌روزرسانی
  if (EXTERNAL_HOSTS.includes(url.hostname)) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      const hit = await cache.match(req);
      const net = fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      return hit || (await net) || new Response('', { status: 504, statusText: 'Offline' });
    })());
    return;
  }

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).catch(() => {
        if (req.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});
