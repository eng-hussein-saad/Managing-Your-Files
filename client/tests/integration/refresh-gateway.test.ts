import { describe, expect, it } from "vitest";
import { clearedRefreshCookie } from "../../src/lib/auth/refresh-cookie";
const env = {
  AUTH_API_BASE_URL: "https://api.example.invalid",
  AUTH_BFF_SHARED_SECRET: "b".repeat(32),
  REFRESH_COOKIE_NAME: "gold_era_refresh",
  REFRESH_COOKIE_PATH: "/api/auth",
  REFRESH_COOKIE_SAME_SITE: "strict",
  REFRESH_COOKIE_SECURE: true,
  REFRESH_TOKEN_TTL: "30d",
} as const;
describe("refresh gateway cookie failure cleanup", () => {
  it("expires the configured credential at its narrow path", () => {
    expect(clearedRefreshCookie(env)).toMatchObject({
      name: "gold_era_refresh",
      value: "",
      path: "/api/auth",
      maxAge: 0,
      httpOnly: true,
    });
  });
});
