const CACHE_NAME = "inpectpro-cache-v1";

// Asset statis yang penting untuk di-cache agar aplikasi bisa diakses offline
const ASSETS_TO_CACHE = [
  "/",
  "/login",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

// Install Event: Cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching core assets");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event: Cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[Service Worker] Clearing old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network-first falling back to cache
self.addEventListener("fetch", (event) => {
  // Hanya tangani request GET
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Jangan cache data API atau Supabase request
  if (url.pathname.startsWith("/api") || url.host.includes("supabase.co")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Jika sukses, salin response ke cache untuk file statis
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Jika offline, coba ambil dari cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Jika request untuk halaman navigasi, arahkan ke login sebagai default fallback
          if (event.request.mode === "navigate") {
            return caches.match("/login");
          }
        });
      })
  );
});
