import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  integrationHarness,
  registerVerified,
} from "../helpers/integration.js";
describeDatabase("refresh rotation race", () => {
  const { app, mailer, trust } = integrationHarness();
  it("allows one winner for concurrent presentation of the same token", async () => {
    await registerVerified(app, mailer);
    const login = await supertest(app)
      .post("/internal/v1/auth/login")
      .set(trust)
      .send({ email: "user@example.invalid", password: "correct-password" });
    const raw = login.body.data.refreshToken as string;
    const responses = await Promise.all(
      Array.from({ length: 20 }, () =>
        supertest(app)
          .post("/internal/v1/auth/refresh")
          .set(trust)
          .send({ refreshToken: raw }),
      ),
    );
    expect(
      responses.filter((response) => response.status === 200),
    ).toHaveLength(1);
    expect(
      responses.filter((response) => response.status === 401),
    ).toHaveLength(19);
  });
});
