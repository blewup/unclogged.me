const CACHE_NAME = 'deboucheur-cache-v3';
const PRECACHE_URLS = [
  './index.html',
  './manifest.json',
  // Core Stylesheets
  './assets/styles/style_00.css',
  './assets/styles/style_01.css',
  './assets/styles/style_02.css',
  './assets/styles/style_03.css',
  './assets/styles/style_04.css',
  './assets/styles/style_05.css',
  './assets/styles/style_06.css',
  './assets/styles/style_07.css',
  './assets/styles/fonts.css',
  './assets/styles/tailwind.css',
  './assets/styles/panda.css',
  // Core Scripts
  './assets/scripts/libs.js',
  './assets/scripts/main.js',
  './assets/scripts/time.js',
  './assets/scripts/icons.js',
  // Slides
  './assets/images/slide/slide_00.webp',
  './assets/images/slide/slide_01.webp',
  './assets/images/slide/slide_02.webp',
  './assets/images/slide/slide_03.webp',
  './assets/images/slide/slide_04.webp',
  './assets/images/slide/slide_05.webp',
  './assets/images/slide/slide_06.webp',
  './assets/images/slide/slide_07.webp',
  './assets/images/slide/slide_08.webp',
  './assets/images/slide/slide_09.webp',
  './assets/images/slide/slide_10.webp',
  './assets/images/slide/slide_11.webp',
  './assets/images/slide/slide_12.webp',
  './assets/images/slide/slide_13.webp',
  './assets/images/slide/slide_14.webp',
  './assets/images/slide/slide_15.webp',
  './assets/images/slide/slide_16.webp',
  // Logos
  './assets/images/logo/logo.png',
  './assets/images/logo/favicon-16x16.png',
  './assets/images/logo/favicon-32x32.png',
  './assets/images/logo/favicon-48x48.png',
  './assets/images/logo/android-chrome-192x192.png',
  './assets/images/logo/android-chrome-512x512.png',
  // Overlay logos
  './assets/images/location/lord_logo.webp',
  './assets/images/location/apt_logo.webp',
  './offline.html',
  './pages/prices.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Provide offline fallback page for navigation requests when offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache a copy for offline use
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match('./offline.html'))
    );
    return;
  }
  // Network‑first strategy for other same‑origin requests; fallback to cache
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(event.request).then(response => {
        const respClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
        return response;
      }).catch(() => caches.match(event.request))
    );
  }
});