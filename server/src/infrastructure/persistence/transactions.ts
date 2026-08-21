import { Prisma, type PrismaClient } from "@prisma/client";

/** Retries a short serializable transaction when PostgreSQL reports a write conflict. */
export async function serializable<T>(
  prisma: PrismaClient,
  operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  attempts = 3,
): Promise<T> {
  let failure: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      failure = error;
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2034"
      )
        throw error;
    }
  }
  throw failure;
}
