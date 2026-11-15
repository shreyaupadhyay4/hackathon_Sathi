// Offline shell: stale-while-revalidate for app files. API calls are never cached here
// (the app keeps its own "last nearby list" in localStorage).
const V = 'aapatkaal-v14';
const SHELL = ['/', '/index.html', '/app.js', '/style.css', '/firstaid.json', '/manifest.json', '/icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api') || u.pathname.startsWith('/t/')) return;
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(res => {
      if (res.ok) caches.open(V).then(c => c.put(e.request, res.clone()));
      return res;
    }).catch(() => hit || caches.match('/index.html'));
    return hit || net;
  }));
});
