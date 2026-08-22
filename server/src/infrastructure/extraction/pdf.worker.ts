import { parentPort } from "node:worker_threads";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

interface ExtractionRequest {
  bytes: Uint8Array;
  maxPages: number;
  maxChars: number;
}

/** Extracts bounded page text and reports only a safe success or failure result. */
async function extractPdf(input: ExtractionRequest): Promise<string> {
  const document = await getDocument({
    data: input.bytes,
    useWorkerFetch: false,
    isEvalSupported: false,
  }).promise;
  try {
    if (document.numPages > input.maxPages)
      throw new Error("PDF page limit exceeded");
    const pages: string[] = [];
    let length = 0;
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map(
          /** Maps one source item into its derived public representation. */ (
            item,
          ) => ("str" in item ? item.str : ""),
        )
        .filter(Boolean)
        .join(" ");
      length += text.length + (pages.length > 0 ? 1 : 0);
      if (length > input.maxChars)
        throw new Error("PDF character limit exceeded");
      pages.push(text);
      page.cleanup();
    }
    return pages.join("\n");
  } finally {
    await document.destroy();
  }
}

if (!parentPort)
  throw new Error("PDF extraction worker requires a parent port");

/** Handles one extraction request and avoids leaking parser details across the worker boundary. */
parentPort.once(
  "message",
  /** Handles the named one-shot or streamed infrastructure event. */ (
    input: ExtractionRequest,
  ) => {
    /** Completes asynchronous parsing without returning a promise to the event callback. */
    const processRequest =
      /** Implements the local processRequest operation. */ async () => {
        try {
          parentPort?.postMessage({ ok: true, text: await extractPdf(input) });
        } catch {
          parentPort?.postMessage({ ok: false });
        }
      };
    void processRequest();
  },
);
