import type {
  ExtractionInput,
  ExtractionPort,
} from "../../modules/files/ports/extraction.port.js";
/** Extracts strict UTF-8 text with a configured public-content ceiling. */
export class TextExtractor implements ExtractionPort {
  /** Returns complete eligible text while rejecting inputs that exceed extraction limits. */
  extract(input: ExtractionInput): Promise<string | null> {
    if (
      input.mimeType !== "text/plain" ||
      input.bytes.byteLength > input.maxBytes
    )
      return Promise.resolve(null);
    const text = new TextDecoder("utf-8", { fatal: true }).decode(input.bytes);
    return Promise.resolve(text.length <= input.maxChars ? text : null);
  }
}
