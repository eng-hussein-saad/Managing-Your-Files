import type { PrismaClient } from "@prisma/client";
import type { VerifyEmailRequest, SafeUser } from "@gold-era/contracts/public";
import type { Clock } from "../../infrastructure/runtime/clock.js";
import type { PasswordHasher } from "../../infrastructure/security/password-hasher.js";
import { serializable } from "../../infrastructure/persistence/transactions.js";
import type { AuditService } from "../audit/audit.service.js";
import { authAudit } from "../audit/auth-audit.js";
import { toSafeUser } from "../users/user.mapper.js";
import { AppError } from "./auth.errors.js";

/** Atomically consumes current verification proof and verifies an identity. */
export class VerificationService {
  /** Coordinates single-use code validation and verified-user transition. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly clock: Clock,
    private readonly hasher: PasswordHasher,
    private readonly audit: AuditService,
  ) {}
  /** Consumes only the current eligible matching code in one serializable transition. */
  async verify(input: VerifyEmailRequest): Promise<SafeUser> {
    const now = this.clock.now();
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user || user.isEmailVerified)
      throw new AppError(
        409,
        "AUTH_VERIFICATION_INVALID",
        "The verification code is invalid or no longer current.",
      );
    const candidates = await this.prisma.verificationCode.findMany({
      where: {
        userId: user.id,
        usedAt: null,
        invalidatedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    const candidate = candidates[0];
    if (
      !candidate ||
      !(await this.hasher.verify(candidate.codeHash, input.code))
    )
      throw new AppError(
        409,
        "AUTH_VERIFICATION_INVALID",
        "The verification code is invalid or no longer current.",
      );
    const verified = await serializable(this.prisma, async (transaction) => {
      const consumed = await transaction.verificationCode.updateMany({
        where: {
          id: candidate.id,
          userId: user.id,
          usedAt: null,
          invalidatedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });
      if (consumed.count !== 1)
        throw new AppError(
          409,
          "AUTH_VERIFICATION_INVALID",
          "The verification code is invalid or no longer current.",
        );
      await transaction.verificationCode.updateMany({
        where: {
          userId: user.id,
          id: { not: candidate.id },
          usedAt: null,
          invalidatedAt: null,
        },
        data: { invalidatedAt: now },
      });
      const updated = await transaction.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true, updatedAt: now },
      });
      return updated;
    });
    await this.audit.bestEffort(
      authAudit("auth.verification", "SUCCESS", {
        actorId: user.id,
        entityType: "USER",
        entityId: user.id,
      }),
    );
    return toSafeUser(verified);
  }
}
