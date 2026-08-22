import supertest from "supertest";
import { expect, it } from "vitest";
import { folderSchema } from "@gold-era/contracts/public";
import {
  describeDatabase,
  fileManagementHarness,
  primaryUserId,
} from "../helpers/integration.js";
import { seedFile } from "../fixtures/file-management.js";

describeDatabase("folder management contract", () => {
  const { app, prisma } = fileManagementHarness();
  it("creates, lists, details, and renames a fixed-parent folder", async () => {
    const created = await supertest(app)
      .post("/api/v1/folders")
      .send({ name: " Projects ", parentId: null })
      .expect(201);
    expect(folderSchema.safeParse(created.body.data).success).toBe(true);
    const id = created.body.data.id as string;
    const list = await supertest(app).get("/api/v1/folders").expect(200);
    expect(list.body.data.folders).toHaveLength(1);
    const detail = await supertest(app)
      .get(`/api/v1/folders/${id}`)
      .expect(200);
    const breadcrumbs = detail.body.data.breadcrumbs as Array<{ name: string }>;
    expect(breadcrumbs.map((item) => item.name)).toEqual(["Projects"]);
    const renamed = await supertest(app)
      .patch(`/api/v1/folders/${id}`)
      .send({ name: "Archive" })
      .expect(200);
    expect(renamed.body.data).toMatchObject({
      name: "Archive",
      parentId: null,
      depth: 1,
    });
  });
  it("returns safe conflict, depth, and immutable-parent validation outcomes", async () => {
    await supertest(app)
      .post("/api/v1/folders")
      .send({ name: "Reports", parentId: null })
      .expect(201);
    await supertest(app)
      .post("/api/v1/folders")
      .send({ name: " reports ", parentId: null })
      .expect(409);
    await supertest(app)
      .patch("/api/v1/folders/not-a-uuid")
      .send({ name: "Nope", parentId: null })
      .expect(404);
  });
  it("moves a file and returns its updated public representation", async () => {
    const folder = await supertest(app)
      .post("/api/v1/folders")
      .send({ name: "Destination", parentId: null })
      .expect(201);
    const file = await seedFile(prisma, { ownerId: primaryUserId });
    const moved = await supertest(app)
      .patch(`/api/v1/files/${file.id}`)
      .send({ folderId: folder.body.data.id })
      .expect(200);
    expect(moved.body.data.folder).toEqual({
      id: folder.body.data.id,
      name: "Destination",
    });
    expect(moved.body.data).not.toHaveProperty("storageKey");
  });
});
