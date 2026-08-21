import type { Prisma, PrismaClient } from "@prisma/client";
import type { Clock } from "../../infrastructure/runtime/clock.js";
import type { Identifiers } from "../../infrastructure/runtime/identifiers.js";
import type { PasswordHasher } from "../../infrastructure/security/password-hasher.js";
import { serializable } from "../../infrastructure/persistence/transactions.js";
import { AuditRepository } from "../audit/audit.repository.js";

/** Initializes exactly one configured administrator without implicit promotion. */
export class AdminBootstrapService {
  /** Configures idempotent administrator initialization without automatic promotion. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly clock: Clock,
    private readonly identifiers: Identifiers,
    private readonly hasher: PasswordHasher,
    private readonly audit = new AuditRepository(),
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
      return await serializable(this.prisma, async (transaction) => {
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
        await this.audit.append(
          transaction,
          {
            actorId: user.id,
            action: "admin.bootstrap",
            entityType: "USER",
            entityId: user.id,
            metadata: { outcome: "SUCCESS" },
          },
          now,
        );
        return { created: true };
      });
    } catch (error) {
      if ((error as Prisma.PrismaClientKnownRequestError).code === "P2002")
        return this.bootstrap(input);
      throw error;
    }
  }
}
