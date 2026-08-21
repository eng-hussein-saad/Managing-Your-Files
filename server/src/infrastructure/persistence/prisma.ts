import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/** Creates the canonical Prisma client through the PostgreSQL driver adapter. */
export function createPrismaClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
}

/** Closes the database client during orderly process shutdown. */
export async function disconnectPrisma(prisma: PrismaClient): Promise<void> {
  await prisma.$disconnect();
}
