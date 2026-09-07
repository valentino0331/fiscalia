const CACHE = 'hardman-v5';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Never cache API calls, WebSockets or cross-origin requests
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Network First for HTML and document navigation (ensures immediate deploy updates)
  if (e.request.mode === 'navigate' || e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(e.request, resClone));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // Stale-While-Revalidate / Cache with Network Fallback for hashed assets
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request)
        .then((res) => {
          if (res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(e.request, resClone));
          }
          return res;
        })
        .catch(() => new Response('', { status: 408, statusText: 'Network Timeout' }));
    })
  );
});

