import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  integrationHarness,
} from "../helpers/integration.js";
describeDatabase("registration persistence", () => {
  const { app, mailer, prisma } = integrationHarness();
  it("normalizes email and commits user, code, and audit together", async () => {
    await supertest(app)
      .post("/api/v1/auth/register")
      .send({
        name: " Ada ",
        email: " ADA@Example.invalid ",
        password: "correct-password",
      })
      .expect(201);
    await expect(
      prisma.user.count({ where: { email: "ada@example.invalid" } }),
    ).resolves.toBe(1);
    await expect(prisma.verificationCode.count()).resolves.toBe(1);
    await expect(
      prisma.auditLog.count({ where: { action: "auth.registration" } }),
    ).resolves.toBe(1);
    expect(mailer.messages).toHaveLength(1);
  });
  it("uses the unique key as final duplicate arbiter", async () => {
    const payload = {
      name: "Ada",
      email: "ada@example.invalid",
      password: "correct-password",
    };
    const statuses = await Promise.all([
      supertest(app).post("/api/v1/auth/register").send(payload),
      supertest(app).post("/api/v1/auth/register").send(payload),
    ]);
    expect(statuses.map((response) => response.status).sort()).toEqual([
      201, 409,
    ]);
  });
  it("retains the account and current code after post-commit mail failure", async () => {
    mailer.shouldFail = true;
    await supertest(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Ada",
        email: "ada@example.invalid",
        password: "correct-password",
      })
      .expect(503);
    await expect(prisma.user.count()).resolves.toBe(1);
    await expect(prisma.verificationCode.count()).resolves.toBe(1);
  });
});
