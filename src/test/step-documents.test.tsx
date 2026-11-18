import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { StepDocuments } from "@/components/wizard/StepDocuments";
import { emptyContract } from "@/lib/nbki-parser";
import { emptyPerson } from "@/lib/types";

const props = {
  person: { ...emptyPerson(), fullName: "Иванов Иван Иванович" },
  service: { unit: "", contractDate: "", basis: "art2_1" as const },
  contracts: [emptyContract({ creditorName: "ПАО Сбербанк", creditorEmail: "sberbank@sberbank.ru", number: "1" })],
  onBack: () => {},
  onRestart: () => {},
};

describe("Step 3: data confirmation is required before download", () => {
  it("keeps downloads disabled until the confirmation box is checked", () => {
    render(<StepDocuments {...props} />);
    const zip = screen.getByRole("button", { name: /Скачать все заявления/ });
    const docx = screen.getByRole("button", { name: /Скачать \.docx/ });
    expect(zip).toBeDisabled();
    expect(docx).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox"));

    expect(zip).toBeEnabled();
    expect(docx).toBeEnabled();
  });
});
