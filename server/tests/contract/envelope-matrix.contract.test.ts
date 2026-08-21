import { describe, expect, it } from "vitest";
import { errorCodes, errorEnvelopeSchema } from "@gold-era/contracts/public";
describe("cross-operation envelope matrix", () => {
  it.each(errorCodes)("accepts the stable %s code", (code) => {
    expect(
      errorEnvelopeSchema.safeParse({
        success: false,
        error: { code, message: "Safe outcome", requestId: "request-id" },
      }).success,
    ).toBe(true);
  });
});
