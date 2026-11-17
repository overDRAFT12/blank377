import { matchCreditor } from "./creditors";
import { emptyPerson, type Contract, type ContractStatus, type Person } from "./types";

/**
 * Эвристический разбор текста кредитного отчета НБКИ.
 * Работает целиком в браузере; на вход — текст, извлеченный из PDF.
 */

const DATE = String.raw`\d{2}\.\d{2}\.\d{4}`;
const UID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9a-f]/gi;

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/** Найти значение после одной из меток: метка, затем (в пределах окна) значение по шаблону. */
function after(text: string, labels: string[], value: string, window = 160): string {
  for (const label of labels) {
    const re = new RegExp(`${label}[\\s\\S]{0,${window}}?(${value})`, "i");
    const m = text.match(re);
    if (m) return clean(m[1] ?? "");
  }
  return "";
}

/** Значение до конца строки после метки (метка и значение на одной строке или на следующей). */
function lineAfter(text: string, labels: string[]): string {
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*[:\\-–]?\\s*([^\\n]*)(?:\\n([^\\n]*))?`, "i");
    const m = text.match(re);
    if (m) {
      const v = clean(m[1] ?? "") || clean(m[2] ?? "");
      if (v && v.length > 2) return v.replace(/^[:\-–\s]+/, "");
    }
  }
  return "";
}

function parseName(text: string): string {
  const fio = lineAfter(text, ["ФИО", "Ф\\.И\\.О\\.", "Субъект кредитной истории"]);
  if (/^[А-ЯЁ][а-яё-]+\s+[А-ЯЁ][а-яё-]+(\s+[А-ЯЁ][а-яё-]+)?/i.test(fio)) {
    const m = fio.match(/^([А-ЯЁа-яё-]+\s+[А-ЯЁа-яё-]+(?:\s+[А-ЯЁа-яё-]+)?)/);
    if (m) return titleCase(m[1] ?? "");
  }
  const last = after(text, ["Фамилия"], "[А-ЯЁ][А-ЯЁа-яё-]+", 20);
  const first = after(text, ["(?<!Отчество\\s)Имя"], "[А-ЯЁ][А-ЯЁа-яё-]+", 20);
  const middle = after(text, ["Отчество"], "[А-ЯЁ][А-ЯЁа-яё-]+", 20);
  if (last && first) return titleCase([last, first, middle].filter(Boolean).join(" "));
  const upper = text.match(/\b([А-ЯЁ]{2,}(?:-[А-ЯЁ]{2,})?\s+[А-ЯЁ]{2,}\s+[А-ЯЁ]{2,}(?:ВИЧ|ВНА|ИЧ|ЫЧ|КЫЗЫ|ОГЛЫ))\b/);
  return upper ? titleCase(upper[1] ?? "") : "";
}

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(/(\s|-)/)
    .map((w) => (w.trim() && w !== "-" ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join("");
}

export function parsePerson(text: string): Person {
  const p = emptyPerson();
  p.fullName = parseName(text);
  p.birthDate = after(text, ["Дата рождения"], DATE, 40);
  p.birthPlace = lineAfter(text, ["Место рождения"]).replace(new RegExp(`^${DATE}\\s*`), "");

  const series = after(text, ["Серия(?: паспорта)?"], String.raw`\d{2}\s?\d{2}`, 20);
  const number = after(text, ["Номер(?: паспорта)?(?! договора)"], String.raw`\d{6}`, 20);
  if (series && number) {
    p.passportSeries = series.replace(/\s/g, "");
    p.passportNumber = number;
  } else {
    const m = text.match(/Паспорт[\s\S]{0,80}?(\d{2}\s?\d{2})\s*(?:№|N|номер)?\s*(\d{6})/i);
    if (m) {
      p.passportSeries = (m[1] ?? "").replace(/\s/g, "");
      p.passportNumber = m[2] ?? "";
    }
  }
  p.passportIssueDate = after(text, ["Дата выдачи"], DATE, 40);
  p.passportIssuedBy = lineAfter(text, ["Кем выдан", "Орган,? выдавший документ", "Выдан"]).replace(new RegExp(`\\s*${DATE}.*$`), "");
  p.passportCode =
    after(text, ["Код подразделения"], String.raw`\d{3}-\d{3}`, 30) ||
    (text.match(/\b\d{3}-\d{3}\b(?!-)/)?.[0] ?? "");
  p.snils = (text.match(/\b\d{3}-\d{3}-\d{3}[\s-]\d{2}\b/)?.[0] ?? "").replace(/\s/, " ");
  p.inn = after(text, ["ИНН(?: физического лица)?"], String.raw`\d{12}(?!\d)`, 20) || (text.match(/ИНН\s*:?\s*(\d{12})(?!\d)/)?.[1] ?? "");
  p.address = lineAfter(text, [
    "Адрес регистрации",
    "Адрес по месту регистрации",
    "Адрес места регистрации",
    "Адрес регистрации по месту жительства",
    "Адрес места жительства",
  ]);
  const phone = text.match(/(?:\+7|(?<!\d)8)[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}(?!\d)/);
  p.phone = phone ? clean(phone[0]) : "";
  p.email =
    after(text, ["Электронная почта", "E-?mail", "Адрес электронной почты"], String.raw`[\w.+-]+@[\w-]+\.[\w.-]+`, 40) ||
    "";
  return p;
}

function detectStatus(block: string): ContractStatus {
  const statusLine = block.match(/(?:Статус(?: договора| сделки)?|Состояние)\s*[:\-]?\s*([^\n]{0,60})/i)?.[1] ?? "";
  const src = statusLine || block;
  if (/(закрыт|погашен|прекращ|исполнен|продан|списан|аннулир)/i.test(src)) return "closed";
  if (/(активн|действующ|открыт|просроч)/i.test(src)) return "active";
  return "active";
}

function findCreditorName(block: string): string {
  const labeled = lineAfter(block, [
    "Полное наименование(?: источника| кредитора| организации)?",
    "Наименование(?: источника| кредитора| организации)?",
    "Источник(?: информации)?",
    "Кредитор",
    "Займодавец",
  ]);
  if (labeled && /[«"А-ЯЁ]/.test(labeled) && !/^\d/.test(labeled)) return labeled.slice(0, 120);
  const m = block.match(
    /((?:Банк ВТБ \(ПАО\))|(?:(?:ПАО|АО|ООО|НАО|ЗАО|ОАО|КБ)(?:\s+(?:МФК|МКК|ПКО|КБ|Банк))?\s*[«"“][^»"”\n]{2,60}[»"”](?:\s*\((?:ПАО|АО|ООО)\))?))/,
  );
  return m ? clean(m[1] ?? "") : "";
}

let seq = 0;
const newId = () => `c${Date.now().toString(36)}${(seq++).toString(36)}`;

export function emptyContract(partial: Partial<Contract> = {}): Contract {
  return {
    id: newId(),
    creditorName: "",
    creditorInn: "",
    creditorOgrn: "",
    creditorAddress: "",
    creditorEmail: "",
    uid: "",
    number: "",
    date: "",
    amount: "",
    status: "active",
    selected: true,
    ...partial,
  };
}

function parseBlock(block: string, lookbehind: string, uid: string): Contract {
  const scope = `${lookbehind}\n${block}`;
  const inn = after(block, ["ИНН(?: источника| кредитора)?"], String.raw`\d{10}(?!\d)`, 20) || after(lookbehind, ["ИНН"], String.raw`\d{10}(?!\d)`, 20);
  const ogrn = after(block, ["ОГРН"], String.raw`\d{13}(?!\d)`, 20) || after(lookbehind, ["ОГРН"], String.raw`\d{13}(?!\d)`, 20);
  const rawName = findCreditorName(block) || findCreditorName(lookbehind);
  const ref = matchCreditor(rawName || scope, inn);
  const number = after(block, ["Номер договора", "№ договора", "Договор №"], String.raw`[^\s\n]{1,40}`, 10).replace(/^№/, "");
  const date =
    after(block, ["Дата (?:заключения|совершения|открытия)(?: сделки| договора)?", "Дата сделки"], DATE, 40) ||
    (block.match(new RegExp(DATE))?.[0] ?? "");
  const amount = after(
    block,
    ["Сумма(?: и валюта)?(?: обязательства| кредита| займа| сделки)?", "Лимит(?: кредитования)?"],
    String.raw`\d[\d\s]{0,12}(?:[.,]\d{2})?`,
    40,
  ).replace(/\s(?=\d{3}\b)/g, " ");
  return emptyContract({
    creditorName: ref?.name ?? rawName,
    creditorInn: inn || ref?.inn || "",
    creditorOgrn: ogrn || ref?.ogrn || "",
    creditorAddress: ref?.address ?? "",
    creditorEmail: ref?.email ?? "",
    uid: uid.toLowerCase(),
    number,
    date,
    amount: amount.trim(),
    status: detectStatus(block),
  });
}

const filled = (c: Contract) =>
  [c.creditorName, c.creditorInn, c.creditorOgrn, c.number, c.date, c.amount].filter(Boolean).length;

export function parseContracts(text: string): Contract[] {
  const hits = [...text.matchAll(UID_RE)];
  const result = new Map<string, Contract>();
  hits.forEach((h, i) => {
    const start = h.index ?? 0;
    const end = hits[i + 1]?.index ?? Math.min(text.length, start + 3000);
    const prevEnd = i > 0 ? (hits[i - 1]?.index ?? 0) + h[0].length : 0;
    const lookbehind = text.slice(Math.max(prevEnd, start - 500), start);
    const c = parseBlock(text.slice(start + h[0].length, end), lookbehind, h[0]);
    const prev = result.get(c.uid);
    if (!prev) result.set(c.uid, c);
    else if (filled(c) > filled(prev)) result.set(c.uid, { ...c, id: prev.id });
  });
  return [...result.values()].map((c) => ({ ...c, selected: c.status === "active" }));
}

export type ParsedReport = { person: Person; contracts: Contract[] };

export function parseNbkiText(text: string): ParsedReport {
  return { person: parsePerson(text), contracts: parseContracts(text) };
}
