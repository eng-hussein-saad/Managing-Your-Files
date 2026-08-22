import supertest from "supertest";
import { expect, it } from "vitest";
import {
  fileDetailSchema,
  filePageResponseSchema,
} from "@gold-era/contracts/public";
import {
  describeDatabase,
  fileManagementHarness,
  primaryUserId,
} from "../helpers/integration.js";
import { seedFile } from "../fixtures/file-management.js";

describeDatabase("file discovery contract", () => {
  const { app, prisma } = fileManagementHarness();
  it("applies documented defaults and decimal-string pagination results", async () => {
    await seedFile(prisma, { ownerId: primaryUserId, size: 42n });
    const response = await supertest(app).get("/api/v1/files").expect(200);
    expect(filePageResponseSchema.safeParse(response.body).success).toBe(true);
    expect(response.body.meta).toEqual({
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1,
    });
    expect(response.body.data[0].sizeBytes).toBe("42");
  });
  it("returns complete extraction details and generic safe absence", async () => {
    const row = await seedFile(prisma, {
      ownerId: primaryUserId,
      extractedContent: "detail text",
    });
    const found = await supertest(app)
      .get(`/api/v1/files/${row.id}`)
      .expect(200);
    expect(fileDetailSchema.safeParse(found.body.data).success).toBe(true);
    expect(found.body.data.extractedContent).toBe("detail text");
    const missing = await supertest(app)
      .get("/api/v1/files/not-a-uuid")
      .expect(404);
    expect(missing.body.error.code).toBe("RESOURCE_NOT_FOUND");
  });
  it("rejects malformed combined query values", async () => {
    const response = await supertest(app)
      .get("/api/v1/files?sort=unsafe&direction=sideways&page=0&pageSize=101")
      .expect(400);
    expect(response.body.error.code).toBe("VALIDATION_FAILED");
    expect(response.body.error.fields.length).toBeGreaterThan(0);
  });
});
