import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  integrationHarness,
} from "../helpers/integration.js";
describeDatabase("verification resend", () => {
  const { app, mailer, prisma } = integrationHarness();
  it("rate limits one-minute overlap", async () => {
    await supertest(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Ada",
        email: "ada@example.invalid",
        password: "correct-password",
      });
    await supertest(app)
      .post("/api/v1/auth/resend-verification")
      .send({ email: "ada@example.invalid" })
      .expect(429)
      .expect("Retry-After", "60");
  });
  it("invalidates prior unused proof when replacement is eligible", async () => {
    await supertest(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Ada",
        email: "ada@example.invalid",
        password: "correct-password",
      });
    const prior = await prisma.verificationCode.findFirstOrThrow();
    await prisma.verificationCode.update({
      where: { id: prior.id },
      data: { createdAt: new Date(Date.now() - 61_000) },
    });
    await supertest(app)
      .post("/api/v1/auth/resend-verification")
      .send({ email: "ada@example.invalid" })
      .expect(202);
    expect(
      (
        await prisma.verificationCode.findUniqueOrThrow({
          where: { id: prior.id },
        })
      ).invalidatedAt,
    ).not.toBeNull();
    expect(mailer.messages).toHaveLength(2);
  });
});
