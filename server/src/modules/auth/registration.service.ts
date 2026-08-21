import type { Prisma, PrismaClient } from "@prisma/client";
import type { RegisterRequest } from "@gold-era/contracts/public";
import type { Clock } from "../../infrastructure/runtime/clock.js";
import type { Identifiers } from "../../infrastructure/runtime/identifiers.js";
import type { PasswordHasher } from "../../infrastructure/security/password-hasher.js";
import type { MailPort } from "./ports/mail.port.js";
import { generateVerificationCode } from "../../infrastructure/security/code-hasher.js";
import { serializable } from "../../infrastructure/persistence/transactions.js";
import { AuditRepository } from "../audit/audit.repository.js";
import { AppError } from "./auth.errors.js";

/** Creates normalized unverified accounts and initiates verification. */
export class RegistrationService {
  /** Wires registration rules to persistence, hashing, time, and delivery ports. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly clock: Clock,
    private readonly identifiers: Identifiers,
    private readonly hasher: PasswordHasher,
    private readonly mailer: MailPort,
    private readonly audit = new AuditRepository(),
  ) {}
  /** Creates one unverified identity and current code atomically before mail delivery. */
  async register(
    input: RegisterRequest,
  ): Promise<{ email: string; verificationRequired: true }> {
    const now = this.clock.now();
    const code = generateVerificationCode();
    const [passwordHash, codeHash] = await Promise.all([
      this.hasher.hash(input.password),
      this.hasher.hash(code),
    ]);
    let user: { id: string; name: string; email: string };
    try {
      user = await serializable(this.prisma, async (transaction) => {
        const created = await transaction.user.create({
          data: {
            id: this.identifiers.uuid(),
            name: input.name,
            email: input.email,
            passwordHash,
            role: "USER",
            isEmailVerified: false,
            createdAt: now,
            updatedAt: now,
          },
        });
        await transaction.verificationCode.create({
          data: {
            id: this.identifiers.uuid(),
            userId: created.id,
            codeHash,
            expiresAt: new Date(now.getTime() + 600_000),
            createdAt: now,
          },
        });
        await this.audit.append(
          transaction,
          {
            actorId: created.id,
            action: "auth.registration",
            entityType: "USER",
            entityId: created.id,
            metadata: { outcome: "SUCCESS" },
          },
          now,
        );
        return created;
      });
    } catch (error) {
      if ((error as Prisma.PrismaClientKnownRequestError).code === "P2002")
        throw new AppError(
          409,
          "AUTH_REGISTRATION_UNAVAILABLE",
          "Registration could not be completed.",
        );
      throw error;
    }
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
        "Your account was created, but delivery is pending. Request a new code.",
      );
    }
    return { email: user.email, verificationRequired: true };
  }
}
