import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  integrationHarness,
  registerVerified,
} from "../helpers/integration.js";
describeDatabase("authentication audit matrix", () => {
  const { app, mailer, prisma, trust } = integrationHarness();
  it("records structurally complete allowlisted lifecycle events without secrets", async () => {
    await registerVerified(app, mailer);
    const login = await supertest(app)
      .post("/internal/v1/auth/login")
      .set(trust)
      .send({ email: "user@example.invalid", password: "correct-password" });
    const refresh = await supertest(app)
      .post("/internal/v1/auth/refresh")
      .set(trust)
      .send({ refreshToken: login.body.data.refreshToken as string });
    await supertest(app)
      .post("/internal/v1/auth/logout")
      .set(trust)
      .send({ refreshToken: refresh.body.data.refreshToken as string });
    const rows = await prisma.auditLog.findMany();
    expect(new Set(rows.map((row) => row.action))).toEqual(
      expect.objectContaining(
        new Set([
          "auth.registration",
          "auth.verification",
          "auth.login",
          "auth.logout",
        ]),
      ),
    );
    expect(rows.map((row) => row.action)).not.toContain("auth.refresh");
    expect(JSON.stringify(rows)).not.toContain("correct-password");
    expect(
      rows.every(
        (row) =>
          row.createdAt instanceof Date &&
          typeof (row.metadata as { outcome?: unknown } | null)?.outcome ===
            "string",
      ),
    ).toBe(true);
  });
});
