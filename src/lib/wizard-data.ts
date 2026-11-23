import { emptyCollectionOptions, emptyFssp, emptyPerson, type Contract, type DocumentCategory, type Service } from "./types";

export function emptyWizardData() {
  return {
    person: emptyPerson(),
    contracts: [] as Contract[],
    service: { unit: "", contractDate: "", basis: "art2_1", agency: "vng" } as Service,
    fssp: emptyFssp(),
    category: "military" as DocumentCategory,
    collection: emptyCollectionOptions(),
  };
}

/** Deliberately fictional data, never sourced from a personal report. */
export function demoWizardData() {
  const data = emptyWizardData();
  return {
    ...data,
    person: {
      ...data.person,
      fullName: "Иванов Иван Иванович",
      birthDate: "01.01.1990",
      birthPlace: "Вымышленный город Пример",
      passportSeries: "0000",
      passportNumber: "000000",
      passportIssueDate: "01.01.2010",
      passportIssuedBy: "Вымышленный орган выдачи (демо)",
      passportCode: "000-000",
      address: "Вымышленный город Пример, ул. Демо, д. 1",
      email: "ivanov@example.invalid",
    },
    service: { ...data.service, unit: "ВНГ РФ", contractDate: "01.06.2026" },
    contracts: [1, 2].map((n): Contract => ({
      id: `demo-${n}`,
      creditorName: n === 1 ? 'ООО «Вымышленный банк Пример» (демо)' : 'ООО «Вымышленный займ Образец» (демо)',
      creditorInn: "0000000000",
      creditorOgrn: "0000000000000",
      creditorAddress: `Вымышленный город Пример, ул. Демо, д. ${n + 1}`,
      creditorEmail: `creditor${n}@example.invalid`,
      uid: "",
      number: `ДЕМО-${n}`,
      date: "01.01.2024",
      amount: n === 1 ? "100000" : "20000",
      status: "active",
      selected: true,
      courtAct: "Вымышленный судебный приказ от 01.03.2024 (демо)",
    })),
  };
}