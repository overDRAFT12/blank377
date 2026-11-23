import { EXTRA_CREDITORS } from "./creditors-extra";

/**
 * Справочник популярных банков и МФО. Реквизиты носят справочный характер —
 * перед отправкой пользователь сверяет адрес и email с сайтом кредитора или реестром ЦБ РФ.
 */
export type CreditorRef = {
  id: string;
  short: string;
  name: string;
  inn: string;
  ogrn: string;
  address: string;
  email: string;
  kind: "bank" | "mfo" | "pko";
  source?: string;
  keywords: string[];
};

export const CREDITORS: CreditorRef[] = [
  { id: "sber", short: "Сбербанк", name: "ПАО Сбербанк", inn: "7707083893", ogrn: "1027700132195", address: "117312, г. Москва, ул. Вавилова, д. 19", email: "sberbank@sberbank.ru", kind: "bank", keywords: ["сбербанк", "сбер банк"] },
  { id: "tbank", short: "Т-Банк", name: "АО «ТБанк»", inn: "7710140679", ogrn: "1027739642281", address: "127287, г. Москва, ул. Хуторская 2-я, д. 38А, стр. 26", email: "help@tbank.ru", kind: "bank", keywords: ["тбанк", "т-банк", "тинькофф"] },
  { id: "vtb", short: "ВТБ", name: "Банк ВТБ (ПАО)", inn: "7702070139", ogrn: "1027739609391", address: "191144, г. Санкт-Петербург, Дегтярный пер., д. 11, лит. А", email: "info@vtb.ru", kind: "bank", keywords: ["втб"] },
  { id: "alfa", short: "Альфа-Банк", name: "АО «Альфа-Банк»", inn: "7728168971", ogrn: "1027700067328", address: "107078, г. Москва, ул. Каланчевская, д. 27", email: "mail@alfabank.ru", kind: "bank", keywords: ["альфа-банк", "альфа банк", "альфабанк"] },
  { id: "gpb", short: "Газпромбанк", name: "«Газпромбанк» (АО)", inn: "7744001497", ogrn: "1027700167110", address: "117420, г. Москва, ул. Наметкина, д. 16, корп. 1", email: "mailbox@gazprombank.ru", kind: "bank", keywords: ["газпромбанк"] },
  { id: "sovcom", short: "Совкомбанк", name: "ПАО «Совкомбанк»", inn: "4401116480", ogrn: "1144400000425", address: "156000, г. Кострома, пр-т Текстильщиков, д. 46", email: "portal@sovcombank.ru", kind: "bank", keywords: ["совкомбанк"] },
  { id: "pochta", short: "Почта Банк", name: "АО «Почта Банк»", inn: "3232005484", ogrn: "1023200000010", address: "107061, г. Москва, Преображенская пл., д. 8", email: "welcome@pochtabank.ru", kind: "bank", keywords: ["почта банк"] },
  { id: "otp", short: "ОТП Банк", name: "АО «ОТП Банк»", inn: "7708001614", ogrn: "1027739176563", address: "125171, г. Москва, Ленинградское ш., д. 16А, стр. 1", email: "info@otpbank.ru", kind: "bank", keywords: ["отп банк", "отп"] },
  { id: "home", short: "Хоум Банк", name: "ООО «Хоум Кредит энд Финанс Банк»", inn: "7735057951", ogrn: "1027700280937", address: "125124, г. Москва, ул. Правды, д. 8, корп. 1", email: "info@homecredit.ru", kind: "bank", keywords: ["хоум кредит", "хоум банк"] },
  { id: "mts", short: "МТС Банк", name: "ПАО «МТС-Банк»", inn: "7702045051", ogrn: "1027739053704", address: "115432, г. Москва, пр-т Андропова, д. 18, корп. 1", email: "info@mtsbank.ru", kind: "bank", keywords: ["мтс-банк", "мтс банк"] },
  { id: "ren", short: "Ренессанс Банк", name: "ООО «Ренессанс Банк»", inn: "7744000126", ogrn: "1027739586291", address: "115114, г. Москва, Кожевническая ул., д. 14", email: "info@rencredit.ru", kind: "bank", keywords: ["ренессанс"] },
  { id: "raif", short: "Райффайзенбанк", name: "АО «Райффайзенбанк»", inn: "7744000302", ogrn: "1027739326449", address: "129090, г. Москва, ул. Троицкая, д. 17, стр. 1", email: "info@raiffeisen.ru", kind: "bank", keywords: ["райффайзен"] },
  { id: "rshb", short: "Россельхозбанк", name: "АО «Россельхозбанк»", inn: "7725114488", ogrn: "1027700342890", address: "119034, г. Москва, Гагаринский пер., д. 3", email: "office@rshb.ru", kind: "bank", keywords: ["россельхозбанк"] },
  { id: "zaymer", short: "Займер", name: "ПАО МФК «Займер»", inn: "4205271785", ogrn: "1134205019189", address: "630099, г. Новосибирск, ул. Октябрьская, д. 52", email: "info@zaymer.ru", kind: "mfo", keywords: ["займер"] },
  { id: "ekapusta", short: "Екапуста", name: "ООО МКК «Русинтерфинанс»", inn: "5408292849", ogrn: "1125476023298", address: "630055, г. Новосибирск, ул. Гнесиных, д. 10/1, офис 202", email: "info@ekapusta.com", kind: "mfo", keywords: ["русинтерфинанс", "екапуста"], source: "https://cbr.ru/finorg/foinfo/?inn=5408292849" },
  { id: "webbankir", short: "Веббанкир", name: "ООО МФК «Веббанкир»", inn: "7733812126", ogrn: "1127746630846", address: "125627, г. Москва, ул. Соколово-Мещерская, д. 25, пом. 1Н/3", email: "info@webbankir.ru", kind: "mfo", keywords: ["веббанкир", "вэббанкир", "webbankir"], source: "https://cbr.ru/finorg/foinfo/?inn=7733812126" },
  { id: "moneyman", short: "MoneyMan", name: "ООО МФК «Мани Мен»", inn: "7704784072", ogrn: "1117746442670", address: "123290, г. Москва, ул. Ермакова Роща, д. 1, стр. 1, пом. 175Н", email: "info@moneyman.ru", kind: "mfo", keywords: ["мани мен", "манимен", "moneyman"], source: "https://cbr.ru/finorg/foinfo/?inn=7704784072" },
  { id: "lime", short: "Лайм-Займ", name: "ООО МФК «Лайм-Займ»", inn: "7724889891", ogrn: "1137746831606", address: "630102, г. Новосибирск, ул. Кирова, д. 48, оф. 1401", email: "support@lime-zaim.ru", kind: "mfo", keywords: ["лайм-займ", "лайм займ", "lime-займ", "lime-zaim"], source: "https://cbr.ru/finorg/foinfo/?inn=7724889891" },
  { id: "turbo", short: "Турбозайм", name: "ООО МФК «Турбозайм»", inn: "7702820127", ogrn: "1137746702367", address: "121087, г. Москва, ул. Барклая, д. 6, стр. 5, пом. 23П/4", email: "info@turbozaim.ru", kind: "mfo", keywords: ["турбозайм"], source: "https://cbr.ru/finorg/foinfo/?inn=7702820127" },
  { id: "bystro", short: "Быстроденьги", name: "ООО МФК «Быстроденьги»", inn: "7325081622", ogrn: "1087325005899", address: "121087, г. Москва, ул. Барклая, д. 6, стр. 5, пом. 23П/4", email: "info@bistrodengi.ru", kind: "mfo", keywords: ["быстроденьги"], source: "https://cbr.ru/finorg/foinfo/?inn=7325081622" },
  ...EXTRA_CREDITORS,
];

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е").replace(/[«»"“”]/g, "").replace(/[-–—]/g, " ").replace(/\s+/g, " ").trim();

/** Найти кредитора в справочнике по ИНН или ключевому слову в названии/тексте. */
export function matchCreditor(text: string, inn?: string): CreditorRef | undefined {
  if (inn) {
    const byInn = CREDITORS.find((c) => c.inn === inn);
    if (byInn) return byInn;
  }
  const t = norm(text);
  if (!t) return undefined;
  return CREDITORS.find((c) => c.keywords.some((k) => {
    const key = norm(k);
    return key.length <= 3 ? new RegExp(`(?:^|[^а-яa-z0-9])${key}(?=$|[^а-яa-z0-9])`, "i").test(t) : t.includes(key);
  }));
}
