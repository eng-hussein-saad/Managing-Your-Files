import { describe, expect, it } from "vitest";
import {
  authSessionResponseSchema,
  safeUserSchema,
} from "@gold-era/contracts/public";
import { trustedAuthResponseSchema } from "@gold-era/contracts/internal";
const user = {
  id: "d2e2ad88-7d91-4209-94cf-0d0c7fcbfa32",
  name: "Ada",
  email: "ada@example.com",
  role: "USER",
  isEmailVerified: true,
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-08-20T00:00:00.000Z",
} as const;
describe("login and profile contracts", () => {
  it("accepts only safe profile fields", () => {
    expect(safeUserSchema.safeParse(user).success).toBe(true);
    expect(
      safeUserSchema.safeParse({ ...user, passwordHash: "hidden" }).success,
    ).toBe(false);
  });
  it("keeps raw refresh material exclusive to the trusted schema", () => {
    const trusted = {
      success: true,
      data: {
        accessToken: "access",
        tokenType: "Bearer",
        expiresIn: 900,
        refreshToken: "r".repeat(43),
        refreshExpiresAt: "2026-09-20T00:00:00.000Z",
        user,
      },
    };
    expect(trustedAuthResponseSchema.safeParse(trusted).success).toBe(true);
    expect(authSessionResponseSchema.safeParse(trusted).success).toBe(false);
  });
});
