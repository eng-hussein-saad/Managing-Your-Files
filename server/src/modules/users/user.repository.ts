import type { Prisma, PrismaClient } from "@prisma/client";
import type { AdminUserQuery } from "@gold-era/contracts/public";
import { lockAdministratorLifecycle, lockUserRow } from "../../infrastructure/persistence/transactions.js";

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
  /** Loads the minimum live authority state needed at the request boundary. */
  findVerifiedAuthority(
    client: PrismaClient | Prisma.TransactionClient,
    id: string,
  ) {
    return client.user.findFirst({
      where: { id, isEmailVerified: true },
      select: { id: true, role: true },
    });
  }
  /** Returns a deterministic filtered administrator user page. */
  async adminList(client: PrismaClient, query: AdminUserQuery) {
    const where: Prisma.UserWhereInput = {
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(query.role ? { role: query.role } : {}),
      ...(query.verified === undefined
        ? {}
        : { isEmailVerified: query.verified }),
    };
    const sortField = query.sort === "createdAt" ? "createdAt" : query.sort;
    const orderBy = [
      { [sortField]: query.direction },
      { id: query.direction },
    ] as Prisma.UserOrderByWithRelationInput[];
    const [rows, totalItems] = await Promise.all([
      client.user.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      client.user.count({ where }),
    ]);
    return { rows, totalItems };
  }
  /** Loads one administrator-safe user detail projection source. */
  adminDetail(client: PrismaClient | Prisma.TransactionClient, userId: string) {
    return client.user.findUnique({ where: { id: userId } });
  }
  /** Locks administrator invariants and returns the current target row. */
  async lockedAdminTarget(client: Prisma.TransactionClient, userId: string) {
    await lockAdministratorLifecycle(client);
    if (!(await lockUserRow(client, userId))) return null;
    return this.adminDetail(client, userId);
  }
  /** Counts current administrators inside the protected transaction. */
  countAdministrators(client: Prisma.TransactionClient) {
    return client.user.count({ where: { role: "ADMIN" } });
  }
  /** Changes a target role and advances its optimistic-concurrency version. */
  updateRole(
    client: Prisma.TransactionClient,
    userId: string,
    role: "USER" | "ADMIN",
    updatedAt: Date,
  ) {
    return client.user.update({ where: { id: userId }, data: { role, updatedAt } });
  }
  /** Invalidates every refresh session after a role authority change. */
  removeRefreshSessions(client: Prisma.TransactionClient, userId: string) {
    return client.refreshToken.deleteMany({ where: { userId } });
  }
}
