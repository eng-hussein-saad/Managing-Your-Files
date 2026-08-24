import { describe, expect, it } from "vitest";
import { adminRoleChangeSchema, adminUserSchema } from "@gold-era/contracts/public";
import { safeAdminUserFixture } from "../fixtures/admin.js";
import supertest from "supertest";
import { createAccessTokenService } from "../../src/infrastructure/security/access-tokens.js";
import { describeDatabase, integrationEnv, integrationHarness, primaryUserId } from "../helpers/integration.js";

describe("administrator user disclosure boundary", () => {
  it("rejects secrets and unsupported authority values", () => {
    expect(adminUserSchema.safeParse({ ...safeAdminUserFixture(), passwordHash: "secret", refreshToken: "secret" }).success).toBe(false);
    expect(adminRoleChangeSchema.safeParse({ role: "SUPERADMIN", expectedUpdatedAt: "2026-08-23T00:00:00.000Z" }).success).toBe(false);
  });
});

describeDatabase("administrator user authorization", () => {
  const { app, prisma } = integrationHarness();
  it("denies unauthenticated and verified normal-user requests before disclosure", async () => {
    await supertest(app).get("/api/v1/admin/users").expect(401);
    await prisma.user.create({ data: { id: primaryUserId, name: "Normal User", email: "normal@example.invalid", passwordHash: "test", role: "USER", isEmailVerified: true, createdAt: new Date(), updatedAt: new Date() } });
    const tokens = createAccessTokenService(integrationEnv.JWT_ACCESS_SECRET, "gold-era-api", "gold-era-browser", 900);
    const token = await tokens.issue({ subject: primaryUserId, role: "USER" });
    const response = await supertest(app).get("/api/v1/admin/users").set("authorization", `Bearer ${token}`).expect(403);
    expect(JSON.stringify(response.body)).not.toContain("normal@example.invalid");
    const staleRoleToken = await tokens.issue({ subject: primaryUserId, role: "ADMIN" });
    await supertest(app).get("/api/v1/admin/users").set("authorization", `Bearer ${staleRoleToken}`).expect(401);
  });
});
