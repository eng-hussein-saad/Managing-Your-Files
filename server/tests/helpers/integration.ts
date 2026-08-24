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
import { FakeStorage } from "../fakes/fake-storage.js";
import { FakeExtractor } from "../fakes/fake-extractor.js";

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
  UPLOAD_MAX_FILE_SIZE_BYTES: "5242880",
  USER_STORAGE_QUOTA_BYTES: "104857600",
  UPLOAD_ALLOWED_MIME_TYPES:
    "application/pdf,text/plain,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  UPLOAD_MAX_FILES_PER_BATCH: "10",
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_test-key",
  SUPABASE_STORAGE_BUCKET: "gold-era-private-files",
  FILE_EXTRACTION_MAX_BYTES: "5242880",
});

export const primaryUserId = "11111111-1111-4111-8111-111111111111";
export const secondaryUserId = "22222222-2222-4222-8222-222222222222";
export const administratorUserId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

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

/** Creates a deterministic file-management app with fake private storage and an owned user. */
export function fileManagementHarness(): {
  app: Express;
  prisma: ReturnType<typeof createPrismaClient>;
  storage: FakeStorage;
  extractor: FakeExtractor;
} {
  const prisma = createPrismaClient(databaseUrl);
  const mailer = new FakeMailer();
  const storage = new FakeStorage();
  const extractor = new FakeExtractor();
  const app = createApp(integrationEnv, prisma, mailer, {
    storage,
    extractor,
    authenticatedUserId: primaryUserId,
  });
  beforeEach(async () => {
    await resetDatabase(prisma);
    storage.objects.clear();
    storage.calls.length = 0;
    storage.failNext = undefined;
    storage.delayMs = 0;
    storage.afterRemove = undefined;
    extractor.result = null;
    extractor.failure = undefined;
    await prisma.user.createMany({
      data: [
        {
          id: primaryUserId,
          name: "Primary User",
          email: "primary@example.invalid",
          passwordHash: "test",
          role: "USER",
          isEmailVerified: true,
          createdAt: new Date("2026-08-01T00:00:00Z"),
          updatedAt: new Date("2026-08-01T00:00:00Z"),
        },
        {
          id: secondaryUserId,
          name: "Secondary User",
          email: "secondary@example.invalid",
          passwordHash: "test",
          role: "USER",
          isEmailVerified: true,
          createdAt: new Date("2026-08-01T00:00:00Z"),
          updatedAt: new Date("2026-08-01T00:00:00Z"),
        },
      ],
    });
  });
  afterAll(async () => disconnectPrisma(prisma));
  return { app, prisma, storage, extractor };
}

/** Creates a deterministic administrator app with fake private storage. */
export function administratorHarness(): {
  app: Express;
  prisma: ReturnType<typeof createPrismaClient>;
  storage: FakeStorage;
} {
  const prisma = createPrismaClient(databaseUrl);
  const storage = new FakeStorage();
  const app = createApp(integrationEnv, prisma, new FakeMailer(), {
    storage,
    extractor: new FakeExtractor(),
    authenticatedUserId: administratorUserId,
    authenticatedRole: "ADMIN",
  });
  beforeEach(async () => {
    await resetDatabase(prisma);
    storage.objects.clear();
    storage.calls.length = 0;
    storage.failNext = undefined;
    await prisma.user.createMany({
      data: [
        {
          id: administratorUserId,
          name: "Administrator",
          email: "administrator@example.invalid",
          passwordHash: "test",
          role: "ADMIN",
          isEmailVerified: true,
          createdAt: new Date("2026-08-01T00:00:00Z"),
          updatedAt: new Date("2026-08-01T00:00:00Z"),
        },
        {
          id: primaryUserId,
          name: "Primary User",
          email: "primary@example.invalid",
          passwordHash: "test",
          role: "USER",
          isEmailVerified: true,
          createdAt: new Date("2026-08-02T00:00:00Z"),
          updatedAt: new Date("2026-08-02T00:00:00Z"),
        },
      ],
    });
  });
  afterAll(async () => disconnectPrisma(prisma));
  return { app, prisma, storage };
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
