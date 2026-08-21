import { describe, expect, it } from "vitest";
import {
  errorEnvelopeSchema,
  registerRequestSchema,
  registrationResponseSchema,
  verifyEmailRequestSchema,
} from "@gold-era/contracts/public";

describe("registration public contracts", () => {
  it("normalizes registration input and enforces an eight-character password minimum", () => {
    expect(
      registerRequestSchema.parse({
        name: " Ada ",
        email: " ADA@Example.COM ",
        password: "eightchr",
      }),
    ).toMatchObject({ name: "Ada", email: "ada@example.com" });
    expect(
      registerRequestSchema.safeParse({
        name: "Ada",
        email: "ada@example.com",
        password: "seven77",
      }).success,
    ).toBe(false);
  });
  it("requires exactly eight verification digits", () => {
    expect(
      verifyEmailRequestSchema.safeParse({
        email: "a@example.com",
        code: "12345678",
      }).success,
    ).toBe(true);
    expect(
      verifyEmailRequestSchema.safeParse({
        email: "a@example.com",
        code: "1234abcd",
      }).success,
    ).toBe(false);
  });
  it("excludes secret fields from successful and failed envelopes", () => {
    expect(
      registrationResponseSchema.safeParse({
        success: true,
        data: {
          email: "a@example.com",
          verificationRequired: true,
          code: "12345678",
        },
      }).success,
    ).toBe(false);
    expect(
      errorEnvelopeSchema.safeParse({
        success: false,
        error: { code: "AUTH_VERIFICATION_INVALID", message: "Invalid" },
      }).success,
    ).toBe(true);
  });
});
