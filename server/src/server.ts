import "dotenv/config";
import { parseServerEnv } from "./config/env.js";
import {
  createPrismaClient,
  disconnectPrisma,
} from "./infrastructure/persistence/prisma.js";
import { createSmtpMailer } from "./infrastructure/mail/smtp-mailer.js";
import { AdminBootstrapService } from "./modules/users/admin-bootstrap.service.js";
import { systemClock } from "./infrastructure/runtime/clock.js";
import { systemIdentifiers } from "./infrastructure/runtime/identifiers.js";
import { passwordHasher } from "./infrastructure/security/password-hasher.js";
import { createApp } from "./app.js";
import { SupabaseStorage } from "./infrastructure/storage/supabase-storage.js";
import { assertStorageReady } from "./infrastructure/storage/storage-readiness.js";
import { PdfExtractor } from "./infrastructure/extraction/pdf-extractor.js";

/** Validates configuration, initializes the administrator, and starts HTTP traffic. */
async function start(): Promise<void> {
  const env = parseServerEnv(process.env);
  const prisma = createPrismaClient(env.DATABASE_URL);
  const storage = new SupabaseStorage(
    env.SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    env.SUPABASE_STORAGE_BUCKET,
  );
  await assertStorageReady(storage);
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
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    from: env.EMAIL_FROM,
  });
  const server = createApp(env, prisma, mailer, {
    storage,
    extractor: new PdfExtractor(),
  }).listen(env.PORT);
  /** Closes network and database resources on a termination signal. */
  const shutdown = () =>
    server.close(() => {
      void disconnectPrisma(prisma);
    });
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

await start();
