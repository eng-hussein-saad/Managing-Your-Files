import supertest from "supertest";
import { expect, it } from "vitest";
import { administratorHarness, describeDatabase, primaryUserId } from "../helpers/integration.js";
import { seedFile, seedFolder } from "../fixtures/file-management.js";

describeDatabase("administrator permanent user deletion", () => {
  const { app, prisma, storage } = administratorHarness();
  it("removes objects and dependent rows, nulls the actor, and audits once", async () => {
    const folder = await seedFolder(prisma, { ownerId: primaryUserId });
    const file = await seedFile(prisma, { ownerId: primaryUserId, folderId: folder.id, storage });
    await prisma.refreshToken.create({ data: { userId: primaryUserId, tokenHash: "session", expiresAt: new Date("2026-09-01T00:00:00Z"), createdAt: new Date() } });
    await prisma.auditLog.create({ data: { actorId: primaryUserId, action: "file.upload", entityType: "FILE", entityId: file.id, metadata: { outcome: "SUCCESS" }, createdAt: new Date() } });
    const target = await prisma.user.findUniqueOrThrow({ where: { id: primaryUserId } });
    await supertest(app).delete(`/api/v1/admin/users/${primaryUserId}`).send({ expectedUpdatedAt: target.updatedAt.toISOString(), confirmationEmail: target.email }).expect(204);
    expect(storage.objects.has(file.storageKey)).toBe(false);
    expect(await prisma.user.findUnique({ where: { id: primaryUserId } })).toBeNull();
    expect(await prisma.file.count({ where: { ownerId: primaryUserId } })).toBe(0);
    const formerActor = await prisma.auditLog.findFirst({ where: { action: "file.upload" } });
    expect(formerActor?.actorId).toBeNull();
    expect(formerActor?.metadata).toMatchObject({ actorState: "DELETED" });
    expect(await prisma.auditLog.count({ where: { action: "admin.user.permanently_deleted" } })).toBe(1);
  });
  it("retains database state on storage failure and completes on retry", async () => {
    await seedFile(prisma, { ownerId: primaryUserId, storage });
    const target = await prisma.user.findUniqueOrThrow({ where: { id: primaryUserId } });
    const command = { expectedUpdatedAt: target.updatedAt.toISOString(), confirmationEmail: target.email };
    storage.failNext = "remove";
    await supertest(app).delete(`/api/v1/admin/users/${primaryUserId}`).send(command).expect(503);
    expect(await prisma.user.findUnique({ where: { id: primaryUserId } })).not.toBeNull();
    await supertest(app).delete(`/api/v1/admin/users/${primaryUserId}`).send(command).expect(204);
    expect(await prisma.user.findUnique({ where: { id: primaryUserId } })).toBeNull();
  });
});
