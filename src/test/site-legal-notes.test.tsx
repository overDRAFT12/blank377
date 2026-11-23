import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Footer } from "@/components/site/Footer";
import { PdnCard } from "@/components/site/PdnCard";
import { PDN_CARD, PDN_NOTE, REPO_URL } from "@/lib/site";

describe("Разъяснение по № 152-ФЗ и реестру РКН", () => {
  it("показывает четвёртую карточку с точной формулировкой", () => {
    render(<PdnCard />);

    expect(screen.getByText("Без передачи на серверы и вне реестра РКН")).toBeTruthy();
    expect(screen.getByText(PDN_CARD.text)).toBeTruthy();
  });

  it("ставит строку о статусе оператора ПДн над копирайтом и ссылку на исходный код", () => {
    const { container } = render(<Footer />);

    const note = screen.getByText((text) => text.startsWith("Сервис не осуществляет сбор, хранение"));
    expect(note.textContent).toContain(PDN_NOTE);

    const link = container.querySelector<HTMLAnchorElement>(`a[href="${REPO_URL}"]`);
    expect(link?.textContent).toBe(REPO_URL);

    const copyright = screen.getByText(/© 2026/);
    const position = note.compareDocumentPosition(copyright);
    // Документ «после» = Node.DOCUMENT_POSITION_FOLLOWING (4)
    expect(position & 4).toBe(4);
  });
});
