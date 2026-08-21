import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  integrationHarness,
} from "../helpers/integration.js";
describeDatabase("verification lifecycle", () => {
  const { app, mailer, prisma } = integrationHarness();
  it("consumes the current code once and verifies atomically", async () => {
    await supertest(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Ada",
        email: "ada@example.invalid",
        password: "correct-password",
      });
    const code = mailer.messages[0]?.code;
    await supertest(app)
      .post("/api/v1/auth/verify-email")
      .send({ email: "ada@example.invalid", code })
      .expect(200);
    await supertest(app)
      .post("/api/v1/auth/verify-email")
      .send({ email: "ada@example.invalid", code })
      .expect(409);
    expect(
      (
        await prisma.user.findUniqueOrThrow({
          where: { email: "ada@example.invalid" },
        })
      ).isEmailVerified,
    ).toBe(true);
    expect(
      (await prisma.verificationCode.findFirstOrThrow()).usedAt,
    ).not.toBeNull();
  });
  it("rejects exact expiry using authoritative time", async () => {
    await supertest(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Ada",
        email: "ada@example.invalid",
        password: "correct-password",
      });
    const row = await prisma.verificationCode.findFirstOrThrow();
    await prisma.verificationCode.update({
      where: { id: row.id },
      data: { expiresAt: new Date(0) },
    });
    await supertest(app)
      .post("/api/v1/auth/verify-email")
      .send({ email: "ada@example.invalid", code: mailer.messages[0]?.code })
      .expect(409);
  });
});
