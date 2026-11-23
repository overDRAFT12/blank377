import { describe, expect, it } from "vitest";
import { isJunkContract, parseNbkiText } from "@/lib/nbki-parser";
import { emptyContract } from "@/lib/nbki-parser";

const uid = (n: number) => `0000${String(n).padStart(4, "0")}-1111-2222-3333-444455556666-${n % 10}`;

const sber = (n: number, num: string) => `УИд договора ${uid(n)}
Полное наименование источника ПАО Сбербанк
ИНН 7707083893 ОГРН 1027700132195
Номер договора ${num}
Дата заключения 15.06.2021
Статус договора Активный`;

describe("Junk header cards are filtered out", () => {
  it("drops cards whose creditor name is a table header phrase", () => {
    const { contracts } = parseNbkiText(`Обязательства
${sber(1, "N-1")}
УИд договора ${uid(2)}
Полное наименование источника Вид займа Дата договора Текущая просрочка
Номер договора J-1
Дата заключения 01.01.2020
Статус Активный
УИд договора ${uid(3)}
Полное наименование источника Дни просрочки Наличие просрочки
Номер договора J-2
Дата заключения 01.01.2020
Статус Активный`);
    expect(contracts).toHaveLength(1);
    expect(contracts[0]?.creditorName).toBe("ПАО Сбербанк");
  });

  it("drops fully empty cards (no INN, OGRN, UID, creditor or number)", () => {
    expect(isJunkContract(emptyContract())).toBe(true);
  });

  it("isJunkContract matches each header phrase from the rule", () => {
    for (const name of ["Вид займа", "Дата договора", "Текущая просрочка", "Дни просрочки", "Наличие просрочки"]) {
      expect(isJunkContract(emptyContract({ creditorName: name, creditorInn: "7707083893" }))).toBe(true);
    }
    expect(isJunkContract(emptyContract({ creditorName: "ПАО Сбербанк", creditorInn: "7707083893" }))).toBe(false);
    // Договор без УИД, но с номером и кредитором — настоящий, его удалять нельзя.
    expect(isJunkContract(emptyContract({ creditorName: "Неизвестная МФО", number: "1", date: "01.01.2020" }))).toBe(false);
  });
});

describe("UID dedup rules", () => {
  it("keeps only one contract per UID", () => {
    const { contracts } = parseNbkiText(`Обязательства
${sber(1, "N-1")}
Стр. 2
УИд договора ${uid(1)}
Платежи по договору 15.07.2021`);
    expect(contracts).toHaveLength(1);
  });

  it("keeps both contracts when UIDs differ, even with same creditor, number and date", () => {
    const { contracts } = parseNbkiText(`Обязательства
${sber(1, "N-1")}
${sber(2, "N-1")}`);
    expect(contracts).toHaveLength(2);
    expect(contracts.map((c) => c.uid)).toEqual([uid(1), uid(2)]);
  });
});

describe("Counts in the result badge match the filtered list", () => {
  it("total and active counts come from the same list shown below", () => {
    const { contracts } = parseNbkiText(`Обязательства
${sber(1, "N-1")}
${sber(2, "N-2").replace("Активный", "Счет закрыт")}
УИд договора ${uid(3)}
Полное наименование источника Вид займа Дата договора
Номер договора J-1
Статус Активный`);
    const active = contracts.filter((c) => c.status === "active");
    expect(contracts).toHaveLength(2);
    expect(active).toHaveLength(1);
  });
});
