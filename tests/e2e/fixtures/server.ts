import { createApp } from "../../../server/src/app.js";
import { parseServerEnv } from "../../../server/src/config/env.js";
import { PdfExtractor } from "../../../server/src/infrastructure/extraction/pdf-extractor.js";
import { createSmtpMailer } from "../../../server/src/infrastructure/mail/smtp-mailer.js";
import {
  createPrismaClient,
  disconnectPrisma,
} from "../../../server/src/infrastructure/persistence/prisma.js";
import { systemIdentifiers } from "../../../server/src/infrastructure/runtime/identifiers.js";
import { systemClock } from "../../../server/src/infrastructure/runtime/clock.js";
import { passwordHasher } from "../../../server/src/infrastructure/security/password-hasher.js";
import { AdminBootstrapService } from "../../../server/src/modules/users/admin-bootstrap.service.js";
import { FakeStorage } from "../../../server/tests/fakes/fake-storage.js";

/** Starts the E2E authority with local private storage and real external boundaries. */
async function start(): Promise<void> {
  const env = parseServerEnv(process.env);
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
    extractor: new PdfExtractor(),
  }).listen(env.PORT);

  /** Closes the E2E HTTP server and its database connections. */
  const shutdown = () => {
    server.close(() => {
      void disconnectPrisma(prisma);
    });
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

void start();
