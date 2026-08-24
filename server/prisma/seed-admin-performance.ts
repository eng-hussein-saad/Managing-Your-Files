import "dotenv/config";
import { createPrismaClient, disconnectPrisma } from "../src/infrastructure/persistence/prisma.js";
import { parseServerEnv } from "../src/config/env.js";

const userCount = 1_000;
const fileCount = 10_000;

/** Produces a stable UUID from a namespace nibble and integer sequence. */
function fixtureUuid(namespace: string, value: number): string {
  return `${namespace}0000000-0000-4000-8000-${value.toString(16).padStart(12, "0")}`;
}

/** Seeds deterministic administrator-scale rows without altering the approved schema. */
async function seedPerformanceData(): Promise<void> {
  const env = parseServerEnv(process.env);
  const prisma = createPrismaClient(env.DATABASE_URL);
  const now = new Date("2026-08-23T00:00:00.000Z");
  try {
    const users = Array.from({ length: userCount }, (_, index) => ({
      id: fixtureUuid("7", index + 1),
      name: `Performance User ${String(index + 1).padStart(4, "0")}`,
      email: `performance-${index + 1}@example.invalid`,
      passwordHash: "performance-fixture-not-for-login",
      role: index === 0 ? "ADMIN" : "USER",
      isEmailVerified: true,
      createdAt: new Date(now.getTime() + index * 1_000),
      updatedAt: new Date(now.getTime() + index * 1_000),
    }));
    await prisma.user.createMany({ data: users, skipDuplicates: true });
    for (let offset = 0; offset < fileCount; offset += 1_000) {
      const files = Array.from({ length: Math.min(1_000, fileCount - offset) }, (_, local) => {
        const index = offset + local;
        const id = fixtureUuid("8", index + 1);
        const ownerId = users[index % users.length]?.id ?? users[0]!.id;
        return {
          id,
          ownerId,
          folderId: null,
          originalName: `performance-${String(index + 1).padStart(5, "0")}.txt`,
          storageKey: `users/${ownerId}/files/${id}`,
          mimeType: "text/plain",
          size: BigInt(1_024 + index),
          extractedContent: null,
          createdAt: new Date(now.getTime() + index * 1_000),
          updatedAt: new Date(now.getTime() + index * 1_000),
        };
      });
      await prisma.file.createMany({ data: files, skipDuplicates: true });
    }
    console.info(`Seeded ${userCount} users and ${fileCount} files.`);
  } finally {
    await disconnectPrisma(prisma);
  }
}

await seedPerformanceData();
