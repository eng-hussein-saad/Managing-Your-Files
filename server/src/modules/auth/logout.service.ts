import type { PrismaClient } from "@prisma/client";
import type { Clock } from "../../infrastructure/runtime/clock.js";
import { hashRefreshToken } from "../../infrastructure/security/refresh-tokens.js";

/** Revokes the presented device credential with idempotent semantics. */
export class LogoutService {
  /** Configures idempotent presented-device revocation. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly clock: Clock,
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
    return { loggedOut: true };
  }
}
