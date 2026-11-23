import { useState, type ReactNode } from "react";
import { Heart, Info } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FORUM_LABEL, FORUM_URL, FORUM_WARNING, SBP_NOTICE } from "@/lib/site";

const AMOUNTS = [100, 300, 500, 1000];

export function DonateDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(300);
  const [custom, setCustom] = useState("");
  const value = custom ? Number(custom.replace(/\D/g, "")) : amount;

  const showSbpNotice = () => {
    // Закрываем окно, чтобы уведомление ничего не перекрывало и оставалось кликабельным.
    setOpen(false);
    toast.info(SBP_NOTICE, {
      duration: 10000,
      closeButton: true,
      classNames: {
        toast: "!rounded-2xl !border-border !bg-card !text-foreground !shadow-float",
        description: "!text-muted-foreground !text-[14px] !leading-relaxed",
      },
      action: {
        label: "Открыть ветку форума",
        onClick: () => window.open(FORUM_URL, "_blank", "noopener,noreferrer,nofollow"),
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        <Button variant="pill" size="lg" className="w-full" onClick={showSbpNotice}>
          Поддержать через СБП{value ? ` ${value} ₽` : ""}
        </Button>
        <div className="space-y-2">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span>Мы не получаем и не храним ваши платежные данные.</span>
          </p>
          <a
            href={FORUM_URL}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {FORUM_LABEL}
          </a>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{FORUM_WARNING}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
