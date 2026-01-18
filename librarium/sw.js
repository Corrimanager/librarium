/* sw.js — Librarium PWA */
const CACHE_NAME = "librarium-cache-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./sw.js"
];

// Instalación: precache básico
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activación: limpiar caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first para assets; network fallback
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Solo GET
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // cachear recursos "mismos-origen" que sean OK
          const url = new URL(req.url);
          if (url.origin === self.location.origin && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          // Si no hay red, al menos devuelve index (para volver a abrir)
          return caches.match("./index.html");
        });
    })
  );
});
