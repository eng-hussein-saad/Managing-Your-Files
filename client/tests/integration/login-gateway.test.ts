import { describe, expect, it } from "vitest";
import { isSameOrigin } from "../../src/lib/auth/same-origin";
import { refreshCookie } from "../../src/lib/auth/refresh-cookie";
const env = {
  AUTH_API_BASE_URL: "https://api.example.invalid",
  AUTH_BFF_SHARED_SECRET: "b".repeat(32),
  REFRESH_COOKIE_NAME: "gold_era_refresh",
  REFRESH_COOKIE_PATH: "/api/auth",
  REFRESH_COOKIE_SAME_SITE: "strict",
  REFRESH_COOKIE_SECURE: true,
  REFRESH_TOKEN_TTL: "30d",
} as const;
describe("login gateway boundary", () => {
  it("requires the exact application origin", () => {
    expect(
      isSameOrigin(
        new Request("https://app.example.invalid/api/auth/login", {
          headers: { origin: "https://app.example.invalid" },
        }),
      ),
    ).toBe(true);
    expect(
      isSameOrigin(
        new Request("https://app.example.invalid/api/auth/login", {
          headers: { origin: "https://evil.invalid" },
        }),
      ),
    ).toBe(false);
  });
  it("constructs a host-only secure HttpOnly cookie", () => {
    expect(refreshCookie(env, "opaque")).toMatchObject({
      name: "gold_era_refresh",
      value: "opaque",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/api/auth",
      maxAge: 2_592_000,
    });
    expect(refreshCookie(env, "opaque")).not.toHaveProperty("domain");
  });
});
