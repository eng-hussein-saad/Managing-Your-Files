import { describe, expect, it } from "vitest";
import {
  adminRoleChangeSchema,
  adminUserDeleteSchema,
  adminUserPageSchema,
  errorEnvelopeSchema,
} from "@gold-era/contracts/public";
import { adminUserFixture } from "../fixtures/admin.js";

const user = adminUserFixture();
const safeUser = {
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  createdAt: (user.createdAt as Date).toISOString(),
  updatedAt: (user.updatedAt as Date).toISOString(),
};

describe("administrator user contracts", () => {
  it("accepts the strict deterministic page envelope", () => {
    expect(adminUserPageSchema.safeParse({ success: true, data: [safeUser], meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } }).success).toBe(true);
    expect(adminUserPageSchema.safeParse({ success: true, data: [{ ...safeUser, passwordHash: "secret" }], meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } }).success).toBe(false);
  });
  it("rejects unknown mutation fields and invalid confirmations", () => {
    expect(adminRoleChangeSchema.safeParse({ role: "OWNER", expectedUpdatedAt: safeUser.updatedAt }).success).toBe(false);
    expect(adminUserDeleteSchema.safeParse({ expectedUpdatedAt: safeUser.updatedAt, confirmationEmail: "not-email", extra: true }).success).toBe(false);
  });
  it("accepts documented conflict and validation error envelopes", () => {
    for (const code of ["VALIDATION_FAILED", "RESOURCE_CONFLICT"])
      expect(errorEnvelopeSchema.safeParse({ success: false, error: { code, message: "Safe message" } }).success).toBe(true);
  });
});
