/// <reference lib="webworker" />

const CACHE_NAME = "xtratune-v1";

// App shell files to precache
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
];

// Install – precache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate – clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - Navigation requests: Network first, fall back to cached "/"
// - API requests (/api/*): Network only (never cache dynamic data)
// - Static assets (.js, .css, images): Stale-while-revalidate
// - Audio (saavn CDN): Network only (streaming, too large to cache)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET
  if (event.request.method !== "GET") return;

  // Skip audio/media streaming
  if (
    url.hostname.includes("saavncdn.com") ||
    url.hostname.includes("saavn.com") ||
    url.pathname.includes("/api/")
  ) {
    return;
  }

  // Navigation – network first, offline fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the latest copy of the page
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match("/").then((r) => r || new Response("Offline", { status: 503 })))
    );
    return;
  }

  // Static assets – stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          // Only cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // If network fails, stay with cache

      return cached || networkFetch;
    })
  );
});
