/**
 * Локальное чтение PDF через pdfjs-dist. Модуль и воркер загружаются заранее
 * (preloadOfflineTools), чтобы мастер работал в авиарежиме после открытия страницы.
 */
type PdfJs = typeof import("pdfjs-dist");
import { startLocalPdfWorker } from "./pdf-worker";

let pdfjsPromise: Promise<PdfJs> | null = null;

function loadPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const [lib, worker, fallback] = await Promise.all([
        import("pdfjs-dist"),
        import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
        // Vite bundles this module; PDF.js never has to import an uncached URL for fallback.
        import("pdfjs-dist/build/pdf.worker.min.mjs"),
      ]);
      lib.GlobalWorkerOptions.workerSrc = worker.default;
      try {
        // Wait for actual startup: fromPort alone cannot detect a script loading failure.
        lib.GlobalWorkerOptions.workerPort = await startLocalPdfWorker(worker.default);
      } catch (error) {
        console.error("PDF-worker не запустился; используем локальное чтение в основном потоке. Причина:", error);
        lib.GlobalWorkerOptions.workerPort = null;
        const scope = globalThis as typeof globalThis & { pdfjsWorker?: { WorkerMessageHandler: unknown } };
        scope.pdfjsWorker = { WorkerMessageHandler: fallback.WorkerMessageHandler };
        // PDF.js uses its supported fake-worker path with the already loaded handler.
      }
      return lib;
    })().catch((e) => {
      console.error("Не удалось загрузить локальные модули чтения PDF. Причина:", e);
      pdfjsPromise = null;
      throw e;
    });
  }
  return pdfjsPromise;
}

let preloaded = false;
export function preloadOfflineTools() {
  if (preloaded || typeof window === "undefined") return;
  preloaded = true;
  void loadPdfJs().catch(() => {});
  void import("docx").catch(() => {});
  void import("jszip").catch(() => {});
}

type TextItem = { str: string; transform: number[]; hasEOL?: boolean };

export async function extractPdfText(data: ArrayBuffer): Promise<string> {
  const lib = await loadPdfJs();
  const pdf = await lib.getDocument({ data, isEvalSupported: false, disableFontFace: true }).promise;
  const pages: string[] = [];
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const lines: { y: number; parts: { x: number; s: string }[] }[] = [];
      for (const raw of content.items) {
        const it = raw as TextItem;
        if (typeof it.str !== "string" || !it.transform) continue;
        const x = it.transform[4] ?? 0;
        const y = it.transform[5] ?? 0;
        const existing = lines.find((l) => Math.abs(l.y - y) < 3);
        const line = existing ?? { y, parts: [] };
        if (!existing) lines.push(line);
        line.parts.push({ x, s: it.str });
      }
      lines.sort((a, b) => b.y - a.y);
      pages.push(
        lines
          .map((l) =>
            l.parts
              .sort((a, b) => a.x - b.x)
              .map((p) => p.s)
              .join(" ")
              .replace(/\s+/g, " ")
              .trim(),
          )
          .filter(Boolean)
          .join("\n"),
      );
      page.cleanup();
    }
  } finally {
    // The preloaded worker port is shared across uploads; destroy() would terminate it.
    await pdf.cleanup();
  }
  return pages.join("\n");
}
