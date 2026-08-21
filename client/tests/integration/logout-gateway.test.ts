import { describe, expect, it } from "vitest";
import {
  clearSession,
  accessToken,
  setSession,
} from "../../src/features/auth/auth-store";
const user = {
  id: "d2e2ad88-7d91-4209-94cf-0d0c7fcbfa32",
  name: "Ada",
  email: "ada@example.com",
  role: "USER",
  isEmailVerified: true,
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-08-20T00:00:00.000Z",
} as const;
describe("logout client cleanup", () => {
  it("always clears memory-only access state", () => {
    setSession({
      accessToken: "access",
      tokenType: "Bearer",
      expiresIn: 900,
      user,
    });
    expect(accessToken()).toBe("access");
    clearSession();
    expect(accessToken()).toBeNull();
  });
});
