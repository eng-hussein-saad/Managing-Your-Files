import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  fileManagementHarness,
  primaryUserId,
} from "../helpers/integration.js";
import { seedFile } from "../fixtures/file-management.js";

describeDatabase("folder hierarchy persistence", () => {
  const { app, prisma } = fileManagementHarness();
  it("supports levels one through ten and rejects level eleven", async () => {
    let parentId: string | null = null;
    for (let depth = 1; depth <= 10; depth += 1) {
      const response = await supertest(app)
        .post("/api/v1/folders")
        .send({ name: `Level ${depth}`, parentId })
        .expect(201);
      expect(response.body.data.depth).toBe(depth);
      parentId = response.body.data.id as string;
    }
    const rejected = await supertest(app)
      .post("/api/v1/folders")
      .send({ name: "Level 11", parentId })
      .expect(422);
    expect(rejected.body.error.code).toBe("FOLDER_DEPTH_EXCEEDED");
    expect(
      await prisma.folder.count({ where: { ownerId: primaryUserId } }),
    ).toBe(10);
    const detail = await supertest(app)
      .get(`/api/v1/folders/${parentId}`)
      .expect(200);
    expect(detail.body.data.breadcrumbs).toHaveLength(10);
  });
  it("renames without moving descendants and moves files between folder and root", async () => {
    const parent = await supertest(app)
      .post("/api/v1/folders")
      .send({ name: "Parent", parentId: null })
      .expect(201);
    const child = await supertest(app)
      .post("/api/v1/folders")
      .send({ name: "Child", parentId: parent.body.data.id })
      .expect(201);
    await supertest(app)
      .patch(`/api/v1/folders/${parent.body.data.id}`)
      .send({ name: "Renamed" })
      .expect(200);
    expect(
      (
        await prisma.folder.findUnique({
          where: { id: child.body.data.id as string },
        })
      )?.parentId,
    ).toBe(parent.body.data.id);
    const file = await seedFile(prisma, { ownerId: primaryUserId });
    await supertest(app)
      .patch(`/api/v1/files/${file.id}`)
      .send({ folderId: child.body.data.id })
      .expect(200);
    await supertest(app)
      .patch(`/api/v1/files/${file.id}`)
      .send({ folderId: null })
      .expect(200);
    expect(
      (await prisma.file.findUnique({ where: { id: file.id } }))?.folderId,
    ).toBeNull();
  });
});
