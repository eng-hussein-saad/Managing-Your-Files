import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  fileManagementHarness,
  primaryUserId,
} from "../helpers/integration.js";
import { seedFile } from "../fixtures/file-management.js";

describeDatabase("file content contract", () => {
  const { app, prisma, storage } = fileManagementHarness();
  it("returns verified private inline preview headers for supported content", async () => {
    const row = await seedFile(prisma, {
      ownerId: primaryUserId,
      name: "image.png",
      mimeType: "image/png",
      extractedContent: null,
      storage,
    });
    const response = await supertest(app)
      .get(`/api/v1/files/${row.id}/preview`)
      .expect(200);
    expect(response.headers["content-type"]).toContain("image/png");
    expect(response.headers["content-length"]).toBe(row.size.toString());
    expect(response.headers["content-disposition"]).toContain("inline");
    expect(response.headers["cache-control"]).toBe("private, no-store");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });
  it("returns attachment headers for every accepted format and audits download", async () => {
    const row = await seedFile(prisma, {
      ownerId: primaryUserId,
      name: "résumé.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extractedContent: null,
      storage,
    });
    const response = await supertest(app)
      .get(`/api/v1/files/${row.id}/download`)
      .expect(200);
    expect(response.headers["content-disposition"]).toContain("attachment");
    expect(response.headers["content-disposition"]).toContain(
      "filename*=UTF-8''",
    );
    expect(
      await prisma.auditLog.count({
        where: { action: "file.download", entityId: row.id },
      }),
    ).toBe(1);
  });
  it("rejects unsupported preview and missing content with safe errors", async () => {
    const docx = await seedFile(prisma, {
      ownerId: primaryUserId,
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extractedContent: null,
      storage,
    });
    await supertest(app).get(`/api/v1/files/${docx.id}/preview`).expect(415);
    const missing = await seedFile(prisma, { ownerId: primaryUserId });
    const response = await supertest(app)
      .get(`/api/v1/files/${missing.id}/download`)
      .expect(404);
    expect(JSON.stringify(response.body)).not.toContain(missing.storageKey);
  });
});
