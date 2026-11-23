import { useRef, useState } from "react";
import { ChevronDown, FileText, Loader2, PenLine, UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Contract, Person } from "@/lib/types";
import type { ReportSummary } from "@/lib/nbki-parser";
import { ContractSummary } from "./ContractSummary";

type Props = {
  person: Person;
  contracts: Contract[];
  parsed: boolean;
  summary: ReportSummary | null;
  showClosed: boolean;
  onShowClosed: (v: boolean) => void;
  onParsed: (person: Person, contracts: Contract[], summary: ReportSummary) => void;
  onManual: () => void;
  onNext: () => void;
};

export function StepUpload({ person, contracts, parsed, summary, showClosed, onShowClosed, onParsed, onManual, onNext }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Нужен файл в формате PDF — кредитный отчет НБКИ.");
      return;
    }
    setError("");
    setBusy(true);
    setFileName(file.name);
    try {
      const [{ extractPdfText }, { parseNbkiText }] = await Promise.all([
        import("@/lib/pdf-extract"),
        import("@/lib/nbki-parser"),
      ]);
      const text = await extractPdfText(await file.arrayBuffer());
      if (text.replace(/\s/g, "").length < 50) {
        setError("В файле не найден текст. Возможно, это скан — заполните данные вручную.");
        return;
      }
      const result = parseNbkiText(text);
      onParsed(result.person, result.contracts, result.summary);
    } catch (e) {
      console.error(e);
      setError("Не удалось прочитать PDF. Проверьте файл или заполните данные вручную.");
    } finally {
      setBusy(false);
    }
  }

  const active = contracts.filter((c) => c.status === "active");
  const visible = showClosed ? contracts : active;

  return (
    <div className="space-y-5">
      <div
        role="button"
        tabIndex={0}
        aria-label="Загрузить PDF-отчет НБКИ"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void handleFile(e.dataTransfer.files[0]);
        }}
        className={cn(
          "surface-card flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-16 text-center transition-all md:py-20",
          drag ? "border-primary bg-primary-soft" : "border-border-strong hover:border-primary/60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {busy ? (
          <>
            <Loader2 className="size-12 animate-spin text-primary" />
            <p className="mt-5 text-lg font-semibold">Читаем отчет на вашем устройстве…</p>
            <p className="mt-1 text-sm text-muted-foreground">{fileName}</p>
          </>
        ) : (
          <>
            <span className="grid size-16 place-items-center rounded-2xl bg-primary-soft text-primary">
              <UploadCloud className="size-8" />
            </span>
            <p className="mt-6 text-xl font-semibold">Перетащите PDF-отчет НБКИ сюда</p>
            <p className="mt-2 text-muted-foreground">или нажмите, чтобы выбрать файл</p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="size-3.5" /> Файл не загружается в интернет
            </span>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
        </div>
      )}

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button variant="outline" size="lg" onClick={onManual}>
          <PenLine /> Заполнить вручную без отчета
        </Button>
      </div>

      <details className="group surface-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 font-semibold [&::-webkit-details-marker]:hidden">
          Где бесплатно скачать отчет НБКИ за 2 минуты?
          <ChevronDown className="size-5 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <ol className="list-decimal space-y-2 px-6 pb-6 pl-11 text-[15px] leading-relaxed text-muted-foreground">
          <li>Зайдите на сайт nbki.ru и нажмите «Войти через Госуслуги».</li>
          <li>Закажите бесплатный кредитный отчет (два раза в год — бесплатно).</li>
          <li>Когда отчет будет готов (обычно за 1–2 минуты), скачайте его в формате PDF.</li>
          <li>Вернитесь сюда и перетащите файл в зону загрузки выше.</li>
        </ol>
      </details>

      {parsed && (
        <section className="surface-card fade-up p-6 md:p-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-success" />
            <div>
              <h2 className="text-xl font-semibold">Отчет обработан</h2>
              <p className="mt-1 text-muted-foreground">
                {person.fullName ? `${person.fullName} · ` : ""}
                Найдено договоров: {contracts.length}, действующих: {active.length}
              </p>
              {summary && (summary.total !== null || summary.active !== null) && (
                <p className="mt-1 text-sm text-muted-foreground">
                  По сводке отчета: всего {summary.total ?? "—"}, действующих {summary.active ?? "—"}
                </p>
              )}
              {summary?.active != null && summary.active !== active.length && (
                <p className="mt-2 flex items-start gap-2 rounded-xl bg-secondary px-3 py-2 text-sm text-foreground">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  Число действующих договоров не совпадает со сводкой — проверьте список на следующем шаге.
                </p>
              )}
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between rounded-2xl bg-background px-4 py-3">
            <span className="text-[15px]">Показать закрытые договоры</span>
            <Switch checked={showClosed} onCheckedChange={onShowClosed} aria-label="Показать закрытые договоры" />
          </div>
          <div className="mt-4 divide-y divide-border">
            {visible.length === 0 && (
              <p className="py-6 text-center text-muted-foreground">
                Договоры не распознаны — вы сможете добавить их вручную на следующем шаге.
              </p>
            )}
            {visible.map((c) => (
              <ContractSummary key={c.id} contract={c} />
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="pill" size="lg" onClick={onNext}>
              Продолжить
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
