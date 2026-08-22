import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  fileManagementHarness,
  primaryUserId,
  secondaryUserId,
} from "../helpers/integration.js";
import { seedFile, seedFolder } from "../fixtures/file-management.js";

describeDatabase("file discovery ownership security", () => {
  const { app, prisma } = fileManagementHarness();
  it("never reveals foreign files through list, detail, or folder filters", async () => {
    const foreignFolder = await seedFolder(prisma, {
      ownerId: secondaryUserId,
    });
    const foreign = await seedFile(prisma, {
      ownerId: secondaryUserId,
      folderId: foreignFolder.id,
    });
    await seedFile(prisma, { ownerId: primaryUserId });
    const list = await supertest(app).get("/api/v1/files").expect(200);
    expect(list.body.data).toHaveLength(1);
    await supertest(app).get(`/api/v1/files/${foreign.id}`).expect(404);
    await supertest(app)
      .get(`/api/v1/files?folderId=${foreignFolder.id}`)
      .expect(404);
  });
  it("allowlists public fields for list and detail responses", async () => {
    const row = await seedFile(prisma, { ownerId: primaryUserId });
    for (const path of ["/api/v1/files", `/api/v1/files/${row.id}`]) {
      const body = (await supertest(app).get(path).expect(200)).body;
      const serialized = JSON.stringify(body);
      expect(serialized).not.toContain("storageKey");
      expect(serialized).not.toContain(row.storageKey);
      expect(serialized).not.toContain(primaryUserId);
    }
  });
});
