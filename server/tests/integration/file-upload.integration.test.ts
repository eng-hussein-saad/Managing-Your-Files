import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  fileManagementHarness,
  primaryUserId,
  secondaryUserId,
} from "../helpers/integration.js";

describeDatabase("file upload integration", () => {
  const { app, prisma, storage, extractor } = fileManagementHarness();

  it("commits object-first metadata under a trusted key and permits duplicate display names", async () => {
    extractor.result = "extracted";
    const first = await supertest(app)
      .post("/api/v1/files")
      .attach("file", Buffer.from("first"), "duplicate.txt")
      .expect(201);
    const second = await supertest(app)
      .post("/api/v1/files")
      .attach("file", Buffer.from("second"), "duplicate.txt")
      .expect(201);
    const rows = await prisma.file.findMany({
      where: { ownerId: primaryUserId },
      orderBy: { createdAt: "asc" },
    });
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.originalName)).toEqual([
      "duplicate.txt",
      "duplicate.txt",
    ]);
    rows.forEach((row) =>
      expect(row.storageKey).toBe(`users/${primaryUserId}/files/${row.id}`),
    );
    expect([...storage.objects.keys()].sort()).toEqual(
      rows.map((row) => row.storageKey).sort(),
    );
    expect(first.body.data.extractionState).toBe("available");
    expect(second.body.data).not.toHaveProperty("storageKey");
  });

  it("accepts only an owned destination and creates no object for a foreign folder", async () => {
    const folder = await prisma.folder.create({
      data: {
        ownerId: secondaryUserId,
        name: "Foreign",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await supertest(app)
      .post("/api/v1/files")
      .field("folderId", folder.id)
      .attach("file", Buffer.from("owned check"), "file.txt")
      .expect(404);
    expect(await prisma.file.count()).toBe(0);
    expect(storage.objects.size).toBe(0);
  });

  it("leaves no partial metadata or retained quota when provider upload fails", async () => {
    storage.failNext = "upload";
    await supertest(app)
      .post("/api/v1/files")
      .attach("file", Buffer.from("provider failure"), "file.txt")
      .expect(503);
    expect(await prisma.file.count()).toBe(0);
    expect(storage.objects.size).toBe(0);
    const policy = await supertest(app).get("/api/v1/files/policy").expect(200);
    expect(policy.body.data.quota.usedBytes).toBe("0");
  });

  it("removes temporary files after successful and rejected requests", async () => {
    const directory = join(tmpdir(), "gold-era-uploads");
    const before = await readdir(directory).catch(() => [] as string[]);
    await supertest(app)
      .post("/api/v1/files")
      .attach("file", Buffer.from("cleanup"), "cleanup.txt")
      .expect(201);
    await supertest(app)
      .post("/api/v1/files")
      .attach("file", Buffer.from([0, 1, 2]), "bad.bin")
      .expect(415);
    await new Promise((resolve) => setTimeout(resolve, 50));
    const after = await readdir(directory).catch(() => [] as string[]);
    expect(after).toEqual(before);
  });

  it("keeps successful uploads committed when audit persistence fails", async () => {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "AUDIT_LOG" RENAME TO "AUDIT_LOG_UNAVAILABLE"',
    );
    try {
      const response = await supertest(app)
        .post("/api/v1/files")
        .attach("file", Buffer.from("audit fail open"), "audit.txt")
        .expect(201);
      expect(
        await prisma.file.findUnique({
          where: { id: response.body.data.id as string },
        }),
      ).not.toBeNull();
    } finally {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "AUDIT_LOG_UNAVAILABLE" RENAME TO "AUDIT_LOG"',
      );
    }
  });
});
