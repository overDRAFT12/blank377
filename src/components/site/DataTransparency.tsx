import { ShieldCheck } from "lucide-react";
import { FORUM_LABEL, FORUM_URL, FORUM_WARNING } from "@/lib/site";
import { DATA_TRANSPARENCY } from "./data-transparency";
import { LEGAL_DOCS } from "./legal-texts";
import { LegalDialog } from "./LegalDialog";

export function DataTransparency() {
  const privacy = LEGAL_DOCS.find((doc) => doc.id === "privacy");
  return (
    <section aria-labelledby="data-transparency-title" className="border-y border-border py-6">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" />
        <h2 id="data-transparency-title" className="text-lg font-semibold">Как обрабатываются ваши данные (простыми словами)</h2>
      </div>
      <div className="mt-5 space-y-5 text-sm leading-relaxed">
        {DATA_TRANSPARENCY.map((answer) => (
          <div key={answer.h}>
            <h3 className="font-semibold">{answer.h}</h3>
            {answer.p.map((text) => <p key={text} className="mt-1.5 text-muted-foreground">{text}</p>)}
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        {privacy && <LegalDialog doc={privacy} label="Политика обработки персональных данных" />}
        <a href={FORUM_URL} target="_blank" rel="noopener noreferrer nofollow" className="text-xs font-medium text-primary hover:underline">{FORUM_LABEL}</a>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{FORUM_WARNING}</p>
    </section>
  );
}