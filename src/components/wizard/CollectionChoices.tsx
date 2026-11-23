import { Checkbox } from "@/components/ui/checkbox";
import type { CollectionOptions } from "@/lib/types";

export function CollectionChoices({ value, onChange }: { value: CollectionOptions; onChange: (options: CollectionOptions) => void }) {
  return <section aria-label="Сценарии для физических лиц" className="space-y-4 border-y border-border py-6">
    <h2 className="text-xl font-semibold">Заявления для физических лиц</h2>
    <label className="flex cursor-pointer items-start gap-3">
      <Checkbox className="mt-1" checked={value.thirdParties} onCheckedChange={(checked) => onChange({ ...value, thirdParties: checked === true })} />
      <span className="min-w-0"><span className="block font-medium">Отзыв согласия на взаимодействие с третьими лицами (ч. 5–7 ст. 4 № 230-ФЗ)</span>
        <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">Можно подать в любой момент (даже с 1-го дня просрочки или до неё). Кредитор и коллекторы обязаны прекратить звонки и сообщения родственникам, коллегам и знакомым в течение 3 рабочих дней.</span>
      </span>
    </label>
    <label className="flex cursor-pointer items-start gap-3">
      <Checkbox className="mt-1" checked={value.debtor} onCheckedChange={(checked) => onChange({ ...value, debtor: checked === true })} />
      <span className="min-w-0"><span className="block font-medium">Отказ от взаимодействия с самим должником — звонки, СМС, встречи (ст. 8 № 230-ФЗ)</span>
        <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">По ч. 6 ст. 8 № 230-ФЗ заявление подается не ранее чем через 4 месяца с даты возникновения просрочки (иначе признается недействительным). После подачи разрешена только переписка Почтой России.</span>
      </span>
    </label>
    {value.debtor && <p role="status" className="rounded-xl bg-warning p-4 text-sm leading-relaxed text-warning-foreground">Вариант Б пока формируется как проект: точное соответствие форме приказа ФССП России от 18.01.2024 № 6 не подтверждено. Перед отправкой перенесите данные в официальный бланк.</p>}
    <label className="flex cursor-pointer items-start gap-3">
      <Checkbox className="mt-1" checked={value.propertyPetition === true} onCheckedChange={(checked) => onChange({ ...value, propertyPetition: checked === true })} />
      <span className="min-w-0"><span className="block font-medium">Ходатайство в ФССП об окончании ИП при отсутствии имущества (п. 4 ч. 1 ст. 46 № 229-ФЗ)</span>
        <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">Можно подготовить отдельно, без отчета НБКИ и списка кредиторов, или вместе с заявлениями по № 230-ФЗ.</span>
      </span>
    </label>
  </section>;
}