import { describe, expect, it } from "vitest";
import { logoutResponseSchema } from "@gold-era/contracts/public";
describe("logout contract", () => {
  it("is a stable idempotent success shape", () => {
    expect(
      logoutResponseSchema.safeParse({
        success: true,
        data: { loggedOut: true },
      }).success,
    ).toBe(true);
    expect(
      logoutResponseSchema.safeParse({
        success: true,
        data: { loggedOut: false },
      }).success,
    ).toBe(false);
  });
});
