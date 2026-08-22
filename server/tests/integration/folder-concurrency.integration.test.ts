import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  fileManagementHarness,
  primaryUserId,
} from "../helpers/integration.js";

describeDatabase("folder mutation concurrency", () => {
  const { app, prisma } = fileManagementHarness();
  it("serializes case-insensitive duplicate sibling creation", async () => {
    const responses = await Promise.all([
      supertest(app)
        .post("/api/v1/folders")
        .send({ name: "Shared", parentId: null }),
      supertest(app)
        .post("/api/v1/folders")
        .send({ name: " shared ", parentId: null }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([
      201, 409,
    ]);
    expect(
      await prisma.folder.count({ where: { ownerId: primaryUserId } }),
    ).toBe(1);
  });
  it("serializes concurrent renames to one sibling name", async () => {
    const first = await supertest(app)
      .post("/api/v1/folders")
      .send({ name: "One", parentId: null })
      .expect(201);
    const second = await supertest(app)
      .post("/api/v1/folders")
      .send({ name: "Two", parentId: null })
      .expect(201);
    const responses = await Promise.all([
      supertest(app)
        .patch(`/api/v1/folders/${first.body.data.id}`)
        .send({ name: "Same" }),
      supertest(app)
        .patch(`/api/v1/folders/${second.body.data.id}`)
        .send({ name: "same" }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 409,
    ]);
  });
});
