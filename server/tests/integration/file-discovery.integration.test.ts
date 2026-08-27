import { randomUUID } from "node:crypto";
import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  fileManagementHarness,
  primaryUserId,
  secondaryUserId,
} from "../helpers/integration.js";
import { seedFile, seedFolder } from "../fixtures/file-management.js";

describeDatabase("file discovery persistence", () => {
  const { app, prisma } = fileManagementHarness();
  it("combines ownership, case-insensitive search, type, and root/folder filters", async () => {
    const folder = await seedFolder(prisma, { ownerId: primaryUserId });
    await seedFile(prisma, {
      ownerId: primaryUserId,
      folderId: folder.id,
      name: "Quarterly Report.PDF",
      mimeType: "application/pdf",
    });
    await seedFile(prisma, {
      ownerId: primaryUserId,
      name: "notes.txt",
      mimeType: "text/plain",
    });
    await seedFile(prisma, {
      ownerId: secondaryUserId,
      name: "Quarterly Report.PDF",
      mimeType: "application/pdf",
    });
    const folderResult = await supertest(app)
      .get(`/api/v1/files?search=quarterly&type=pdf&folderId=${folder.id}`)
      .expect(200);
    const folderFiles = folderResult.body.data as Array<{
      originalName: string;
    }>;
    expect(folderFiles.map((item) => item.originalName)).toEqual([
      "Quarterly Report.PDF",
    ]);
    const root = await supertest(app)
      .get("/api/v1/files?folderId=root")
      .expect(200);
    const rootFiles = root.body.data as Array<{ originalName: string }>;
    expect(rootFiles.map((item) => item.originalName)).toEqual(["notes.txt"]);
  });
  it("uses the requested direction for every sort and the id tie-breaker", async () => {
    const createdAt = new Date("2026-08-20T00:00:00Z");
    const first = await seedFile(prisma, {
      ownerId: primaryUserId,
      id: "10000000-0000-4000-8000-000000000000",
      name: "same.txt",
      size: 10n,
      createdAt,
    });
    const second = await seedFile(prisma, {
      ownerId: primaryUserId,
      id: "20000000-0000-4000-8000-000000000000",
      name: "same.txt",
      size: 10n,
      createdAt,
    });
    for (const sort of ["name", "size", "uploadedAt"]) {
      const asc = await supertest(app)
        .get(`/api/v1/files?sort=${sort}&direction=asc&pageSize=5`)
        .expect(200);
      const desc = await supertest(app)
        .get(`/api/v1/files?sort=${sort}&direction=desc&pageSize=5`)
        .expect(200);
      expect(asc.body.data[0].id).toBe(first.id);
      expect(desc.body.data[0].id).toBe(second.id);
      expect(asc.body.meta.totalItems).toBe(2);
    }
  });
  it("sorts names case-insensitively", async () => {
    for (const name of ["Hussein_Saad_CV.docx", "dog.png", "text.txt"])
      await seedFile(prisma, { ownerId: primaryUserId, name });

    const asc = await supertest(app)
      .get("/api/v1/files?sort=name&direction=asc&pageSize=5")
      .expect(200);
    const desc = await supertest(app)
      .get("/api/v1/files?sort=name&direction=desc&pageSize=5")
      .expect(200);
    const ascFiles = asc.body.data as Array<{ originalName: string }>;
    const descFiles = desc.body.data as Array<{ originalName: string }>;

    expect(ascFiles.map((item) => item.originalName)).toEqual([
      "dog.png",
      "Hussein_Saad_CV.docx",
      "text.txt",
    ]);
    expect(descFiles.map((item) => item.originalName)).toEqual([
      "text.txt",
      "Hussein_Saad_CV.docx",
      "dog.png",
    ]);
  });
  it("returns a 10,000-row owner page within the local two-second acceptance budget", async () => {
    const createdAt = new Date("2026-08-01T00:00:00Z");
    await prisma.file.createMany({
      data: Array.from({ length: 10_000 }, (_value, index) => ({
        id: randomUUID(),
        ownerId: primaryUserId,
        folderId: null,
        originalName: `fixture-${index.toString().padStart(5, "0")}.txt`,
        storageKey: `benchmark/${index}`,
        mimeType: "text/plain",
        size: 10n,
        extractedContent: null,
        createdAt,
        updatedAt: createdAt,
      })),
    });
    const started = performance.now();
    const response = await supertest(app)
      .get("/api/v1/files?sort=name&direction=asc&page=250&pageSize=20")
      .expect(200);
    const elapsed = performance.now() - started;
    expect(response.body.meta.totalItems).toBe(10_000);
    expect(response.body.data).toHaveLength(20);
    expect(elapsed).toBeLessThan(2_000);
  });
});
