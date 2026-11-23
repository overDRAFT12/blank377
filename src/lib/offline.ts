/** Cache only public application files; user-entered data never enters this cache. */
export async function prepareOfflineShell() {
  if (!("serviceWorker" in navigator)) return;
  await navigator.serviceWorker.register("/offline-worker.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  if (!navigator.serviceWorker.controller) {
    await new Promise<void>((resolve) =>
      navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }),
    );
  }
  const urls = performance.getEntriesByType("resource").map((entry) => entry.name);
  navigator.serviceWorker.controller?.postMessage({ type: "WARM_PUBLIC_FILES", urls });
}
