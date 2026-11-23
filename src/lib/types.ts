export type Person = {
  fullName: string;
  birthDate: string;
  birthPlace: string;
  passportSeries: string;
  passportNumber: string;
  passportIssueDate: string;
  passportIssuedBy: string;
  passportCode: string;
  snils: string;
  inn: string;
  address: string;
  phone: string;
  email: string;
  /** Прежние паспортные данные (для проверки архива ФССП). */
  previousPassport: string;
  previousPassportEnabled?: boolean;
};

export type ContractStatus = "active" | "closed";

export type Contract = {
  id: string;
  creditorName: string;
  creditorInn: string;
  creditorOgrn: string;
  creditorAddress: string;
  creditorEmail: string;
  uid: string;
  number: string;
  date: string;
  amount: string;
  status: ContractStatus;
  selected: boolean;
  /** Реквизиты судебного акта / постановления ФССП (необязательно). */
  courtAct: string;
};

export type Basis = "art2_1" | "art1" | "art1_auto" | "art2";
export const isCreditHoliday = (basis: Basis) => basis === "art1" || basis === "art1_auto";

export type Agency = "mod" | "vng" | "other";

export const AGENCY_LABELS: Record<Agency, string> = {
  mod: "Вооруженные Силы РФ (Минобороны России)",
  vng: "Войска национальной гвардии РФ (ВНГ РФ)",
  other: "Иной федеральный орган",
};

/** Согласованная по падежам фраза о заключении контракта для текста заявления. */
export function agencyPhrase(service: Service): string {
  switch (service.agency ?? "vng") {
    case "mod":
      return "мною заключен контракт о прохождении военной службы в Вооруженных Силах Российской Федерации";
    case "other":
      return "мною заключен контракт о прохождении военной службы (службы) / пребывании в добровольческом формировании";
    default:
      return "мною заключен контракт о прохождении военной службы (службы) в войсках национальной гвардии Российской Федерации (ВНГ РФ)";
  }
}

export type Service = {
  unit: string;
  contractDate: string;
  basis: Basis;
  agency?: Agency;
  graceStartDate?: string;
  vehicleModel?: string;
  vehicleVin?: string;
  pledgeContract?: string;
};

export const graceStartDate = (service: Service) => service.graceStartDate ?? service.contractDate;
export const documentPerson = (person: Person): Person => person.previousPassportEnabled === false ? { ...person, previousPassport: "" } : person;

export const emptyPerson = (): Person => ({
  fullName: "",
  birthDate: "",
  birthPlace: "",
  passportSeries: "",
  passportNumber: "",
  passportIssueDate: "",
  passportIssuedBy: "",
  passportCode: "",
  snils: "",
  inn: "",
  address: "",
  phone: "",
  email: "",
  previousPassport: "",
  previousPassportEnabled: true,
});

/** Данные для отдельного заявления в службу судебных приставов. */
export type Fssp = {
  enabled: boolean;
  department: string;
  address: string;
  bailiff: string;
  cases: string;
};

export const emptyFssp = (): Fssp => ({ enabled: true, department: "", address: "", bailiff: "", cases: "" });

export const BASIS_LABELS: Record<Basis, string> = {
  art2_1: "Списание до 10 млн ₽ по ст. 2.1 ФЗ-377",
  art1: "Кредитные каникулы по ст. 1 ФЗ-377 (беззалоговый кредит / заем)",
  art1_auto: "Кредитные каникулы по ст. 1 ФЗ-377 (кредит под залог автомобиля)",
  art2: "Полное прекращение обязательств по ст. 2 ФЗ-377",
};
