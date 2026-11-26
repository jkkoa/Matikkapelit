/* Matikkapelit — Offline PWA Service Worker */
const CACHE_NAME = 'matikkapelit-cache-v2';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './fonts/andika-regular.woff2',
  './fonts/andika-bold.woff2',
  './img/pikaluku-tile.webp',
  './img/karhu-win.webp',
  './shared/style.css',
  './shared/audio.js',
  './shared/games.js',
  './shared/scheduler.js',
  './shared/quantities.js',
  './shared/ui.js',
  './games/pikaluku/',
  './games/pikaluku/index.html',
  './games/pikaluku/style.css',
  './games/pikaluku/app.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isMedia = /\/(img|fonts|icons)\//.test(url.pathname);

  if (isMedia) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(req);
        const networkPromise = fetch(req).then(res => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || networkPromise;
      })
    );
  } else {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
  }
});
