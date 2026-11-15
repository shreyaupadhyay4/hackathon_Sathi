// Offline shell: stale-while-revalidate for app files. API calls are never cached here
// (the app keeps its own "last nearby list" in localStorage).
const V = 'aapatkaal-v36';
const SHELL = ['/', '/index.html', '/app.js?v=36-rounded-map-location', '/style.css', '/firstaid.json', '/manifest.json', '/icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api') || u.pathname.startsWith('/t/')) return;
  const cachePromise = caches.open(V);
  const updateFirst = e.request.mode === 'navigate' || u.pathname === '/index.html' || u.pathname === '/app.js';
  if (updateFirst) {
    e.respondWith(fetch(e.request).then(async res => {
      if (res.ok) await (await cachePromise).put(e.request, res.clone());
      return res;
    }).catch(async () => {
      const cache = await cachePromise;
      return (await cache.match(e.request)) || (e.request.mode === 'navigate' ? await cache.match('/index.html') : new Response('Offline', {status: 503}));
    }));
    return;
  }
  const refresh = fetch(e.request).then(async res => {
    if (res.ok) await (await cachePromise).put(e.request, res.clone());
    return res;
  });
  e.waitUntil(refresh.then(() => {}, () => {}));
  e.respondWith(cachePromise.then(cache => cache.match(e.request)).then(hit => {
    if (hit) return hit;
    return refresh.catch(async () => {
      if (e.request.mode === 'navigate') return (await cachePromise).match('/index.html');
      return new Response('Offline', {status: 503, headers: {'Content-Type': 'text/plain'}});
    });
  }));
});
