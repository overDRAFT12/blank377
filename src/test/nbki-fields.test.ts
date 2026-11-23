import { describe, expect, it } from "vitest";
import { parseNbkiText } from "@/lib/nbki-parser";
import { obligationFields } from "@/lib/nbki-fields";

describe("Supplemental NBKI fields without changing contract identity", () => {
  const report = `Субъект кредитной истории
Фамилия ИВАНОВ
Имя ИВАН
Паспорт Серия 4515 Номер 999888
Ранее выданные паспорта: Серия 4505 Номер 111222
Дата выдачи 01.02.2005
Кем выдан ОВД Г. МОСКВЫ
Паспорт Серия
4500
Номер
333444
Дата выдачи 01.01.2000
Адрес регистрации г. Москва
Обязательства
Полное наименование источника ООО МКК «Пример»
Номер договора: NB-77
Сумма обязательства:
120 500,25 RUB
УИД договора 12345678-1111-2222-3333-444455556666-1
Дата заключения 15.06.2021
ИНН физического лица 123456789012
Источник формирования кредитной истории
Полное наименование ООО МКК «Пример»
ИНН ОГРН
1234567890 1234567890123
Запросы
ИНН 9876543210 ОГРН 9876543210123`;
  const parsed = parseNbkiText(report);
  it("reads the opening contract number before the UID", () => expect(parsed.contracts[0]?.number).toBe("NB-77"));
  it("reads the opening obligation amount before the UID", () => expect(parsed.contracts[0]?.amount).toBe("120 500,25"));
  it("takes the creditor's ten-digit INN from the source section", () => expect(parsed.contracts[0]?.creditorInn).toBe("1234567890"));
  it("takes the creditor's thirteen-digit OGRN from the source section", () => expect(parsed.contracts[0]?.creditorOgrn).toBe("1234567890123"));
  it("preserves the current passport and reads inline previous passports", () => {
    expect(parsed.person.passportNumber).toBe("999888");
    expect(parsed.person.previousPassport).toContain("серия 4505 № 111222");
  });
  it("reads another previous passport whose series and number are on separate lines", () => expect(parsed.person.previousPassport).toContain("серия 4500 № 333444"));
  it("retains the original contract date and UID and ignores queries", () => {
    expect(parsed.contracts).toHaveLength(1);
    expect(parsed.contracts[0]?.date).toBe("15.06.2021");
    expect(parsed.contracts[0]?.uid).toBe("12345678-1111-2222-3333-444455556666-1");
  });
  it("does not take values from a later field when opening fields are empty", () => {
    const fields = obligationFields("Номер договора\nДата договора 01.01.2020\nСумма обязательства\nДата исполнения 02.01.2020", "");
    expect(fields.number).toBe("");
    expect(fields.amount).toBe("");
  });
  it("does not copy the preceding contract's number or amount", () => {
    const { contracts } = parseNbkiText(`Обязательства
Полное наименование источника ООО МКК «Пример»
УИД 12345678-1111-2222-3333-444455556666-1
Номер договора FIRST
Дата заключения 01.01.2020
Сумма обязательства 1000
ИНН 1234567890
Полное наименование источника ООО МКК «Пример»
УИД 12345678-1111-2222-3333-444455556666-2
Номер договора SECOND
Дата заключения 02.01.2020
Сумма обязательства 2000
ИНН 1234567890`);
    expect(contracts.map((c) => c.number)).toEqual(["FIRST", "SECOND"]);
    expect(contracts.map((c) => c.amount)).toEqual(["1000", "2000"]);
  });
  it("reads opening fields when creditor details appear only at the end", () => {
    const { contracts } = parseNbkiText(`Обязательства
Номер договора END-77
Сумма обязательства 5000,00 RUB
УИД 12345678-1111-2222-3333-444455556666-1
Дата заключения 01.01.2020
Источник формирования кредитной истории
Полное наименование источника ООО МКК «Пример»
ИНН 1234567890 ОГРН 1234567890123`);
    expect(contracts[0]?.number).toBe("END-77");
    expect(contracts[0]?.amount).toBe("5000,00");
  });
  it("reads values rather than headers in an opening requisites table", () => {
    const fields = obligationFields("Номер договора Дата договора Сумма обязательства\nTABLE-77 01.01.2020 25 000,50 RUB", "");
    expect(fields.number).toBe("TABLE-77"); expect(fields.amount).toBe("25 000,50");
  });
});