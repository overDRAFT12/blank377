import { MessagesSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FORUM_LABEL, FORUM_URL, FORUM_WARNING, SITE_NAME } from "@/lib/site";
import { LEGAL_DOCS } from "./legal-texts";

export function Footer() {
  return (
    <footer className="bg-background">
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-12 text-xs leading-relaxed text-muted-foreground">
        <p className="border-b border-border pb-5">
          Сервис носит исключительно информационно-технический характер и является инструментом автоматизации
          заполнения шаблонов. Администрация не оказывает юридических услуг, не гарантирует принятие решений банками,
          МФО или госорганами и не несет ответственности за последствия использования документов. Все данные
          обрабатываются локально в браузере пользователя.
        </p>
        <div className="flex flex-col gap-3 pt-5 md:flex-row md:items-center md:justify-between">
          <span>© 2026 {SITE_NAME}. Некоммерческий информационный сервис</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {LEGAL_DOCS.map((doc) => (
              <Dialog key={doc.id}>
                <DialogTrigger className="text-foreground/70 transition-colors hover:text-foreground hover:underline">
                  {doc.title}
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">{doc.title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-5 text-sm leading-relaxed text-foreground/85">
                    {doc.sections.map((s) => (
                      <section key={s.h} className="space-y-2">
                        <h3 className="font-semibold text-foreground">{s.h}</h3>
                        {s.p.map((p) => (
                          <p key={p.slice(0, 32)}>{p}</p>
                        ))}
                      </section>
                    ))}
                    <p className="text-xs text-muted-foreground">Редакция от 19.11.2026</p>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
        <div className="mt-5 max-w-xl">
          <a
            href={FORUM_URL}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <MessagesSquare className="size-4 text-primary" /> {FORUM_LABEL}
          </a>
          <p className="mt-2 text-[11px] leading-relaxed">{FORUM_WARNING}</p>
        </div>
      </div>
    </footer>
  );
}
