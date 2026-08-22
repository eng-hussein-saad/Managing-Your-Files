import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  fileManagementHarness,
  primaryUserId,
} from "../helpers/integration.js";
import { seedFile } from "../fixtures/file-management.js";

describeDatabase("provider-first file deletion", () => {
  const { app, prisma, storage } = fileManagementHarness();
  it("reclaims quota exactly once and records a sanitized audit", async () => {
    const file = await seedFile(prisma, {
      ownerId: primaryUserId,
      size: 12n,
      storage,
    });
    await supertest(app).delete(`/api/v1/files/${file.id}`).expect(204);
    await supertest(app).delete(`/api/v1/files/${file.id}`).expect(404);
    const policy = await supertest(app).get("/api/v1/files/policy").expect(200);
    expect(policy.body.data.quota.usedBytes).toBe("0");
    const audit = await prisma.auditLog.findFirst({
      where: { action: "file.delete", entityId: file.id },
    });
    expect(audit).not.toBeNull();
    expect(JSON.stringify(audit?.metadata)).not.toContain(file.storageKey);
  });
  it("leaves metadata and quota unchanged when provider removal fails", async () => {
    const file = await seedFile(prisma, { ownerId: primaryUserId, storage });
    storage.failNext = "remove";
    await supertest(app).delete(`/api/v1/files/${file.id}`).expect(503);
    expect(
      await prisma.file.findUnique({ where: { id: file.id } }),
    ).not.toBeNull();
    expect(storage.objects.has(file.storageKey)).toBe(true);
  });
  it("reports a retryable partial outcome when metadata removal fails after provider removal", async () => {
    const file = await seedFile(prisma, { ownerId: primaryUserId, storage });
    storage.afterRemove = async () => {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "FILE" RENAME TO "FILE_UNAVAILABLE"',
      );
    };
    try {
      await supertest(app).delete(`/api/v1/files/${file.id}`).expect(503);
      expect(storage.objects.has(file.storageKey)).toBe(false);
    } finally {
      storage.afterRemove = undefined;
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "FILE_UNAVAILABLE" RENAME TO "FILE"',
      );
    }
    expect(
      await prisma.file.findUnique({ where: { id: file.id } }),
    ).not.toBeNull();
  });
  it("does not reverse successful deletion when audit persistence fails", async () => {
    const file = await seedFile(prisma, { ownerId: primaryUserId, storage });
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "AUDIT_LOG" RENAME TO "AUDIT_LOG_UNAVAILABLE"',
    );
    try {
      await supertest(app).delete(`/api/v1/files/${file.id}`).expect(204);
    } finally {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "AUDIT_LOG_UNAVAILABLE" RENAME TO "AUDIT_LOG"',
      );
    }
    expect(await prisma.file.findUnique({ where: { id: file.id } })).toBeNull();
  });
});
