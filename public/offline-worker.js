// Only public page shells and static files. Never cache POST, APIs or personal data.
const CACHE = "blank377-public-v1";
const SHELLS = ["/", "/sozdat"];
function isPublicFile(url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/") || url.pathname.includes("__server")) return false;
  return (
    /\.(?:js|mjs|tsx?|jsx|css|woff2?|png|jpe?g|ico|svg)$/.test(url.pathname) ||
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/node_modules/.vite/")
  );
}
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELLS))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("blank377-public-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("message", (event) => {
  if (event.data?.type !== "WARM_PUBLIC_FILES" || !Array.isArray(event.data.urls)) return;
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await Promise.all(
        event.data.urls
          .filter((url) => isPublicFile(new URL(url, self.location.origin)))
          .map(async (url) => {
            try {
              await cache.add(url);
            } catch {
              /* A failed asset can be retried on the next online load. */
            }
          }),
      );
    }),
  );
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  const shell = request.mode === "navigate" && SHELLS.includes(url.pathname) && !url.search;
  if (!shell && !isPublicFile(url)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (!shell) {
        const hit = await cache.match(request);
        if (hit) return hit;
      }
      try {
        const response = await fetch(request);
        if (response.ok && response.type === "basic") await cache.put(request, response.clone());
        return response;
      } catch (error) {
        const hit = await cache.match(shell ? url.pathname : request);
        if (hit) return hit;
        throw error;
      }
    })(),
  );
});
