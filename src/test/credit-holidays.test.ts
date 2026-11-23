import { describe, expect, it } from "vitest";
import { buildStatement, buildFsspStatement, emailBody, emailSubject, statementToText } from "@/lib/statement";
import { emptyContract } from "@/lib/nbki-parser";
import { documentPerson, emptyFssp, emptyPerson, graceStartDate, type Agency, type Service } from "@/lib/types";

const person = { ...emptyPerson(), fullName: "Иванов Иван Иванович", previousPassport: "серия 0002 № 000002" };
const c = emptyContract({ creditorName: "ПАО Сбербанк", number: "77", date: "01.01.2020" });
const service: Service = { basis: "art1", contractDate: "01.05.2026", unit: "ВНГ РФ" };
const auto: Service = { ...service, basis: "art1_auto", vehicleModel: "Lada Vesta", vehicleVin: "XTA12000000901234", pledgeContract: "№ P-77 от 01.01.2020" };

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
    expect(t).toContain("Lada Vesta"); expect(t).toContain("XTA12000000901234"); expect(t).toContain("№ P-77 от 01.01.2020");
  });
  it("preserves the pledge and prohibits car repossession during the holiday", () => {
    const t = statementToText(buildStatement(person, auto, c));
    expect(t).toContain("на прежних условиях"); expect(t).toContain("не изымать автомобиль"); expect(t).toContain("ч. 14 ст. 6");
  });
  it("does not include preserved vehicle fields when the unsecured variant is selected", () => {
    const t = statementToText(buildStatement(person, { ...auto, basis: "art1" }, c));
    expect(t).not.toContain("Lada Vesta"); expect(t).not.toContain("XTA12000000901234");
  });
  it("uses a holiday requirement for car-variant email and copy", () => {
    expect(emailSubject(person, auto, c)).toContain("Требование о льготном периоде");
    expect(emailBody(person, auto, c)).toContain("требование о предоставлении льготного периода");
  });
});

describe("Agency-specific wording", () => {
  const phrases: Record<Agency, string> = {
    mod: "мною заключен контракт о прохождении военной службы в Вооруженных Силах Российской Федерации",
    vng: "мною заключен контракт о прохождении военной службы (службы) в войсках национальной гвардии Российской Федерации (ВНГ РФ)",
    other: "мною заключен контракт о прохождении военной службы (службы) / пребывании в добровольческом формировании",
  };
  it.each(Object.entries(phrases))("uses the agreed phrase for agency %s in creditor and FSSP statements", (agency, phrase) => {
    const s: Service = { ...service, agency: agency as Agency };
    expect(statementToText(buildStatement(person, s, c))).toContain(phrase);
    expect(statementToText(buildFsspStatement(person, s, emptyFssp(), [c]))).toContain(phrase);
  });
  it("defaults to the Rosgvardia phrase when no agency is chosen", () => {
    expect(statementToText(buildStatement(person, service, c))).toContain(phrases.vng);
  });
  it.each([service, { ...service, basis: "art2_1" as const }, { ...service, basis: "art2" as const }])("lists the universal SVO certificate wording in attachments for $basis", (s) => {
    const t = statementToText(buildStatement(person, s, c));
    expect(t).toContain("Копия справки об участии в специальной военной операции (СВО) установленного образца.");
  });
  it("lists the universal SVO certificate wording in the FSSP attachments", () => {
    expect(statementToText(buildFsspStatement(person, service, emptyFssp(), [c]))).toContain("Копия справки об участии в специальной военной операции (СВО) установленного образца.");
  });
});

describe("Optional document data", () => {
  const disabled = { ...person, previousPassportEnabled: false };
  it("excludes previous passport from creditor documents when disabled without deleting entered data", () => {
    expect(statementToText(buildStatement(disabled, service, c))).not.toContain("000002");
    expect(disabled.previousPassport).toContain("000002");
    expect(documentPerson(disabled).previousPassport).toBe("");
  });
  it("excludes previous passport from FSSP archive searches when disabled", () => {
    const t = statementToText(buildFsspStatement(disabled, service, emptyFssp(), [c]));
    expect(t).not.toContain("000002"); expect(t).not.toContain("по прежним паспортным");
  });
  it("suspends, rather than terminates, proceedings for holidays", () => {
    const s = buildFsspStatement(person, auto, emptyFssp(), [c]);
    expect(s.requests[2]).toContain("Приостановить");
    expect(s.requests[2]).toContain("ст. 1 Федерального закона № 377-ФЗ");
    expect(s.requests[2]).not.toContain("ст. 2.1");
  });
});