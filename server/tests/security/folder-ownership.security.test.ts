import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  fileManagementHarness,
  primaryUserId,
  secondaryUserId,
} from "../helpers/integration.js";
import { seedFile, seedFolder } from "../fixtures/file-management.js";

describeDatabase("folder ownership security", () => {
  const { app, prisma } = fileManagementHarness();
  it("converges every foreign hierarchy read and mutation to generic absence", async () => {
    const foreign = await seedFolder(prisma, { ownerId: secondaryUserId });
    for (const request of [
      supertest(app).get(`/api/v1/folders/${foreign.id}`),
      supertest(app).get(`/api/v1/folders?parentId=${foreign.id}`),
      supertest(app)
        .patch(`/api/v1/folders/${foreign.id}`)
        .send({ name: "Nope" }),
      supertest(app).delete(`/api/v1/folders/${foreign.id}`),
      supertest(app)
        .post("/api/v1/folders")
        .send({ name: "Child", parentId: foreign.id }),
    ]) {
      const response = await request;
      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe(
        "The requested resource was not found.",
      );
    }
  });
  it("rejects foreign move destinations without changing the file", async () => {
    const foreign = await seedFolder(prisma, { ownerId: secondaryUserId });
    const file = await seedFile(prisma, { ownerId: primaryUserId });
    await supertest(app)
      .patch(`/api/v1/files/${file.id}`)
      .send({ folderId: foreign.id })
      .expect(404);
    expect(
      (await prisma.file.findUnique({ where: { id: file.id } }))?.folderId,
    ).toBeNull();
  });
});
