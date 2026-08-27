import supertest from "supertest";
import { expect, it } from "vitest";
import { administratorHarness, describeDatabase, primaryUserId } from "../helpers/integration.js";
import { seedFile } from "../fixtures/file-management.js";

describeDatabase("administrator global file management", () => {
  const { app, prisma, storage } = administratorHarness();
  it("combines filters without read audits and permanently deletes with one audit", async () => {
    const file = await seedFile(prisma, { ownerId: primaryUserId, name: "Quarterly Report.pdf", mimeType: "application/pdf", size: 42n, storage });
    const page = await supertest(app).get(`/api/v1/admin/files?search=quarterly&ownerId=${primaryUserId}&type=pdf&minSizeBytes=40&maxSizeBytes=50&pageSize=5`).expect(200);
    expect(page.body.data).toHaveLength(1);
    expect(JSON.stringify(page.body)).not.toContain(file.storageKey);
    expect(await prisma.auditLog.count()).toBe(0);
    await supertest(app).delete(`/api/v1/admin/files/${file.id}`).send({ expectedUpdatedAt: file.updatedAt.toISOString(), confirmationOriginalName: file.originalName }).expect(204);
    expect(storage.objects.has(file.storageKey)).toBe(false);
    expect(await prisma.auditLog.count({ where: { action: "admin.file.permanently_deleted" } })).toBe(1);
  });
  it("returns stale conflicts and retryable storage failure without metadata loss", async () => {
    const file = await seedFile(prisma, { ownerId: primaryUserId, storage });
    await supertest(app).delete(`/api/v1/admin/files/${file.id}`).send({ expectedUpdatedAt: "2026-01-01T00:00:00.000Z", confirmationOriginalName: file.originalName }).expect(409);
    storage.failNext = "remove";
    await supertest(app).delete(`/api/v1/admin/files/${file.id}`).send({ expectedUpdatedAt: file.updatedAt.toISOString(), confirmationOriginalName: file.originalName }).expect(503);
    expect(await prisma.file.findUnique({ where: { id: file.id } })).not.toBeNull();
  });
  it("sorts file names case-insensitively", async () => {
    for (const name of ["Hussein_Saad_CV.docx", "dog.png", "text.txt"])
      await seedFile(prisma, { ownerId: primaryUserId, name });

    const page = await supertest(app)
      .get("/api/v1/admin/files?sort=name&direction=asc&pageSize=5")
      .expect(200);
    const files = page.body.data as Array<{ originalName: string }>;

    expect(files.map((item) => item.originalName)).toEqual([
      "dog.png",
      "Hussein_Saad_CV.docx",
      "text.txt",
    ]);
  });
});
