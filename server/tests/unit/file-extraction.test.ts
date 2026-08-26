import { describe, expect, it } from "vitest";
import { PdfExtractor } from "../../src/infrastructure/extraction/pdf-extractor.js";

const encoder = new TextEncoder();
const defaults = {
  timeoutMs: 5_000,
  maxBytes: 5_242_880,
  maxPages: 200,
  maxChars: 1_000_000,
};

/** Builds a small standards-compliant PDF with one text-bearing page. */
function onePagePdf(text: string): Uint8Array {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${text.length + 31} >>\nstream\nBT /F1 12 Tf 20 100 Td (${text}) Tj ET\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let source = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(encoder.encode(source).byteLength);
    source += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = encoder.encode(source).byteLength;
  source += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  source += offsets
    .slice(1)
    .map((offset) => `${offset.toString().padStart(10, "0")} 00000 n \n`)
    .join("");
  source += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return encoder.encode(source);
}

describe("bounded file extraction", () => {
  const extractor = new PdfExtractor();

  it("preserves empty and normal UTF-8 text", async () => {
    await expect(
      extractor.extract({
        ...defaults,
        bytes: encoder.encode(""),
        mimeType: "text/plain",
      }),
    ).resolves.toBe("");
    await expect(
      extractor.extract({
        ...defaults,
        bytes: encoder.encode("hello\nworld"),
        mimeType: "text/plain",
      }),
    ).resolves.toBe("hello\nworld");
  });

  it("rejects text at byte or character ceilings instead of truncating it", async () => {
    const bytes = encoder.encode("12345");
    await expect(
      extractor.extract({
        ...defaults,
        bytes,
        mimeType: "text/plain",
        maxBytes: 4,
      }),
    ).resolves.toBeNull();
    await expect(
      extractor.extract({
        ...defaults,
        bytes,
        mimeType: "text/plain",
        maxChars: 4,
      }),
    ).resolves.toBeNull();
  });

  it("extracts PDF text within page and character limits", async () => {
    const bytes = onePagePdf("bounded PDF text");
    await expect(
      extractor.extract({ ...defaults, bytes, mimeType: "application/pdf" }),
    ).resolves.toContain("bounded PDF text");
    await expect(
      extractor.extract({
        ...defaults,
        bytes,
        mimeType: "application/pdf",
        maxPages: 0,
      }),
    ).resolves.toBeNull();
    await expect(
      extractor.extract({
        ...defaults,
        bytes,
        mimeType: "application/pdf",
        maxChars: 3,
      }),
    ).resolves.toBeNull();
  }, 20_000);

  it("terminates timed-out and malformed PDF work as unavailable", async () => {
    const bytes = onePagePdf("timeout");
    await expect(
      extractor.extract({
        ...defaults,
        bytes,
        mimeType: "application/pdf",
        timeoutMs: 0,
      }),
    ).resolves.toBeNull();
    await expect(
      extractor.extract({
        ...defaults,
        bytes: encoder.encode("%PDF malformed"),
        mimeType: "application/pdf",
      }),
    ).resolves.toBeNull();
  });

  it("does not extract images or DOCX documents", async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    await expect(
      extractor.extract({ ...defaults, bytes, mimeType: "image/png" }),
    ).resolves.toBeNull();
    await expect(
      extractor.extract({
        ...defaults,
        bytes,
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    ).resolves.toBeNull();
  });
});
