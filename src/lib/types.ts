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
});

export const BASIS_LABELS: Record<Basis, string> = {
  art2_1: "Списание до 10 млн ₽ по ст. 2.1 ФЗ-377",
  art1: "Кредитные каникулы по ст. 1 ФЗ-377",
  art2: "Полное прекращение обязательств по ст. 2 ФЗ-377",
};
