import { describe, expect, it } from "vitest";

import { DATA_TRANSPARENCY } from "@/components/site/data-transparency";
import { LEGAL_DOCS } from "@/components/site/legal-texts";
import { SUPPORT_URL, PDN_OPERATOR_STATEMENT, REPO_URL } from "@/lib/site";

const privacy = LEGAL_DOCS.find((doc) => doc.id === "privacy");
if (!privacy) throw new Error("Privacy policy missing");
const privacyText = privacy.sections
  .flatMap((section) => [section.h, ...section.p])
  .join("\n");
const transparencyText = DATA_TRANSPARENCY.flatMap((answer) => [answer.h, ...answer.p]).join("\n");

/** Формулировки, которые пользователь просил убрать как обтекаемые. */
const HEDGES = [
  "не является юридическим заключением",
  "зависит от фактической обработки",
  "рассматривается отдельно",
];

describe("Прямая формулировка политики конфиденциальности", () => {
  it("фиксирует клиентский статус сервиса без записи и отправки данных", () => {
    expect(privacyText).toContain("автономным клиентским веб-приложением (Client-Side)");
    expect(privacyText).toContain("оперативной памяти (RAM)");
    expect(privacyText).toContain("без записи в cookies или localStorage и без отправки на сервер");
  });

  it("прямо отрицает статус оператора ПДн, трансграничную передачу и реестр РКН", () => {
    expect(privacyText).toContain(PDN_OPERATOR_STATEMENT);
    expect(privacyText).toContain("не является оператором персональных данных");
    expect(privacyText).toContain("ст. 3 Федерального закона № 152-ФЗ");
    expect(privacyText).toContain("ст. 12 Федерального закона № 152-ФЗ");
    expect(privacyText).toContain("включение в реестр операторов");
  });

  it("дает ссылку на исходный код и Telegram", () => {
    expect(privacyText).toContain(REPO_URL);
    expect(privacyText).toContain(SUPPORT_URL);
  });

  it("не содержит обтекаемых формулировок ни в политике, ни в разделе о данных", () => {
    for (const hedge of HEDGES) {
      expect(privacyText).not.toContain(hedge);
      expect(transparencyText).not.toContain(hedge);
    }
  });

  it("раздел о данных на шаге 1 говорит то же самое прямым тоном", () => {
    expect(transparencyText).toContain("автономное клиентское веб-приложение (Client-Side)");
    expect(transparencyText).toContain(PDN_OPERATOR_STATEMENT);
    expect(transparencyText).toContain(REPO_URL);
  });
});
