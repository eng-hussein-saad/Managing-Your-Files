import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  integrationHarness,
  registerVerified,
} from "../helpers/integration.js";
describeDatabase("logout revocation", () => {
  const { app, mailer, prisma, trust } = integrationHarness();
  it("revokes only the presented token and remains idempotent", async () => {
    await registerVerified(app, mailer);
    const first = await supertest(app)
      .post("/internal/v1/auth/login")
      .set(trust)
      .send({ email: "user@example.invalid", password: "correct-password" });
    await supertest(app)
      .post("/internal/v1/auth/login")
      .set(trust)
      .send({ email: "user@example.invalid", password: "correct-password" });
    const raw = first.body.data.refreshToken as string;
    await supertest(app)
      .post("/internal/v1/auth/logout")
      .set(trust)
      .send({ refreshToken: raw })
      .expect(200);
    await supertest(app)
      .post("/internal/v1/auth/logout")
      .set(trust)
      .send({ refreshToken: raw })
      .expect(200);
    await expect(
      prisma.refreshToken.count({ where: { revokedAt: null } }),
    ).resolves.toBe(1);
  });
  it("is safe for absent or malformed values", async () => {
    await supertest(app)
      .post("/internal/v1/auth/logout")
      .set(trust)
      .send({})
      .expect(200);
    await supertest(app)
      .post("/internal/v1/auth/logout")
      .set(trust)
      .send({ refreshToken: "short" })
      .expect(400);
  });
});
