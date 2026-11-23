import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Cpu,
  DatabaseZap,
  FileCheck2,
  FileUp,
  Heart,
  Lock,
  Plane,
  ScanSearch,
  Send,
  ShieldCheck,
  Timer,
  Scale,
  HeartPulse,
  PauseCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DonateDialog } from "@/components/site/DonateDialog";
import heroImage from "@/assets/hero-documents.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Бланк 377 — заявления на списание долгов и кредитные каникулы" },
      {
        name: "description",
        content:
          "Заявления в банки и МФО для военнослужащих и сотрудников Росгвардии по отчету НБКИ. Бесплатно, без регистрации, обработка только в браузере.",
      },
      { property: "og:title", content: "Бланк 377 — заявления на списание долгов и кредитные каникулы" },
      {
        property: "og:description",
        content: "Автоматическая подготовка заявлений по ФЗ-377 по отчету НБКИ. Данные не покидают ваше устройство.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Бланк 377 — заявления на списание долгов и кредитные каникулы" },
      { name: "twitter:description", content: "Автоматическая подготовка заявлений по ФЗ-377 по отчету НБКИ. Данные не покидают ваше устройство." },
    ],
  }),
  component: Index,
});

const STEPS = [
  { n: "01", icon: FileUp, title: "Загрузите отчет НБКИ", text: "Перетащите PDF-файл — система сама найдет паспортные данные и активные договоры." },
  { n: "02", icon: ScanSearch, title: "Проверьте реквизиты", text: "Убедитесь в точности данных — адреса и почта банков и МФО подставятся автоматически." },
  { n: "03", icon: Send, title: "Скачайте и отправьте", text: "Получите готовые заявления в Word (.docx) и отправьте их кредиторам." },
];

const PRIVACY = [
  { icon: Cpu, title: "Обработка строго в браузере", text: "Чтение PDF и сборка Word идут за счет ресурсов вашего устройства, файл не загружается в сеть." },
  { icon: DatabaseZap, title: "Никаких баз данных и регистрации", text: "Мы не запрашиваем логины, не ведем историю и технически не видим ваши данные." },
  { icon: Timer, title: "Автоудаление после закрытия", text: "Данные живут только в оперативной памяти вкладки и бесследно стираются при закрытии страницы." },
];

const LAW = [
  {
    icon: Scale,
    tag: "ст. 2.1 ФЗ-377",
    title: "Списание до 10 млн ₽ по контракту",
    text: "Контракт от 1 года (с 1 декабря 2024 г. или с 1 мая 2026 г.) + наличие вступившего в силу судебного акта, исполнительного листа или открытого производства ФССП до даты контракта. Действует для служащего и супруга(и).",
  },
  {
    icon: HeartPulse,
    tag: "ст. 2 ФЗ-377",
    title: "Полное списание без лимита",
    text: "Прекращение всех кредитов и займов (включая ипотеку), оформленных до начала участия в СВО, при установлении инвалидности I группы вследствие военной травмы или гибели служащего.",
  },
  {
    icon: PauseCircle,
    tag: "ст. 1 ФЗ-377",
    title: "Кредитные каникулы",
    text: "Приостановка платежей на весь срок службы + 180 дней со списанием начисленных процентов, если долг не попадает под ст. 2.1.",
  },
];

const FAQ = [
  { q: "Распространяется ли закон на Росгвардию?", a: "Да. Согласно ч. 6 ст. 1 ФЗ-377 положения закона распространяются на сотрудников и военнослужащих войск национальной гвардии Российской Федерации, участвующих в специальной военной операции, и членов их семей." },
  { q: "Какие долги НЕ списываются?", a: "Не списываются алименты, возмещение вреда жизни и здоровью, налоги и сборы, административные штрафы, а также задолженность за жилищно-коммунальные услуги." },
  { q: "Что приложить к заявлению?", a: "Копию контракта или справку об участии в СВО, копию паспорта, а при наличии — постановление ФССП о возбуждении исполнительного производства или судебный акт." },
];

function Index() {
  return (
    <>
      {/* Hero */}
      <section className="hero-glow relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-5 pb-10 pt-20 text-center md:pt-28">
          <h1 className="text-display fade-up mx-auto max-w-4xl text-balance">Списание долгов без бумажной рутины.</h1>
          <p className="fade-up mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground md:text-xl [animation-delay:80ms]">
            Автоматическая подготовка заявлений в банки и МФО для сотрудников Росгвардии и военнослужащих по отчету НБКИ.
            Бесплатно, без регистрации и без передачи данных.
          </p>
          <div className="fade-up mt-10 flex flex-col items-center gap-5 [animation-delay:160ms]">
            <Button asChild variant="hero" size="xl">
              <Link to="/sozdat">
                Начать оформление <ArrowRight className="size-5" />
              </Link>
            </Button>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[13px] text-muted-foreground shadow-card">
              <Lock className="size-3.5 text-success" />
              100% конфиденциально: обработка только внутри вашего браузера
            </span>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-5 pb-16">
          <img
            src={heroImage}
            alt="Стопка готовых документов с синей отметкой и замком — символ конфиденциальной подготовки заявлений"
            width={1600}
            height={912}
            className="fade-up w-full fade-edges [animation-delay:240ms]"
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <p className="text-center text-sm font-semibold text-primary">Как это работает</p>
        <h2 className="text-section mt-3 text-center">Три шага до готовых заявлений.</h2>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <article key={s.n} className="surface-card p-8">
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <s.icon className="size-6" />
                </span>
                <span className="text-sm font-semibold text-muted-foreground">Шаг {s.n}</span>
              </div>
              <h3 className="mt-8 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{s.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Security */}
      <section id="security" className="bg-card py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-foreground text-background">
              <ShieldCheck className="size-7" />
            </span>
            <h2 className="text-section mt-6 text-balance">Ваши документы не покидают ваше устройство.</h2>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {PRIVACY.map((p) => (
              <article key={p.title} className="rounded-3xl bg-background p-8">
                <p.icon className="size-7 text-primary" />
                <h3 className="mt-6 text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{p.text}</p>
              </article>
            ))}
          </div>
          <details className="group surface-card mt-5 p-0 open:shadow-float">
            <summary className="flex cursor-pointer list-none items-center gap-4 p-6 md:p-8 [&::-webkit-details-marker]:hidden">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <Plane className="size-5" />
              </span>
              <span className="flex-1 text-lg font-semibold">Как убедиться самостоятельно</span>
              <span className="text-2xl leading-none text-muted-foreground transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="px-6 pb-8 leading-relaxed text-muted-foreground md:px-8 md:pl-[5.75rem]">
              Откройте сайт, включите на телефоне «Авиарежим» (отключите интернет) и загрузите PDF-отчет НБКИ. Программа
              сформирует документы полностью автономно — это доказывает, что данные никуда не отправляются.
            </p>
          </details>
        </div>
      </section>

      {/* Law */}
      <section id="law" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <p className="text-center text-sm font-semibold text-primary">Правовая база и условия списания</p>
        <h2 className="text-section mx-auto mt-3 max-w-3xl text-balance text-center">
          На каком основании списываются долги (Федеральный закон № 377-ФЗ)
        </h2>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {LAW.map((l) => (
            <article key={l.tag} className="surface-card flex flex-col p-8">
              <div className="flex items-center gap-3">
                <l.icon className="size-6 text-primary" />
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{l.tag}</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold">{l.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">{l.text}</p>
            </article>
          ))}
        </div>
        <div className="surface-card mx-auto mt-10 max-w-3xl px-6 py-2 md:px-8">
          <Accordion type="single" collapsible>
            {FAQ.map((f, i) => (
              <AccordionItem key={f.q} value={`q${i}`} className={i === FAQ.length - 1 ? "border-b-0" : ""}>
                <AccordionTrigger className="py-5 text-left text-[17px] font-semibold hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-[15px] leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Support */}
      <section id="support" className="px-5 pb-20 md:pb-28">
        <div className="surface-card mx-auto max-w-4xl px-6 py-14 text-center md:px-16 md:py-20">
          <Heart className="mx-auto size-10 text-destructive" />
          <h2 className="text-section mx-auto mt-6 max-w-2xl text-balance">Проект работает благодаря вашей поддержке</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Сервис полностью бесплатен для защитников и их семей. Добровольные пожертвования идут на оплату домена и
            развитие платформы.
          </p>
          <DonateDialog>
            <Button variant="hero" size="xl" className="mt-9">
              Поддержать проект
            </Button>
          </DonateDialog>
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl justify-center px-5 pb-6">
        <Link to="/sozdat" className="inline-flex items-center gap-2 text-[15px] font-medium text-primary hover:underline">
          <FileCheck2 className="size-4" /> Перейти к созданию документов
        </Link>
      </div>
    </>
  );
}
