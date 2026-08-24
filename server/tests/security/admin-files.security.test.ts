import { describe, expect, it } from "vitest";
import { adminFileSchema } from "@gold-era/contracts/public";
import { safeAdminFileFixture } from "../fixtures/admin.js";
import supertest from "supertest";
import { describeDatabase, integrationHarness } from "../helpers/integration.js";

describe("administrator file metadata boundary", () => {
  it.each(["storageKey", "extractedContent", "previewUrl", "downloadUrl"])("rejects the private %s field", (field) => {
    expect(adminFileSchema.safeParse({ ...safeAdminFileFixture(), [field]: "private" }).success).toBe(false);
  });
});

describeDatabase("administrator file authorization", () => {
  const { app } = integrationHarness();
  it("denies unauthenticated metadata and defines no administrator content routes", async () => {
    await supertest(app).get("/api/v1/admin/files").expect(401);
    await supertest(app).get("/api/v1/admin/files/10000000-0000-4000-8000-000000000000/preview").expect(404);
  });
});
