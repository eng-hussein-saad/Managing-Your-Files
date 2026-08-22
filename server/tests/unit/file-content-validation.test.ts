import { describe, expect, it } from "vitest";
import { detectAllowedMime } from "../../src/infrastructure/file-content/content-detector.js";
import { normalizeDisplayName } from "../../src/infrastructure/file-content/filename.js";
import {
  docxFile,
  jpegFile,
  malformedFile,
  pdfFile,
  pngFile,
  textFile,
  webpFile,
  zipFile,
} from "../fixtures/files.js";

describe("authoritative file content validation", () => {
  it.each([
    ["PDF", pdfFile(), "application/pdf"],
    ["JPEG", jpegFile(), "image/jpeg"],
    ["PNG", pngFile(), "image/png"],
    ["WebP", webpFile(), "image/webp"],
    [
      "DOCX",
      docxFile(),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  ])(
    "classifies %s from bytes without submitted metadata",
    async (_label, bytes, expected) => {
      await expect(detectAllowedMime(bytes)).resolves.toBe(expected);
    },
  );

  it("accepts strict UTF-8 text including permitted whitespace", async () => {
    await expect(
      detectAllowedMime(textFile("valid\ttext\r\nnext")),
    ).resolves.toBe("text/plain");
    await expect(detectAllowedMime(textFile("مرحبا بالعالم"))).resolves.toBe(
      "text/plain",
    );
  });

  it("rejects fatal UTF-8, prohibited controls, generic ZIPs, and malformed content", async () => {
    await expect(
      detectAllowedMime(new Uint8Array([0xc3, 0x28])),
    ).resolves.toBeNull();
    await expect(
      detectAllowedMime(textFile("unsafe\u0000text")),
    ).resolves.toBeNull();
    await expect(detectAllowedMime(zipFile())).resolves.toBeNull();
    await expect(detectAllowedMime(malformedFile())).resolves.toBeNull();
  });

  it("normalizes display-only names without creating a trusted path", () => {
    expect(normalizeDisplayName(" ../unsafe\u0000name.txt ")).toBe(
      ".. unsafe name.txt",
    );
    expect(normalizeDisplayName("folder\\nested/file.txt")).toBe(
      "folder nested file.txt",
    );
    expect(normalizeDisplayName("\u0000/\\")).toBe("unnamed-file");
    expect(normalizeDisplayName("e\u0301.txt")).toBe("é.txt");
    expect(normalizeDisplayName("x".repeat(300))).toHaveLength(255);
  });
});
