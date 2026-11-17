import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Download, FileArchive, FileText, Heart, Loader2, Mail, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DonateDialog } from "@/components/site/DonateDialog";
import { buildStatement, emailBody, emailSubject, fileNameFor } from "@/lib/statement";
import { downloadBlob, statementToDocx, zipBlobs } from "@/lib/docx-builder";
import { BASIS_LABELS, type Contract, type Person, type Service } from "@/lib/types";
import { contractMeta } from "./ContractSummary";

type Props = { person: Person; service: Service; contracts: Contract[]; onBack: () => void; onRestart: () => void };

export function StepDocuments({ person, service, contracts, onBack, onRestart }: Props) {
  const [zipping, setZipping] = useState(false);
  const docs = useMemo(
    () => contracts.map((c, i) => ({ c, file: fileNameFor(c, i), statement: buildStatement(person, service, c) })),
    [person, service, contracts],
  );

  async function downloadOne(i: number) {
    const d = docs[i];
    if (!d) return;
    try {
      downloadBlob(await statementToDocx(d.statement), d.file);
    } catch (e) {
      console.error(e);
      toast.error("Не удалось сформировать файл");
    }
  }

  async function downloadAll() {
    setZipping(true);
    try {
      const files = await Promise.all(docs.map(async (d) => ({ name: d.file, blob: await statementToDocx(d.statement) })));
      downloadBlob(await zipBlobs(files), "Заявления_ФЗ-377.zip");
    } catch (e) {
      console.error(e);
      toast.error("Не удалось собрать архив");
    } finally {
      setZipping(false);
    }
  }

  async function copyLetter(c: Contract) {
    const text = [
      `Кому: ${c.creditorEmail || "—"}`,
      `Тема: ${emailSubject(person, service, c)}`,
      "",
      emailBody(person, service, c),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Скопировано", { description: "Email кредитора, тема и текст письма в буфере обмена" });
    } catch {
      toast.error("Браузер запретил доступ к буферу обмена");
    }
  }

  const mailto = (c: Contract) =>
    `mailto:${encodeURIComponent(c.creditorEmail)}?subject=${encodeURIComponent(emailSubject(person, service, c))}&body=${encodeURIComponent(emailBody(person, service, c))}`;

  return (
    <div className="space-y-5">
      <section className="surface-card p-8 text-center md:p-12">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary-soft text-primary">
          <FileText className="size-8" />
        </span>
        <h2 className="mt-6 text-3xl font-bold tracking-tight">Документы готовы</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          {docs.length} {plural(docs.length, ["заявление", "заявления", "заявлений"])} · {BASIS_LABELS[service.basis]}
        </p>
        <Button variant="hero" size="xl" className="mt-8" onClick={downloadAll} disabled={zipping}>
          {zipping ? <Loader2 className="animate-spin" /> : <FileArchive />} Скачать все заявления (ZIP)
        </Button>
        <p className="mx-auto mt-4 max-w-md text-xs text-muted-foreground">
          Перед отправкой распечатайте и подпишите заявление или приложите скан с подписью к письму.
        </p>
      </section>

      <ul className="space-y-3">
        {docs.map((d, i) => (
          <li key={d.c.id} className="surface-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
            <div className="min-w-0">
              <p className="truncate font-semibold">{d.c.creditorName || "Кредитор не указан"}</p>
              <p className="truncate text-sm text-muted-foreground">
                {contractMeta(d.c) || "—"}
                {d.c.creditorEmail ? ` · ${d.c.creditorEmail}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button variant="tint" size="sm" className="px-3.5" onClick={() => downloadOne(i)}>
                <Download /> Скачать .docx
              </Button>
              <Button asChild variant="soft" size="sm" className="px-3.5">
                <a href={mailto(d.c)}>
                  <Mail /> Открыть в почте
                </a>
              </Button>
              <Button variant="soft" size="sm" className="px-3.5" onClick={() => copyLetter(d.c)}>
                <Copy /> Скопировать текст письма
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button variant="soft" size="lg" onClick={onBack}>
          Назад
        </Button>
        <Button variant="ghost" size="lg" className="rounded-full" onClick={onRestart}>
          <RotateCcw /> Начать заново
        </Button>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 rounded-3xl bg-card/60 px-6 py-5 text-center sm:flex-row sm:text-left">
        <p className="text-sm text-muted-foreground">
          Сервис помог? Он бесплатный и живет на добровольные пожертвования.
        </p>
        <DonateDialog>
          <Button variant="outline" size="sm" className="px-4">
            <Heart className="text-destructive" /> Поддержать проект
          </Button>
        </DonateDialog>
      </div>
    </div>
  );
}

function plural(n: number, forms: [string, string, string]) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
  return forms[2];
}
