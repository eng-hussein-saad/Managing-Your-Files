import type { PrismaClient } from "@prisma/client";
import type { Clock } from "../../infrastructure/runtime/clock.js";
import type { Logger } from "../../infrastructure/observability/logger.js";
import { AuditRepository } from "./audit.repository.js";
import type { AuditEvent } from "./audit.types.js";

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
}
