import type { Prisma, PrismaClient } from "@prisma/client";
import type { Clock } from "../../infrastructure/runtime/clock.js";
import type { Identifiers } from "../../infrastructure/runtime/identifiers.js";
import type { PasswordHasher } from "../../infrastructure/security/password-hasher.js";
import { serializable } from "../../infrastructure/persistence/transactions.js";
import { AuditService } from "../audit/audit.service.js";
import { logger } from "../../infrastructure/observability/logger.js";

/** Initializes exactly one configured administrator without implicit promotion. */
export class AdminBootstrapService {
  /** Configures idempotent administrator initialization without automatic promotion. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly clock: Clock,
    private readonly identifiers: Identifiers,
    private readonly hasher: PasswordHasher,
    private readonly audit = new AuditService(prisma, clock, logger),
  ) {}
  /** Creates the configured verified administrator or safely preserves an existing admin. */
  async bootstrap(input: {
    email: string;
    password: string;
    name: string;
  }): Promise<{ created: boolean }> {
    const passwordHash = await this.hasher.hash(input.password);
    const now = this.clock.now();
    try {
      const result = await serializable(this.prisma, async (transaction) => {
        const existing = await transaction.user.findUnique({
          where: { email: input.email },
        });
        if (existing) {
          if (existing.role !== "ADMIN")
            throw new Error("ADMIN_EMAIL_CONFLICT");
          return { created: false };
        }
        const user = await transaction.user.create({
          data: {
            id: this.identifiers.uuid(),
            name: input.name,
            email: input.email,
            passwordHash,
            role: "ADMIN",
            isEmailVerified: true,
            createdAt: now,
            updatedAt: now,
          },
        });
        return { created: true, userId: user.id };
      });
      if (result.created)
        await this.audit.bestEffort({
          actorId: result.userId,
          action: "admin.bootstrap",
          entityType: "USER",
          entityId: result.userId,
          metadata: { outcome: "SUCCESS" },
        });
      return { created: result.created };
    } catch (error) {
      if ((error as Prisma.PrismaClientKnownRequestError).code === "P2002")
        return this.bootstrap(input);
      throw error;
    }
  }
}
