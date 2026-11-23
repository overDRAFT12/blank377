import { Gavel, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { PropertyPetition } from "@/lib/types";
import { Card, Field } from "./Field";

export function PropertyPetitionFields({ value, onChange }: { value: PropertyPetition; onChange: (value: PropertyPetition) => void }) {
  return <Card title="Ходатайство приставу: отсутствие имущества" icon={<Gavel className="size-5" />}>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field className="sm:col-span-2" label="Наименование отдела ФССП (РОСП / ОСП)" value={value.department} onChange={(department) => onChange({ ...value, department })} />
      <Field className="sm:col-span-2" label="Адрес отдела ФССП (для ходатайства)" value={value.address} onChange={(address) => onChange({ ...value, address })} />
      <Field className="sm:col-span-2" label="ФИО судебного пристава-исполнителя (если известно)" value={value.bailiff} onChange={(bailiff) => onChange({ ...value, bailiff })} />
    </div>
    <div className="mt-5 space-y-4">
      {value.cases.map((entry, index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Field className="col-span-2 sm:col-span-1" label={`Номер исполнительного производства ${index + 1}`} value={entry.number} onChange={(number) => onChange({ ...value, cases: value.cases.map((c, i) => i === index ? { ...c, number } : c) })} />
        <Field label={`Дата возбуждения ИП ${index + 1}`} placeholder="ДД.ММ.ГГГГ" value={entry.openedDate} onChange={(openedDate) => onChange({ ...value, cases: value.cases.map((c, i) => i === index ? { ...c, openedDate } : c) })} />
        <Button variant="ghost" size="icon" className="self-end text-destructive" title="Удалить производство" aria-label={`Удалить производство ${index + 1}`} disabled={value.cases.length === 1} onClick={() => onChange({ ...value, cases: value.cases.filter((_, i) => i !== index) })}><Trash2 /></Button>
      </div>)}
      <Button variant="tint" onClick={() => onChange({ ...value, cases: [...value.cases, { number: "", openedDate: "" }] })}><Plus /> Добавить производство</Button>
    </div>
    <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
      <Checkbox className="mt-1" checked={value.confirmed} onCheckedChange={(confirmed) => onChange({ ...value, confirmed: confirmed === true })} />
      <span>Отсутствует имущество (кроме единственного жилья по ст. 446 ГПК РФ) и официальный доход (либо доход не превышает прожиточный минимум)<span className="text-destructive"> *</span></span>
    </label>
    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Окончание производства возможно после проверки приставом и не означает списания долга. Защита единственного жилья имеет исключения, в том числе для ипотечного жилья. 10 дней — срок рассмотрения ходатайства, а не гарантированный срок окончания производства.</p>
  </Card>;
}