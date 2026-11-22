import { describe, expect, it } from "vitest";
import { parseNbkiText } from "@/lib/nbki-parser";
import { buildStatement, statementToText } from "@/lib/statement";

const SAMPLE = `КРЕДИТНЫЙ ОТЧЕТ
Титульная часть
Фамилия ИВАНОВ
Имя ПЁТР
Отчество СЕРГЕЕВИЧ
Дата рождения 12.03.1990
Место рождения г. Тула
Паспорт гражданина РФ
Серия 7012 Номер 345678
Дата выдачи 01.04.2010
Кем выдан ОТДЕЛОМ УФМС РОССИИ ПО ТУЛЬСКОЙ ОБЛ.
Код подразделения 710-001
СНИЛС 123-456-789 01
ИНН 711234567890
Адрес регистрации 300000, Тульская обл., г. Тула, ул. Ленина, д. 1, кв. 2
Телефон +7 (910) 123-45-67
Электронная почта petr@mail.ru
Договоры
УИд договора 1a2b3c4d-1111-2222-3333-444455556666-7
Полное наименование источника ПАО Сбербанк
ИНН 7707083893 ОГРН 1027700132195
Номер договора 99887766
Дата заключения 15.06.2021
Сумма и валюта обязательства 250 000,00 RUB
Статус договора Активный
УИд договора 9f8e7d6c-aaaa-bbbb-cccc-ddddeeeeffff-1
Полное наименование источника ООО МФК «Мани Мен»
ИНН 7704784072 ОГРН 1117746442670
Номер договора MM-555
Дата заключения 02.02.2022
Сумма и валюта обязательства 15 000,00 RUB
Статус договора Закрыт
УИд договора 1a2b3c4d-1111-2222-3333-444455556666-7
Платежи по договору 15.07.2021`;

describe("NBKI parser", () => {
  const { person, contracts } = parseNbkiText(SAMPLE);

  it("extracts passport and contact data", () => {
    expect(person.fullName).toBe("Иванов Пётр Сергеевич");
    expect(person.birthDate).toBe("12.03.1990");
    expect(person.passportSeries).toBe("7012");
    expect(person.passportNumber).toBe("345678");
    expect(person.passportIssueDate).toBe("01.04.2010");
    expect(person.passportCode).toBe("710-001");
    expect(person.snils).toBe("123-456-789 01");
    expect(person.inn).toBe("711234567890");
    expect(person.address).toContain("г. Тула, ул. Ленина");
    expect(person.email).toBe("petr@mail.ru");
    expect(person.phone).toContain("123-45-67");
  });

  it("finds each contract once, even when its UID repeats", () => {
    expect(contracts).toHaveLength(2);
  });

  it("fills creditor details from the directory", () => {
    const sber = contracts.find((c) => c.creditorInn === "7707083893")!;
    expect(sber.creditorName).toBe("ПАО Сбербанк");
    expect(sber.creditorEmail).toBe("sberbank@sberbank.ru");
    expect(sber.number).toBe("99887766");
    expect(sber.date).toBe("15.06.2021");
    expect(sber.amount).toBe("250 000,00");
  });

  it("selects only active contracts by default", () => {
    const sber = contracts.find((c) => c.creditorInn === "7707083893")!;
    const mm = contracts.find((c) => c.creditorInn === "7704784072")!;
    expect(sber.status).toBe("active");
    expect(sber.selected).toBe(true);
    expect(mm.status).toBe("closed");
    expect(mm.selected).toBe(false);
  });
});

describe("Statement text follows the chosen basis", () => {
  const { person, contracts } = parseNbkiText(SAMPLE);
  const c = contracts[0]!;
  const service = { unit: "в/ч 12345", contractDate: "10.01.2025" };

  it("art. 2.1 asks to terminate obligations up to 10 mln", () => {
    const t = statementToText(buildStatement(person, { ...service, basis: "art2_1" }, c, "01.02.2026"));
    expect(t).toContain("ст. 2.1");
    expect(t).toContain("10 000 000");
    expect(t).toContain("99887766");
  });

  it("art. 1 is a demand for a grace period", () => {
    const s = buildStatement(person, { ...service, basis: "art1" }, c);
    expect(s.title).toBe("ТРЕБОВАНИЕ");
    expect(s.subtitle).toContain("статьей 1");
  });

  it("art. 2 mentions disability group I", () => {
    const t = statementToText(buildStatement(person, { ...service, basis: "art2" }, c));
    expect(t).toContain("инвалидность I группы");
  });
});
