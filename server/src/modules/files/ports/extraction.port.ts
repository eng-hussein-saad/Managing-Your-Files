export interface ExtractionInput {
  bytes: Uint8Array;
  mimeType: string;
  timeoutMs: number;
  maxBytes: number;
  maxPages: number;
  maxChars: number;
}

export interface ExtractionPort {
  extract(input: ExtractionInput): Promise<string | null>;
}
