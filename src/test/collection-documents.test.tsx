import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StepDocuments } from "@/components/wizard/StepDocuments";
import { demoWizardData } from "@/lib/wizard-data";
import { downloadBlob, statementToDocx, zipBlobs } from "@/lib/docx-builder";

vi.mock("@/lib/docx-builder", () => ({
  statementToDocx: vi.fn(async () => new Blob(["document"])),
  zipBlobs: vi.fn(async () => new Blob(["archive"])),
  downloadBlob: vi.fn(),
}));

describe("Civilian downloads", () => {
  it("requires confirmation, allows early dates, includes both variants and excludes military/FSSP outputs", async () => {
    vi.clearAllMocks();
    const data = demoWizardData();
    render(<StepDocuments {...data} contracts={data.contracts.map((c) => ({ ...c, overdueDate: "22.11.2026" }))} category="civilian" collection={{ thirdParties: true, debtor: true }} onBack={() => {}} onRestart={() => {}} />);
    const zip = screen.getByRole("button", { name: /Скачать все заявления/ });
    expect(zip).toBeDisabled();
    fireEvent.click(zip);
    expect(downloadBlob).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(zip).toBeEnabled();
    fireEvent.click(zip);
    await waitFor(() => expect(downloadBlob).toHaveBeenCalledTimes(1));
    const files = vi.mocked(zipBlobs).mock.calls[0]?.[0];
    expect(files).toHaveLength(4);
    expect(files?.some((f) => f.name.includes("ФССП"))).toBe(false);
    for (const call of vi.mocked(statementToDocx).mock.calls) {
      expect(call[0].paragraphs.join("\n")).not.toContain("377-ФЗ");
      expect(call[0].paragraphs.join("\n")).not.toContain(data.service.unit);
    }
    expect(vi.mocked(downloadBlob).mock.calls[0]?.[1]).toBe("Заявления_230-ФЗ.zip");
    expect(screen.queryByRole("link", { name: /Открыть в почте/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Скопировать письмо/ })).toBeNull();
  });
});