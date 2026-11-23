/** Verify the PDF.js handshake before handing a port to PDFWorker.fromPort. */
export function startLocalPdfWorker(url: string): Promise<Worker> {
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(url, { type: "module" });
    } catch (error) {
      reject(error);
      return;
    }
    const cleanup = () => {
      clearTimeout(timer);
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
      worker.removeEventListener("messageerror", onMessageError);
    };
    const fail = (error: unknown) => {
      cleanup();
      worker.terminate();
      reject(error);
    };
    const onError = (event: ErrorEvent) => {
      // Browsers may redact a failed module's details; preserve the event rather than inventing a cause.
      fail(event.error ?? event);
    };
    const onMessageError = () => fail(new Error("PDF worker message could not be deserialized"));
    const onMessage = (event: MessageEvent) => {
      if (event.data?.sourceName !== "worker" || event.data?.targetName !== "main" || event.data?.action !== "test") return;
      if (!event.data.data) {
        fail(new Error("PDF worker rejected the transferable-buffer handshake"));
        return;
      }
      cleanup();
      resolve(worker);
    };
    const timer = setTimeout(() => fail(new Error(`PDF worker startup timed out: ${url}`)), 10000);
    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.addEventListener("messageerror", onMessageError);
    try {
      const data = new Uint8Array();
      worker.postMessage({ sourceName: "main", targetName: "worker", action: "test", data }, [data.buffer]);
    } catch (error) {
      fail(error);
    }
  });
}