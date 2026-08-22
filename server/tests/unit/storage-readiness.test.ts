import { describe, expect, it, vi } from "vitest";
import type { SupabaseStorage } from "../../src/infrastructure/storage/supabase-storage.js";
import { assertStorageReady } from "../../src/infrastructure/storage/storage-readiness.js";
import { StorageError } from "../../src/modules/files/ports/storage.port.js";

/** Creates a structural readiness boundary for deterministic startup checks. */
const storageWith = (result: "private" | "public" | "missing") =>
  ({
    assertPrivateBucket: vi.fn(async () => {
      if (result !== "private") throw new StorageError("unavailable");
    }),
  }) as unknown as SupabaseStorage;

describe("storage startup readiness", () => {
  it("accepts a present private bucket", async () => {
    await expect(
      assertStorageReady(storageWith("private")),
    ).resolves.toBeUndefined();
  });

  it.each(["public", "missing"] as const)(
    "rejects a %s bucket with one safe category",
    async (result) => {
      await expect(
        assertStorageReady(storageWith(result)),
      ).rejects.toMatchObject({ kind: "unavailable" });
    },
  );
});
