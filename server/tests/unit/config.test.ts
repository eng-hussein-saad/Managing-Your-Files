import { describe, expect, it } from "vitest";
import { durationSeconds, parseServerEnv } from "../../src/config/env.js";

const valid = {
  PORT: "3001",
  DATABASE_URL: "postgresql://user:pass@localhost:5432/gold",
  JWT_ACCESS_SECRET: "j".repeat(32),
  ACCESS_TOKEN_TTL: "15m",
  REFRESH_TOKEN_TTL: "30d",
  BFF_SHARED_SECRET: "b".repeat(32),
  CORS_ALLOWED_ORIGINS: "http://localhost:3000",
  EMAIL_FROM: "noreply@example.invalid",
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  SMTP_SECURE: "false",
  SMTP_USER: "user",
  SMTP_PASSWORD: "pass",
  ADMIN_EMAIL: "Admin@Example.invalid ",
  ADMIN_PASSWORD: "administrator-pass",
  ADMIN_NAME: "Administrator",
};

describe("server configuration contract", () => {
  it("normalizes valid settings and durations", () => {
    expect(parseServerEnv(valid).ADMIN_EMAIL).toBe("admin@example.invalid");
    expect(durationSeconds("15m")).toBe(900);
  });
  it("rejects wildcard CORS and weak secrets", () => {
    expect(() =>
      parseServerEnv({
        ...valid,
        CORS_ALLOWED_ORIGINS: "*",
        JWT_ACCESS_SECRET: "short",
      }),
    ).toThrow();
  });
  it("enforces an eight-character administrator password minimum", () => {
    expect(
      parseServerEnv({ ...valid, ADMIN_PASSWORD: "eightchr" }).ADMIN_PASSWORD,
    ).toBe("eightchr");
    expect(() =>
      parseServerEnv({ ...valid, ADMIN_PASSWORD: "seven77" }),
    ).toThrow();
  });
  it("rejects a missing required value", () => {
    const missing = { ...valid };
    delete (missing as Partial<typeof valid>).DATABASE_URL;
    expect(() => parseServerEnv(missing)).toThrow();
  });
});
