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

describe("Step 3: FSSP statement card", () => {
  const fssp = { enabled: true, department: "Центральный РОСП", address: "", bailiff: "", cases: "" };
  it("shows the FSSP file when the switch is on for art. 2.1", () => {
    render(<StepDocuments {...props} fssp={fssp} />);
    expect(screen.getByText("Заявление в ФССП")).toBeInTheDocument();
  });
  it("hides it when the switch is off", () => {
    render(<StepDocuments {...props} fssp={{ ...fssp, enabled: false }} />);
    expect(screen.queryByText("Заявление в ФССП")).toBeNull();
  });
});
