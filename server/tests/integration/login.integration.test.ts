import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  integrationHarness,
  registerVerified,
} from "../helpers/integration.js";
describeDatabase("verified login", () => {
  const { app, mailer, prisma, trust } = integrationHarness();
  it("returns generic denial and refuses unverified identity", async () => {
    await supertest(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Ada",
        email: "ada@example.invalid",
        password: "correct-password",
      });
    await supertest(app)
      .post("/internal/v1/auth/login")
      .set(trust)
      .send({ email: "ada@example.invalid", password: "wrong-password" })
      .expect(401);
    await supertest(app)
      .post("/internal/v1/auth/login")
      .set(trust)
      .send({ email: "ada@example.invalid", password: "correct-password" })
      .expect(403);
  });
  it("persists distinct refresh rows and audits each verified sign-in", async () => {
    await registerVerified(app, mailer);
    await supertest(app)
      .post("/internal/v1/auth/login")
      .set(trust)
      .send({ email: "user@example.invalid", password: "correct-password" })
      .expect(200);
    await supertest(app)
      .post("/internal/v1/auth/login")
      .set(trust)
      .send({ email: "user@example.invalid", password: "correct-password" })
      .expect(200);
    await expect(prisma.refreshToken.count()).resolves.toBe(2);
    await expect(
      prisma.auditLog.count({ where: { action: "auth.login" } }),
    ).resolves.toBe(2);
  });
});
