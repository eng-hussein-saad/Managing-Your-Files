import { createApp } from "../server/src/app.js";
import { parseServerEnv } from "../server/src/config/env.js";
import { createSmtpMailer } from "../server/src/infrastructure/mail/smtp-mailer.js";
import {
  createPrismaClient,
  disconnectPrisma,
} from "../server/src/infrastructure/persistence/prisma.js";
import { systemClock } from "../server/src/infrastructure/runtime/clock.js";
import { systemIdentifiers } from "../server/src/infrastructure/runtime/identifiers.js";
import { passwordHasher } from "../server/src/infrastructure/security/password-hasher.js";
import { AdminBootstrapService } from "../server/src/modules/users/admin-bootstrap.service.js";
import { FakeExtractor } from "../server/tests/fakes/fake-extractor.js";
import { FakeStorage } from "../server/tests/fakes/fake-storage.js";

const databaseUrl = process.env.UI_TEST_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "UI_TEST_DATABASE_URL is required to start the isolated UI test server.",
  );
}

const env = parseServerEnv({
  PORT: "3001",
  DATABASE_URL: databaseUrl,
  JWT_ACCESS_SECRET: "ui-test-access-secret-with-at-least-32-characters",
  ACCESS_TOKEN_TTL: "15m",
  REFRESH_TOKEN_TTL: "30d",
  BFF_SHARED_SECRET: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  CORS_ALLOWED_ORIGINS: "http://localhost:3000,http://127.0.0.1:3000",
  EMAIL_FROM: "Fileora <noreply@example.invalid>",
  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: "11025",
  SMTP_SECURE: "false",
  SMTP_USER: "unused",
  SMTP_PASSWORD: "unused",
  ADMIN_EMAIL: "admin-baseline@example.invalid",
  ADMIN_PASSWORD: "BaselinePassword123!",
  ADMIN_NAME: "Baseline Administrator",
  SUPABASE_URL: "https://example.invalid",
  SUPABASE_SECRET_KEY: "sb_secret_placeholder",
  SUPABASE_STORAGE_BUCKET: "gold-era-private-files",
  UPLOAD_MAX_FILE_SIZE_BYTES: "5242880",
  USER_STORAGE_QUOTA_BYTES: "104857600",
  UPLOAD_ALLOWED_MIME_TYPES:
    "application/pdf,text/plain,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  UPLOAD_MAX_FILES_PER_BATCH: "10",
  FILE_EXTRACTION_MAX_BYTES: "5242880",
});

/** Boots the isolated UI authority with fake storage and local SMTP. */
async function start() {
  const prisma = createPrismaClient(env.DATABASE_URL);
  const bootstrap = new AdminBootstrapService(
    prisma,
    systemClock,
    systemIdentifiers,
    passwordHasher,
  );
  await bootstrap.bootstrap({
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    name: env.ADMIN_NAME,
  });
  const mailer = createSmtpMailer({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    from: env.EMAIL_FROM,
  });
  const server = createApp(env, prisma, mailer, {
    storage: new FakeStorage(),
    extractor: new FakeExtractor(),
  }).listen(env.PORT);

  /** Closes the isolated verification server and its database pool. */
  const shutdown = () =>
    server.close(() => {
      void disconnectPrisma(prisma);
    });
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

void start();
