import { describe, expect, it } from "vitest";
import {
  accessToken,
  clearSession,
  setAuthState,
} from "../../src/features/auth/auth-store";
describe("reload restoration state", () => {
  it("starts without browser-readable access and clears on failure", () => {
    setAuthState({ status: "loading", session: null });
    expect(accessToken()).toBeNull();
    clearSession();
    expect(accessToken()).toBeNull();
  });
});
