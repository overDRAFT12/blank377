import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StepDocuments } from "@/components/wizard/StepDocuments";
import { emptyContract } from "@/lib/nbki-parser";
import { emptyFssp, emptyPerson, type Basis } from "@/lib/types";
import { FSSP_FILE_NAME } from "@/lib/statement";
import { downloadBlob, zipBlobs } from "@/lib/docx-builder";

vi.mock("@/lib/docx-builder", () => ({
  statementToDocx: vi.fn(async () => new Blob(["document"])),
  zipBlobs: vi.fn(async () => new Blob(["archive"])),
  downloadBlob: vi.fn(),
}));

describe("FSSP inclusion in the downloaded ZIP", () => {
  const bases: Basis[] = ["art2_1", "art1", "art1_auto", "art2"];
  it.each(bases)("includes the FSSP file for enabled $basis", async (basis) => {
    vi.clearAllMocks();
    render(<StepDocuments person={emptyPerson()} service={{ unit: "", contractDate: "", basis }} fssp={emptyFssp()} contracts={[emptyContract()]} onBack={() => {}} onRestart={() => {}} />);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Скачать все заявления/ }));
    await waitFor(() => expect(downloadBlob).toHaveBeenCalledTimes(1));
    const files = vi.mocked(zipBlobs).mock.calls[0]?.[0];
    expect(files?.map((f) => f.name)).toContain(FSSP_FILE_NAME);
    expect(files).toHaveLength(2);
  });
  it("excludes the FSSP file when its block is disabled", async () => {
    vi.clearAllMocks();
    render(<StepDocuments person={emptyPerson()} service={{ unit: "", contractDate: "", basis: "art1_auto" }} fssp={{ ...emptyFssp(), enabled: false }} contracts={[emptyContract()]} onBack={() => {}} onRestart={() => {}} />);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Скачать все заявления/ }));
    await waitFor(() => expect(downloadBlob).toHaveBeenCalledTimes(1));
    const files = vi.mocked(zipBlobs).mock.calls[0]?.[0];
    expect(files).toHaveLength(1);
    expect(files?.map((f) => f.name)).not.toContain(FSSP_FILE_NAME);
  });
});