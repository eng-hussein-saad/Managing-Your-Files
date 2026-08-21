import { describe, expect, it } from "vitest";
import {
  adminAccessResponseSchema,
  errorEnvelopeSchema,
} from "@gold-era/contracts/public";
describe("administrator access contract", () => {
  it("distinguishes allowed and forbidden envelopes", () => {
    expect(
      adminAccessResponseSchema.safeParse({
        success: true,
        data: { allowed: true },
      }).success,
    ).toBe(true);
    expect(
      errorEnvelopeSchema.safeParse({
        success: false,
        error: {
          code: "AUTH_FORBIDDEN",
          message: "Administrator permission is required.",
        },
      }).success,
    ).toBe(true);
  });
});
