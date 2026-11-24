import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CHANNEL_URL } from "@/lib/site";
import { TelegramGlyph } from "./TelegramGlyph";

type Props = {
  /** Текст кнопки: в футере — про канал, на шаге 3 — про подписку. */
  label: string;
  className?: string;
  variant?: "outline" | "tint";
};

/**
 * Кнопка перехода в информационный Telegram-канал проекта.
 * Одна и та же ссылка и правила открытия (новая вкладка, rel="noopener noreferrer") во всех местах сайта.
 */
export function ChannelButton({ label, className, variant = "outline" }: Props) {
  return (
    <Button
      asChild
      variant={variant}
      className={cn("h-auto w-fit whitespace-normal text-left", className)}
    >
      <a
        href={CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium"
      >
        <TelegramGlyph className="size-4 shrink-0 text-primary" />
        {label}
      </a>
    </Button>
  );
}
