import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  integrationHarness,
  registerVerified,
} from "../helpers/integration.js";
describeDatabase("authentication audit exclusion", () => {
  const { app, mailer, prisma, trust } = integrationHarness();
  it("does not audit ordinary authentication lifecycle operations", async () => {
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
    expect(rows).toHaveLength(0);
    expect(JSON.stringify(rows)).not.toContain("correct-password");
  });
});
