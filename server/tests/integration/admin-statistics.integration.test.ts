import supertest from "supertest";
import { expect, it } from "vitest";
import { administratorHarness, describeDatabase, primaryUserId } from "../helpers/integration.js";
import { seedFile } from "../fixtures/file-management.js";

describeDatabase("administrator exact statistics", () => {
  const { app, prisma } = administratorHarness();
  it("returns current users, bigint bytes, type distribution, and recent ordering without audits", async () => {
    await seedFile(prisma, { ownerId: primaryUserId, name: "older.txt", size: 10n, createdAt: new Date("2026-08-01T00:00:00Z") });
    await seedFile(prisma, { ownerId: primaryUserId, name: "newer.pdf", mimeType: "application/pdf", size: 20n, createdAt: new Date("2026-08-02T00:00:00Z") });
    const response = await supertest(app).get("/api/v1/admin/statistics").expect(200);
    expect(response.body.data).toMatchObject({ totalUsers: 2, totalFiles: 2, storedBytes: "30" });
    expect(response.body.data.recentUploads[0].originalName).toBe("newer.pdf");
    expect(await prisma.auditLog.count()).toBe(0);
  });
  it("returns exact zero-safe values for an empty file dataset", async () => {
    const response = await supertest(app).get("/api/v1/admin/statistics").expect(200);
    expect(response.body.data).toMatchObject({ totalFiles: 0, storedBytes: "0", recentUploads: [] });
  });
});
