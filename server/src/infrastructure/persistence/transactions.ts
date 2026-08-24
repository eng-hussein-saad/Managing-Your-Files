import { Prisma, type PrismaClient } from "@prisma/client";

export type TransactionDatabase = PrismaClient | Prisma.TransactionClient;

/** Reports whether a database failure represents a retryable write conflict. */
export function isTransactionConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

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
      if (!isTransactionConflict(error)) throw error;
    }
  }
  throw failure;
}

/** Runs an administrator command once at serializable isolation without retry. */
export function serializableOnce<T>(
  prisma: PrismaClient,
  operation: (transaction: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return serializable(prisma, operation, 1);
}

/** Serializes administrator invariants across otherwise unrelated target rows. */
export async function lockAdministratorLifecycle(
  database: TransactionDatabase,
): Promise<void> {
  await database.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('fileora:administrator-lifecycle'))::text AS lock`;
}

/** Locks one current user row and returns whether it still exists. */
export async function lockUserRow(
  database: TransactionDatabase,
  userId: string,
): Promise<boolean> {
  const rows = await database.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "USER" WHERE id = ${userId}::uuid FOR UPDATE
  `;
  return rows.length === 1;
}

/** Locks one current file row and returns whether it still exists. */
export async function lockFileRow(
  database: TransactionDatabase,
  fileId: string,
): Promise<boolean> {
  const rows = await database.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "FILE" WHERE id = ${fileId}::uuid FOR UPDATE
  `;
  return rows.length === 1;
}
