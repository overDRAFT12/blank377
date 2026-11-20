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

export type Basis = "art2_1" | "art1" | "art2";

export type Service = {
  unit: string;
  contractDate: string;
  basis: Basis;
};

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
  art1: "Кредитные каникулы по ст. 1 ФЗ-377",
  art2: "Полное прекращение обязательств по ст. 2 ФЗ-377",
};
