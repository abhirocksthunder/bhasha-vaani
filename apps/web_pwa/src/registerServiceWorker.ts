// Registers public/sw.js. Kept as a tiny hand-written service worker
// instead of vite-plugin-pwa/workbox -- see the comment at the top of
// public/sw.js for why.
export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch (error) {
    // Non-fatal: the app works fine without a service worker, it just
    // loses installability/offline-shell caching.
    console.warn('Service worker registration failed:', error);
  }
}
