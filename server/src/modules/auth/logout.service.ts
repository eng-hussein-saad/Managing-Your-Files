import type { PrismaClient } from "@prisma/client";
import type { Clock } from "../../infrastructure/runtime/clock.js";
import { hashRefreshToken } from "../../infrastructure/security/refresh-tokens.js";
import type { AuditService } from "../audit/audit.service.js";
import { authAudit } from "../audit/auth-audit.js";

/** Revokes the presented device credential with idempotent semantics. */
export class LogoutService {
  /** Configures idempotent presented-device revocation with logout-priority auditing. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly clock: Clock,
    private readonly audit: AuditService,
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
    await this.audit.bestEffort(
      authAudit("auth.logout", "SUCCESS", {
        actorId: persisted.userId,
        entityType: "REFRESH_TOKEN",
        entityId: persisted.id,
      }),
    );
    return { loggedOut: true };
  }
}
