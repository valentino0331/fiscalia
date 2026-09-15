const CACHE = 'hardman-v6';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/hardman-icon.svg'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS)).catch(() => {})
  );
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

  // Never intercept non-GET requests or requests to other origins
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Never intercept API routes, backend chat, auth, files, or streaming endpoints
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/chat') ||
    url.pathname.startsWith('/auth') ||
    url.pathname.startsWith('/files') ||
    url.pathname.includes('/sse')
  ) {
    return;
  }

  // Network First for HTML and document navigation (ensures immediate deploy updates)
  if (e.request.mode === 'navigate' || e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(e.request, resClone)).catch(() => {});
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(e.request);
          if (cached) return cached;
          const indexCached = await caches.match('/index.html');
          if (indexCached) return indexCached;
          return new Response('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Hardman</title></head><body><p>Reconectando a Hardman...</p><script>window.location.reload();</script></body></html>', {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        })
    );
    return;
  }

  // Cache-First with Network Fallback for static assets (JS, CSS, images)
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request)
        .then((res) => {
          if (res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(e.request, resClone)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match('/index.html'));
    }).then((res) => res || new Response('', { status: 404, statusText: 'Not Found' }))
  );
});


