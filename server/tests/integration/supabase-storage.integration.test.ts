import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { SupabaseStorage } from "../../src/infrastructure/storage/supabase-storage.js";
import { StorageError } from "../../src/modules/files/ports/storage.port.js";

const url = process.env.SUPABASE_ADAPTER_TEST_URL;
const secret = process.env.SUPABASE_ADAPTER_TEST_SECRET_KEY;
const bucket = process.env.SUPABASE_ADAPTER_TEST_BUCKET;
const describeProvider = url && secret && bucket ? describe : describe.skip;

describeProvider("Supabase private storage adapter", () => {
  const storage = new SupabaseStorage(
    url ?? "https://adapter-test.invalid",
    secret ?? "sb_secret_adapter-test-placeholder",
    bucket ?? "private-adapter-test",
  );
  const keys = new Set<string>();

  afterEach(async () => {
    await Promise.all(
      [...keys].map(async (key) => storage.remove(key).catch(() => undefined)),
    );
    keys.clear();
  });

  it("verifies that the dedicated test bucket exists and is private", async () => {
    await expect(storage.assertPrivateBucket()).resolves.toBeUndefined();
  });

  it("uploads without overwrite, downloads bounded bytes, and removes idempotently", async () => {
    const key = `adapter-tests/${randomUUID()}`;
    const bytes = new TextEncoder().encode("private adapter payload");
    keys.add(key);
    await expect(
      storage.upload({ key, data: bytes, mimeType: "text/plain" }),
    ).resolves.toBeUndefined();
    await expect(
      storage.upload({ key, data: bytes, mimeType: "text/plain" }),
    ).rejects.toMatchObject({ kind: "unavailable" });
    const stored = await storage.download(key, bytes.byteLength);
    const chunks: Buffer[] = [];
    for await (const chunk of stored.stream) chunks.push(Buffer.from(chunk));
    expect(Buffer.concat(chunks)).toEqual(Buffer.from(bytes));
    expect(stored.size).toBe(bytes.byteLength);
    await expect(
      storage.download(key, bytes.byteLength - 1),
    ).rejects.toMatchObject({ kind: "invalid" });
    await storage.remove(key);
    keys.delete(key);
    await expect(storage.remove(key)).resolves.toBeUndefined();
    await expect(storage.download(key, bytes.byteLength)).rejects.toMatchObject(
      { kind: "not-found" },
    );
  });
});

describe("Supabase storage failure safety", () => {
  it("classifies provider failures without placing credentials in the public error", async () => {
    const secretValue = "sb_secret_adapter-test-do-not-expose";
    const storage = new SupabaseStorage(
      "https://invalid.example.invalid",
      secretValue,
      "private-test-bucket",
    );
    const error = await storage
      .download("missing", 10)
      .catch((failure: unknown) => failure);
    expect(error).toBeInstanceOf(StorageError);
    expect(String(error)).not.toContain(secretValue);
    expect(String(error)).not.toContain("invalid.example.invalid");
  });
});
