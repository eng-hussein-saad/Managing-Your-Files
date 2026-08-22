import type { ExtractionPort } from "../../src/modules/files/ports/extraction.port.js";
/** Provides deterministic extraction results and failures for service tests. */
export class FakeExtractor implements ExtractionPort {
  result: string | null = null;
  failure: Error | undefined;
  delayMs = 0;
  abortNext = false;
  /** Produces a controlled extraction result, failure, delay, or abort. */ async extract(): Promise<
    string | null
  > {
    if (this.delayMs > 0)
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    if (this.abortNext) {
      this.abortNext = false;
      throw new Error("Simulated extraction abort");
    }
    if (this.failure) throw this.failure;
    return this.result;
  }
}
