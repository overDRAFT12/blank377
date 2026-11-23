import { ServerOff } from "lucide-react";
import { PDN_CARD } from "@/lib/site";

/**
 * Четвёртая карточка секции о конфиденциальности: статус по № 152-ФЗ и реестру РКН.
 * Вынесена из главной страницы, чтобы текст можно было проверить тестом.
 */
export function PdnCard() {
  return (
    <article className="mt-5 rounded-3xl bg-background p-8 md:flex md:items-start md:gap-6">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
        <ServerOff className="size-6" />
      </span>
      <div className="mt-6 md:mt-0">
        <h3 className="text-lg font-semibold">{PDN_CARD.title}</h3>
        <p className="mt-2 leading-relaxed text-muted-foreground">{PDN_CARD.text}</p>
      </div>
    </article>
  );
}
