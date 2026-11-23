import { describe, expect, it } from "vitest";
import { collectionDocumentCount, refusalEligibilityDate, refusalTiming } from "@/lib/collection";
import { demoWizardData, emptyWizardData } from "@/lib/wizard-data";
import { buildCollectionStatement, statementToText } from "@/lib/statement";

describe("Collection eligibility and document selection", () => {
  it("requires four calendar months and accepts the exact anniversary", () => {
    expect(refusalTiming("23.07.2026", new Date(2026, 10, 22))).toBe("early");
    expect(refusalTiming("23.07.2026", new Date(2026, 10, 23))).toBe("eligible");
  });
  it("clamps month-end anniversaries without using 120 days", () => {
    expect(refusalEligibilityDate("31.10.2026")).toEqual(new Date(2027, 1, 28));
    expect(refusalTiming("31.10.2026", new Date(2027, 1, 27))).toBe("early");
  });
  it("handles invalid, missing, leap-year and future dates", () => {
    expect(refusalTiming("31.02.2026")).toBe("invalid");
    expect(refusalTiming("")).toBe("missing");
    expect(refusalEligibilityDate("29.02.2024")).toEqual(new Date(2024, 5, 29));
    expect(refusalTiming("23.12.2026", new Date(2026, 10, 23))).toBe("early");
  });
  it("creates one or both statements per creditor without a service prerequisite", () => {
    const { contracts } = demoWizardData();
    expect(collectionDocumentCount(contracts, { thirdParties: true, debtor: false })).toBe(2);
    expect(collectionDocumentCount(contracts, { thirdParties: false, debtor: true })).toBe(2);
    expect(collectionDocumentCount(contracts, { thirdParties: true, debtor: true })).toBe(4);
    expect(collectionDocumentCount(contracts, { thirdParties: false, debtor: false })).toBe(0);
  });
  it("includes identity, phone and contract identifiers without disabled passport or email", () => {
    const { person, contracts } = demoWizardData();
    const c = contracts[0];
    if (!c) throw new Error("Fixture contract missing");
    const p = { ...person, phone: "+7 000 000-00-00", previousPassport: "PRIVATE-OLD" };
    const s = buildCollectionStatement(p, { ...c, uid: "TEST-UID" }, "thirdParties", "23.11.2026");
    expect(s.sender.join("\n")).toContain(p.phone);
    expect(s.sender.join("\n")).toContain(p.passportSeries);
    expect(s.paragraphs.join("\n")).toContain("TEST-UID");
    expect(s.paragraphs.join("\n")).toContain(c.number);
    expect(statementToText(s)).not.toContain("PRIVATE-OLD");
    expect(statementToText(s)).not.toContain(p.email);
  });
  it("preserves the entered overdue date and allows early refusals to be generated", () => {
    const { person, contracts } = demoWizardData();
    const c = contracts[0];
    if (!c) throw new Error("Fixture contract missing");
    const statement = buildCollectionStatement(person, { ...c, overdueDate: "22.11.2026" }, "debtor");
    expect(statement.paragraphs.join("\n")).toContain("22.11.2026");
    expect(statementToText(statement)).not.toContain("377-ФЗ");
    expect(statementToText(statement)).not.toContain("СВО");
  });
  it("resets the category, options and overdue dates along with all personal data", () => {
    const data = demoWizardData();
    data.collection.debtor = true;
    data.category = "civilian";
    const c = data.contracts[0];
    if (c) c.overdueDate = "01.01.2026";
    const fresh = emptyWizardData();
    expect(fresh.category).toBe("military");
    expect(fresh.collection).toEqual({ thirdParties: true, debtor: false });
    expect(fresh.contracts).toEqual([]);
  });
});