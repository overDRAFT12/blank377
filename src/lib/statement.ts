import type { Basis, Contract, Person, Service } from "./types";

/** Текст заявления — чистая функция, общий источник для .docx, письма и предпросмотра. */
export type Statement = {
  addressee: string[];
  sender: string[];
  title: string;
  subtitle: string;
  paragraphs: string[];
  requests: string[];
  attachments: string[];
  date: string;
  signature: string;
};

const LAW = "Федерального закона от 07.10.2022 № 377-ФЗ «Об особенностях исполнения обязательств по кредитным договорам (договорам займа) лицами, призванными на военную службу по мобилизации в Вооруженные Силы Российской Федерации, лицами, принимающими участие в специальной военной операции, а также членами их семей и о внесении изменений в отдельные законодательные акты Российской Федерации»";

const v = (s: string, fallback = "________") => (s && s.trim() ? s.trim() : fallback);

export function formatToday(d = new Date()) {
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function shortName(full: string) {
  const [last, first, middle] = full.trim().split(/\s+/);
  if (!last) return "________";
  return [last, first ? `${first[0]}.` : "", middle ? `${middle[0]}.` : ""].join(" ").replace(/\s+$/, "");
}

export function contractRef(c: Contract) {
  const parts = [`договор № ${v(c.number)}`, `от ${v(c.date)}`];
  if (c.uid) parts.push(`УИд ${c.uid}`);
  return parts.join(" ");
}

export function buildStatement(person: Person, service: Service, c: Contract, today = formatToday()): Statement {
  const addressee = [
    `Кому: ${v(c.creditorName)}`,
    c.creditorInn || c.creditorOgrn
      ? [c.creditorInn && `ИНН ${c.creditorInn}`, c.creditorOgrn && `ОГРН ${c.creditorOgrn}`].filter(Boolean).join(", ")
      : "",
    c.creditorAddress ? `Адрес: ${c.creditorAddress}` : "",
    c.creditorEmail ? `E-mail: ${c.creditorEmail}` : "",
  ].filter(Boolean);

  const passport = `паспорт ${v(person.passportSeries, "____")} № ${v(person.passportNumber, "______")}, выдан ${v(person.passportIssuedBy)} ${v(person.passportIssueDate, "")}${person.passportCode ? `, код подразделения ${person.passportCode}` : ""}`.replace(/\s+,/g, ",");

  const sender = [
    `От: ${v(person.fullName)}`,
    `Дата рождения: ${v(person.birthDate)}${person.birthPlace ? `, место рождения: ${person.birthPlace}` : ""}`,
    passport[0].toUpperCase() + passport.slice(1),
    person.snils ? `СНИЛС: ${person.snils}` : "",
    person.inn ? `ИНН: ${person.inn}` : "",
    `Адрес регистрации: ${v(person.address)}`,
    `Телефон: ${v(person.phone)}`,
    person.email ? `E-mail: ${person.email}` : "",
  ].filter(Boolean);

  const amount = c.amount ? ` на сумму ${c.amount} руб.` : "";
  const contractLine = `Между мной, ${v(person.fullName)}, и ${v(c.creditorName)} заключен кредитный договор (договор займа) № ${v(c.number)} от ${v(c.date)}${c.uid ? ` (уникальный идентификатор договора ${c.uid})` : ""}${amount}.`;
  const serviceLine = `${v(service.contractDate)} мною заключен контракт о прохождении военной службы (службы в войсках национальной гвардии Российской Федерации)${service.unit ? `, место службы: ${service.unit}` : ""}.`;
  const reply = `Ответ прошу направить по адресу: ${v(person.address)}${person.email ? `, а также на адрес электронной почты ${person.email}` : ""}.`;

  const byBasis: Record<Basis, Pick<Statement, "title" | "subtitle" | "paragraphs" | "requests" | "attachments">> = {
    art2_1: {
      title: "ЗАЯВЛЕНИЕ",
      subtitle: "о прекращении обязательств по кредитному договору (договору займа) в соответствии со статьей 2.1 Федерального закона № 377-ФЗ",
      paragraphs: [
        contractLine,
        `${serviceLine} Срок контракта составляет не менее одного года.`,
        "На дату заключения указанного контракта в отношении меня имелся вступивший в законную силу судебный акт о взыскании задолженности по данному договору, и (или) выдан исполнительный документ, и (или) возбуждено исполнительное производство.",
        `В соответствии со статьей 2.1 ${LAW} обязательства лица, заключившего контракт о прохождении военной службы на срок не менее одного года, по кредитным договорам (договорам займа), общий размер которых не превышает 10 000 000 рублей, прекращаются при соблюдении условий, установленных указанной статьей.`,
      ],
      requests: [
        `Прекратить мои обязательства по договору № ${v(c.number)} от ${v(c.date)} в соответствии со статьей 2.1 Федерального закона № 377-ФЗ.`,
        "Направить в бюро кредитных историй сведения о прекращении обязательств по указанному договору.",
        "Отозвать исполнительный документ и (или) уведомить службу судебных приставов о прекращении обязательств.",
        reply,
      ],
      attachments: [
        "Копия паспорта.",
        "Копия контракта о прохождении военной службы (справка воинской части / подразделения об участии в специальной военной операции).",
        "Копия судебного акта, исполнительного документа или постановления о возбуждении исполнительного производства (при наличии).",
      ],
    },
    art1: {
      title: "ТРЕБОВАНИЕ",
      subtitle: "о предоставлении льготного периода по кредитному договору (договору займа) в соответствии со статьей 1 Федерального закона № 377-ФЗ",
      paragraphs: [
        contractLine,
        `${serviceLine} Я являюсь лицом, принимающим участие в специальной военной операции, и в соответствии с частью 6 статьи 1 ${LAW} на меня распространяются положения указанного закона.`,
        "В соответствии со статьей 1 Федерального закона № 377-ФЗ заемщик вправе обратиться к кредитору с требованием о предоставлении льготного периода, в течение которого исполнение обязательств по договору приостанавливается.",
      ],
      requests: [
        `Предоставить льготный период по договору № ${v(c.number)} от ${v(c.date)} на срок участия в специальной военной операции (прохождения службы), увеличенный на срок, предусмотренный статьей 1 Федерального закона № 377-ФЗ.`,
        "Не начислять неустойку (штраф, пени) в течение льготного периода и не передавать сведения о просрочке в бюро кредитных историй.",
        "Направить мне уведомление об установлении льготного периода и об уточненных условиях договора.",
        reply,
      ],
      attachments: [
        "Копия паспорта.",
        "Копия контракта о прохождении военной службы или справка об участии в специальной военной операции.",
      ],
    },
    art2: {
      title: "ЗАЯВЛЕНИЕ",
      subtitle: "о прекращении обязательств по кредитному договору (договору займа) в соответствии со статьей 2 Федерального закона № 377-ФЗ",
      paragraphs: [
        contractLine,
        `${serviceLine} Указанный договор заключен до начала моего участия в специальной военной операции.`,
        "В период участия в специальной военной операции мне установлена инвалидность I группы вследствие увечья (ранения, травмы, контузии), полученного при выполнении задач в ходе специальной военной операции.",
        `В соответствии со статьей 2 ${LAW} обязательства заемщика по кредитному договору (договору займа), в том числе обеспеченному ипотекой, прекращаются в случае гибели (смерти) заемщика либо установления ему инвалидности I группы вследствие увечья, полученного при участии в специальной военной операции.`,
      ],
      requests: [
        `Прекратить мои обязательства по договору № ${v(c.number)} от ${v(c.date)} в полном объеме в соответствии со статьей 2 Федерального закона № 377-ФЗ.`,
        "Направить в бюро кредитных историй сведения о прекращении обязательств по указанному договору.",
        "Прекратить залог (ипотеку) по договору, если он установлен, и выдать документы, необходимые для погашения регистрационной записи.",
        reply,
      ],
      attachments: [
        "Копия паспорта.",
        "Справка об участии в специальной военной операции (копия контракта).",
        "Копия справки МСЭ об установлении инвалидности I группы.",
      ],
    },
  };

  return {
    addressee,
    sender,
    date: today,
    signature: `____________ / ${shortName(person.fullName)} /`,
    ...byBasis[service.basis],
  };
}

export function statementToText(s: Statement) {
  return [
    ...s.addressee,
    "",
    ...s.sender,
    "",
    s.title,
    s.subtitle,
    "",
    ...s.paragraphs,
    "",
    "На основании изложенного ПРОШУ:",
    ...s.requests.map((r, i) => `${i + 1}. ${r}`),
    "",
    "Приложения:",
    ...s.attachments.map((a, i) => `${i + 1}. ${a}`),
    "",
    `Дата: ${s.date}`,
    `Подпись: ${s.signature}`,
  ].join("\n");
}

export function emailSubject(person: Person, service: Service, c: Contract) {
  const kind = service.basis === "art1" ? "Требование о льготном периоде (ст. 1 ФЗ-377)" : `Заявление о прекращении обязательств (ст. ${service.basis === "art2" ? "2" : "2.1"} ФЗ-377)`;
  return `${kind} — договор № ${v(c.number, "б/н")} — ${v(person.fullName, "")}`.trim();
}

export function emailBody(person: Person, service: Service, c: Contract) {
  return [
    "Здравствуйте!",
    "",
    `Направляю ${service.basis === "art1" ? "требование о предоставлении льготного периода" : "заявление о прекращении обязательств"} по ${contractRef(c)} в соответствии с Федеральным законом № 377-ФЗ.`,
    "Заявление и копии подтверждающих документов приложены к письму.",
    "Прошу подтвердить получение и сообщить о принятом решении в установленный законом срок.",
    "",
    "С уважением,",
    v(person.fullName, ""),
    person.phone,
  ]
    .filter((l) => l !== undefined)
    .join("\n");
}

export function fileNameFor(c: Contract, index: number) {
  const base = (c.creditorName || `Кредитор ${index + 1}`)
    .replace(/[«»"“”]/g, "")
    .replace(/[\\/:*?<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  const num = c.number ? `_${c.number.replace(/[\\/:*?<>|\s]+/g, "-")}` : "";
  return `${String(index + 1).padStart(2, "0")}_${base}${num}.docx`;
}
