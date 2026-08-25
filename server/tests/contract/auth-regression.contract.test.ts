import { describe, expect, it } from "vitest";
import { errorEnvelopeSchema, loginRequestSchema, registerRequestSchema, verifyEmailRequestSchema } from "@gold-era/contracts/public";
import { auditActions } from "../../src/modules/audit/audit.types.js";

describe("authentication regression contract", () => {
  it("retains strict registration, login, and verification validation", () => {
    expect(registerRequestSchema.safeParse({ name: "User", email: "user@example.invalid", password: "correct-password" }).success).toBe(true);
    expect(loginRequestSchema.safeParse({ email: "invalid", password: "" }).success).toBe(false);
    expect(verifyEmailRequestSchema.safeParse({ email: "user@example.invalid", code: "123" }).success).toBe(false);
  });
  it("retains safe authentication failures without ordinary authentication audit actions", () => {
    expect(errorEnvelopeSchema.safeParse({ success: false, error: { code: "AUTH_INVALID_CREDENTIALS", message: "Email or password is invalid." } }).success).toBe(true);
    expect(auditActions).not.toEqual(expect.arrayContaining(["auth.registration", "auth.verification", "auth.login", "auth.logout"]));
    expect(auditActions.every((action) => !action.startsWith("auth."))).toBe(true);
  });
});
