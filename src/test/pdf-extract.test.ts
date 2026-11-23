import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  start: vi.fn(),
  options: { workerSrc: "", workerPort: null as unknown },
  handler: {},
  getDocument: vi.fn(),
}));
vi.mock("../lib/pdf-worker", () => ({ startLocalPdfWorker: mocks.start }));
vi.mock("pdfjs-dist", () => ({ GlobalWorkerOptions: mocks.options, getDocument: mocks.getDocument }));
vi.mock("pdfjs-dist/build/pdf.worker.min.mjs?url", () => ({ default: "/assets/pdf.worker.min.mjs" }));
vi.mock("pdfjs-dist/build/pdf.worker.min.mjs", () => ({ WorkerMessageHandler: mocks.handler }));

afterEach(() => { vi.restoreAllMocks(); vi.resetModules(); });

describe("PDF extraction fallback", () => {
  it("reads with an in-memory handler after startup failure and logs the exact cause", async () => {
    const error = new Error("Worker unavailable in airplane mode");
    mocks.start.mockRejectedValueOnce(error);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const cleanup = vi.fn().mockResolvedValue(undefined);
    mocks.getDocument.mockReturnValueOnce({ promise: Promise.resolve({
      numPages: 1,
      getPage: async () => ({ getTextContent: async () => ({ items: [{ str: "Иванов Иван Иванович", transform: [1, 0, 0, 1, 0, 10] }] }), cleanup: vi.fn() }),
      cleanup,
    }) });
    const { extractPdfText } = await import("../lib/pdf-extract");
    const data = new ArrayBuffer(8);
    expect(await extractPdfText(data)).toBe("Иванов Иван Иванович");
    expect(mocks.options.workerPort).toBeNull();
    expect(mocks.options.workerSrc).toBe("/assets/pdf.worker.min.mjs");
    expect((globalThis as typeof globalThis & { pdfjsWorker?: { WorkerMessageHandler: unknown } }).pdfjsWorker?.WorkerMessageHandler).toBe(mocks.handler);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Причина:"), error);
    expect(mocks.getDocument).toHaveBeenCalledWith({ data, isEvalSupported: false, disableFontFace: true });
    expect(cleanup).toHaveBeenCalledOnce();
  });
});