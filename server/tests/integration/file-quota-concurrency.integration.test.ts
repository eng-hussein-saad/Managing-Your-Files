import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  fileManagementHarness,
  primaryUserId,
} from "../helpers/integration.js";

describeDatabase("concurrent file quota admission", () => {
  const { app, prisma, storage } = fileManagementHarness();

  it("serializes at least twenty same-user attempts without exceeding 100 MB", async () => {
    await prisma.file.create({
      data: {
        ownerId: primaryUserId,
        originalName: "seed.bin",
        storageKey: "seed",
        mimeType: "text/plain",
        size: 99_614_720n,
        extractedContent: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    const payload = Buffer.alloc(1_048_576, 0x61);
    const outcomes = await Promise.all(
      Array.from({ length: 20 }, (_value, index) =>
        supertest(app)
          .post("/api/v1/files")
          .attach("file", payload, `candidate-${index}.txt`),
      ),
    );
    const successful = outcomes.filter((response) => response.status === 201);
    const rejected = outcomes.filter((response) => response.status === 422);
    const aggregate = await prisma.file.aggregate({
      where: { ownerId: primaryUserId },
      _sum: { size: true },
    });
    expect(successful).toHaveLength(5);
    expect(rejected).toHaveLength(15);
    expect(aggregate._sum.size).toBe(104_857_600n);
    expect(storage.objects.size).toBe(5);
  });

  it("releases locked capacity after a provider failure", async () => {
    storage.failNext = "upload";
    await supertest(app)
      .post("/api/v1/files")
      .attach("file", Buffer.from("failed"), "failed.txt")
      .expect(503);
    await supertest(app)
      .post("/api/v1/files")
      .attach("file", Buffer.from("retry"), "retry.txt")
      .expect(201);
    expect(await prisma.file.count({ where: { ownerId: primaryUserId } })).toBe(
      1,
    );
  });
});
