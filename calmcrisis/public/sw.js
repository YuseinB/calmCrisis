// Simple offline-first cache with versioning
const CACHE = 'calmcrisis-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(caches.open(CACHE));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    // Cache only same-origin
    if (url.origin !== location.origin) return;

    event.respondWith(
        caches.open(CACHE).then(async cache => {
            const cached = await cache.match(req);
            if (cached) return cached;
            try {
                const fresh = await fetch(req);
                cache.put(req, fresh.clone());
                return fresh;
            } catch (e) {
                return cached || Response.error();
            }
        })
    );
});
