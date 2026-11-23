import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, Lock } from "lucide-react";
import { StepUpload } from "@/components/wizard/StepUpload";
import { StepReview } from "@/components/wizard/StepReview";
import { StepDocuments } from "@/components/wizard/StepDocuments";
import type { ReportSummary } from "@/lib/nbki-parser";
import { emptyFssp, emptyPerson, type Contract, type Fssp, type Person, type Service } from "@/lib/types";
import { cn } from "@/lib/utils";
import { demoWizardData, emptyWizardData } from "@/lib/wizard-data";

export const Route = createFileRoute("/sozdat")({
  head: () => ({
    meta: [
      { title: "Бланк 377 — создание заявлений в банки, МФО и ФССП" },
      {
        name: "description",
        content: "Загрузите отчет НБКИ, проверьте реквизиты и скачайте заявления в банки и МФО по ФЗ-377. Всё локально в браузере.",
      },
      { property: "og:title", content: "Бланк 377 — создание заявлений в банки, МФО и ФССП" },
      { property: "og:description", content: "Три шага до готовых заявлений по ФЗ-377. Данные не покидают устройство." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Бланк 377 — создание заявлений в банки, МФО и ФССП" },
      { name: "twitter:description", content: "Три шага до готовых заявлений по ФЗ-377. Данные не покидают устройство." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Wizard,
});

const STEPS = ["Отчет НБКИ", "Проверка данных", "Документы"];

function Wizard() {
  // Данные живут только в памяти вкладки: никакого localStorage, сервера или базы.
  const [step, setStep] = useState(0);
  const [person, setPerson] = useState<Person>(emptyPerson);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [service, setService] = useState<Service>({ unit: "", contractDate: "", basis: "art2_1", agency: "vng" });
  const [fssp, setFssp] = useState<Fssp>(emptyFssp);
  const [showClosed, setShowClosed] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [demo, setDemo] = useState(false);

  const replaceData = (data: ReturnType<typeof emptyWizardData>) => {
    setPerson(data.person);
    setContracts(data.contracts);
    setService(data.service);
    setFssp(data.fssp);
    setSummary(null);
    setParsed(false);
    setShowClosed(false);
    setDemo(false);
  };

  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selected = contracts.filter((c) => c.selected && (showClosed || c.status === "active"));

  return (
    <div className="mx-auto max-w-3xl px-5 pb-16 pt-8 md:pt-12">
      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[15px] font-medium text-primary hover:underline">
          <ArrowLeft className="size-4" /> На главную
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5 text-success" /> Локально в браузере
        </span>
      </div>

      <ol className="mt-8 grid grid-cols-3 gap-2" aria-label="Шаги">
        {STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={label}>
              <button
                disabled={i > step || (i === 2 && selected.length === 0)}
                onClick={() => go(i)}
                className="w-full text-left disabled:cursor-default"
                aria-current={current ? "step" : undefined}
              >
                <div className={cn("h-1.5 rounded-full transition-colors duration-500", done || current ? "bg-primary" : "bg-border")} />
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                      done ? "bg-primary text-primary-foreground" : current ? "bg-foreground text-background" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={cn("min-w-0 text-[12px] font-medium leading-tight sm:text-[13px]", current ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      <h1 className="mt-10 text-3xl font-bold tracking-tight md:text-4xl">
        {step === 0 && "Загрузите отчет НБКИ"}
        {step === 1 && "Проверьте данные"}
        {step === 2 && "Готовые документы"}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {step === 0 && "PDF читается прямо на вашем устройстве — файл никуда не отправляется."}
        {step === 1 && "Поправьте то, что распознано неточно, и выберите основание по ФЗ-377."}
        {step === 2 && "Скачайте заявления и отправьте их кредиторам."}
      </p>

      <div className="mt-8">
        {demo && <p role="status" className="mb-5 rounded-2xl border border-border bg-secondary p-4 text-sm leading-relaxed text-muted-foreground">Демо: все персональные данные и кредиторы вымышлены. Документы с этими данными не предназначены для отправки.</p>}
        {step === 0 && (
          <StepUpload
            person={person}
            contracts={contracts}
            parsed={parsed}
            summary={summary}
            showClosed={showClosed}
            onShowClosed={setShowClosed}
            onParsed={(p, c, sum) => {
              setDemo(false);
              setPerson(p);
              setContracts(c);
              setSummary(sum);
              setShowClosed(false);
              setParsed(true);
            }}
            onManual={() => go(1)}
            onDemo={() => {
              replaceData(demoWizardData());
              setDemo(true);
              go(1);
            }}
            onNext={() => go(1)}
          />
        )}
        {step === 1 && (
          <StepReview
            person={person}
            setPerson={setPerson}
            service={service}
            setService={setService}
            fssp={fssp}
            setFssp={setFssp}
            contracts={contracts}
            setContracts={setContracts}
            showClosed={showClosed}
            onShowClosed={setShowClosed}
            onBack={() => go(0)}
            onNext={() => go(2)}
            onClear={() => replaceData(emptyWizardData())}
          />
        )}
        {step === 2 && (
          <StepDocuments
            person={person}
            service={service}
            fssp={fssp}
            contracts={selected}
            onBack={() => go(1)}
            onRestart={() => {
              replaceData(emptyWizardData());
              go(0);
            }}
          />
        )}
      </div>
    </div>
  );
}
