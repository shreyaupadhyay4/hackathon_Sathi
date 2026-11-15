// Offline shell: stale-while-revalidate for app files. API calls are never cached here
// (the app keeps its own "last nearby list" in localStorage).
const V = 'aapatkaal-v18';
const SHELL = ['/', '/index.html', '/app.js', '/style.css', '/firstaid.json', '/manifest.json', '/icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api') || u.pathname.startsWith('/t/')) return;
  const cachePromise = caches.open(V);
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
