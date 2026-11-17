import { useState, type ReactNode } from "react";
import { Heart } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DONATE_LINKS } from "@/lib/site";

const AMOUNTS = [100, 300, 500, 1000];

export function DonateDialog({ children }: { children: ReactNode }) {
  const [amount, setAmount] = useState<number | null>(300);
  const [custom, setCustom] = useState("");
  const value = custom ? Number(custom.replace(/\D/g, "")) : amount;

  const methods = [
    { label: "СБП", href: DONATE_LINKS.sbp },
    { label: "CloudTips", href: DONATE_LINKS.cloudtips },
    { label: "ЮMoney", href: DONATE_LINKS.yoomoney },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader className="items-center text-center">
          <span className="mb-2 grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
            <Heart className="size-6" />
          </span>
          <DialogTitle className="text-2xl font-semibold">Поддержать проект</DialogTitle>
          <DialogDescription>
            Сервис бесплатен для защитников и их семей. Пожертвование добровольное и безвозмездное.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => {
                setAmount(a);
                setCustom("");
              }}
              className={cn(
                "h-12 rounded-2xl border text-[15px] font-medium transition-all",
                !custom && amount === a ? "border-primary bg-primary-soft text-primary" : "border-border bg-card hover:bg-secondary",
              )}
            >
              {a} ₽
            </button>
          ))}
        </div>
        <Input
          inputMode="numeric"
          placeholder="Своя сумма, ₽"
          value={custom}
          onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 7))}
          className="h-12 rounded-2xl text-center text-[15px]"
        />
        <div className="grid gap-2">
          {methods.map((m) => (
            <Button key={m.label} asChild variant={m.label === "СБП" ? "pill" : "soft"} size="lg">
              <a href={`${m.href}${value ? `?amount=${value}` : ""}`} target="_blank" rel="noreferrer">
                {m.label === "СБП" ? `Перевести ${value || ""} ₽ через СБП` : `Через ${m.label}`}
              </a>
            </Button>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Платежные ссылки ведут на внешние сервисы. Мы не получаем и не храним ваши платежные данные.
        </p>
      </DialogContent>
    </Dialog>
  );
}
