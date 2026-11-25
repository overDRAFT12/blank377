import { describe, expect, it } from "vitest";
import { canRegisterOfflineWorker } from "@/lib/offline";

const base = { prod: true, inIframe: false, hostname: "blank377.lovable.app", search: "" };
describe("Offline worker registration guard", () => {
  it("registers on the published site", () => expect(canRegisterOfflineWorker(base)).toBe(true));
  it("never registers in dev", () => expect(canRegisterOfflineWorker({ ...base, prod: false })).toBe(false));
  it("never registers in the editor preview", () => {
    expect(canRegisterOfflineWorker({ ...base, inIframe: true })).toBe(false);
    expect(canRegisterOfflineWorker({ ...base, hostname: "id-preview--abc.lovable.app" })).toBe(false);
    expect(canRegisterOfflineWorker({ ...base, hostname: "x.lovableproject.com" })).toBe(false);
  });
  it("honours the ?sw=off kill switch", () => expect(canRegisterOfflineWorker({ ...base, search: "?sw=off" })).toBe(false));
});
