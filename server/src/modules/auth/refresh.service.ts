import type { PrismaClient } from "@prisma/client";
import type { TrustedAuthResult } from "@gold-era/contracts/internal";
import type { Clock } from "../../infrastructure/runtime/clock.js";
import type { Identifiers } from "../../infrastructure/runtime/identifiers.js";
import type { AccessTokenService } from "../../infrastructure/security/access-tokens.js";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "../../infrastructure/security/refresh-tokens.js";
import { serializable } from "../../infrastructure/persistence/transactions.js";
import { AuditRepository } from "../audit/audit.repository.js";
import { toSafeUser } from "../users/user.mapper.js";
import { AppError } from "./auth.errors.js";

/** Rotates opaque refresh credentials atomically and rejects replay. */
export class RefreshService {
  /** Configures replay-safe refresh rotation and short-lived token issuance. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly clock: Clock,
    private readonly identifiers: Identifiers,
    private readonly accessTokens: AccessTokenService,
    private readonly accessTtl: number,
    private readonly refreshTtl: number,
    private readonly audit = new AuditRepository(),
  ) {}
  /** Conditionally revokes one active token and creates exactly one replacement. */
  async refresh(rawToken: string): Promise<TrustedAuthResult> {
    const now = this.clock.now();
    const tokenHash = hashRefreshToken(rawToken);
    const replacement = generateRefreshToken();
    const refreshExpiresAt = new Date(now.getTime() + this.refreshTtl * 1000);
    const user = await serializable(this.prisma, async (transaction) => {
      const persisted = await transaction.refreshToken.findFirst({
        where: { tokenHash },
        include: { user: true },
      });
      if (
        !persisted ||
        persisted.revokedAt ||
        persisted.expiresAt <= now ||
        !persisted.user.isEmailVerified
      )
        throw new AppError(
          401,
          "AUTH_REFRESH_INVALID",
          "The session can no longer be renewed.",
        );
      const revoked = await transaction.refreshToken.updateMany({
        where: { id: persisted.id, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now },
      });
      if (revoked.count !== 1)
        throw new AppError(
          401,
          "AUTH_REFRESH_INVALID",
          "The session can no longer be renewed.",
        );
      await transaction.refreshToken.create({
        data: {
          id: this.identifiers.uuid(),
          userId: persisted.userId,
          tokenHash: hashRefreshToken(replacement),
          expiresAt: refreshExpiresAt,
          createdAt: now,
        },
      });
      await this.audit.append(
        transaction,
        {
          actorId: persisted.userId,
          action: "auth.refresh",
          entityType: "REFRESH_TOKEN",
          entityId: persisted.id,
          metadata: { outcome: "SUCCESS" },
        },
        now,
      );
      return persisted.user;
    });
    const safeUser = toSafeUser(user);
    const accessToken = await this.accessTokens.issue({
      subject: user.id,
      role: safeUser.role,
    });
    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn: this.accessTtl,
      refreshToken: replacement,
      refreshExpiresAt: refreshExpiresAt.toISOString(),
      user: safeUser,
    };
  }
}
