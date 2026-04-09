// SuperFinz Service Worker — fast launch caching (not full offline)
const CACHE = "superfinz-v1";
const PRECACHE = ["/manifest.json", "/favicon.ico", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  // Skip non-GET, API calls, and Next.js internal routes
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("/api/") || e.request.url.includes("/_next/")) return;

  // Static assets: cache-first
  const url = new URL(e.request.url);
  if (PRECACHE.some((p) => url.pathname === p)) {
    e.respondWith(caches.match(e.request).then((cached) => cached ?? fetch(e.request)));
    return;
  }

  // Pages: network-first, fall through on failure
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
