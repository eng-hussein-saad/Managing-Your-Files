import { describe, expect, it } from "vitest";
import { errorEnvelopeSchema, loginRequestSchema, registerRequestSchema, verifyEmailRequestSchema } from "@gold-era/contracts/public";
import { auditActions } from "../../src/modules/audit/audit.types.js";

describe("authentication regression contract", () => {
  it("retains strict registration, login, and verification validation", () => {
    expect(registerRequestSchema.safeParse({ name: "User", email: "user@example.invalid", password: "correct-password" }).success).toBe(true);
    expect(loginRequestSchema.safeParse({ email: "invalid", password: "" }).success).toBe(false);
    expect(verifyEmailRequestSchema.safeParse({ email: "user@example.invalid", code: "123" }).success).toBe(false);
  });
  it("retains safe authentication failures and every required success audit action", () => {
    expect(errorEnvelopeSchema.safeParse({ success: false, error: { code: "AUTH_INVALID_CREDENTIALS", message: "Email or password is invalid." } }).success).toBe(true);
    expect(auditActions).toEqual(expect.arrayContaining(["auth.registration", "auth.verification", "auth.login", "auth.logout"]));
  });
});
