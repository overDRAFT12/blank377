import { describe, expect, it } from "vitest";
import { canGenerateCivilian, civilianDocumentCount } from "@/lib/collection";
import { emptyPropertyPetition } from "@/lib/types";
import { buildPropertyPetition, PROPERTY_PETITION_FILE_NAME, PROPERTY_PETITION_REVIEW_DAYS, statementToText } from "@/lib/statement";
import { demoWizardData, emptyWizardData } from "@/lib/wizard-data";

describe("Civilian property petition", () => {
  it("requires confirmation of the debtor's property/income status", () => {
    const petition = emptyPropertyPetition();
    const options = { thirdParties: false, debtor: false, propertyPetition: true };
    expect(canGenerateCivilian(0, options, petition)).toBe(false);
    expect(() => buildPropertyPetition(emptyWizardData().person, petition)).toThrow();
    petition.confirmed = true;
    expect(canGenerateCivilian(0, options, petition)).toBe(true);
    expect(civilianDocumentCount(0, options, petition)).toBe(1);
  });
  it("adds one petition, not one per creditor, and excludes it when disabled", () => {
    const petition = { ...emptyPropertyPetition(), confirmed: true };
    expect(civilianDocumentCount(2, { thirdParties: true, debtor: true, propertyPetition: true }, petition)).toBe(5);
    expect(civilianDocumentCount(2, { thirdParties: true, debtor: true, propertyPetition: false }, petition)).toBe(4);
    expect(canGenerateCivilian(0, { thirdParties: false, debtor: false, propertyPetition: false }, petition)).toBe(false);
  });
  it("keeps each proceeding paired with its own opening date", () => {
    const { person } = demoWizardData();
    const petition = { ...emptyPropertyPetition(), confirmed: true, department: "Тестовый ОСП", address: "Тестовый адрес", bailiff: "Тестовый Пристав", cases: [
      { number: "№ 111/26/00001-ИП", openedDate: "01.10.2026" },
      { number: "222/26/00001-ИП", openedDate: "03.11.2026" },
    ] };
    const statement = buildPropertyPetition(person, petition, "23.11.2026");
    expect(statement.addressee.join("\n")).toContain(petition.department);
    expect(statement.addressee.join("\n")).toContain(petition.address);
    expect(statement.addressee.join("\n")).toContain(petition.bailiff);
    expect(statement.paragraphs.join("\n")).toContain("111/26/00001-ИП от 01.10.2026");
    expect(statement.paragraphs.join("\n")).toContain("222/26/00001-ИП от 03.11.2026");
    expect(statement.date).toBe("23.11.2026");
  });
  it("uses the requested filename and ten-day review period", () => {
    expect(PROPERTY_PETITION_FILE_NAME).toBe("Ходатайство_ФССП_ст46.docx");
    expect(PROPERTY_PETITION_REVIEW_DAYS).toBe(10);
  });
  it("does not use disabled passport data, email, service or creditors", () => {
    const { person } = demoWizardData();
    const statement = buildPropertyPetition({ ...person, previousPassport: "OLD-SECRET", phone: "TEST-PHONE" }, { ...emptyPropertyPetition(), confirmed: true });
    const text = statementToText(statement);
    expect(text).toContain(person.fullName);
    expect(text).toContain("TEST-PHONE");
    expect(text).not.toContain("OLD-SECRET");
    expect(text).not.toContain(person.email);
    expect(text).not.toContain("377-ФЗ");
    expect(text).not.toContain("Вымышленный банк");
  });
  it("clears petition values, dates and consent using fresh factories", () => {
    const data = emptyWizardData();
    data.propertyPetition.confirmed = true;
    data.propertyPetition.department = "PRIVATE";
    data.propertyPetition.cases.push({ number: "PRIVATE", openedDate: "01.01.2026" });
    expect(emptyWizardData().propertyPetition).toEqual({ department: "", address: "", bailiff: "", cases: [{ number: "", openedDate: "" }], confirmed: false });
    expect(emptyWizardData().propertyPetition).not.toBe(data.propertyPetition);
  });
});