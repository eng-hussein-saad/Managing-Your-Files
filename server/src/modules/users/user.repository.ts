import type { Prisma, PrismaClient } from "@prisma/client";

/** Encapsulates normalized identity lookups for authentication services. */
export class UserRepository {
  /** Finds one account by its already-normalized unique email. */
  findByEmail(client: PrismaClient | Prisma.TransactionClient, email: string) {
    return client.user.findUnique({ where: { email } });
  }
  /** Finds one account by primary identity. */
  findById(client: PrismaClient | Prisma.TransactionClient, id: string) {
    return client.user.findUnique({ where: { id } });
  }
}
