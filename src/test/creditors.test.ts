import { describe, expect, it } from "vitest";
import { CREDITORS, matchCreditor } from "@/lib/creditors";

describe("Requested creditor directory coverage", () => {
  it.each(["Займер", "Екапуста", "Веббанкир", "MoneyMan", "Лайм-Займ", "Joymoney", "Быстроденьги", "Турбозайм", "Vivus", "Срочноденьги", "Денежная Крепость", "ДЗП-Развитие 7", "МигКредит", "А Деньги", "Веб-Займ", "До Зарплаты", "Бустра", "Монеза", "Езаем", "Кредит Плюс", "OneClickMoney", "ПКБ", "Феникс", "ЭОС", "АБК", "АйДи Коллект", "Сентинел", "НСВ", "М.Б.А. Финансы", "Филберт", "ЦДУ", "РСВ"])("fills address and email for %s by name and INN", (name) => {
    const ref = matchCreditor(name);
    expect(ref).toBeDefined();
    if (!ref) throw new Error(`Missing creditor ${name}`);
    expect(ref.address.length).toBeGreaterThan(15);
    expect(ref.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
    expect(matchCreditor("", ref.inn)?.id).toBe(ref.id);
  });
  it("keeps eleven requested PKO references separately", () => expect(CREDITORS.filter((r) => r.kind === "pko")).toHaveLength(11));
  it("does not match a short PKO abbreviation within another word", () => expect(matchCreditor("Слабко" )).toBeUndefined());
  it("prioritizes the INN for the two distinct Vivus creditors", () => expect(matchCreditor("Vivus", "5042119198")?.name).toBe("ООО МКК «Джет Мани»"));
});