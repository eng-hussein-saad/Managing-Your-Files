import type { Prisma, PrismaClient } from "@prisma/client";

/** Encapsulates hashed refresh-token persistence and lookup. */
export class RefreshTokenRepository {
  /** Finds a persisted token hash and owning user without retaining raw material. */
  findByHash(
    client: PrismaClient | Prisma.TransactionClient,
    tokenHash: string,
  ) {
    return client.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });
  }
  /** Persists one independently revocable device token. */
  create(
    transaction: Prisma.TransactionClient,
    input: {
      userId: string;
      tokenHash: string;
      expiresAt: Date;
      createdAt: Date;
    },
  ) {
    return transaction.refreshToken.create({ data: input });
  }
}
