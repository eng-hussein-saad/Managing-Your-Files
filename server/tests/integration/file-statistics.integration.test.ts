import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  fileManagementHarness,
  primaryUserId,
  secondaryUserId,
} from "../helpers/integration.js";
import { seedFile } from "../fixtures/file-management.js";

describeDatabase("file statistics aggregates", () => {
  const { app, prisma } = fileManagementHarness();
  it("counts only current owned rows and normalizes every type exactly once", async () => {
    await seedFile(prisma, {
      ownerId: primaryUserId,
      mimeType: "application/pdf",
      size: 10n,
    });
    await seedFile(prisma, {
      ownerId: primaryUserId,
      mimeType: "image/png",
      size: 20n,
    });
    await seedFile(prisma, {
      ownerId: primaryUserId,
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 30n,
    });
    await seedFile(prisma, { ownerId: secondaryUserId, size: 999n });
    const response = await supertest(app)
      .get("/api/v1/file-statistics?timeZone=Africa%2FCairo")
      .expect(200);
    expect(response.body.data).toMatchObject({
      fileCount: 3,
      storedBytes: "60",
      quota: { usedBytes: "60", remainingBytes: "104857540" },
    });
    expect(response.body.data.typeDistribution).toEqual([
      { type: "pdf", count: 1 },
      { type: "text", count: 0 },
      { type: "image", count: 1 },
      { type: "document", count: 1 },
    ]);
  });
  it("groups immutable createdAt around local midnight and zero-fills exactly 30 dates", async () => {
    const now = new Date();
    const todayUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    await seedFile(prisma, {
      ownerId: primaryUserId,
      createdAt: new Date(todayUtc.getTime() - 60 * 60 * 1000),
    });
    await seedFile(prisma, {
      ownerId: primaryUserId,
      createdAt: new Date(todayUtc.getTime() + 60 * 60 * 1000),
    });
    const cairo = await supertest(app)
      .get("/api/v1/file-statistics?timeZone=Africa%2FCairo")
      .expect(200);
    const newYork = await supertest(app)
      .get("/api/v1/file-statistics?timeZone=America%2FNew_York")
      .expect(200);
    const cairoHistory = cairo.body.data.uploadHistory as Array<{
      count: number;
    }>;
    const newYorkHistory = newYork.body.data.uploadHistory as Array<{
      count: number;
    }>;
    expect(cairoHistory).toHaveLength(30);
    expect(newYorkHistory).toHaveLength(30);
    expect(cairoHistory.reduce((sum, item) => sum + item.count, 0)).toBe(2);
    expect(newYorkHistory.reduce((sum, item) => sum + item.count, 0)).toBe(2);
    expect(cairo.body.data.timeZone).toBe("Africa/Cairo");
    expect(newYork.body.data.timeZone).toBe("America/New_York");
  });
  it("updates every current aggregate immediately after permanent deletion", async () => {
    const file = await seedFile(prisma, { ownerId: primaryUserId, size: 25n });
    const before = await supertest(app)
      .get("/api/v1/file-statistics?timeZone=UTC")
      .expect(200);
    await prisma.file.delete({ where: { id: file.id } });
    const after = await supertest(app)
      .get("/api/v1/file-statistics?timeZone=UTC")
      .expect(200);
    expect(before.body.data.fileCount).toBe(1);
    expect(after.body.data).toMatchObject({ fileCount: 0, storedBytes: "0" });
  });
});
