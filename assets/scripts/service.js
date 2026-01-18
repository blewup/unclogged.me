const CACHE_NAME = 'deboucheur-cache-v7';
const PRECACHE_URLS = [
  './index.html',
  './manifest.json',
  './errors.html',
  // Core Stylesheets
  './assets/styles/index.css',
  './assets/styles/errors.css',
  './assets/styles/fonts.css',
  './assets/styles/tailwind.css',
  './assets/styles/panda.css',
  // Page-specific Stylesheets
  './assets/styles/tools.css',
  './assets/styles/conditions.css',
  './assets/styles/politics.css',
  './assets/styles/team.css',
  './assets/styles/plumbing.css',
  './assets/styles/events.css',
  './assets/styles/prices.css',
  // Core Scripts
  './assets/scripts/libs.js',
  './assets/scripts/main.js',
  './assets/scripts/time.js',
  './assets/scripts/icons.js',
  './assets/scripts/components/loader.js',
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
  // Shared Components (pages/ level)
  './pages/components/navbar.html',
  './pages/components/footer.html',
  './pages/components/banner.html',
  './pages/components/helper.html',
  './pages/components/hero.html',
  // Index Components
  './pages/index/components/navbar.html',
  './pages/index/components/footer.html',
  './pages/index/components/banner.html',
  './pages/index/components/helper.html',
  './pages/index/components/hero.html',
  // Index Sections
  './pages/index/section_00.html',
  './pages/index/section_01.html',
  './pages/index/section_02.html',
  './pages/index/section_03.html',
  './pages/index/section_04.html',
  './pages/index/section_05.html',
  './pages/index/section_06.html',
  './pages/index/section_07.html',
  './pages/index/section_08.html',
  // Plumbing Components
  './pages/plumbing/components/navbar.html',
  './pages/plumbing/components/footer.html',
  './pages/plumbing/components/banner.html',
  './pages/plumbing/components/helper.html',
  // Plumbing Hero Components
  './pages/plumbing/drainage/hero.html',
  './pages/plumbing/normes/hero.html',
  './pages/plumbing/supply/hero.html',
  './pages/plumbing/unclog/hero.html',
  // Error Components
  './pages/errors/components/navbar.html',
  // Pages
  './pages/errors/offline.html',
  './pages/prices.html',
  './pages/plumbing.html',
  './pages/plumbing/unclog.html',
  './pages/events.html',
  './pages/tools.html',
  './pages/team.html',
  './pages/politics.html',
  './pages/conditions.html',
  // Videos
  './assets/videos/video_00.mp4',
  './assets/videos/video_01.mp4',
  './assets/videos/video_02.mp4',
  './assets/videos/video_03.mp4',
  './assets/videos/video_04.mp4',
  './assets/videos/video_05.mp4'
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