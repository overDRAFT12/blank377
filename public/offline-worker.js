// Retired worker: removes the old cache and unregisters itself. The app now uses /sw.js.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.allSettled(keys.filter((k) => k.startsWith("blank377-public-")).map((k) => caches.delete(k)));
      } finally {
        await self.registration.unregister();
      }
    })(),
  ),
);
