// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        // Static public/manifest.json is linked from __root; registration lives only in src/lib/offline.ts.
        manifest: false,
        injectRegister: null,
        registerType: "autoUpdate",
        filename: "sw.js",
        outDir: "dist/client",
        devOptions: { enabled: false },
        workbox: {
          globDirectory: "dist/client",
          globPatterns: ["**/*.{js,mjs,css,woff,woff2,png,jpg,jpeg,ico,svg,json,webmanifest}"],
          maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              // Public page shells only (SSR HTML has no personal data). Never API or OAuth.
              urlPattern: ({ request, url }) =>
                url.origin === self.location.origin &&
                request.method === "GET" &&
                !url.pathname.startsWith("/~oauth") &&
                !url.pathname.startsWith("/api/") &&
                !url.pathname.includes("_server") &&
                (request.mode === "navigate" || url.pathname === "/" || url.pathname === "/sozdat"),
              handler: "NetworkFirst",
              options: {
                cacheName: "blank377-pages",
                networkTimeoutSeconds: 4,
                matchOptions: { ignoreSearch: true },
                expiration: { maxEntries: 20 },
              },
            },
          ],
        },
      }),
    ],
  },
});
