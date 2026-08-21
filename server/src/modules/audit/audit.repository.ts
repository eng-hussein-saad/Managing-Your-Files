import type { Prisma } from "@prisma/client";
import type { AuditEvent } from "./audit.types.js";

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
}
