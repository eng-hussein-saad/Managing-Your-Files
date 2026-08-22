import { Readable } from "node:stream";
import { createClient } from "@supabase/supabase-js";
import {
  StorageError,
  type StoragePort,
  type StoredObject,
} from "../../modules/files/ports/storage.port.js";

/** Adapts the server-only Supabase client to the replaceable private storage port. */
export class SupabaseStorage implements StoragePort {
  private readonly client: ReturnType<typeof createClient>;
  /** Creates a service-role client that is never exposed to browser code. */
  constructor(
    private readonly url: string,
    private readonly serviceRoleKey: string,
    private readonly bucket: string,
  ) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  /** Uploads a generated key with overwrite disabled. */
  async upload(input: {
    key: string;
    data: Uint8Array;
    mimeType: string;
  }): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(input.key, input.data, {
        contentType: input.mimeType,
        upsert: false,
      });
    if (error) throw new StorageError("unavailable");
  }
  /** Downloads one private object and rejects an unexpected size. */
  async download(key: string, maxBytes: number): Promise<StoredObject> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(key);
    if (error || !data)
      throw new StorageError(
        error && /not[ -]?found|does not exist|404/i.test(error.message)
          ? "not-found"
          : "unavailable",
      );
    const bytes = new Uint8Array(await data.arrayBuffer());
    if (bytes.byteLength > maxBytes) throw new StorageError("invalid");
    return {
      stream: Readable.from([Buffer.from(bytes)]),
      size: bytes.byteLength,
      mimeType: data.type || "application/octet-stream",
    };
  }
  /** Removes an object while treating provider absence as successful idempotence. */
  async remove(key: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([key]);
    if (error) throw new StorageError("unavailable");
  }
  /** Reads bucket metadata for readiness without logging provider details. */
  async assertPrivateBucket(): Promise<void> {
    const { data, error } = await this.client.storage.getBucket(this.bucket);
    if (error || !data || data.public) throw new StorageError("unavailable");
  }
}
