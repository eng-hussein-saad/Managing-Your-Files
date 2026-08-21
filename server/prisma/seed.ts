import "dotenv/config";
import { parseServerEnv } from "../src/config/env.js";
import {
  createPrismaClient,
  disconnectPrisma,
} from "../src/infrastructure/persistence/prisma.js";
import { AdminBootstrapService } from "../src/modules/users/admin-bootstrap.service.js";
import { systemClock } from "../src/infrastructure/runtime/clock.js";
import { systemIdentifiers } from "../src/infrastructure/runtime/identifiers.js";
import { passwordHasher } from "../src/infrastructure/security/password-hasher.js";

/** Runs the repeatable administrator bootstrap without printing credentials. */
async function seed(): Promise<void> {
  const env = parseServerEnv(process.env);
  const prisma = createPrismaClient(env.DATABASE_URL);
  try {
    const service = new AdminBootstrapService(
      prisma,
      systemClock,
      systemIdentifiers,
      passwordHasher,
    );
    const result = await service.bootstrap({
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
      name: env.ADMIN_NAME,
    });
    console.info(
      result.created
        ? "Administrator initialized."
        : "Administrator already initialized.",
    );
  } finally {
    await disconnectPrisma(prisma);
  }
}
await seed();
