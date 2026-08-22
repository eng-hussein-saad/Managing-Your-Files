import type { Readable } from "node:stream";

/** Classifies provider failures without forwarding private provider details. */
export class StorageError extends Error {
  /** Creates a stable application-facing storage failure category. */
  constructor(
    public readonly kind: "not-found" | "unavailable" | "invalid",
    message = "Storage operation failed",
  ) {
    super(message);
  }
}
export interface StoredObject {
  stream: Readable;
  size: number;
  mimeType: string;
}
export interface StoragePort {
  upload(input: {
    key: string;
    data: Uint8Array;
    mimeType: string;
  }): Promise<void>;
  download(key: string, maxBytes: number): Promise<StoredObject>;
  remove(key: string): Promise<void>;
}
