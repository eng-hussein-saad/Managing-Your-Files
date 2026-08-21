import { describe, expect, it } from "vitest";
import { createAccessTokenService } from "../../src/infrastructure/security/access-tokens.js";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "../../src/infrastructure/security/refresh-tokens.js";
import { trustSecretMatches } from "../../src/infrastructure/security/trust-secret.js";
import { redact } from "../../src/infrastructure/observability/redaction.js";

describe("security primitives", () => {
  it("issues pinned verified access claims", async () => {
    const service = createAccessTokenService(
      "s".repeat(32),
      "issuer",
      "audience",
      60,
    );
    const token = await service.issue({ subject: "user-id", role: "USER" });
    await expect(service.verify(token)).resolves.toEqual({
      subject: "user-id",
      role: "USER",
    });
  });
  it("hashes opaque refresh tokens deterministically without retaining raw values", () => {
    const token = generateRefreshToken();
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(hashRefreshToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashRefreshToken(token)).not.toContain(token);
  });
  it("compares trust credentials and deeply redacts secrets", () => {
    const secret = "x".repeat(32);
    expect(trustSecretMatches(secret, secret)).toBe(true);
    expect(trustSecretMatches(`y${secret}`, secret)).toBe(false);
    expect(
      redact({
        password: "hidden",
        nested: { authorization: "Bearer secret", safe: "ok" },
      }),
    ).toEqual({
      password: "[REDACTED]",
      nested: { authorization: "[REDACTED]", safe: "ok" },
    });
  });
});
