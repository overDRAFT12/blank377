import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StepDocuments } from "@/components/wizard/StepDocuments";
import { demoWizardData } from "@/lib/wizard-data";
import { downloadBlob, statementToDocx, zipBlobs } from "@/lib/docx-builder";
import { PROPERTY_PETITION_FILE_NAME } from "@/lib/statement";

vi.mock("@/lib/docx-builder", () => ({
  statementToDocx: vi.fn(async () => new Blob(["document"])),
  zipBlobs: vi.fn(async () => new Blob(["archive"])),
  downloadBlob: vi.fn(),
}));

describe("Civilian downloads", () => {
  it("downloads a standalone property petition without any creditors", async () => {
    vi.clearAllMocks();
    const data = demoWizardData();
    render(<StepDocuments {...data} contracts={[]} category="civilian" collection={{ thirdParties: false, debtor: false, propertyPetition: true }} propertyPetition={{ ...data.propertyPetition, confirmed: true }} onBack={() => {}} onRestart={() => {}} />);
    fireEvent.click(screen.getByRole("checkbox"));
    const downloads = screen.getAllByRole("button", { name: /Скачать \.docx/ });
    expect(downloads).toHaveLength(1);
    const download = downloads[0];
    if (!download) throw new Error("Petition download missing");
    fireEvent.click(download);
    await waitFor(() => expect(downloadBlob).toHaveBeenCalledTimes(1));
    expect(vi.mocked(downloadBlob).mock.calls[0]?.[1]).toBe(PROPERTY_PETITION_FILE_NAME);
    fireEvent.click(screen.getByRole("button", { name: /Скачать все заявления/ }));
    await waitFor(() => expect(zipBlobs).toHaveBeenCalledTimes(1));
    expect(vi.mocked(zipBlobs).mock.calls[0]?.[0].map((f) => f.name)).toEqual([PROPERTY_PETITION_FILE_NAME]);
  });
  it("adds exactly one property petition alongside both collector scenarios", async () => {
    vi.clearAllMocks();
    const data = demoWizardData();
    render(<StepDocuments {...data} category="civilian" collection={{ thirdParties: true, debtor: true, propertyPetition: true }} propertyPetition={{ ...data.propertyPetition, confirmed: true }} onBack={() => {}} onRestart={() => {}} />);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Скачать все заявления/ }));
    await waitFor(() => expect(zipBlobs).toHaveBeenCalledTimes(1));
    const files = vi.mocked(zipBlobs).mock.calls[0]?.[0];
    expect(files).toHaveLength(5);
    expect(files?.filter((f) => f.name === PROPERTY_PETITION_FILE_NAME)).toHaveLength(1);
  });
  it("does not permit property downloads without debtor-status confirmation", () => {
    vi.clearAllMocks();
    const data = demoWizardData();
    render(<StepDocuments {...data} category="civilian" collection={{ thirdParties: true, debtor: false, propertyPetition: true }} onBack={() => {}} onRestart={() => {}} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("button", { name: /Скачать все заявления/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /Скачать все заявления/ }));
    expect(downloadBlob).not.toHaveBeenCalled();
  });
  it("excludes the civilian petition in the military category despite remembered selection", async () => {
    vi.clearAllMocks();
    const data = demoWizardData();
    render(<StepDocuments {...data} collection={{ thirdParties: false, debtor: false, propertyPetition: true }} propertyPetition={{ ...data.propertyPetition, confirmed: true }} onBack={() => {}} onRestart={() => {}} />);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Скачать все заявления/ }));
    await waitFor(() => expect(zipBlobs).toHaveBeenCalledTimes(1));
    const files = vi.mocked(zipBlobs).mock.calls[0]?.[0];
    expect(files).toHaveLength(3);
    expect(files?.some((f) => f.name === PROPERTY_PETITION_FILE_NAME)).toBe(false);
  });
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