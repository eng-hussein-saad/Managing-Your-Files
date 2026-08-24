import type { PrismaClient } from "@prisma/client";
import type { SafeUser } from "@gold-era/contracts/public";
import type { TrustedAuthResult } from "@gold-era/contracts/internal";
import type { Clock } from "../../infrastructure/runtime/clock.js";
import type { Identifiers } from "../../infrastructure/runtime/identifiers.js";
import type { PasswordHasher } from "../../infrastructure/security/password-hasher.js";
import type { AccessTokenService } from "../../infrastructure/security/access-tokens.js";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "../../infrastructure/security/refresh-tokens.js";
import type { AuditService } from "../audit/audit.service.js";
import { authAudit } from "../audit/auth-audit.js";
import { toSafeUser } from "../users/user.mapper.js";
import { AppError } from "./auth.errors.js";

/** Authenticates verified users and persists per-device refresh credentials. */
export class LoginService {
  /** Configures verified credential authentication and credential persistence. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly clock: Clock,
    private readonly identifiers: Identifiers,
    private readonly hasher: PasswordHasher,
    private readonly accessTokens: AccessTokenService,
    private readonly accessTtl: number,
    private readonly refreshTtl: number,
    private readonly audit: AuditService,
  ) {}
  /** Validates credentials generically and issues a distinct per-device credential pair. */
  async login(email: string, password: string): Promise<TrustedAuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await this.hasher.verify(user.passwordHash, password)))
      throw new AppError(
        401,
        "AUTH_INVALID_CREDENTIALS",
        "Email or password is invalid.",
      );
    if (!user.isEmailVerified)
      throw new AppError(
        403,
        "AUTH_VERIFICATION_REQUIRED",
        "Verify your email before signing in.",
      );
    const now = this.clock.now();
    const refreshToken = generateRefreshToken();
    const refreshExpiresAt = new Date(now.getTime() + this.refreshTtl * 1000);
    await this.prisma.$transaction(async (transaction) => {
      await transaction.refreshToken.create({
        data: {
          id: this.identifiers.uuid(),
          userId: user.id,
          tokenHash: hashRefreshToken(refreshToken),
          expiresAt: refreshExpiresAt,
          createdAt: now,
        },
      });
    });
    await this.audit.bestEffort(
      authAudit("auth.login", "SUCCESS", {
        actorId: user.id,
        entityType: "USER",
        entityId: user.id,
      }),
    );
    const safeUser: SafeUser = toSafeUser(user);
    const accessToken = await this.accessTokens.issue({
      subject: user.id,
      role: safeUser.role,
    });
    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn: this.accessTtl,
      refreshToken,
      refreshExpiresAt: refreshExpiresAt.toISOString(),
      user: safeUser,
    };
  }
}
