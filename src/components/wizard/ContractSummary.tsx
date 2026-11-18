import { cn } from "@/lib/utils";
import type { Contract } from "@/lib/types";

export function StatusBadge({ status, className }: { status: Contract["status"]; className?: string }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "active" ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground",
        className,
      )}
    >
      {status === "active" ? "Действующий" : "Закрыт"}
    </span>
  );
}

export function contractMeta(c: Contract) {
  return [c.number && `№ ${c.number}`, c.date && `от ${c.date}`, c.amount && `${c.amount} ₽`].filter(Boolean).join(" · ");
}

export function ContractSummary({ contract: c }: { contract: Contract }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="truncate font-medium">{c.creditorName || "Кредитор не определен"}</p>
        <p className="truncate text-sm text-muted-foreground">{contractMeta(c) || c.uid || "—"}</p>
      </div>
      <StatusBadge status={c.status} />
    </div>
  );
}
