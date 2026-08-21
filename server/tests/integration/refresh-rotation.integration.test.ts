import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  integrationHarness,
  registerVerified,
} from "../helpers/integration.js";
describeDatabase("refresh rotation", () => {
  const { app, mailer, prisma, trust } = integrationHarness();
  it("rotates active credentials and rejects replay without partial replacement", async () => {
    await registerVerified(app, mailer);
    const login = await supertest(app)
      .post("/internal/v1/auth/login")
      .set(trust)
      .send({ email: "user@example.invalid", password: "correct-password" });
    const raw = login.body.data.refreshToken as string;
    const rotated = await supertest(app)
      .post("/internal/v1/auth/refresh")
      .set(trust)
      .send({ refreshToken: raw })
      .expect(200);
    expect(rotated.body.data.refreshToken).not.toBe(raw);
    await supertest(app)
      .post("/internal/v1/auth/refresh")
      .set(trust)
      .send({ refreshToken: raw })
      .expect(401);
    await expect(prisma.refreshToken.count()).resolves.toBe(2);
    await expect(
      prisma.refreshToken.count({ where: { revokedAt: null } }),
    ).resolves.toBe(1);
  });
});
