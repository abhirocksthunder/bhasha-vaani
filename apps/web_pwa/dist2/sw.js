// Minimal hand-written service worker -- deliberately not using
// vite-plugin-pwa/workbox. That was tried during phase 1 scaffolding and
// its dependency tree repeatedly failed to install through this repo's
// cross-OS sandbox mount (see apps/web_pwa/README.md and
// .ai/known-issues.yaml BV-WEBPWA-* entries). This is small enough to
// maintain by hand and has no install-time dependency footprint at all.
//
// Scope is deliberately narrow: only same-origin GET requests are touched.
// Cross-origin API calls to the backend (127.0.0.1:6001) are never
// intercepted here -- the app already has its own offline handling
// (seed-data fallback + the progress outbox in
// src/features/progress/progressOutboxRepository.ts), and caching API
// responses in the service worker on top of that would just add a second,
// harder-to-reason-about source of staleness.

const CACHE_NAME = 'bhashavaani-web-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // App-shell navigation: try the network first (so an online user
    // always gets the current build), fall back to whatever shell was
    // last cached when offline.
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put('/', response.clone());
          return response;
        } catch {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match('/');
          return cached ?? Response.error();
        }
      })(),
    );
    return;
  }

  // Static assets (hashed JS/CSS, icons, manifest): stale-while-revalidate
  // so repeat loads are fast and still self-heal once a new build's
  // hashed filenames replace the old ones in the cache over time.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => undefined);
      return cached ?? (await networkFetch) ?? Response.error();
    })(),
  );
});
