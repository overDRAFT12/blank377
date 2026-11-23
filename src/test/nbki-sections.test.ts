import { describe, expect, it } from "vitest";
import { detectStatus, parseNbkiText } from "@/lib/nbki-parser";

const uid = (n: number) => `0000${String(n).padStart(4, "0")}-1111-2222-3333-444455556666-${n % 10}`;
const reqUid = (n: number) => `ffff${String(n).padStart(4, "0")}-aaaa-bbbb-cccc-ddddeeeeffff-${n % 10}`;

const contract = (n: number, status: string, extra = "") => `Публичное акционерное общество «Сбербанк России»
УИд договора ${uid(n)}
Полное наименование источника ПАО Сбербанк
ИНН 7707083893 ОГРН 1027700132195
Номер договора N-${n}
Дата заключения 15.06.2021
Сумма и валюта обязательства 100 000,00 RUB
Плановая дата закрытия 15.06.2030
Статус договора ${status}
${extra}
Стр. ${n}
УИд договора ${uid(n)}
Платежи по договору 15.07.2021 15.08.2021`;

const REPORT = `КРЕДИТНЫЙ ОТЧЕТ ДЛЯ СУБЪЕКТА
Титульная часть
Фамилия Имя Отчество Место рождения Гражданство
КОЗЛОВ АНДРЕЙ ВИКТОРОВИЧ г. Курск РФ
Дата рождения 07.07.1988
Паспорт гражданина РФ
Серия 3810 Номер 654321
Сводка по кредитной истории
Всего договоров 6
Действующих 3
Запросов за 30 дней 12
Обязательства
${contract(1, "Активный")}
${contract(2, "Действующий")}
${contract(3, "Просрочен")}
${contract(4, "Активный", "Дата фактического прекращения обязательства 01.02.2024")}
${contract(5, "Счет закрыт")}
${contract(6, "Передан на обслуживание")}
Публичное акционерное общество «Сбербанк России»
Номер договора N-1
Дата заключения 15.06.2021
Статус договора Активный
Информационная часть
Запросы
${Array.from({ length: 260 }, (_, i) => `УИд ${reqUid(i)} Запрос от банка 01.03.2025 Активный`).join("\n")}`;

describe("NBKI report: only the «Обязательства» section is read", () => {
  const { person, contracts, summary } = parseNbkiText(REPORT);

  it("ignores requests after «Информационная часть» / «Запросы»", () => {
    expect(contracts.some((c) => c.uid.startsWith("ffff"))).toBe(false);
  });
  it("counts each contract once even when its UID repeats on every page", () => {
    expect(contracts).toHaveLength(6);
  });
  it("reads the control numbers from the summary", () => {
    expect(summary).toEqual({ total: 6, active: 3 });
  });
  it("marks as active only explicit active/overdue contracts without closing signs", () => {
    expect(contracts.filter((c) => c.status === "active").map((c) => c.number)).toEqual(["N-1", "N-2", "N-3"]);
  });
  it("preselects only active contracts", () => {
    expect(contracts.filter((c) => c.selected)).toHaveLength(3);
  });
  it("takes the name values, not the table headers", () => {
    expect(person.fullName).toBe("Козлов Андрей Викторович");
    expect(person.passportSeries).toBe("3810");
    expect(person.passportNumber).toBe("654321");
  });
});

describe("Status rules", () => {
  it("closing date wins over an «active» label", () => {
    expect(detectStatus("Статус договора Активный\nДата фактического исполнения обязательств 10.10.2023")).toBe("closed");
  });
  it("a planned closing date does not close the contract", () => {
    expect(detectStatus("Статус Действующий\nПлановая дата закрытия 10.10.2030")).toBe("active");
  });
  it("cession closes the contract", () => {
    expect(detectStatus("Статус договора Уступка прав требования (цессия)")).toBe("closed");
  });
  it("no explicit status means not active", () => {
    expect(detectStatus("Номер договора 1\nСумма 1000")).toBe("closed");
  });
  it("«Обязательство исполнено» closes the contract", () => {
    expect(detectStatus("Состояние Обязательство исполнено")).toBe("closed");
  });
});

describe("Name parsing skips label words", () => {
  it("never returns «Имя Отчество Место»", () => {
    const { person } = parseNbkiText("Фамилия Имя Отчество Место рождения\nСИДОРОВ ОЛЕГ ПЕТРОВИЧ г. Орел\nОбязательства\nУИд договора 12345678-1111-2222-3333-444455556666-1\nСтатус Активный");
    expect(person.fullName).toBe("Сидоров Олег Петрович");
  });
  it("reads separate labelled values", () => {
    const { person } = parseNbkiText("Фамилия ПЕТРОВА\nИмя АННА\nОтчество ИГОРЕВНА\nМесто рождения г. Тула");
    expect(person.fullName).toBe("Петрова Анна Игоревна");
  });
});
