import { describe, expect, it } from "vitest";
import { demoWizardData, emptyWizardData } from "@/lib/wizard-data";

describe("Fictional demo and full reset", () => {
  it("uses the requested fictional identity and two fictional creditors", () => {
    const data = demoWizardData();
    expect(data.person.fullName).toBe("Иванов Иван Иванович");
    expect(data.person.passportSeries).toBe("0000");
    expect(data.person.passportNumber).toBe("000000");
    expect(data.contracts).toHaveLength(2);
    expect(data.contracts.every((c) => c.creditorName.includes("Вымышленный") && c.selected && c.status === "active")).toBe(true);
  });
  it("fully clears personal, service, creditor and FSSP values with fresh objects", () => {
    const demo = demoWizardData();
    demo.person.previousPassport = "0000 000001";
    demo.service.vehicleVin = "DEMO";
    demo.fssp.cases = "DEMO";
    const clean = emptyWizardData();
    expect(Object.values(clean.person).filter((v) => typeof v === "string").every((v) => v === "")).toBe(true);
    expect(clean.contracts).toEqual([]);
    expect(clean.service).toEqual({ unit: "", contractDate: "", basis: "art2_1", agency: "vng" });
    expect(clean.fssp).toEqual({ enabled: true, department: "", address: "", bailiff: "", cases: "" });
    clean.person.fullName = "changed";
    expect(emptyWizardData().person.fullName).toBe("");
  });
});