import type { PrismaClient } from "@prisma/client";
import type { Clock } from "../../infrastructure/runtime/clock.js";
import type { Logger } from "../../infrastructure/observability/logger.js";
import { AuditRepository } from "./audit.repository.js";
import type { AuditEvent } from "./audit.types.js";
import type { AdminAuditQuery } from "@gold-era/contracts/public";

/** Exposes the application's write-only audit capability. */
export class AuditService {
  /** Configures the write-only audit capability with no read or deletion surface. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly clock: Clock,
    private readonly log: Logger,
    private readonly repository = new AuditRepository(),
  ) {}
  /** Appends a standalone audit event and reports only sanitized failure context. */
  async write(event: AuditEvent): Promise<void> {
    await this.prisma.$transaction((transaction) =>
      this.repository.append(transaction, event, this.clock.now()),
    );
  }
  /** Preserves denial/logout behavior when telemetry storage alone is unavailable. */
  async bestEffort(event: AuditEvent): Promise<void> {
    try {
      await this.write(event);
    } catch {
      this.log.critical("Security audit persistence failed", {
        action: event.action,
        entityId: event.entityId,
      });
    }
  }
  /** Returns a sanitized retained audit page without creating a read audit. */
  async list(query: AdminAuditQuery) {
    const page = await this.repository.adminList(this.prisma, query);
    return {
      data: page.rows.map((row) => {
        const raw =
          row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
            ? row.metadata
            : {};
        const actorState = "actorState" in raw ? raw.actorState : undefined;
        const actor = row.actor
          ? { kind: "user" as const, ...row.actor }
          : actorState === "DELETED"
            ? { kind: "deleted" as const, label: "Deleted user" as const }
            : { kind: "system" as const, label: "System" as const };
        return {
          id: row.id,
          actor,
          action: row.action,
          entityType:
            row.entityType === "USER" ||
            row.entityType === "REFRESH_TOKEN" ||
            row.entityType === "FILE" ||
            row.entityType === "FOLDER"
              ? row.entityType
              : null,
          entityId: row.entityId,
          metadata: {
            ...(raw.outcome === "SUCCESS" || raw.outcome === "FAILURE" || raw.outcome === "DENIED"
              ? { outcome: raw.outcome }
              : {}),
            ...(typeof raw.reasonCode === "string" ? { reasonCode: raw.reasonCode } : {}),
            ...(typeof raw.requestId === "string" ? { requestId: raw.requestId } : {}),
          },
          createdAt: row.createdAt.toISOString(),
        };
      }),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems: page.totalItems,
        totalPages: Math.ceil(page.totalItems / query.pageSize),
      },
    };
  }
}
