import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { LegalDoc } from "./legal-texts";

export function LegalDialog({ doc, label }: { doc: LegalDoc; label?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="h-auto max-w-full whitespace-normal p-0 text-left text-xs leading-relaxed">{label ?? doc.title}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle className="text-2xl font-semibold">{doc.title}</DialogTitle></DialogHeader>
        <div className="space-y-5 text-sm leading-relaxed text-foreground/85">
          {doc.sections.map((s) => (
            <section key={s.h} className="space-y-2">
              <h3 className="font-semibold text-foreground">{s.h}</h3>
              {s.p.map((p) => <p key={p}>{p}</p>)}
            </section>
          ))}
          <p className="text-xs text-muted-foreground">Редакция от 23.11.2026</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}