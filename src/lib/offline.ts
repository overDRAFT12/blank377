/** The only place that registers the offline worker. It caches public app files, never user data. */
const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;
const LOVABLE_HOSTS = [".lovable.app", ".gpt-eng.com", ".gptengineer.run"];

export function canRegisterOfflineWorker(opts: { prod: boolean; inIframe: boolean; hostname: string; search: string }) {
  const host = opts.hostname.toLowerCase();
  const label = host.split(".")[0] ?? "";
  const lovable = LOVABLE_HOSTS.some((h) => host.endsWith(h));
  if (!opts.prod || opts.inIframe) return false;
  if (new URLSearchParams(opts.search).get("sw") === "off") return false;
  if (lovable && (PREVIEW_LABEL.test(label) || /^project--.+-dev$/.test(label))) return false;
  for (const d of ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"]) {
    if (host === d || host.endsWith(`.${d}`)) return false;
  }
  return true;
}

async function unregisterAppWorkers() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => /\/(sw|offline-worker)\.js$/.test(r.active?.scriptURL ?? r.installing?.scriptURL ?? r.waiting?.scriptURL ?? ""))
      .map((r) => r.unregister()),
  );
}

export async function prepareOfflineShell() {
  if (!("serviceWorker" in navigator)) return;
  let inIframe = true;
  try {
    inIframe = window.self !== window.top;
  } catch {
    /* cross-origin parent */
  }
  const allowed = canRegisterOfflineWorker({
    prod: import.meta.env.PROD,
    inIframe,
    hostname: window.location.hostname,
    search: window.location.search,
  });
  if (!allowed) {
    await unregisterAppWorkers();
    return;
  }
  // Retire the previous hand-written worker, then register the generated one.
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.filter((r) => r.active?.scriptURL.endsWith("/offline-worker.js")).map((r) => r.unregister()));
  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  // Warm both public page shells so they open without internet.
  await Promise.allSettled(["/", "/sozdat"].map((u) => fetch(u, { credentials: "same-origin" })));
}
