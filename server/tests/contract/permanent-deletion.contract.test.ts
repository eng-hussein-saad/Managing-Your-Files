import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  fileManagementHarness,
  primaryUserId,
} from "../helpers/integration.js";
import { seedFile, seedFolder } from "../fixtures/file-management.js";

describeDatabase("permanent deletion contract", () => {
  const { app, prisma, storage } = fileManagementHarness();
  it("returns 204 only after owned file content and metadata are absent", async () => {
    const file = await seedFile(prisma, { ownerId: primaryUserId, storage });
    await supertest(app).delete(`/api/v1/files/${file.id}`).expect(204);
    expect(storage.objects.has(file.storageKey)).toBe(false);
    expect(await prisma.file.findUnique({ where: { id: file.id } })).toBeNull();
  });
  it("uses generic absence for repeated, malformed, and unknown deletes", async () => {
    const file = await seedFile(prisma, { ownerId: primaryUserId, storage });
    await supertest(app).delete(`/api/v1/files/${file.id}`).expect(204);
    for (const id of [
      file.id,
      "not-a-uuid",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    ]) {
      const response = await supertest(app)
        .delete(`/api/v1/files/${id}`)
        .expect(404);
      expect(response.body.error.code).toBe("RESOURCE_NOT_FOUND");
    }
  });
  it("deletes empty folders but safely rejects non-empty folders", async () => {
    const empty = await seedFolder(prisma, {
      ownerId: primaryUserId,
      name: "Empty",
    });
    await supertest(app).delete(`/api/v1/folders/${empty.id}`).expect(204);
    const parent = await seedFolder(prisma, {
      ownerId: primaryUserId,
      name: "Parent",
    });
    await seedFolder(prisma, {
      ownerId: primaryUserId,
      parentId: parent.id,
      name: "Child",
    });
    const response = await supertest(app)
      .delete(`/api/v1/folders/${parent.id}`)
      .expect(409);
    expect(response.body.error.code).toBe("FOLDER_NOT_EMPTY");
  });
});
