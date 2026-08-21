import type { PrismaClient } from "@prisma/client";
import type { Clock } from "../../infrastructure/runtime/clock.js";
import type { Logger } from "../../infrastructure/observability/logger.js";
import { hashRefreshToken } from "../../infrastructure/security/refresh-tokens.js";
import { AuditRepository } from "../audit/audit.repository.js";

/** Revokes the presented device credential with idempotent semantics. */
export class LogoutService {
  /** Configures idempotent presented-device revocation with logout-priority auditing. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly clock: Clock,
    private readonly log: Logger,
    private readonly audit = new AuditRepository(),
  ) {}
  /** Revokes a known active token while remaining safe for absent or repeated input. */
  async logout(rawToken?: string): Promise<{ loggedOut: true }> {
    if (!rawToken) return { loggedOut: true };
    const now = this.clock.now();
    const persisted = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: hashRefreshToken(rawToken) },
    });
    if (!persisted) return { loggedOut: true };
    await this.prisma.refreshToken.updateMany({
      where: { id: persisted.id, revokedAt: null },
      data: { revokedAt: now },
    });
    try {
      await this.prisma.$transaction((transaction) =>
        this.audit.append(
          transaction,
          {
            actorId: persisted.userId,
            action: "auth.logout",
            entityType: "REFRESH_TOKEN",
            entityId: persisted.id,
            metadata: { outcome: "SUCCESS" },
          },
          now,
        ),
      );
    } catch {
      this.log.critical("Logout audit persistence failed", {
        entityId: persisted.id,
      });
    }
    return { loggedOut: true };
  }
}
