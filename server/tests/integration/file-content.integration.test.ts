import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  fileManagementHarness,
  primaryUserId,
  secondaryUserId,
} from "../helpers/integration.js";
import { seedFile } from "../fixtures/file-management.js";

describeDatabase("file content authorization and lifecycle", () => {
  const { app, prisma, storage } = fileManagementHarness();
  it("authorizes before storage and never calls the provider for foreign identifiers", async () => {
    const foreign = await seedFile(prisma, {
      ownerId: secondaryUserId,
      storage,
    });
    storage.calls.length = 0;
    await supertest(app)
      .get(`/api/v1/files/${foreign.id}/download`)
      .expect(404);
    expect(storage.calls).toEqual([]);
  });
  it("maps provider operational failure to a safe retryable response", async () => {
    const row = await seedFile(prisma, { ownerId: primaryUserId, storage });
    storage.failNext = "download";
    const response = await supertest(app)
      .get(`/api/v1/files/${row.id}/download`)
      .expect(503);
    expect(response.body.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(JSON.stringify(response.body)).not.toContain(row.storageKey);
  });
  it("lets deletion win while delayed retrieval is in flight", async () => {
    const row = await seedFile(prisma, { ownerId: primaryUserId, storage });
    storage.delayMs = 100;
    const pending = supertest(app).get(`/api/v1/files/${row.id}/download`);
    await new Promise((resolve) => setTimeout(resolve, 20));
    await prisma.file.delete({ where: { id: row.id } });
    const response = await pending;
    storage.delayMs = 0;
    expect(response.status).toBe(404);
  });
  it("bounds retrieval to authoritative metadata size", async () => {
    const row = await seedFile(prisma, { ownerId: primaryUserId, storage });
    storage.objects.set(row.storageKey, {
      bytes: new Uint8Array(Number(row.size) + 1),
      mimeType: row.mimeType,
    });
    await supertest(app).get(`/api/v1/files/${row.id}/download`).expect(503);
  });
});
