// @vitest-environment node
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const worker = readFileSync(new URL("../../public/offline-worker.js", import.meta.url), "utf8");
const allowed = (url: string): boolean =>
  runInNewContext(`${worker}\nisPublicFile(new URL(input))`, {
    URL,
    input: url,
    self: { location: { origin: "https://example.invalid" }, addEventListener: () => {} },
  }) as boolean;

describe("Offline cache privacy boundary", () => {
  it("accepts local font and PDF worker assets", () => {
    expect(allowed("https://example.invalid/assets/inter.woff2")).toBe(true);
    expect(allowed("https://example.invalid/assets/pdf.worker.min.mjs")).toBe(true);
  });
  it("rejects external resources", () =>
    expect(allowed("https://external.invalid/font.woff2")).toBe(false));
  it("rejects API and server-function responses", () => {
    expect(allowed("https://example.invalid/api/private/document.json")).toBe(false);
    expect(allowed("https://example.invalid/__server/functions/test.js")).toBe(false);
  });
});
