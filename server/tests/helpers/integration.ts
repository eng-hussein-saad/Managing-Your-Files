import type { Express } from "express";
import supertest from "supertest";
import { afterAll, beforeEach, describe } from "vitest";
import { createApp } from "../../src/app.js";
import {
  createPrismaClient,
  disconnectPrisma,
} from "../../src/infrastructure/persistence/prisma.js";
import { parseServerEnv } from "../../src/config/env.js";
import { resetDatabase } from "./database.js";
import { FakeMailer } from "../fakes/fake-mailer.js";

const hasDatabase = Boolean(process.env.DATABASE_URL);
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";
export const describeDatabase = hasDatabase ? describe : describe.skip;
export const integrationEnv = parseServerEnv({
  PORT: "3001",
  DATABASE_URL: databaseUrl,
  JWT_ACCESS_SECRET: "j".repeat(32),
  ACCESS_TOKEN_TTL: "15m",
  REFRESH_TOKEN_TTL: "30d",
  BFF_SHARED_SECRET: "b".repeat(32),
  CORS_ALLOWED_ORIGINS: "http://localhost:3000",
  EMAIL_FROM: "noreply@example.invalid",
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  SMTP_SECURE: "false",
  SMTP_USER: "test",
  SMTP_PASSWORD: "test",
  ADMIN_EMAIL: "admin@example.invalid",
  ADMIN_PASSWORD: "administrator-pass",
  ADMIN_NAME: "Administrator",
});

/** Creates a migrated-database integration harness and resets it between cases. */
export function integrationHarness(): {
  app: Express;
  mailer: FakeMailer;
  prisma: ReturnType<typeof createPrismaClient>;
  trust: Record<string, string>;
} {
  const prisma = createPrismaClient(databaseUrl);
  const mailer = new FakeMailer();
  const app = createApp(integrationEnv, prisma, mailer);
  beforeEach(async () => {
    mailer.messages.length = 0;
    mailer.shouldFail = false;
    await resetDatabase(prisma);
  });
  afterAll(async () => disconnectPrisma(prisma));
  return {
    app,
    mailer,
    prisma,
    trust: { "x-gold-era-bff-trust": integrationEnv.BFF_SHARED_SECRET },
  };
}

/** Registers and verifies one user through the public HTTP contract. */
export async function registerVerified(
  app: Express,
  mailer: FakeMailer,
  email = "user@example.invalid",
  password = "correct-password",
): Promise<void> {
  await supertest(app)
    .post("/api/v1/auth/register")
    .send({ name: "Test User", email, password })
    .expect(201);
  const code = mailer.messages.at(-1)?.code;
  if (!code) throw new Error("Expected captured verification code");
  await supertest(app)
    .post("/api/v1/auth/verify-email")
    .send({ email, code })
    .expect(200);
}
