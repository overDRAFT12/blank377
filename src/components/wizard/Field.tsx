import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function Field({
  label,
  value,
  onChange,
  placeholder,
  className,
  inputMode,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
  className?: string | undefined;
  inputMode?: "text" | "numeric" | "email" | "tel" | undefined;
  hint?: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[13px] font-medium text-muted-foreground">{label}</span>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode} />
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Card({ title, icon, action, children }: { title: string; icon?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="surface-card p-6 md:p-8">
      <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h2 className="flex min-w-0 items-center gap-3 text-lg font-semibold sm:text-xl">
          {icon && <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">{icon}</span>}
          <span className="min-w-0 break-words">{title}</span>
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
