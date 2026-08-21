import { describe, expect, it } from "vitest";
import { accessToken, clearSession } from "../../src/features/auth/auth-store";
describe("logout state", () => {
  it("is idempotently anonymous", () => {
    clearSession();
    clearSession();
    expect(accessToken()).toBeNull();
  });
});
