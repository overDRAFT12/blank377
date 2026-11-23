import { describe, expect, it } from "vitest";
import { detectStatus, parseNbkiText, parseSummary } from "@/lib/nbki-parser";

describe("Obligations are active unless explicitly closed", () => {
  it.each(["Просрочен", "Счет открыт", "Активен", "Исполняется", "Судебное взыскание"])("keeps %s active", (status) => {
    expect(detectStatus(`Статус договора ${status}`)).toBe("active");
  });
  it.each(["Закрыт", "Счет закрыт", "Договор прекращен", "Обязательство исполнено", "Уступка прав", "Передан"])("closes %s", (status) => {
    expect(detectStatus(`Состояние договора\n${status}`)).toBe("closed");
  });
  it.each(["-", "—", "", "Нет", "Не заполнено"])("does not close for placeholder %s", (value) => {
    expect(detectStatus(`Дата фактического прекращения обязательства ${value}\nДата следующего платежа 01.12.2026`)).toBe("active");
    expect(detectStatus(`Дата закрытия\n${value}\nДата следующего платежа 01.12.2026`)).toBe("active");
  });
  it.each(["Дата фактического прекращения", "Дата фактического прекращения обязательства", "Дата закрытия"])("closes on a real %s", (label) => {
    expect(detectStatus(`${label}: 23.11.2026`)).toBe("closed");
    expect(detectStatus(`${label}\n23.11.2026`)).toBe("closed");
  });
  it("ignores invalid dates and planned closure", () => {
    expect(detectStatus("Дата закрытия 31.02.2026\nПлановая дата закрытия 01.12.2026")).toBe("active");
  });
  it("does not treat negative cession fields or court dates as closing", () => {
    expect(detectStatus("Уступка прав: Нет\nПередан на обслуживание: —\nСтатус Судебное взыскание\nДата судебного акта 01.02.2026")).toBe("active");
  });
  it("does not take the next field label as an empty status value", () => {
    expect(detectStatus("Статус договора\nДата закрытия —\nДата следующего платежа 01.12.2026")).toBe("active");
  });
});

describe("Summary totals", () => {
  it.each([
    "Всего договоров 79\nДействующих 45",
    "Всего заключено договоров: 79\nДействующих 45",
    "Общее количество договоров: 79\nДействующих 45",
    "Всего договоров (кредитов и займов): 79\nДействующих 45",
    "Всего Действующих Закрытых\n79 45 34",
    "Всего\nДействующих\nЗакрытых\n79\n45\n34",
  ])("reads both counts from %s", (summary) => {
    expect(parseSummary(`Сводка по кредитной истории\n${summary}\nЗапросов 301\nОбязательства\nУИд договора 00000000-1111-2222-3333-444455556666-0`)).toEqual({ total: 79, active: 45 });
  });
  it("finds 79 obligations, selects 45 active, and ignores requests", () => {
    const rows = Array.from({ length: 79 }, (_, i) => `УИд договора ${String(i).padStart(8, "0")}-1111-2222-3333-444455556666-0\nНомер договора N-${i}\nДата фактического прекращения обязательства ${i < 45 ? "—" : "01.02.2026"}`);
    const report = parseNbkiText(`Сводка по кредитной истории\nВсего договоров\nДействующих\nЗакрытых\n79 45 34\nОбязательства\n${rows.join("\n")}\nЗапросы\nУИд договора ffffffff-1111-2222-3333-444455556666-0`);
    expect(report.summary).toEqual({ total: 79, active: 45 });
    expect(report.contracts).toHaveLength(79);
    expect(report.contracts.filter((c) => c.status === "active")).toHaveLength(45);
    expect(report.contracts.filter((c) => c.selected)).toHaveLength(45);
  });
});