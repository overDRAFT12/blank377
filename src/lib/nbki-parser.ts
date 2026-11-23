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
      // Строка, начинающаяся с другой метки (заголовок таблицы), — не значение: смотрим следующую строку.
      for (const raw of [m[1], m[2]]) {
        const v = clean(raw ?? "").replace(/^[:\-–\s]+/, "");
        if (v.length > 2 && !startsWithLabel(v)) return v;
      }
    }
  }
  return "";
}

/** Слова-заголовки таблицы с личными данными — это метки, а не ФИО. */
const LABEL_WORDS = new Set([
  "фамилия", "имя", "отчество", "место", "дата", "рождения", "гражданство", "пол", "фио", "субъект",
  "кредитной", "истории", "паспорт", "серия", "номер", "документ", "гражданина", "рф", "россии", "сведения",
  "персональные", "данные", "выдан", "выдачи", "кем", "код", "подразделения", "снилс", "инн", "адрес",
  "предыдущие", "прежние", "ранее", "наименование", "тип", "значение", "мужской", "женский",
]);
const FIELD_LABEL_WORDS = new Set(["огрн", "сумма", "статус", "состояние", "телефон", "электронная", "email", "e-mail", "уид", "уид", "плановая", "источник"]);
function startsWithLabel(v: string) {
  const w = (v.split(/\s+/)[0] ?? "").toLowerCase().replace(/[:.,]/g, "");
  return LABEL_WORDS.has(w) || FIELD_LABEL_WORDS.has(w);
}
const isNameWord = (w: string) => /^[А-ЯЁ][А-ЯЁа-яё]+(?:-[А-ЯЁа-яё]+)?$/.test(w) && !LABEL_WORDS.has(w.toLowerCase());

/** 2–3 слова подряд, похожих на ФИО, с начала строки (метки пропускаются). */
function nameFrom(line: string): string {
  const words = clean(line).split(" ");
  let i = 0;
  while (i < words.length && LABEL_WORDS.has((words[i] ?? "").toLowerCase().replace(/[:.,]/g, ""))) i++;
  const out: string[] = [];
  for (; i < words.length && out.length < 3; i++) {
    const w = (words[i] ?? "").replace(/[,;]$/, "");
    if (!isNameWord(w)) break;
    out.push(w);
  }
  return out.length >= 2 ? titleCase(out.join(" ")) : "";
}

/** Одно слово-значение сразу после метки на той же строке. */
function wordAfterLabel(text: string, label: string): string {
  const re = new RegExp(`(?:^|\\n)\\s*${label}\\s*[:\\-–]?[ \\t]+([А-ЯЁ][А-ЯЁа-яё-]+)`, "gi");
  for (const m of text.matchAll(re)) {
    const w = m[1] ?? "";
    if (isNameWord(w)) return w;
  }
  return "";
}

function parseName(text: string): string {
  // 1) «ФИО: Иванов Иван Иванович» — на той же или следующей строке.
  for (const m of text.matchAll(/(?:ФИО|Ф\.И\.О\.|Субъект кредитной истории)\s*[:\-–]?[ \t]*([^\n]*)(?:\n([^\n]*))?/gi)) {
    const n = nameFrom(m[1] ?? "") || nameFrom(m[2] ?? "");
    if (n) return n;
  }
  // 2) Отдельные метки «Фамилия ИВАНОВ», «Имя ИВАН», «Отчество ИВАНОВИЧ».
  const last = wordAfterLabel(text, "Фамилия");
  const first = wordAfterLabel(text, "Имя");
  const middle = wordAfterLabel(text, "Отчество");
  if (last && first) return titleCase([last, first, middle].filter(Boolean).join(" "));
  // 3) Таблица: строка-заголовок «Фамилия Имя Отчество …», значения — в одной из следующих строк.
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i] ?? "";
    if (/Фамилия/i.test(l) && /Имя/i.test(l)) {
      for (let j = i + 1; j <= i + 4 && j < lines.length; j++) {
        const n = nameFrom(lines[j] ?? "");
        if (n) return n;
      }
    }
  }
  // 4) ФИО прописными с отчеством.
  for (const m of text.matchAll(/\b([А-ЯЁ]{2,}(?:-[А-ЯЁ]{2,})?\s+[А-ЯЁ]{2,}\s+[А-ЯЁ]{2,}(?:ВИЧ|ВНА|ИЧ|ЫЧ|КЫЗЫ|ОГЛЫ))\b/g)) {
    const n = nameFrom(m[1] ?? "");
    if (n) return n;
  }
  return "";
}

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(/(\s|-)/)
    .map((w) => (w.trim() && w !== "-" ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join("");
}

const PREV_DOCS_RE = /Ранее\s+выданн\S*\s+(?:документ\S*|паспорт\S*)(?:[^\n]*)/i;
const NEXT_SECTION_RE =
  /\n\s*(?:СНИЛС|ИНН|Адрес|Телефон|Электронная почта|E-?mail|Договор|Сведения|Кредитн|Информационная часть|Основная часть|Сделки|Обязательств|Титульная|Запрос)/i;

/** Отделить раздел «Ранее выданные документы», чтобы старый паспорт не перепутать с текущим. */
export function splitPreviousDocs(text: string): { main: string; previous: string } {
  const m = text.match(PREV_DOCS_RE);
  if (!m || m.index === undefined) return { main: text, previous: "" };
  const rest = text.slice(m.index + m[0].length);
  const end = rest.search(NEXT_SECTION_RE);
  const cut = end >= 0 ? end : Math.min(rest.length, 600);
  return { main: `${text.slice(0, m.index)}\n${rest.slice(cut)}`, previous: rest.slice(0, cut) };
}

/** Прежние паспорта из раздела «Ранее выданные документы»: «серия 0000 № 000000, выдан …, ДД.ММ.ГГГГ». */
export function parsePreviousPassport(section: string): string {
  if (!section.trim()) return "";
  const re = /(?<!\d)(\d{2}\s?\d{2})(?!\d)[^\d\n]{0,20}?(?<!\d)(\d{6})(?!\d)/g;
  const hits = [...section.matchAll(re)];
  const out: string[] = [];
  hits.forEach((h, i) => {
    const start = (h.index ?? 0) + h[0].length;
    const chunk = section.slice(start, hits[i + 1]?.index ?? section.length);
    const date = after(chunk, ["Дата выдачи"], DATE, 40) || (chunk.match(new RegExp(DATE))?.[0] ?? "");
    const by = lineAfter(chunk, ["Кем выдан", "Орган,? выдавший документ", "Выдан"])
      .replace(new RegExp(`\\s*${DATE}.*$`), "")
      .replace(/^(?:Дата выдачи).*$/i, "");
    const parts = [`серия ${(h[1] ?? "").replace(/\s/g, "")} № ${h[2] ?? ""}`];
    if (by || date) parts.push(`выдан ${[by, date].filter(Boolean).join(" ")}`);
    out.push(parts.join(", "));
  });
  return [...new Set(out)].join("; ");
}

export function parsePerson(report: string): Person {
  // Личные данные ищем до раздела с обязательствами, чтобы не цеплять реквизиты кредиторов.
  const head = report.slice(0, findObligationsStart(report) ?? report.length);
  const source = head.replace(/\s/g, "").length > 100 ? head : report;
  const { main: text, previous } = splitPreviousDocs(source);
  const p = emptyPerson();
  p.previousPassport = parsePreviousPassport(previous);
  p.fullName = parseName(text);
  p.birthDate = after(text, ["Дата рождения"], DATE, 40);
  const place = lineAfter(text, ["Место рождения"]).replace(new RegExp(`^${DATE}\\s*`), "");
  p.birthPlace = LABEL_WORDS.has((place.split(/\s+/)[0] ?? "").toLowerCase().replace(/[:.,]/g, "")) ? "" : place;

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

const CLOSE_DATE_LABEL_RE = /(?:Дата\s+фактическ\S*\s+(?:прекращения|исполнения|закрытия|погашения)|Фактическ\S*\s+дата\s+(?:прекращения|исполнения|закрытия|погашения)|Дата\s+(?:закрытия|прекращения))(?:[ \t]+(?:сч[её]та|договора|обязательств\S*|сделки))?/i;
const CLOSED_WORDS_RE =
  /(?:сч[её]т\s+закрыт|договор\s+прекращ|обязательств\S*\s+(?:исполнен|прекращ)|уступк\S*\s+прав|цесси[яи]|закрыт|погашен|прекращ[её]н|исполнен|передан|продан|списан|аннулир)/i;
const STATUS_LINE_RE = /(?:Статус|Состояние)(?:[ \t]+(?:договора|сделки|сч[её]та|обязательства))?[ \t]*[:\-–]?[ \t]*([^\n]*)(?:\n([^\n]*))?/gi;
const EMPTY_VALUE_RE = /^(?:[-—–]|нет|не\s+заполнено)(?:\s|$)/i;

function realDate(value: string): boolean {
  const m = value.match(new RegExp(`^(${DATE})(?!\\d)`));
  if (!m) return false;
  const [day = 0, month = 0, year = 0] = (m[1] ?? "").split(".").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return year >= 1000 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * Договор из раздела обязательств действующий по умолчанию.
 * Исключения: явный закрывающий статус или реальная дата фактического закрытия.
 */
export function detectStatus(block: string): ContractStatus {
  const statusValues = [...block.matchAll(STATUS_LINE_RE)].map((m) => clean(m[1] ?? "") || clean(m[2] ?? ""));
  if (statusValues.some((v) => !startsWithLabel(v) && !EMPTY_VALUE_RE.test(v) && !/^не\s/i.test(v) && CLOSED_WORDS_RE.test(v))) return "closed";
  const lines = block.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    // «Плановая дата закрытия» — это срок по графику, а не факт прекращения.
    const label = line.match(CLOSE_DATE_LABEL_RE);
    if (!label || /план/i.test(line)) continue;
    const inline = line.slice((label.index ?? 0) + label[0].length).replace(/^[ \t]*:[ \t]*/, "").trim();
    // Прочерк/«Нет» не позволяет захватить дату из другого поля на следующей строке.
    const value = inline || (lines[i + 1] ?? "").trim();
    if (!EMPTY_VALUE_RE.test(value) && realDate(value)) return "closed";
  }
  if (/сч[её]т\s+закрыт|договор\s+прекращ[её]н|обязательств[оа]\s+исполнен/i.test(block)) return "closed";
  if (/(?:передан\S*\s+на\s+обслуживание|уступк\S*\s+прав\S*(?:\s+требовани\S*)?|цесси[яи])\s*[:\-–]?\s*(?:да|произведен|осуществлен|передан)/i.test(block)) return "closed";
  if (/(?:^|\n)\s*(?:передан\s+на\s+обслуживание|уступка\s+прав(?:\s+требования)?\s*\(цессия\))\s*$/im.test(block)) return "closed";
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
    courtAct: "",
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

/** Заголовок начала раздела с договорами. */
const OBLIGATIONS_HEAD_RE =
  /(?:^|\n)[ \t]*(?:\d+\.?\s*)?(?:Сведения\s+об\s+обязательствах(?:\s+субъекта)?(?:\s+кредитной\s+истории)?|Обязательства(?:\s+субъекта)?|Кредитные\s+(?:договоры|обязательства)|Договоры|Сч[её]та)[ \t]*:?[ \t]*(?=\n|$)/gi;
/** Разделы, где перечислены запросы/обращения, а не кредиты: здесь поиск договоров прекращается. */
const STOP_HEAD_RE =
  /(?:^|\n)[ \t]*(?:\d+\.?\s*)?(?:Обращения|Запросы|Информационная\s+часть|Сведения\s+о\s+запросах|Сведения\s+об\s+обращениях|История\s+запросов)[^\n\d]{0,60}(?=\n|$)/gi;
const CONTRACT_MARK_RE = /(?:УИд|УИД|Уникальный\s+идентификатор|Номер\s+договора|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9a-f])/i;

function firstStopAfter(text: string, from: number): number {
  STOP_HEAD_RE.lastIndex = from;
  const m = STOP_HEAD_RE.exec(text);
  STOP_HEAD_RE.lastIndex = 0;
  return m ? m.index : text.length;
}

/** Начало раздела «Обязательства» (первый заголовок, за которым действительно идут договоры). */
export function findObligationsStart(text: string): number | null {
  for (const m of text.matchAll(OBLIGATIONS_HEAD_RE)) {
    const start = m.index ?? 0;
    const end = firstStopAfter(text, start + m[0].length);
    if (CONTRACT_MARK_RE.test(text.slice(start, end))) return start;
  }
  return null;
}

/** Текст строго между началом раздела обязательств и первым разделом «Обращения / Запросы / Информационная часть». */
export function obligationsSection(text: string): string {
  const start = findObligationsStart(text);
  if (start !== null) return text.slice(start, firstStopAfter(text, start + 1));
  // Заголовок не найден: берем текст от первого договора до первого раздела запросов после него.
  const first = text.search(CONTRACT_MARK_RE);
  if (first < 0) return "";
  return text.slice(Math.max(0, first - 500), firstStopAfter(text, first));
}

export type ReportSummary = { total: number | null; active: number | null };

/** Контрольные цифры из «Сводки по кредитной истории»: всего договоров и действующих. */
export function parseSummary(text: string): ReportSummary {
  const at = text.search(/Сводк\S*|Сводн\S*\s+информаци\S*/i);
  if (at < 0) return { total: null, active: null };
  const until = findObligationsStart(text);
  const block = text.slice(at, until !== null && until > at ? Math.min(until, at + 4000) : at + 4000);
  const num = (re: RegExp) => {
    const m = block.match(re);
    return m ? Number(m[1]) : null;
  };
  let total = num(/Всего(?:\s+(?:заключено|открыто|кредитных))?(?:\s+(?:договор\S*|сч[её]т\S*|кредит\S*|обязательств\S*|займ\S*))?(?:[ \t]*\([^\n)]*\))?\s*[:\-–—]?\s*(\d{1,4})(?!\d|\.\d)/i)
    ?? num(/(?:Общее\s+количество|Количество|Число)\s+(?:кредитных\s+)?(?:договор\S*|сч[её]т\S*|кредит\S*|обязательств\S*|займ\S*)\s*[:\-–—]?\s*(\d{1,4})(?!\d|\.\d)/i);
  let active = num(/(?:Действующ\S*|Активн\S*|Открыт\S*)(?:\s+(?:договор\S*|сч[её]т\S*|кредит\S*|обязательств\S*|займ\S*))?\s*[:\-–]?\s*(\d{1,4})(?!\d|\.\d)/i);
  if (total === null || active === null) {
    // Табличная сводка: строка заголовков «Всего Действующих Закрытых», под ней — числа по порядку.
    const lines = block.split("\n");
    for (let i = 0; i < lines.length - 1; i++) {
      let head = lines[i] ?? "";
      let next = i + 1;
      // PDF может разнести заголовки колонок и их значения на отдельные строки.
      while (!/\d/.test(head) && next < Math.min(lines.length, i + 8) && /^(?:Действующ|Активн|Открыт|Закрыт|Просроч|Негатив)/i.test(clean(lines[next] ?? ""))) {
        head += ` ${lines[next] ?? ""}`;
        next++;
      }
      if (/Всего/i.test(head) && /(Действующ|Активн|Открыт)/i.test(head) && !/\d/.test(head)) {
        const values: string[] = [];
        while (next < Math.min(lines.length, i + 12) && /^\s*\d+(?:\s+\d+)*\s*$/.test(lines[next] ?? "")) {
          values.push(lines[next] ?? "");
          next++;
        }
        const nums = values.join(" ").match(/\d+/g) ?? [];
        const cols = head.match(/Всего|Действующ\S*|Активн\S*|Открыт\S*|Закрыт\S*|Просроч\S*|Негатив\S*/gi) ?? [];
        cols.forEach((col, k) => {
          const n = nums[k] !== undefined ? Number(nums[k]) : null;
          if (/^Всего/i.test(col) && total === null) total = n;
          if (/^(Действующ|Активн|Открыт)/i.test(col) && active === null) active = n;
        });
        break;
      }
    }
  }
  return { total, active };
}

const dedupKey = (c: Contract) =>
  c.creditorName && c.number && c.date ? `${c.creditorName.toLowerCase().replace(/[^а-яёa-z0-9]/gi, "")}|${c.number.toLowerCase()}|${c.date}` : "";

export function parseContracts(text: string): Contract[] {
  const section = obligationsSection(text);
  if (!section) return [];
  const hits = [...section.matchAll(UID_RE)];

  // Все фрагменты с одним УИД (повтор на каждой странице) — это один договор: склеиваем их.
  const groups = new Map<string, { uid: string; parts: string[]; lookbehind: string }>();
  hits.forEach((h, i) => {
    const uid = h[0].toLowerCase();
    const start = h.index ?? 0;
    const end = hits[i + 1]?.index ?? section.length;
    const g = groups.get(uid);
    const part = section.slice(start + h[0].length, end);
    if (g) g.parts.push(part);
    else {
      const prevEnd = i > 0 ? (hits[i - 1]?.index ?? 0) + h[0].length : 0;
      groups.set(uid, { uid, parts: [part], lookbehind: section.slice(Math.max(prevEnd, start - 500), start) });
    }
  });

  let found: Contract[] = [...groups.values()].map((g) => parseBlock(g.parts.join("\n"), g.lookbehind, g.uid));

  // Старые договоры без УИД: делим раздел по «Номер договора».
  if (found.length === 0) {
    const marks = [...section.matchAll(/(?:Номер\s+договора|Договор\s+№)/gi)];
    found = marks.map((m, i) => {
      const start = m.index ?? 0;
      const prevEnd = i > 0 ? (marks[i - 1]?.index ?? 0) + m[0].length : 0;
      return parseBlock(section.slice(start, marks[i + 1]?.index ?? section.length), section.slice(Math.max(prevEnd, start - 500), start), "");
    });
  }

  // Защита от дублей по связке «кредитор + номер + дата».
  const byKey = new Map<string, Contract>();
  const result: Contract[] = [];
  for (const c of found) {
    const key = dedupKey(c);
    const prev = key ? byKey.get(key) : undefined;
    if (!prev) {
      if (key) byKey.set(key, c);
      result.push(c);
      continue;
    }
    // Дубликат: оставляем более полную запись; закрытый статус побеждает.
    const best = filled(c) > filled(prev) ? { ...c, id: prev.id } : prev;
    const merged = { ...best, status: prev.status === "closed" || c.status === "closed" ? ("closed" as const) : best.status };
    byKey.set(key, merged);
    result[result.indexOf(prev)] = merged;
  }
  return result.map((c) => ({ ...c, selected: c.status === "active" }));
}

export type ParsedReport = { person: Person; contracts: Contract[]; summary: ReportSummary };

export function parseNbkiText(text: string): ParsedReport {
  return { person: parsePerson(text), contracts: parseContracts(text), summary: parseSummary(text) };
}
