import type { PrismaClient } from "@prisma/client";
import type { Clock } from "../../infrastructure/runtime/clock.js";
import type { Identifiers } from "../../infrastructure/runtime/identifiers.js";
import type { PasswordHasher } from "../../infrastructure/security/password-hasher.js";
import type { MailPort } from "./ports/mail.port.js";
import { generateVerificationCode } from "../../infrastructure/security/code-hasher.js";
import { serializable } from "../../infrastructure/persistence/transactions.js";
import { AppError } from "./auth.errors.js";

/** Replaces unused verification codes under database-backed abuse limits. */
export class VerificationResendService {
  /** Wires resend abuse controls and post-commit delivery dependencies. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly clock: Clock,
    private readonly identifiers: Identifiers,
    private readonly hasher: PasswordHasher,
    private readonly mailer: MailPort,
  ) {}
  /** Issues a replacement code subject to per-minute and rolling-hour limits. */
  async resend(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.isEmailVerified)
      return {
        message: "If verification is available, a new message will be sent.",
      };
    const now = this.clock.now();
    const code = generateVerificationCode();
    const codeHash = await this.hasher.hash(code);
    await serializable(this.prisma, async (transaction) => {
      const recent = await transaction.verificationCode.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      const hourly = await transaction.verificationCode.count({
        where: {
          userId: user.id,
          createdAt: { gte: new Date(now.getTime() - 3_600_000) },
        },
      });
      if (
        (recent && now.getTime() - recent.createdAt.getTime() < 60_000) ||
        hourly >= 5
      )
        throw new AppError(
          429,
          "RATE_LIMITED",
          "Please wait before requesting another verification message.",
        );
      await transaction.verificationCode.updateMany({
        where: { userId: user.id, usedAt: null, invalidatedAt: null },
        data: { invalidatedAt: now },
      });
      await transaction.verificationCode.create({
        data: {
          id: this.identifiers.uuid(),
          userId: user.id,
          codeHash,
          expiresAt: new Date(now.getTime() + 600_000),
          createdAt: now,
        },
      });
    });
    try {
      await this.mailer.sendVerification({
        recipient: user.email,
        name: user.name,
        code,
        expiresAt: new Date(now.getTime() + 600_000),
      });
    } catch {
      throw new AppError(
        503,
        "AUTH_VERIFICATION_DELIVERY_PENDING",
        "Delivery is pending. Please try again later.",
      );
    }
    return {
      message: "If verification is available, a new message will be sent.",
    };
  }
}
