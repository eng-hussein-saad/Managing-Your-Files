import supertest from "supertest";
import { expect, it } from "vitest";
import {
  describeDatabase,
  integrationHarness,
  registerVerified,
} from "../helpers/integration.js";
describeDatabase("access and own profile", () => {
  const { app, mailer, trust } = integrationHarness();
  it("denies absent/malformed access and returns only the token subject profile", async () => {
    await registerVerified(app, mailer);
    const login = await supertest(app)
      .post("/internal/v1/auth/login")
      .set(trust)
      .send({ email: "user@example.invalid", password: "correct-password" })
      .expect(200);
    await supertest(app).get("/api/v1/users/me").expect(401);
    await supertest(app)
      .get("/api/v1/users/me")
      .set("authorization", "Bearer malformed")
      .expect(401);
    const profile = await supertest(app)
      .get("/api/v1/users/me")
      .set("authorization", `Bearer ${login.body.data.accessToken as string}`)
      .expect(200);
    expect(profile.body.data.email).toBe("user@example.invalid");
    expect(profile.body.data).not.toHaveProperty("passwordHash");
  });
});
