/** Supplementary field readers only; contract boundaries, names, dates and UIDs stay in nbki-parser. */
const tidy = (s: string) => s.replace(/\s+/g, " ").trim();
const SOURCE = /Источник\s+формирования\s+кредитной\s+истории/i;
const FIELD = /^(?:\d+(?:\.\d+)*[.)]?\s*)?(?:Дата|Сумма|Валюта|ИНН|ОГРН|Статус|Состояние|УИд|Номер|Вид|Код|Полное|Наименование|Источник|Лимит|Плановая|Текущая)(?=\s|:|$)/i;

function labeled(text: string, label: RegExp, value: RegExp): string {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const m = label.exec(line);
    if (!m) continue;
    const inline = line.slice((m.index ?? 0) + m[0].length).replace(/^[\s:№–—-]+/, "").trim();
    if (inline && !FIELD.test(inline)) {
      const found = inline.match(value)?.[0];
      if (found) return tidy(found);
    }
    if (inline) continue;
    for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
      const next = (lines[j] ?? "").trim();
      if (!next) continue;
      if (FIELD.test(next)) break;
      const found = next.match(value)?.[0];
      if (found) return tidy(found);
      break;
    }
  }
  return "";
}

export function obligationFields(block: string, lookbehind: string) {
  const sourceAt = block.search(SOURCE);
  const source = sourceAt >= 0 ? block.slice(sourceAt) : block;
  // Numeric identifiers from the source, never the subject's 12-digit INN.
  const pair = source.match(/ИНН[^\n]*ОГРН[^\n]*\n\s*(\d{10})\s+(\d{13})(?!\d)/i);
  const inn = pair?.[1] ?? labeled(source, /ИНН(?:\s+(?:источника|кредитора))?/i, /(?<!\d)\d{10}(?!\d)/);
  const ogrn = pair?.[2] ?? labeled(source, /ОГРН/i, /(?<!\d)\d{13}(?!\d)/);
  // Requisites before the UID belong to the current creditor heading, not the prior contract.
  const heading = [...lookbehind.matchAll(/(?:Полное\s+наименование(?:\s+(?:источника|кредитора|организации))?|(?:^|\n)[ \t]*(?:ПАО|АО|ООО|НАО|ЗАО|ОАО|КБ)\s)/gi)].at(-1);
  const previousSource = [...lookbehind.matchAll(/Источник\s+формирования\s+кредитной\s+истории/gi)].at(-1);
  const opening = heading ? lookbehind.slice(heading.index ?? 0)
    : previousSource ? lookbehind.slice((previousSource.index ?? 0) + previousSource[0].length)
    : /(?:^|\n)\s*(?:Обязательства|Сведения об обязательствах|Договоры)\s*(?:\n|$)/i.test(lookbehind) ? lookbehind : "";
  const numberLabel = /(?:Номер\s+(?:кредитного\s+)?договора(?:\s*\(договора\s+займа\))?|№\s*договора|Договор\s*№)/i;
  const amountLabel = /(?:Сумма(?:\s+и\s+валюта)?\s+(?:обязательства|кредита|займа|сделки)|Лимит(?:\s+кредитования)?)/i;
  const numberValue = /^[^\s:№]+/;
  const amountValue = /^\d(?:[\d \u00a0]*\d)?(?:[.,]\d{1,2})?(?!\d)/;
  const table = `${opening}\n${block}`.match(/Номер\s+договора[^\n]*Дата[^\n]*Сумма[^\n]*\n\s*([^\s]+)\s+\d{2}\.\d{2}\.\d{4}\s+(\d(?:[\d \u00a0]*\d)?(?:[.,]\d{1,2})?)/i);
  return {
    inn, ogrn,
    number: table?.[1] ?? (labeled(opening, numberLabel, numberValue) || labeled(block, numberLabel, numberValue)),
    amount: table?.[2] ? tidy(table[2]) : (labeled(opening, amountLabel, amountValue) || labeled(block, amountLabel, amountValue)),
  };
}