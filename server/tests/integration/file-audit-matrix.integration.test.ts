import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  fileManagementHarness,
  primaryUserId,
} from "../helpers/integration.js";
import { seedFile } from "../fixtures/file-management.js";

const expectedActions = [
  "file.upload",
  "file.download",
  "file.move",
  "file.delete",
  "folder.create",
  "folder.rename",
  "folder.delete",
] as const;

/** Exercises every Phase 2 lifecycle audit and its fail-open boundary. */
describeDatabase("file-management audit matrix", () => {
  const { app, prisma, storage } = fileManagementHarness();

  it("records one sanitized allowlisted event for every successful lifecycle", async () => {
    await supertest(app)
      .post("/api/v1/files")
      .attach("file", Buffer.from("upload"), "upload.txt")
      .expect(201);
    const downloadable = await seedFile(prisma, {
      ownerId: primaryUserId,
      storage,
      name: "download.txt",
    });
    await supertest(app)
      .get(`/api/v1/files/${downloadable.id}/download`)
      .expect(200);
    const folder = (
      await supertest(app)
        .post("/api/v1/folders")
        .send({ name: "Folder", parentId: null })
        .expect(201)
    ).body.data;
    await supertest(app)
      .patch(`/api/v1/folders/${folder.id}`)
      .send({ name: "Renamed" })
      .expect(200);
    const movable = await seedFile(prisma, {
      ownerId: primaryUserId,
      storage,
      name: "move.txt",
    });
    await supertest(app)
      .patch(`/api/v1/files/${movable.id}`)
      .send({ folderId: folder.id })
      .expect(200);
    await supertest(app).delete(`/api/v1/files/${movable.id}`).expect(204);
    await supertest(app).delete(`/api/v1/files/${downloadable.id}`).expect(204);
    await supertest(app).delete(`/api/v1/folders/${folder.id}`).expect(204);

    const rows = await prisma.auditLog.findMany({
      where: { action: { in: [...expectedActions] } },
    });
    expect(new Set(rows.map((row) => row.action))).toEqual(
      new Set(expectedActions),
    );
    for (const row of rows)
      expect(row.metadata).toEqual({ outcome: "SUCCESS" });
    const serialized = JSON.stringify(rows.map((row) => row.metadata));
    expect(serialized).not.toMatch(
      /storageKey|users\/|supabase|filename|extracted|password|token|temp/i,
    );
  });

  it("does not reverse an accepted lifecycle when audit persistence is unavailable", async () => {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "AUDIT_LOG" RENAME TO "AUDIT_LOG_UNAVAILABLE"',
    );
    try {
      const response = await supertest(app)
        .post("/api/v1/folders")
        .send({ name: "Fail open", parentId: null })
        .expect(201);
      expect(
        await prisma.folder.findUnique({
          where: { id: response.body.data.id },
        }),
      ).not.toBeNull();
    } finally {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "AUDIT_LOG_UNAVAILABLE" RENAME TO "AUDIT_LOG"',
      );
    }
  });
});
