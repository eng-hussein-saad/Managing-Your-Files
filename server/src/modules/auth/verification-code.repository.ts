import type { Prisma } from "@prisma/client";

/** Encapsulates current-code eligibility and resend-window persistence. */
export class VerificationCodeRepository {
  /** Returns current candidate codes newest-first for constant-work verification. */
  findEligible(
    transaction: Prisma.TransactionClient,
    userId: string,
    now: Date,
  ) {
    return transaction.verificationCode.findMany({
      where: {
        userId,
        usedAt: null,
        invalidatedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });
  }
  /** Invalidates every unused code that a replacement supersedes. */
  invalidateUnused(
    transaction: Prisma.TransactionClient,
    userId: string,
    now: Date,
  ) {
    return transaction.verificationCode.updateMany({
      where: { userId, usedAt: null, invalidatedAt: null },
      data: { invalidatedAt: now },
    });
  }
  /** Counts issued codes inside the rolling abuse-prevention window. */
  countSince(
    transaction: Prisma.TransactionClient,
    userId: string,
    since: Date,
  ) {
    return transaction.verificationCode.count({
      where: { userId, createdAt: { gte: since } },
    });
  }
}
