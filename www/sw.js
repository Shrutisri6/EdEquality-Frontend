/**
 * EdEquality Service Worker
 * Enables offline support and PWA installability.
 *
 * Strategy:
 *  - Cache-first for static assets (shell, icons, fonts)
 *  - Network-first for API/dynamic requests, falling back to offline page
 */

const CACHE_NAME = 'edequality-v1';
const OFFLINE_URL = './index.html';

/** Static assets to pre-cache on install */
const PRECACHE_URLS = [
  './index.html',
  './manifest.json',
  './icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // Chart.js CDN — cache for offline use
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.4/chart.umd.min.js',
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  // Take control immediately without waiting for old SW to finish
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  // Claim all open clients so they use the new SW right away
  self.clients.claim();
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and browser-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // Skip Capacitor bridge requests
  if (url.hostname === 'localhost' && url.pathname.startsWith('/_capacitor_')) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          // Cache successful same-origin responses and CDN assets
          if (
            response.ok &&
            (url.origin === self.location.origin ||
              url.hostname.includes('cloudflare'))
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // For navigation requests, serve the offline shell
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
    })
  );
});
