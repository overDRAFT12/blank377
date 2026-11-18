import { useState } from "react";
import { Briefcase, Building2, ChevronDown, Plus, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CREDITORS } from "@/lib/creditors";
import { emptyContract } from "@/lib/nbki-parser";
import { BASIS_LABELS, type Basis, type Contract, type Person, type Service } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, Field } from "./Field";
import { StatusBadge, contractMeta } from "./ContractSummary";

type Props = {
  person: Person;
  setPerson: (p: Person) => void;
  service: Service;
  setService: (s: Service) => void;
  contracts: Contract[];
  setContracts: (c: Contract[]) => void;
  showClosed: boolean;
  onShowClosed: (v: boolean) => void;
  onBack: () => void;
  onNext: () => void;
};

const PERSON_FIELDS: { key: keyof Person; label: string; placeholder?: string; wide?: boolean; mode?: "numeric" | "email" | "tel" }[] = [
  { key: "fullName", label: "ФИО полностью", placeholder: "Иванов Иван Иванович", wide: true },
  { key: "birthDate", label: "Дата рождения", placeholder: "ДД.ММ.ГГГГ" },
  { key: "birthPlace", label: "Место рождения" },
  { key: "passportSeries", label: "Серия паспорта", placeholder: "0000", mode: "numeric" },
  { key: "passportNumber", label: "Номер паспорта", placeholder: "000000", mode: "numeric" },
  { key: "passportIssueDate", label: "Дата выдачи", placeholder: "ДД.ММ.ГГГГ" },
  { key: "passportCode", label: "Код подразделения", placeholder: "000-000" },
  { key: "passportIssuedBy", label: "Кем выдан", wide: true },
  { key: "snils", label: "СНИЛС", placeholder: "000-000-000 00" },
  { key: "inn", label: "ИНН", placeholder: "12 цифр", mode: "numeric" },
  { key: "address", label: "Адрес регистрации", wide: true },
  { key: "phone", label: "Телефон", placeholder: "+7", mode: "tel" },
  { key: "email", label: "Email", placeholder: "name@mail.ru", mode: "email" },
];

export function StepReview(props: Props) {
  const { person, setPerson, service, setService, contracts, setContracts, showClosed, onShowClosed } = props;
  const [openId, setOpenId] = useState<string | null>(null);
  const visible = showClosed ? contracts : contracts.filter((c) => c.status === "active");
  const selectedCount = contracts.filter((c) => c.selected && (showClosed || c.status === "active")).length;

  const update = (id: string, patch: Partial<Contract>) =>
    setContracts(contracts.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const addContract = () => {
    const c = emptyContract();
    setContracts([...contracts, c]);
    setOpenId(c.id);
  };

  return (
    <div className="space-y-5">
      <Card title="Личные данные" icon={<User className="size-5" />}>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          {PERSON_FIELDS.map((f) => (
            <Field
              key={f.key}
              label={f.label}
              placeholder={f.placeholder}
              inputMode={f.mode}
              className={f.wide ? "sm:col-span-2" : ""}
              value={person[f.key]}
              onChange={(v) => setPerson({ ...person, [f.key]: v })}
            />
          ))}
        </div>
      </Card>

      <Card title="Данные о службе" icon={<Briefcase className="size-5" />}>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          <Field
            label="Подразделение / воинская часть"
            placeholder="в/ч 00000"
            value={service.unit}
            onChange={(v) => setService({ ...service, unit: v })}
          />
          <Field
            label="Дата контракта / начала участия"
            placeholder="ДД.ММ.ГГГГ"
            value={service.contractDate}
            onChange={(v) => setService({ ...service, contractDate: v })}
          />
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Основание</span>
            <Select value={service.basis} onValueChange={(v) => setService({ ...service, basis: v as Basis })}>
              <SelectTrigger aria-label="Основание">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(BASIS_LABELS) as Basis[]).map((b) => (
                  <SelectItem key={b} value={b}>
                    {BASIS_LABELS[b]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
      </Card>

      <Card
        title="Кредиторы"
        icon={<Building2 className="size-5" />}
        action={
          <Button variant="tint" size="sm" className="px-4" onClick={addContract}>
            <Plus /> <span className="hidden sm:inline">Добавить займ</span>
            <span className="sr-only sm:hidden">Добавить займ</span>
          </Button>
        }
      >
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-background px-4 py-3">
          <span className="text-[15px]">Показать закрытые договоры</span>
          <Switch checked={showClosed} onCheckedChange={onShowClosed} aria-label="Показать закрытые договоры" />
        </div>
        {visible.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border-strong py-10 text-center text-muted-foreground">
            Пока нет договоров. Нажмите «Добавить займ».
          </p>
        )}
        <ul className="space-y-3">
          {visible.map((c) => {
            const open = openId === c.id;
            return (
              <li key={c.id} className={cn("rounded-2xl border transition-colors", c.selected ? "border-primary/40 bg-primary-soft/40" : "border-border")}>
                <div className="flex items-center gap-3 p-4 sm:gap-4">
                  <Checkbox
                    checked={c.selected}
                    onCheckedChange={(v) => update(c.id, { selected: v === true })}
                    aria-label={`Выбрать ${c.creditorName || "договор"}`}
                  />
                  <button className="min-w-0 flex-1 text-left" onClick={() => setOpenId(open ? null : c.id)}>
                    <p className="truncate font-medium">{c.creditorName || "Новый договор"}</p>
                    <p className="truncate text-sm text-muted-foreground">{contractMeta(c) || "Заполните реквизиты"}</p>
                    <StatusBadge status={c.status} className="mt-1.5 inline-block sm:hidden" />
                  </button>
                  <StatusBadge status={c.status} className="hidden sm:inline-block" />
                  <button
                    onClick={() => setOpenId(open ? null : c.id)}
                    aria-label="Редактировать"
                    className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
                  >
                    <ChevronDown className={cn("size-5 transition-transform", open && "rotate-180")} />
                  </button>
                </div>
                {open && <ContractEditor contract={c} onChange={(p) => update(c.id, p)} onRemove={() => setContracts(contracts.filter((x) => x.id !== c.id))} />}
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="soft" size="lg" className="w-full sm:w-auto" onClick={props.onBack}>
          Назад
        </Button>
        <Button variant="pill" size="lg" className="w-full sm:w-auto" disabled={selectedCount === 0} onClick={props.onNext}>
          Сформировать документы{selectedCount ? ` (${selectedCount})` : ""}
        </Button>
      </div>
    </div>
  );
}

function ContractEditor({ contract: c, onChange, onRemove }: { contract: Contract; onChange: (p: Partial<Contract>) => void; onRemove: () => void }) {
  const pick = (id: string) => {
    const ref = CREDITORS.find((r) => r.id === id);
    if (!ref) return;
    onChange({ creditorName: ref.name, creditorInn: ref.inn, creditorOgrn: ref.ogrn, creditorAddress: ref.address, creditorEmail: ref.email });
  };
  return (
    <div className="border-t border-border p-4 pt-5">
      <label className="mb-4 block">
        <span className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Справочник банков и МФО</span>
        <Select onValueChange={pick}>
          <SelectTrigger aria-label="Выбрать из справочника">
            <SelectValue placeholder="Выбрать из справочника — адрес и email подставятся" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Банки</SelectLabel>
              {CREDITORS.filter((r) => r.kind === "bank").map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.short}</SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>МФО</SelectLabel>
              {CREDITORS.filter((r) => r.kind === "mfo").map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.short}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </label>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2" label="Наименование кредитора" value={c.creditorName} onChange={(v) => onChange({ creditorName: v })} />
        <Field label="ИНН кредитора" inputMode="numeric" value={c.creditorInn} onChange={(v) => onChange({ creditorInn: v })} />
        <Field label="ОГРН кредитора" inputMode="numeric" value={c.creditorOgrn} onChange={(v) => onChange({ creditorOgrn: v })} />
        <Field className="sm:col-span-2" label="Юридический адрес" value={c.creditorAddress} onChange={(v) => onChange({ creditorAddress: v })} hint="Сверьте адрес и email с сайтом кредитора или реестром ЦБ РФ." />
        <Field label="Email для обращений" inputMode="email" value={c.creditorEmail} onChange={(v) => onChange({ creditorEmail: v })} />
        <Field label="УИД договора" value={c.uid} onChange={(v) => onChange({ uid: v })} />
        <Field label="Номер договора" value={c.number} onChange={(v) => onChange({ number: v })} />
        <Field label="Дата договора" placeholder="ДД.ММ.ГГГГ" value={c.date} onChange={(v) => onChange({ date: v })} />
        <Field label="Сумма, ₽" inputMode="numeric" value={c.amount} onChange={(v) => onChange({ amount: v })} />
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-muted-foreground">Статус</span>
          <Select value={c.status} onValueChange={(v) => onChange({ status: v as Contract["status"] })}>
            <SelectTrigger aria-label="Статус">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Действующий</SelectItem>
              <SelectItem value="closed">Закрыт</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" size="sm" className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onRemove}>
          <Trash2 /> Удалить
        </Button>
      </div>
    </div>
  );
}
