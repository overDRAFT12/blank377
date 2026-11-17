/**
 * Локальное чтение PDF через pdfjs-dist. Модуль и воркер загружаются заранее
 * (preloadOfflineTools), чтобы мастер работал в авиарежиме после открытия страницы.
 */
type PdfJs = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PdfJs> | null = null;

function loadPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const [lib, worker] = await Promise.all([
        import("pdfjs-dist"),
        import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
      ]);
      // Сразу создаем воркер, чтобы его скрипт был загружен до отключения сети.
      lib.GlobalWorkerOptions.workerPort = new Worker(worker.default, { type: "module" });
      return lib;
    })().catch((e) => {
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
        const x = it.transform[4];
        const y = it.transform[5];
        let line = lines.find((l) => Math.abs(l.y - y) < 3);
        if (!line) {
          line = { y, parts: [] };
          lines.push(line);
        }
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
    void pdf.cleanup();
  }
  return pages.join("\n");
}
