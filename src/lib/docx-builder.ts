import type { Statement } from "./statement";

/** Сборка .docx в браузере. Библиотека docx подгружается динамически. */
export async function statementToDocx(s: Statement): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = await import("docx");
  const FONT = "Times New Roman";
  const size = 24; // 12pt
  const run = (text: string, opts: { bold?: boolean } = {}) => new TextRun({ text, font: FONT, size, bold: opts.bold });
  const header = (text: string) =>
    new Paragraph({ children: [run(text)], indent: { left: 5100 }, spacing: { after: 0 } });
  const body = (text: string) =>
    new Paragraph({
      children: [run(text)],
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 709 },
      spacing: { after: 120, line: 300 },
    });
  const blank = () => new Paragraph({ children: [run("")] });

  const doc = new Document({
    creator: "Чистый лист",
    title: `${s.title} ${s.subtitle}`,
    sections: [
      {
        properties: { page: { margin: { top: 1134, bottom: 1134, left: 1701, right: 850 } } },
        children: [
          ...s.addressee.map(header),
          blank(),
          ...s.sender.map(header),
          blank(),
          new Paragraph({ children: [run(s.title, { bold: true })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [run(s.subtitle, { bold: true })], alignment: AlignmentType.CENTER, spacing: { after: 240 } }),
          ...s.paragraphs.map(body),
          new Paragraph({ children: [run("На основании изложенного ПРОШУ:", { bold: true })], indent: { firstLine: 709 }, spacing: { before: 120, after: 120 } }),
          ...s.requests.map((r, i) => body(`${i + 1}. ${r}`)),
          blank(),
          new Paragraph({ children: [run("Приложения:", { bold: true })], spacing: { after: 60 } }),
          ...s.attachments.map((a, i) => new Paragraph({ children: [run(`${i + 1}. ${a}`)], spacing: { after: 60 } })),
          blank(),
          new Paragraph({ children: [run(`Дата: ${s.date}`)] }),
          new Paragraph({ children: [run(`Подпись: ${s.signature}`)], spacing: { before: 120 } }),
        ],
      },
    ],
  });
  return Packer.toBlob(doc);
}

export async function zipBlobs(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const f of files) zip.file(f.name, f.blob);
  return zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
