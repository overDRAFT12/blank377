/** Pure subject-only readers. Never search creditor/obligation sections for identity data. */
const DATE = /(?<!\d)\d{2}\.\d{2}\.\d{4}(?!\d)/g;
const HEADERS = /Действ\.?\s*до|Гражданство|Обновлено|Код\s+подразделения|Дата\s+выдачи|Дата\s+рождения|Место\s+рождения|Кем\s+выдан|Орган,?\s+выдавший\s+документ|Серия(?:\s+паспорта)?|Номер(?:\s+паспорта)?|СНИЛС|ИНН(?:\s+физического\s+лица)?|Адрес[^\n:]*|Телефон|Электронная\s+почта|E-?mail|Фамилия|Имя|Отчество/gi;
const CONTACT_SECTION = /(?:^|\n)\s*(?:СНИЛС|ИНН|Адрес|Контактн\S*|Адресн\S*|Телефон|Электронная\s+почта|E-?mail|Сведени\S*\s+(?:об\s+адрес|о\s+месте|о\s+контакт)|Сводк\S*)/i;
const DOCUMENT = /(?:^|\n)\s*(?:\d+[.)]?\s*)?(?:Паспорт(?:\s+гражданина)?|Документ\S*\s*,?\s*удостоверяющ\S*\s+личность)/gi;
const ISSUER = /(?:ГУ\s+МВД|ГУМВД|УМВД|МВД|ОУФМС|ТП\s+УФМС|УФМС|ОТДЕЛОМ|ОТДЕЛ\b|ОВД|УВД|ГУВД|МО\s+МВД)/i;
const tidy = (s: string) => s.replace(/\s+/g, " ").trim();

/** Read a labeled value, stopping at other columns instead of capturing their titles. */
export function subjectValue(text: string, label: RegExp): string {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const hit = line.match(label);
    if (!hit) continue;
    const inline = line.slice((hit.index ?? 0) + hit[0].length).replace(/^[\s:–—-]+/, "");
    const cut = inline.search(HEADERS);
    const value = tidy(cut >= 0 ? inline.slice(0, cut) : inline);
    if (value) return value;
    // Only a single-column label is safe to pair with the next row.
    if (cut >= 0) continue;
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      const next = tidy(lines[j] ?? "");
      if (!next) continue;
      if (next.search(HEADERS) === 0) break;
      const end = next.search(HEADERS);
      return end >= 0 ? tidy(next.slice(0, end)) : next;
    }
  }
  return "";
}

function firstPassport(text: string): string {
  const headings = [...text.matchAll(DOCUMENT)];
  const start = headings[0]?.index ?? text.search(/(?:Серия(?:\s+паспорта)?|Кем\s+выдан|Орган,?\s+выдавший\s+документ)/i);
  if (start < 0) return "";
  // «Документ, удостоверяющий личность» followed by «Паспорт» names one document.
  const first = headings[0];
  const second = headings[1];
  const headingPrefix = first && second && /Документ/i.test(first[0]) && /Паспорт/i.test(second[0])
    && !/\d{4}|Серия|Номер/i.test(text.slice(first.index ?? 0, second.index ?? 0));
  const end = headings[headingPrefix ? 2 : 1]?.index ?? text.length;
  let block = text.slice(start, end);
  const contact = block.search(CONTACT_SECTION);
  if (contact >= 0) block = block.slice(0, contact);
  return block;
}

/** Date values in a table follow date columns, including update/expiration columns. */
function tableIssueDate(block: string, numberAt: number): string {
  const lines = block.split("\n");
  let offset = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const columns = [...line.matchAll(/Дата\s+выдачи|Обновлено|Действ\.?\s*до/gi)].map((c) => c[0]);
    const issueIndex = columns.findIndex((c) => /^Дата/i.test(c));
    if (issueIndex >= 0 && !/\d/.test(line)) {
      const rows: string[] = [];
      let j = i + 1;
      while (j < Math.min(i + 12, lines.length)) {
        const next = lines[j] ?? "";
        if (/^(?:Дата\s+выдачи|Обновлено|Действ\.?\s*до|Кем\s+выдан|Код\s+подразделения)\s*$/i.test(tidy(next))) {
          columns.push(tidy(next));
          j++;
        } else break;
      }
      for (; j < Math.min(i + 12, lines.length); j++) {
        const next = lines[j] ?? "";
        if (next.search(HEADERS) === 0) break;
        rows.push(next);
      }
      const rowStart = offset + lines.slice(i, j - rows.length).join("\n").length + 1;
      const dates = [...rows.join("\n").matchAll(DATE)].filter((m) => rowStart + (m.index ?? 0) > numberAt);
      const dateColumns = columns.filter((c) => /Дата\s+выдачи|Обновлено|Действ\.?\s*до/i.test(c));
      const index = dateColumns.findIndex((c) => /^Дата/i.test(c));
      // Missing date cells make column alignment ambiguous: leave manual input rather than borrow an update date.
      if (index >= 0 && dates.length === dateColumns.length) return dates[index]?.[0] ?? "";
    }
    offset += line.length + 1;
  }
  return "";
}

export function currentPassportFields(beforePrevious: string) {
  const block = firstPassport(beforePrevious);
  const seriesValue = subjectValue(block, /Серия(?:\s+паспорта)?/i);
  const numberValue = subjectValue(block, /Номер(?:\s+паспорта)?/i);
  const series = seriesValue.match(/^(\d{2}[ \t]?\d{2})(?!\d)/)?.[1]?.replace(/\s/g, "") ?? "";
  const number = numberValue.match(/^(\d{6})(?!\d)/)?.[1] ?? "";
  const pair = block.match(/(?<!\d)(\d{2}[ \t]?\d{2})(?!\d)\s*(?:Номер|№|N)?\s*(\d{6})(?!\d)/i);
  const passportSeries = series || pair?.[1]?.replace(/\s/g, "") || "";
  const passportNumber = number || pair?.[2] || "";
  const numberAt = passportNumber ? block.indexOf(passportNumber) + passportNumber.length : -1;
  const issued = numberAt >= 0 ? subjectValue(block.slice(numberAt), /Дата\s+выдачи/i) : "";
  const passportIssueDate = numberAt >= 0 ? (issued.match(/^\d{2}\.\d{2}\.\d{4}(?!\d)/)?.[0] || tableIssueDate(block, numberAt)) : "";
  let issuer = subjectValue(block, /Кем\s+выдан|Орган,?\s+выдавший\s+документ|(?:^|\n)\s*Выдан/i);
  if (!ISSUER.test(issuer)) {
    issuer = block.split("\n").find((line) => ISSUER.test(line)) ?? issuer;
  }
  const issuerStart = issuer.search(ISSUER);
  if (issuerStart >= 0) issuer = issuer.slice(issuerStart);
  const stop = issuer.search(/Действ\.?\s*до|Гражданство|Обновлено|Код\s+подразделения|Дата\s+выдачи|\d{2}\.\d{2}\.\d{4}|\d{3}-\d{3}/i);
  if (stop >= 0) issuer = issuer.slice(0, stop);
  const passportIssuedBy = /[а-яё]/i.test(issuer) && !/^(?:[-—–]|нет|не\s+указано)$/i.test(tidy(issuer)) ? tidy(issuer) : "";
  const passportCode = block.match(/(?<![\d-])\d{3}-\d{3}(?![\d-])/)?.[0] ?? "";
  return { passportSeries, passportNumber, passportIssueDate, passportIssuedBy, passportCode };
}

export function subjectBirthPlace(text: string, fullName: string): string {
  const value = subjectValue(text, /Место\s+рождения/i).replace(/^\d{2}\.\d{2}\.\d{4}\s*/, "");
  const normalized = (s: string) => tidy(s).toLocaleLowerCase();
  if (!value || /^(?:РОССИЯ|РФ|Российская\s+Федерация|[-—–]|нет|не\s+указано)$/i.test(value)) return "";
  if (fullName && normalized(value).includes(normalized(fullName))) return "";
  const nameWords = normalized(fullName).split(" ").filter(Boolean);
  if (nameWords.length >= 2 && nameWords.slice(0, 2).every((word) => normalized(value).includes(word))) return "";
  return value;
}

export function subjectInn(text: string): string {
  const labeled = subjectValue(text, /ИНН(?:\s+физического\s+лица)?/i).match(/(?<!\d)\d{12}(?!\d)/)?.[0];
  if (labeled) return labeled;
  const table = text.match(/СНИЛС\s+ИНН(?:\s+физического\s+лица)?[^\n]*\n\s*\d{3}-\d{3}-\d{3}[ \t-]\d{2}\s+(\d{12})(?!\d)/i);
  return table?.[1] ?? "";
}