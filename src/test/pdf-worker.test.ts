import { afterEach, describe, expect, it, vi } from "vitest";
import { startLocalPdfWorker } from "../lib/pdf-worker";

class TestWorker extends EventTarget {
  static current: TestWorker | null = null;
  terminate = vi.fn();
  postMessage = vi.fn();
  constructor(public url: string, public options: WorkerOptions) {
    super();
    TestWorker.current = this;
  }
}

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("Local PDF worker startup", () => {
  it("waits for the PDF.js handshake on a local module worker", async () => {
    vi.stubGlobal("Worker", TestWorker);
    const pending = startLocalPdfWorker("/assets/pdf.worker.min.mjs");
    const worker = TestWorker.current;
    if (!worker) throw new Error("Expected worker");
    expect(worker.url).toBe("/assets/pdf.worker.min.mjs");
    expect(worker.options.type).toBe("module");
    expect(worker.postMessage).toHaveBeenCalledWith(expect.objectContaining({ action: "test", sourceName: "main" }), expect.any(Array));
    worker.dispatchEvent(new MessageEvent("message", { data: { sourceName: "worker", targetName: "main", action: "test", data: true } }));
    expect(await pending).toBe(worker);
    expect(worker.terminate).not.toHaveBeenCalled();
  });

  it("preserves the original worker launch error", async () => {
    const error = new Error("Worker blocked by CSP");
    vi.stubGlobal("Worker", class { constructor() { throw error; } });
    await expect(startLocalPdfWorker("/assets/pdf.worker.min.mjs")).rejects.toBe(error);
  });

  it("reports script loading errors and terminates the failed worker", async () => {
    vi.stubGlobal("Worker", TestWorker);
    const pending = startLocalPdfWorker("/assets/pdf.worker.min.mjs");
    const worker = TestWorker.current;
    if (!worker) throw new Error("Expected worker");
    const error = new Error("Offline worker asset missing");
    worker.dispatchEvent(new ErrorEvent("error", { error }));
    await expect(pending).rejects.toBe(error);
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it("falls back rather than hanging when startup never responds", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("Worker", TestWorker);
    const pending = startLocalPdfWorker("/assets/pdf.worker.min.mjs");
    const result = expect(pending).rejects.toThrow("PDF worker startup timed out");
    await vi.advanceTimersByTimeAsync(10000);
    await result;
    expect(TestWorker.current?.terminate).toHaveBeenCalledOnce();
  });
});