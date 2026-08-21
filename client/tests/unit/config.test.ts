import { describe, expect, it, vi } from "vitest";
describe("client configuration classification", () => {
  it("keeps trust and cookie values out of the public parser input", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:3001");
    const { publicEnv } = await import("../../src/lib/config/public-env");
    expect(publicEnv()).toEqual({
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:3001",
    });
    expect(publicEnv()).not.toHaveProperty("AUTH_BFF_SHARED_SECRET");
  });
});
describe("gateway configuration contract", () => {
  it("rejects a missing server trust credential", async () => {
    vi.stubEnv("AUTH_API_BASE_URL", "http://localhost:3001");
    vi.stubEnv("AUTH_BFF_SHARED_SECRET", "");
    vi.stubEnv("REFRESH_COOKIE_NAME", "gold_era_refresh");
    vi.stubEnv("REFRESH_COOKIE_PATH", "/api/auth");
    vi.stubEnv("REFRESH_COOKIE_SAME_SITE", "strict");
    vi.stubEnv("REFRESH_COOKIE_SECURE", "true");
    vi.stubEnv("REFRESH_TOKEN_TTL", "30d");
    const { serverEnv } = await import("../../src/lib/config/server-env");
    expect(() => serverEnv()).toThrow();
  });
});
