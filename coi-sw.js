// Cross-Origin Isolation Service Worker for Multi-Threaded WASM SIMD (SharedArrayBuffer)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.cache === "only-if-cached" && req.mode !== "same-origin") return;
  const dest = req.destination;
  if (req.mode === "navigate" || dest === "document" || dest === "worker" || dest === "sharedworker") {
    event.respondWith(
      fetch(req).then((res) => {
        if (!res || res.status === 0 || res.type === "opaque") return res;
        const headers = new Headers(res.headers);
        headers.set("Cross-Origin-Embedder-Policy", "credentialless");
        headers.set("Cross-Origin-Opener-Policy", "same-origin");
        headers.set("Cross-Origin-Resource-Policy", "cross-origin");
        return new Response(res.body, {
          status: res.status,
          statusText: res.statusText,
          headers,
        });
      })
    );
  }
});
