import { MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChannelButton } from "./ChannelButton";
import { LegalDialog } from "./LegalDialog";
import { InstallAppButton } from "./InstallAppButton";
import { CHANNEL_LABEL, SUPPORT_LABEL, SUPPORT_URL, SUPPORT_WARNING, PDN_NOTE, REPO_URL, SITE_NAME } from "@/lib/site";
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
        <p className="pt-5 leading-relaxed">
          {PDN_NOTE} Открытый исходный код:{" "}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-primary underline-offset-4 hover:underline"
          >
            {REPO_URL}
          </a>
        </p>
        <div className="flex flex-col gap-3 pt-5 md:flex-row md:items-center md:justify-between">
          <span>© 2026 {SITE_NAME}. Некоммерческий информационный сервис</span>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {LEGAL_DOCS.map((doc) => <LegalDialog key={doc.id} doc={doc} />)}
          </div>
        </div>
        <div className="mt-5 max-w-2xl">
          <div className="flex flex-wrap gap-3">
            <InstallAppButton />
            <ChannelButton label={CHANNEL_LABEL} />
            <Button asChild variant="outline" className="h-auto whitespace-normal text-left">
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium"
            >
              <MessagesSquare className="size-4 text-primary" /> {SUPPORT_LABEL}
            </a>
            </Button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed">{SUPPORT_WARNING}</p>
        </div>
      </div>
    </footer>
  );
}
