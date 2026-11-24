import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Footer } from "@/components/site/Footer";
import { StepDocuments } from "@/components/wizard/StepDocuments";
import { emptyPerson } from "@/lib/types";
import { emptyContract } from "@/lib/nbki-parser";
import { CHANNEL_LABEL, CHANNEL_STEP_LABEL, CHANNEL_STEP_NOTE, CHANNEL_URL } from "@/lib/site";

const stepProps = {
  person: { ...emptyPerson(), fullName: "Иванов Иван Иванович" },
  service: { unit: "", contractDate: "", basis: "art2_1" as const },
  contracts: [emptyContract({ creditorName: "ПАО Сбербанк", creditorEmail: "sberbank@sberbank.ru", number: "1" })],
  onBack: () => {},
  onRestart: () => {},
};

describe("Кнопка информационного Telegram-канала", () => {
  it("в футере стоит рядом с кнопкой техподдержки и открывается в новой вкладке", () => {
    const { container } = render(<Footer />);

    const channel = container.querySelector<HTMLAnchorElement>(`a[href="${CHANNEL_URL}"]`);
    expect(channel?.textContent).toBe(CHANNEL_LABEL);
    expect(channel?.getAttribute("target")).toBe("_blank");
    expect(channel?.getAttribute("rel")).toBe("noopener noreferrer");

    // Кнопка канала и кнопка техподдержки идут рядом в одном блоке.
    const support = container.querySelector<HTMLAnchorElement>('a[href="https://t.me/supp_blank377"]');
    expect(support).toBeTruthy();
    expect(channel?.parentElement?.parentElement).toBe(support?.parentElement?.parentElement);
  });

  it("на шаге 3 показывает плашку с подпиской и пояснением", () => {
    const { container } = render(<StepDocuments {...stepProps} />);

    const channel = container.querySelector<HTMLAnchorElement>(`a[href="${CHANNEL_URL}"]`);
    expect(channel?.textContent).toBe(CHANNEL_STEP_LABEL);
    expect(channel?.getAttribute("target")).toBe("_blank");
    expect(channel?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.getByText(CHANNEL_STEP_NOTE)).toBeTruthy();
  });
});
