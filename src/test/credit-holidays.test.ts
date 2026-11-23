import { describe, expect, it } from "vitest";
import { buildStatement, buildFsspStatement, emailBody, emailSubject, statementToText } from "@/lib/statement";
import { emptyContract } from "@/lib/nbki-parser";
import { documentPerson, emptyFssp, emptyPerson, graceStartDate, type Service } from "@/lib/types";

const person = { ...emptyPerson(), fullName: "Иванов Иван Иванович", previousPassport: "серия 4500 № 333444" };
const c = emptyContract({ creditorName: "ПАО Сбербанк", number: "77", date: "01.01.2020" });
const service: Service = { basis: "art1", contractDate: "01.05.2026", unit: "в/ч 12345" };
const auto: Service = { ...service, basis: "art1_auto", vehicleModel: "Lada Vesta", vehicleVin: "XTA12345678901234", pledgeContract: "№ P-77 от 01.01.2020" };

describe("Credit holiday statement rules", () => {
  it("defaults the start date to the contract date", () => expect(graceStartDate(service)).toBe("01.05.2026"));
  it("uses an explicitly changed start date", () => expect(graceStartDate({ ...service, graceStartDate: "15.05.2026" })).toBe("15.05.2026"));
  it.each([service, auto])("requests service duration plus 180 days for $basis", (s) => {
    const statement = buildStatement(person, s, c);
    expect(statement.requests[0]).toContain("180 дней");
    expect(statement.requests[0]).toContain("с 01.05.2026");
  });
  it("treats 31.12.2026 as the submission deadline, not the end of the holiday", () => {
    const t = statementToText(buildStatement(person, service, c));
    expect(t).toContain("не позднее 31.12.2026");
    expect(t).toContain("не датой окончания льготного периода");
  });
  it("requests cessation of penalties via the applicable 106-ФЗ provisions", () => expect(statementToText(buildStatement(person, service, c))).toContain("ч. 14 ст. 6 Федерального закона № 106-ФЗ"));
  it.each([service, auto])("terminates holiday interest under art. 18.1 for $basis", (s) => expect(statementToText(buildStatement(person, s, c))).toContain("ч. 18.1 ст. 1"));
  it("requests an amended payment schedule within ten days", () => expect(statementToText(buildStatement(person, service, c))).toContain("в течение 10 дней"));
  it("identifies the pledged car and separate pledge contract", () => {
    const t = statementToText(buildStatement(person, auto, c));
    expect(t).toContain("Lada Vesta"); expect(t).toContain("XTA12345678901234"); expect(t).toContain("№ P-77 от 01.01.2020");
  });
  it("preserves the pledge and prohibits car repossession during the holiday", () => {
    const t = statementToText(buildStatement(person, auto, c));
    expect(t).toContain("на прежних условиях"); expect(t).toContain("не изымать автомобиль"); expect(t).toContain("ч. 14 ст. 6");
  });
  it("does not include preserved vehicle fields when the unsecured variant is selected", () => {
    const t = statementToText(buildStatement(person, { ...auto, basis: "art1" }, c));
    expect(t).not.toContain("Lada Vesta"); expect(t).not.toContain("XTA12345678901234");
  });
  it("uses a holiday requirement for car-variant email and copy", () => {
    expect(emailSubject(person, auto, c)).toContain("Требование о льготном периоде");
    expect(emailBody(person, auto, c)).toContain("требование о предоставлении льготного периода");
  });
});

describe("Optional document data", () => {
  const disabled = { ...person, previousPassportEnabled: false };
  it("excludes previous passport from creditor documents when disabled without deleting entered data", () => {
    expect(statementToText(buildStatement(disabled, service, c))).not.toContain("333444");
    expect(disabled.previousPassport).toContain("333444");
    expect(documentPerson(disabled).previousPassport).toBe("");
  });
  it("excludes previous passport from FSSP archive searches when disabled", () => {
    const t = statementToText(buildFsspStatement(disabled, service, emptyFssp(), [c]));
    expect(t).not.toContain("333444"); expect(t).not.toContain("по прежним паспортным");
  });
  it("suspends, rather than terminates, proceedings for holidays", () => {
    const s = buildFsspStatement(person, auto, emptyFssp(), [c]);
    expect(s.requests[2]).toContain("Приостановить");
    expect(s.requests[2]).toContain("ст. 1 Федерального закона № 377-ФЗ");
    expect(s.requests[2]).not.toContain("ст. 2.1");
  });
});