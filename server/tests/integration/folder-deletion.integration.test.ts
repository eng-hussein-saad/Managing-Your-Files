import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  fileManagementHarness,
  primaryUserId,
  secondaryUserId,
} from "../helpers/integration.js";
import { seedFile, seedFolder } from "../fixtures/file-management.js";

describeDatabase("locked empty-folder deletion", () => {
  const { app, prisma } = fileManagementHarness();
  it("never cascades files or child folders", async () => {
    const withFile = await seedFolder(prisma, { ownerId: primaryUserId });
    await seedFile(prisma, { ownerId: primaryUserId, folderId: withFile.id });
    await supertest(app).delete(`/api/v1/folders/${withFile.id}`).expect(409);
    const withChild = await seedFolder(prisma, {
      ownerId: primaryUserId,
      name: "Parent",
    });
    const child = await seedFolder(prisma, {
      ownerId: primaryUserId,
      parentId: withChild.id,
      name: "Child",
    });
    await supertest(app).delete(`/api/v1/folders/${withChild.id}`).expect(409);
    expect(
      await prisma.folder.findUnique({ where: { id: child.id } }),
    ).not.toBeNull();
  });
  it("serializes deletion against concurrent child creation without stranding children", async () => {
    const parent = await seedFolder(prisma, { ownerId: primaryUserId });
    const [deletion, creation] = await Promise.all([
      supertest(app).delete(`/api/v1/folders/${parent.id}`),
      supertest(app)
        .post("/api/v1/folders")
        .send({ name: "Concurrent", parentId: parent.id }),
    ]);
    expect([
      [204, 404],
      [409, 201],
    ]).toContainEqual([deletion.status, creation.status]);
    const child = await prisma.folder.findFirst({
      where: { parentId: parent.id },
    });
    if (child)
      expect(
        await prisma.folder.findUnique({ where: { id: parent.id } }),
      ).not.toBeNull();
  });
  it("preserves parent reachability and hides foreign folder identifiers", async () => {
    const parent = await seedFolder(prisma, { ownerId: primaryUserId });
    const child = await seedFolder(prisma, {
      ownerId: primaryUserId,
      parentId: parent.id,
    });
    await supertest(app).delete(`/api/v1/folders/${child.id}`).expect(204);
    expect(
      await prisma.folder.findUnique({ where: { id: parent.id } }),
    ).not.toBeNull();
    const foreign = await seedFolder(prisma, { ownerId: secondaryUserId });
    await supertest(app).delete(`/api/v1/folders/${foreign.id}`).expect(404);
  });
});
