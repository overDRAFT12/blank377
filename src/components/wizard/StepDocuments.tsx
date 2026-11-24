import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Download, FileArchive, FileText, Gavel, Heart, Loader2, Mail, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DonateDialog } from "@/components/site/DonateDialog";
import { ChannelButton } from "@/components/site/ChannelButton";
import { CHANNEL_STEP_LABEL, CHANNEL_STEP_NOTE } from "@/lib/site";
import { buildCollectionStatement, buildFsspStatement, buildPropertyPetition, buildStatement, emailBody, emailSubject, fileNameFor, FSSP_FILE_NAME, PROPERTY_PETITION_FILE_NAME, type Statement } from "@/lib/statement";
import { collectionKinds } from "@/lib/collection";
import { downloadBlob, statementToDocx, zipBlobs } from "@/lib/docx-builder";
import { BASIS_LABELS, type CollectionOptions, type DocumentCategory, type Contract, type Fssp, type Person, type PropertyPetition, type Service } from "@/lib/types";
import { contractMeta } from "./ContractSummary";

type Props = { person: Person; service: Service; fssp?: Fssp; contracts: Contract[]; category?: DocumentCategory; collection?: CollectionOptions; propertyPetition?: PropertyPetition; onBack: () => void; onRestart: () => void };

export function StepDocuments({ person, service, fssp, contracts, category = "military", collection, propertyPetition, onBack, onRestart }: Props) {
  const [zipping, setZipping] = useState(false);
  // Обязательное подтверждение: без него файлы не скачиваются и письма не готовятся.
  const [confirmed, setConfirmed] = useState(false);
  const civilian = category === "civilian";
  const hasPropertyPetition = civilian && collection?.propertyPetition === true;
  const locked = !confirmed || (hasPropertyPetition && !propertyPetition?.confirmed);
  const docs = useMemo(
    () => civilian ? contracts.flatMap((c, i) => collectionKinds(collection ?? { thirdParties: true, debtor: false }).map((kind) => ({
      c, kind, file: fileNameFor(c, i).replace(/\.docx$/, kind === "thirdParties" ? "_Отзыв_третьи_лица.docx" : "_ПРОЕКТ_Отказ_взаимодействие.docx"), statement: buildCollectionStatement(person, c, kind),
    }))) : contracts.map((c, i) => ({ c, kind: "military", file: fileNameFor(c, i), statement: buildStatement(person, service, c) })),
    [person, service, contracts, civilian, collection],
  );
  // Заявление в ФССП формируется для выбранного основания только при включенном переключателе.
  const fsspStatement = useMemo<Statement | null>(
    () => civilian
      ? hasPropertyPetition && propertyPetition?.confirmed ? buildPropertyPetition(person, propertyPetition) : null
      : fssp?.enabled ? buildFsspStatement(person, service, fssp, contracts) : null,
    [person, service, fssp, contracts, civilian, hasPropertyPetition, propertyPetition],
  );
  const fsspFile = civilian ? PROPERTY_PETITION_FILE_NAME : FSSP_FILE_NAME;
  const total = docs.length + (fsspStatement ? 1 : 0);

  async function downloadFssp() {
    if (!fsspStatement || locked) return;
    try {
      downloadBlob(await statementToDocx(fsspStatement), fsspFile);
    } catch (e) {
      console.error(e);
      toast.error("Не удалось сформировать файл");
    }
  }

  async function downloadOne(i: number) {
    const d = docs[i];
    if (!d || locked) return;
    try {
      downloadBlob(await statementToDocx(d.statement), d.file);
    } catch (e) {
      console.error(e);
      toast.error("Не удалось сформировать файл");
    }
  }

  async function downloadAll() {
    if (locked || total === 0) return;
    setZipping(true);
    try {
      const files = await Promise.all(docs.map(async (d) => ({ name: d.file, blob: await statementToDocx(d.statement) })));
      if (fsspStatement) files.push({ name: fsspFile, blob: await statementToDocx(fsspStatement) });
      downloadBlob(await zipBlobs(files), civilian ? hasPropertyPetition ? "Заявления_физическим_лицам.zip" : "Заявления_230-ФЗ.zip" : "Заявления_ФЗ-377.zip");
    } catch (e) {
      console.error(e);
      toast.error("Не удалось собрать архив");
    } finally {
      setZipping(false);
    }
  }

  async function copyLetter(c: Contract) {
    if (locked || civilian) return;
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
          {total} {plural(total, ["документ", "документа", "документов"])} · {civilian ? hasPropertyPetition ? docs.length ? "№ 230-ФЗ и № 229-ФЗ" : "Ходатайство в ФССП (№ 229-ФЗ)" : "Защита от звонков (№ 230-ФЗ)" : BASIS_LABELS[service.basis]}
          {!civilian && fsspStatement && " · включая заявление в ФССП"}
        </p>
        <label
          htmlFor="confirm-data"
          className="mx-auto mt-8 flex max-w-md cursor-pointer items-start gap-3 rounded-2xl border border-border bg-background p-4 text-left text-sm leading-relaxed has-[[data-state=checked]]:border-primary/40 has-[[data-state=checked]]:bg-primary-soft/50"
        >
          <Checkbox id="confirm-data" checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} className="mt-0.5" />
          <span>
            {hasPropertyPetition ? "Я проверил(а) свои данные и реквизиты адресатов и понимаю, что сервис не оказывает юридических услуг." : "Я проверил(а) свои данные и реквизиты кредиторов и понимаю, что сервис не оказывает юридических услуг."}
            <span className="text-destructive"> *</span>
          </span>
        </label>
        <Button variant="hero" size="xl" className="mt-6 w-full sm:w-auto" onClick={downloadAll} disabled={zipping || locked || total === 0}>
          {zipping ? <Loader2 className="animate-spin" /> : <FileArchive />} Скачать все заявления (ZIP)
        </Button>
        {locked && <p className="mt-3 text-xs text-muted-foreground">{hasPropertyPetition && !propertyPetition?.confirmed ? "Вернитесь на шаг 2 и подтвердите сведения об отсутствии имущества и дохода." : "Отметьте подтверждение, чтобы скачать документы."}</p>}
        <div className="mx-auto mt-4 max-w-md space-y-1.5 text-xs text-muted-foreground">
          {civilian ? <>
            <p>При подаче на бумаге распечатайте и подпишите каждый документ. Сохраните копии и подтверждение подачи.</p>
            {docs.length > 0 && <p className="text-sm leading-relaxed text-foreground"><strong>Внимание: заявления по № 230-ФЗ имеют юридическую силу только при отправке заказным письмом с уведомлением о вручении (Почтой России), через нотариуса либо при вручении под расписку в офисе кредитора (обычный email для этих заявлений не подходит)</strong> — ч. 1 ст. 8 № 230-ФЗ.</p>}
            {hasPropertyPetition && <div className="border-t border-border pt-3 text-left text-sm leading-relaxed text-foreground">
              <p className="font-semibold">Ходатайство в ФССП по № 229-ФЗ</p>
              <p className="mt-2">Подайте через портал «Госуслуги», раздел «Подача заявлений и ходатайств в ФССП», заказным письмом или через канцелярию отдела ФССП под отметку о принятии.</p>
              <p className="mt-2 text-muted-foreground">10 дней — срок рассмотрения ходатайства по ст. 64.1, а не гарантированный срок окончания производства. Окончание зависит от результатов проверки и не списывает долг.</p>
            </div>}
            {collection?.debtor && <p className="rounded-xl bg-warning p-3 text-warning-foreground">Вариант Б — проект, не проверенный на соответствие форме приказа ФССП России от 18.01.2024 № 6. Перед отправкой перенесите данные в официальный бланк и проверьте срок 4 месяца с даты просрочки.</p>}
          </> : <>
          <p>Перед отправкой распечатайте и подпишите заявление или приложите скан с подписью к письму.</p>
          <p>
            Перед отправкой документов по электронной почте убедитесь, что в тексте заявления и приложенной справке
            отсутствуют сведения о дислокации и задачах подразделения.
          </p>
          </>}
        </div>
      </section>

      <ul className="space-y-3">
        {docs.map((d, i) => (
          <li key={`${d.c.id}-${d.kind}`} className="surface-card p-5 md:p-6">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                <FileText className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{d.c.creditorName || "Кредитор не указан"}</p>
                <p className="text-sm text-muted-foreground">{contractMeta(d.c) || "—"}</p>
                {civilian && <p className="mt-1 text-sm text-primary">{d.kind === "thirdParties" ? "Отзыв согласия: третьи лица" : "Проект: отказ от взаимодействия"}</p>}
                {civilian && <p className="mt-1 break-words text-sm text-muted-foreground">{d.c.creditorAddress || "Адрес кредитора не указан"}</p>}
                {!civilian && d.c.creditorEmail && <p className="truncate text-sm text-muted-foreground">{d.c.creditorEmail}</p>}
              </div>
            </div>
            <div className={`mt-4 grid gap-2 ${civilian ? "" : "sm:grid-cols-3"}`}>
              <Button variant="tint" size="lg" className="w-full px-3" disabled={locked} onClick={() => downloadOne(i)}>
                <Download /> Скачать .docx
              </Button>
              {!civilian && <>{locked ? (
                <Button variant="soft" size="lg" className="w-full px-3" disabled>
                  <Mail /> Открыть в почте
                </Button>
              ) : (
                <Button asChild variant="soft" size="lg" className="w-full px-3">
                  <a href={mailto(d.c)}>
                    <Mail /> Открыть в почте
                  </a>
                </Button>
              )}
              <Button variant="soft" size="lg" className="w-full px-3" disabled={locked} onClick={() => copyLetter(d.c)}>
                <Copy /> Скопировать письмо
              </Button>
              </>}
            </div>
          </li>
        ))}
        {fsspStatement && (
          <li className="surface-card p-5 md:p-6">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Gavel className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold">{civilian ? "Ходатайство в ФССП: отсутствие имущества" : "Заявление в ФССП"}</p>
                <p className="text-sm text-muted-foreground">{(civilian ? propertyPetition?.department.trim() : fssp?.department.trim()) || "Отдел судебных приставов не указан"}</p>
                <p className="break-words text-sm text-muted-foreground">{fsspFile}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <Button variant="tint" size="lg" className="w-full px-3" disabled={locked} onClick={downloadFssp}>
                <Download /> Скачать .docx
              </Button>
            </div>
          </li>
        )}
      </ul>

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button variant="soft" size="lg" onClick={onBack}>
          Назад
        </Button>
        <Button variant="ghost" size="lg" className="rounded-full" onClick={onRestart}>
          <RotateCcw /> Начать заново
        </Button>
      </div>

      <div className="rounded-3xl border border-border bg-card/60 px-6 py-5">
        <ChannelButton label={CHANNEL_STEP_LABEL} variant="tint" />
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{CHANNEL_STEP_NOTE}</p>
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
