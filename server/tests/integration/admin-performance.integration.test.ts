import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import { AdminFileRepository } from "../../src/modules/files/repositories/admin-file.repository.js";
import { AuditRepository } from "../../src/modules/audit/audit.repository.js";
import { AdminStatisticsService } from "../../src/modules/statistics/admin-statistics.service.js";
import { UserRepository } from "../../src/modules/users/user.repository.js";
import { describeDatabase, integrationHarness } from "../helpers/integration.js";

describeDatabase("administrator scale queries", () => {
  const { prisma } = integrationHarness();
  it("keeps deterministic pages, statistics, and audit queries bounded at approved scale", async () => {
    const now = new Date("2026-08-23T00:00:00Z");
    const users = Array.from({ length: 1_000 }, (_value, index) => ({ id: randomUUID(), name: `Scale User ${index}`, email: `scale-${index}@example.invalid`, passwordHash: "test", role: index === 0 ? "ADMIN" : "USER", isEmailVerified: true, createdAt: now, updatedAt: now }));
    await prisma.user.createMany({ data: users });
    for (let offset = 0; offset < 10_000; offset += 1_000)
      await prisma.file.createMany({ data: Array.from({ length: 1_000 }, (_value, index) => { const sequence = offset + index; const ownerId = users[sequence % users.length]!.id; const id = randomUUID(); return { id, ownerId, folderId: null, originalName: `scale-${sequence}.txt`, storageKey: `users/${ownerId}/files/${id}`, mimeType: "text/plain", size: 1024n, extractedContent: null, createdAt: new Date(now.getTime() + sequence), updatedAt: now }; }) });
    await prisma.auditLog.createMany({ data: Array.from({ length: 1_000 }, (_value, index) => ({ action: "file.upload", entityType: "FILE", entityId: `scale-file-${index}`, actorId: users[index]!.id, metadata: { outcome: "SUCCESS" }, createdAt: new Date(now.getTime() + index) })) });
    const started = performance.now();
    const userPage = await new UserRepository().adminList(prisma, { sort: "createdAt", direction: "desc", page: 1, pageSize: 20 });
    const filePage = await new AdminFileRepository().list(prisma, { folder: "any", sort: "uploadedAt", direction: "desc", page: 1, pageSize: 20 });
    const statistics = await new AdminStatisticsService(prisma).get(now);
    const auditPage = await new AuditRepository().adminList(prisma, { direction: "desc", page: 1, pageSize: 20 });
    const elapsed = performance.now() - started;
    expect([userPage.rows.length, filePage.rows.length, auditPage.rows.length]).toEqual([20, 20, 20]);
    expect(statistics).toMatchObject({ totalUsers: 1_000, totalFiles: 10_000, storedBytes: "10240000" });
    expect(elapsed).toBeLessThan(2_000);
  }, 30_000);
});
