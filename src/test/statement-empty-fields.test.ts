import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { emptyContract } from "@/lib/nbki-parser";
import { emptyFssp, emptyPerson, type Basis } from "@/lib/types";
import { buildFsspStatement, buildStatement, statementToText } from "@/lib/statement";
import { statementToDocx, zipBlobs } from "@/lib/docx-builder";

const person = {
  ...emptyPerson(),
  fullName: "Иванов Иван Иванович",
  passportSeries: "0000",
  passportNumber: "000000",
};
const bases: Basis[] = ["art2_1", "art1", "art1_auto", "art2"];

const bytes = (blob: Blob) =>
  new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      reader.result instanceof ArrayBuffer
        ? resolve(new Uint8Array(reader.result))
        : reject(new Error("Missing binary document"));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });

describe.each(bases)("Unfilled optional fields: %s", (basis) => {
  const service = { basis, unit: "", contractDate: "01.05.2026" };
  const contract = emptyContract({ creditorName: "ООО МКК «Вымышленный пример»" });
  it("omits an absent contract number instead of printing a blank number", () => {
    const text = statementToText(buildStatement(person, service, contract));
    expect(text).not.toMatch(/(?:договор|займа\)) №/);
    expect(text).toContain("ООО МКК «Вымышленный пример»");
  });
  it("omits the absent amount", () =>
    expect(statementToText(buildStatement(person, service, contract))).not.toContain("на сумму"));
  it("omits the absent UID", () =>
    expect(statementToText(buildStatement(person, service, contract))).not.toMatch(
      /УИД|УИд|идентификатор договора/,
    ));
  it("omits the absent previous passport", () => {
    expect(statementToText(buildStatement(person, service, contract))).not.toContain(
      "ранее выдавался",
    );
    expect(
      statementToText(buildFsspStatement(person, service, emptyFssp(), [contract])),
    ).not.toContain("по прежним паспортным");
  });
  it("omits absent enforcement details without empty parentheses", () => {
    const text = statementToText(buildFsspStatement(person, service, emptyFssp(), [contract]));
    expect(text).not.toContain("производства №");
    expect(text).not.toMatch(/\(\s*\)|undefined|null|NaN/);
  });
  it("creates real Word and ZIP files without missing-value artifacts", async () => {
    const statements = [
      buildStatement(person, service, contract),
      buildFsspStatement(person, service, emptyFssp(), [contract]),
    ];
    const files = await Promise.all(
      statements.map(async (statement, i) => ({
        name: `test-${i}.docx`,
        blob: await statementToDocx(statement),
      })),
    );
    const zipBlob = await zipBlobs(files);
    const archive = await JSZip.loadAsync(await bytes(zipBlob));
    expect(Object.keys(archive.files)).toHaveLength(2);
    for (const file of files) {
      const doc = await JSZip.loadAsync(await bytes(file.blob));
      const xml = doc.file("word/document.xml");
      if (!xml) throw new Error("Word document XML missing");
      expect(await xml.async("string")).not.toMatch(/undefined|null|NaN|\(\s*\)/);
    }
  });
  it.each([undefined, null, Number.NaN, "undefined", "null", "NaN", "   "])(
    "safely omits missing or malformed optional value %s",
    (value) => {
      const input = { ...contract };
      for (const field of ["number", "amount", "uid", "courtAct"])
        Object.defineProperty(input, field, { value });
      const sender = { ...person };
      Object.defineProperty(sender, "previousPassport", { value });
      const fssp = emptyFssp();
      for (const field of ["cases", "bailiff"]) Object.defineProperty(fssp, field, { value });
      for (const statement of [
        buildStatement(sender, service, input),
        buildFsspStatement(sender, service, fssp, [input]),
      ]) {
        expect(statementToText(statement)).not.toMatch(/undefined|null|NaN|\(\s*\)/);
      }
    },
  );
});
