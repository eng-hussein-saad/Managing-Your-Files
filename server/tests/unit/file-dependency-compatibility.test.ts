import { describe, expect, it } from "vitest";

describe("file-processing dependency compatibility", () => {
  it("loads the ESM libraries required by the file-management boundary", async () => {
    const [fileType, supabase, yauzl, pdfjs] = await Promise.all([
      import("file-type"),
      import("@supabase/supabase-js"),
      import("yauzl"),
      import("pdfjs-dist/legacy/build/pdf.mjs"),
    ]);
    expect(fileType.fileTypeFromBuffer).toBeTypeOf("function");
    expect(supabase.createClient).toBeTypeOf("function");
    expect(yauzl.fromBuffer).toBeTypeOf("function");
    expect(pdfjs.getDocument).toBeTypeOf("function");
  }, 20_000);
});
