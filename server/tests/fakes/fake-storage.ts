import { Readable } from "node:stream";
import {
  StorageError,
  type StoragePort,
  type StoredObject,
} from "../../src/modules/files/ports/storage.port.js";
/** Provides deterministic private-object behavior without provider credentials. */
export class FakeStorage implements StoragePort {
  readonly objects = new Map<string, { bytes: Uint8Array; mimeType: string }>();
  readonly calls: Array<{
    operation: "upload" | "download" | "remove";
    key: string;
  }> = [];
  failNext: "upload" | "download" | "remove" | undefined;
  delayMs = 0;
  abortNext = false;
  afterRemove: (() => Promise<void>) | undefined;
  /** Stores a new object only when its generated key is absent. */
  async upload(input: {
    key: string;
    data: Uint8Array;
    mimeType: string;
  }): Promise<void> {
    this.calls.push({ operation: "upload", key: input.key });
    await this.wait();
    if (this.failNext === "upload") {
      this.failNext = undefined;
      throw new StorageError("unavailable");
    }
    if (this.abortNext) {
      this.abortNext = false;
      throw new StorageError("unavailable");
    }
    if (this.objects.has(input.key)) throw new StorageError("invalid");
    this.objects.set(input.key, {
      bytes: input.data,
      mimeType: input.mimeType,
    });
  }
  /** Returns an authorized bounded stream or a classified absence. */
  async download(key: string, maxBytes: number): Promise<StoredObject> {
    this.calls.push({ operation: "download", key });
    await this.wait();
    if (this.failNext === "download") {
      this.failNext = undefined;
      throw new StorageError("unavailable");
    }
    const object = this.objects.get(key);
    if (!object) throw new StorageError("not-found");
    if (object.bytes.byteLength > maxBytes) throw new StorageError("invalid");
    return {
      stream: Readable.from([Buffer.from(object.bytes)]),
      size: object.bytes.byteLength,
      mimeType: object.mimeType,
    };
  }
  /** Removes an object idempotently. */
  async remove(key: string): Promise<void> {
    this.calls.push({ operation: "remove", key });
    await this.wait();
    if (this.failNext === "remove") {
      this.failNext = undefined;
      throw new StorageError("unavailable");
    }
    this.objects.delete(key);
    await this.afterRemove?.();
  }
  /** Delays provider responses to exercise cancellation and compensation paths. */
  private async wait(): Promise<void> {
    if (this.delayMs > 0)
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
  }
}
