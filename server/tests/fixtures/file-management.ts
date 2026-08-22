import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import type { FakeStorage } from "../fakes/fake-storage.js";

/** Seeds one canonical owned folder with deterministic optional ancestry. */
export async function seedFolder(
  prisma: PrismaClient,
  input: {
    ownerId: string;
    parentId?: string | null;
    name?: string;
    id?: string;
    createdAt?: Date;
  },
) {
  const now = input.createdAt ?? new Date("2026-08-20T00:00:00Z");
  return prisma.folder.create({
    data: {
      id: input.id ?? randomUUID(),
      ownerId: input.ownerId,
      parentId: input.parentId ?? null,
      name: input.name ?? "Folder",
      createdAt: now,
      updatedAt: now,
    },
  });
}
/** Seeds one canonical file and optional matching fake private object. */
export async function seedFile(
  prisma: PrismaClient,
  input: {
    ownerId: string;
    folderId?: string | null;
    name?: string;
    id?: string;
    mimeType?: string;
    size?: bigint;
    extractedContent?: string | null;
    createdAt?: Date;
    storage?: FakeStorage;
  },
) {
  const id = input.id ?? randomUUID();
  const bytes = new TextEncoder().encode(
    input.extractedContent ?? "seed content",
  );
  const storageKey = `users/${input.ownerId}/files/${id}`;
  const createdAt = input.createdAt ?? new Date("2026-08-20T00:00:00Z");
  const mimeType = input.mimeType ?? "text/plain";
  const size = input.size ?? BigInt(bytes.byteLength);
  const row = await prisma.file.create({
    data: {
      id,
      ownerId: input.ownerId,
      folderId: input.folderId ?? null,
      originalName: input.name ?? "seed.txt",
      storageKey,
      mimeType,
      size,
      extractedContent:
        input.extractedContent === undefined
          ? "seed content"
          : input.extractedContent,
      createdAt,
      updatedAt: createdAt,
    },
  });
  if (input.storage)
    input.storage.objects.set(storageKey, {
      bytes:
        size === BigInt(bytes.byteLength)
          ? bytes
          : new Uint8Array(Number(size)),
      mimeType,
    });
  return row;
}
