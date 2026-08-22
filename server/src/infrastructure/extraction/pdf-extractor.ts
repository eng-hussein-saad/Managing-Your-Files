import { Worker } from "node:worker_threads";
import type {
  ExtractionInput,
  ExtractionPort,
} from "../../modules/files/ports/extraction.port.js";
import { TextExtractor } from "./text-extractor.js";

interface WorkerReply {
  ok: boolean;
  text?: string;
}

/** Extracts text formats while isolating bounded PDF.js work in a terminable worker. */
export class PdfExtractor implements ExtractionPort {
  /** Creates the combined extractor with a replaceable strict-text implementation. */
  constructor(private readonly textExtractor = new TextExtractor()) {}

  /** Dispatches eligible text and PDF inputs while leaving images and documents unavailable. */
  async extract(input: ExtractionInput): Promise<string | null> {
    if (input.bytes.byteLength > input.maxBytes) return null;
    if (input.mimeType === "text/plain")
      return this.textExtractor.extract(input);
    if (input.mimeType !== "application/pdf") return null;
    return this.extractPdf(input);
  }

  /** Runs PDF.js outside the request thread and terminates it on every outcome. */
  private async extractPdf(input: ExtractionInput): Promise<string | null> {
    const sourceWorker = import.meta.url.endsWith(".ts");
    const workerUrl = new URL(
      sourceWorker ? "./pdf.worker.ts" : "./pdf.worker.js",
      import.meta.url,
    );
    const worker = new Worker(workerUrl, { execArgv: [] });
    return new Promise(
      /** Executes the bounded callback owned by this constructed operation. */ (
        resolve,
      ) => {
        let settled = false;
        /** Finishes extraction once and ensures the worker cannot outlive the request budget. */
        const finish = /** Implements the local finish operation. */ (
          value: string | null,
        ) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          void worker.terminate();
          resolve(value);
        };
        const timer = setTimeout(
          /** Ends the bounded operation when its configured timeout elapses. */ () =>
            finish(null),
          input.timeoutMs,
        );
        /** Accepts only a successful bounded worker response. */
        worker.once(
          "message",
          /** Handles the named one-shot or streamed infrastructure event. */ (
            reply: WorkerReply,
          ) => finish(reply.ok ? (reply.text ?? "") : null),
        );
        /** Converts worker startup and parsing failures into unavailable extraction. */
        worker.once(
          "error",
          /** Handles the named one-shot or streamed infrastructure event. */ () =>
            finish(null),
        );
        worker.postMessage({
          bytes: input.bytes,
          maxPages: input.maxPages,
          maxChars: input.maxChars,
        });
      },
    );
  }
}
