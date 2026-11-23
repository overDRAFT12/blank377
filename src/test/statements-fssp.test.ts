import { describe, expect, it } from "vitest";
import { parseNbkiText } from "@/lib/nbki-parser";
import { buildFsspStatement, buildStatement, statementToText, FSSP_FILE_NAME } from "@/lib/statement";
import { emptyFssp } from "@/lib/types";

const REPORT = `Фамилия ИВАНОВ
Имя ИВАН
Отчество ИВАНОВИЧ
Дата рождения 05.05.1985
Паспорт гражданина РФ
Серия 0000 Номер 000001
Дата выдачи 10.06.2015
Кем выдан УМВД РОССИИ ПО ТУЛЬСКОЙ ОБЛ.
Код подразделения 710-002
Ранее выданные документы
Паспорт гражданина РФ Серия 0001 Номер 000002
Дата выдачи 01.02.2005
Кем выдан ОВД СОВЕТСКОГО Р-НА Г. ТУЛЫ
Адрес регистрации 300001, г. Тула, ул. Мира, д. 3
Телефон +7 (000) 000-00-00
Электронная почта ivanov@example.invalid
УИд договора 1a2b3c4d-1111-2222-3333-444455556666-7
Полное наименование источника ПАО Сбербанк
ИНН 7707083893 ОГРН 1027700132195
Номер договора TEST-0001
Дата заключения 15.06.2021
Статус договора Активный`;

const { person, contracts } = parseNbkiText(REPORT);
const service = { unit: "ВНГ РФ", contractDate: "10.01.2026", basis: "art2_1" as const };

describe("Previous passport from the NBKI report", () => {
  it("reads the old passport from «Ранее выданные документы»", () => {
    expect(person.previousPassport).toContain("серия 0001 № 000002");
    expect(person.previousPassport).toContain("01.02.2005");
  });
  it("keeps the current passport as the main one", () => {
    expect(person.passportSeries).toBe("0000");
    expect(person.passportNumber).toBe("000001");
    expect(person.address).toContain("ул. Мира");
  });
});

describe("Creditor statement under art. 2.1", () => {
  const c = { ...(contracts[0] ?? (() => { throw new Error("Missing synthetic contract"); })()), courtAct: "Судебный приказ № 2-1/2024 от 01.03.2024" };
  const s = buildStatement(person, service, c, "20.11.2026");
  const t = statementToText(s);

  it("header names creditor with INN/OGRN and the old passport", () => {
    expect(s.addressee[0]).toBe("В ПАО Сбербанк, ИНН 7707083893, ОГРН 1027700132195");
    expect(t).toContain("ранее выдавался паспорт серия 0001 № 000002");
    expect(t).toContain("Тел.: +7 (000) 000-00-00");
  });
  it("title cites 377-ФЗ as amended by 156-ФЗ of 25.05.2026", () => {
    expect(s.subtitle).toBe(
      "о прекращении кредитных обязательств (обязательств по договору займа) на основании ст. 2.1 Федерального закона от 07.10.2022 № 377-ФЗ (в редакции Федерального закона от 25.05.2026 № 156-ФЗ)",
    );
  });
  it("mentions the court act before 1 May 2026 and the user's details", () => {
    expect(t).toContain("До 1 мая 2026 года");
    expect(t).toContain("Судебный приказ № 2-1/2024 от 01.03.2024");
    expect(t).toContain("УИД 1a2b3c4d-1111-2222-3333-444455556666-7");
  });
  it("has the four requests in order", () => {
    expect(s.requests).toHaveLength(4);
    expect(s.requests[0]).toContain("10 000 000");
    expect(s.requests[1]).toContain("отозвать исполнительный документ");
    expect(s.requests[2]).toContain("НБКИ");
    expect(s.requests[3]).toContain("ivanov@example.invalid");
  });
});

describe("FSSP statement", () => {
  const fssp = { ...emptyFssp(), department: "Центральный РОСП г. Тулы", address: "г. Тула, ул. Шухова, 1", cases: "123/24/71001-ИП, 456/25/71001-ИП" };
  const s = buildFsspStatement(person, service, fssp, contracts, "20.11.2026");
  const t = statementToText(s);

  it("is on by default and saved as Заявление_в_ФССП.docx", () => {
    expect(emptyFssp().enabled).toBe(true);
    expect(FSSP_FILE_NAME).toBe("Заявление_в_ФССП.docx");
  });
  it("asks to check archives including the previous passport", () => {
    expect(t).toContain("АИС ФССП России");
    expect(t).toContain("архивных");
    expect(t).toContain("серия 0001 № 000002");
  });
  it("cites art. 47, 46 and 43 of 229-ФЗ and lists the case numbers", () => {
    expect(t).toContain("п. 7 ч. 1 ст. 47 и п. 4 ч. 1 ст. 46");
    expect(t).toContain("п. 14 ч. 2 ст. 43");
    expect(t).toContain("№ 123/24/71001-ИП, № 456/25/71001-ИП");
    expect(t).toContain("Снять все аресты");
  });
});
