import { describe, expect, it } from "vitest";
import { parseNbkiText, parsePerson } from "../lib/nbki-parser";

const identity = `Субъект кредитной истории
Фамилия ИВАНОВ
Имя ИВАН
Отчество ИВАНОВИЧ
Дата рождения 12.03.1990`;
const passport = `Документ, удостоверяющий личность
Паспорт гражданина РФ
Серия 0000 Номер 000000
Дата выдачи 01.04.2020
Кем выдан ГУ МВД РОССИИ ПО ТЕСТОВОЙ ОБЛАСТИ
Код подразделения 000-001`;
const old = `Ранее выданные документы
Паспорт Серия 0001 Номер 000001
Дата выдачи 02.05.2010
Кем выдан ОУФМС РОССИИ ПО ТЕСТОВОЙ ОБЛАСТИ
Код подразделения 000-002`;
const contracts = `Обязательства
УИД 12000000-1111-2222-3333-444455556666-1
Полное наименование источника ПАО Сбербанк
ИНН 7707083893 ОГРН 1027700132195
Номер договора TEST-0001
Дата заключения 15.06.2021
Статус Активный`;

describe("NBKI current passport boundary", () => {
  it("uses the current series and number, not previously issued documents", () => {
    const p = parsePerson(`${identity}\n${passport}\n${old}`);
    expect(p.passportSeries).toBe("0000");
    expect(p.passportNumber).toBe("000000");
  });
  it("does not overwrite the current issue date with the old passport date", () => {
    expect(parsePerson(`${identity}\n${passport}\n${old}`).passportIssueDate).toBe("01.04.2020");
  });
  it("does not overwrite the current department code with the old passport code", () => {
    expect(parsePerson(`${identity}\n${passport}\n${old}`).passportCode).toBe("000-001");
  });
  it("does not borrow absent fields from previous documents or later contact fields", () => {
    const p = parsePerson(`${identity}\nПаспорт Серия 0000 Номер 000000\n${old}\nКонтактные данные\nДата выдачи 03.06.2011\nКод подразделения 000-003`);
    expect(p.passportIssueDate).toBe("");
    expect(p.passportCode).toBe("");
    expect(p.passportIssuedBy).toBe("");
  });
  it("also stops at «Предыдущие документы»", () => {
    expect(parsePerson(`${identity}\nПаспорт Серия 0000 Номер 000000\n${old.replace("Ранее выданные", "Предыдущие")}`).passportCode).toBe("");
  });
  it("only reads the first identity document even without a previous-documents heading", () => {
    expect(parsePerson(`${identity}\nПаспорт Серия 0000 Номер 000000\nПаспорт Серия 0001 Номер 000001\nДата выдачи 02.05.2010\nКод подразделения 000-002`).passportIssueDate).toBe("");
  });
});

describe("Passport tables and exact values", () => {
  it("reads series and number from a table row", () => {
    const p = parsePerson(`${identity}\nПаспорт\nСерия Номер Дата выдачи Код подразделения Кем выдан Гражданство Обновлено\n0000 000000 01.04.2020 000-001 ГУ МВД РОССИИ ПО ТЕСТОВОЙ ОБЛАСТИ РОССИЯ 23.11.2026`);
    expect(p.passportSeries).toBe("0000");
    expect(p.passportNumber).toBe("000000");
    expect(p.passportIssueDate).toBe("01.04.2020");
    expect(p.passportCode).toBe("000-001");
  });
  it("does not confuse a table's update date with its issue date", () => {
    expect(parsePerson(`${identity}\nПаспорт\nСерия Номер Обновлено Дата выдачи Кем выдан\n0000 000000 23.11.2026 01.04.2020 ГУ МВД РОССИИ`).passportIssueDate).toBe("01.04.2020");
  });
  it("does not take birth or update dates when the passport issue date is absent", () => {
    expect(parsePerson(`${identity}\nПаспорт Серия 0000 Номер 000000\nДата выдачи\nОбновлено 23.11.2026`).passportIssueDate).toBe("");
  });
  it("does not borrow an update date from an incomplete passport table", () => {
    expect(parsePerson(`${identity}\nПаспорт\nСерия Номер Дата выдачи Обновлено\n0000 000000 — 23.11.2026`).passportIssueDate).toBe("");
  });
  it("only looks for the issue date after the passport number", () => {
    expect(parsePerson(`${identity}\nПаспорт\nДата выдачи 23.11.2026\nСерия 0000 Номер 000000`).passportIssueDate).toBe("");
  });
  it("does not mistake SNILS for a department code", () => {
    expect(parsePerson(`${identity}\nПаспорт Серия 0000 Номер 000000\nСНИЛС 000-000-000 00`).passportCode).toBe("");
  });
  it("removes column headers from the issuing authority", () => {
    expect(parsePerson(`${identity}\nПаспорт Серия 0000 Номер 000000\nКем выдан Действ. до Гражданство Обновлено Код подразделения Дата выдачи\nТП УФМС РОССИИ ПО ТЕСТОВОЙ ОБЛАСТИ 01.04.2020 000-001`).passportIssuedBy).toBe("ТП УФМС РОССИИ ПО ТЕСТОВОЙ ОБЛАСТИ");
  });
  it.each(["ГУ МВД", "УМВД", "МВД", "ОУФМС", "ТП УФМС", "ОТДЕЛОМ"])("recognizes %s as an issuer rather than table labels", (issuer) => {
    expect(parsePerson(`${identity}\nПаспорт Серия 0000 Номер 000000\nКем выдан ${issuer} РОССИИ Обновлено 23.11.2026`).passportIssuedBy).toBe(`${issuer} РОССИИ`);
  });
});

describe("Subject personal and contact data", () => {
  it("leaves a missing birthplace empty", () => expect(parsePerson(identity).birthPlace).toBe(""));
  it("does not return the subject's name as birthplace", () => {
    expect(parsePerson(`${identity}\nМесто рождения\nИВАНОВ ИВАН ИВАНОВИЧ`).birthPlace).toBe("");
  });
  it("does not return merged name and place data", () => {
    expect(parsePerson(`${identity}\nМесто рождения ИВАНОВ ИВАН ИВАНОВИЧ г. Тула`).birthPlace).toBe("");
  });
  it("does not return citizenship as birthplace", () => {
    expect(parsePerson(`${identity}\nМесто рождения РОССИЯ`).birthPlace).toBe("");
  });
  it("preserves an unambiguous birthplace", () => {
    expect(parsePerson(`${identity}\nМесто рождения г. Тула Гражданство РОССИЯ`).birthPlace).toBe("г. Тула");
  });
  it("reads SNILS from the subject's contact data after old documents", () => {
    expect(parsePerson(`${identity}\n${passport}\n${old}\nСНИЛС 000-000-000 00`).snils).toBe("000-000-000 00");
  });
  it("reads a twelve-digit individual INN", () => {
    expect(parsePerson(`${identity}\nИНН физического лица\n000000000000`).inn).toBe("000000000000");
  });
  it("reads INN next to SNILS in a subject identifier table", () => {
    const p = parsePerson(`${identity}\nСНИЛС ИНН\n000-000-000 00 000000000000`);
    expect(p.inn).toBe("000000000000");
    expect(p.snils).toBe("000-000-000 00");
  });
  it("does not borrow the creditor's INN even with a short subject block", () => {
    expect(parsePerson(`ФИО Иванов Иван Иванович\n${contracts}\nИНН физического лица 000000000001`).inn).toBe("");
  });
  it("reads registration address without the adjacent phone header or value", () => {
    expect(parsePerson(`${identity}\n${passport}\n${old}\nАдрес регистрации Телефон\n000000, г. Тула, ул. Тестовая, д. 0\nТелефон +7 (000) 000-00-00`).address).toBe("000000, г. Тула, ул. Тестовая, д. 0");
  });
  it("does not change contracts when passport details change", () => {
    const a = parseNbkiText(`${identity}\n${passport}\n${contracts}`).contracts.map(({ id, ...c }) => c);
    const b = parseNbkiText(`${identity}\n${passport}\n${old}\n${contracts}`).contracts.map(({ id, ...c }) => c);
    expect(a).toEqual(b);
    expect(a[0]?.number).toBe("TEST-0001");
    expect(a[0]?.creditorName).toBe("ПАО Сбербанк");
  });
});