import type { Prisma, PrismaClient } from "@prisma/client";
import type { AdminAuditQuery } from "@gold-era/contracts/public";
import type { AuditEvent } from "./audit.types.js";
import { auditActions } from "./audit.types.js";

/** Owns append-only persistence for allowlisted audit events. */
export class AuditRepository {
  /** Appends a sanitized audit event through an existing transaction. */
  async append(
    transaction: Prisma.TransactionClient,
    event: AuditEvent,
    now: Date,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        actorId: event.actorId,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        metadata: event.metadata,
        createdAt: now,
      },
    });
  }
  /** Returns a deterministic retained administrator audit page. */
  async adminList(prisma: PrismaClient, query: AdminAuditQuery) {
    const actorState: Prisma.AuditLogWhereInput =
      query.actorState === "user"
        ? { actorId: { not: null } }
        : query.actorState === "deleted"
          ? { actorId: null, metadata: { path: ["actorState"], equals: "DELETED" } }
          : query.actorState === "system"
            ? { actorId: null, NOT: { metadata: { path: ["actorState"], equals: "DELETED" } } }
            : {};
    const where: Prisma.AuditLogWhereInput = {
      action: { in: [...auditActions] },
      ...actorState,
      ...(query.search
        ? {
            OR: [
              { action: { contains: query.search, mode: "insensitive" } },
              { entityId: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(query.action
        ? { action: { equals: query.action, in: [...auditActions] } }
        : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.outcome
        ? { metadata: { path: ["outcome"], equals: query.outcome } }
        : {}),
      ...(query.createdFrom || query.createdBefore
        ? {
            createdAt: {
              ...(query.createdFrom ? { gte: new Date(query.createdFrom) } : {}),
              ...(query.createdBefore ? { lt: new Date(query.createdBefore) } : {}),
            },
          }
        : {}),
    };
    const [rows, totalItems] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, name: true, email: true } } },
        orderBy: [{ createdAt: query.direction }, { id: query.direction }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { rows, totalItems };
  }
}
