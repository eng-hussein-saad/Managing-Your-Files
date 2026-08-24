import type { PrismaClient } from "@prisma/client";
import type { AdminUserDelete } from "@gold-era/contracts/public";
import type { StoragePort } from "../files/ports/storage.port.js";
import { StorageError } from "../files/ports/storage.port.js";
import { FileRepository } from "../files/repositories/file.repository.js";
import type { AuditService } from "../audit/audit.service.js";
import { adminAudit } from "../audit/admin-audit.js";
import { AppError } from "../auth/auth.errors.js";
import { isTransactionConflict, serializableOnce } from "../../infrastructure/persistence/transactions.js";
import { UserRepository } from "./user.repository.js";

/** Permanently cleans a user and all owned state with retry-safe object removal. */
export class AdminUserDeletionService {
  /** Configures permanent cleanup across database, storage, and audit boundaries. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly storage: StoragePort,
    private readonly audit: AuditService,
    private readonly users = new UserRepository(),
    private readonly files = new FileRepository(),
  ) {}
  /** Permanently deletes a confirmed non-self target after all objects are absent. */
  async delete(
    actorId: string,
    targetId: string,
    input: AdminUserDelete,
    requestId?: string,
  ): Promise<void> {
    if (actorId === targetId)
      throw new AppError(403, "AUTH_FORBIDDEN", "Administrators cannot delete their own account.");
    try {
      await serializableOnce(this.prisma, async (transaction) => {
      const target = await this.users.lockedAdminTarget(transaction, targetId);
      if (!target)
        throw new AppError(404, "RESOURCE_NOT_FOUND", "The user was not found.");
      await this.files.lockOwnerLifecycle(transaction, targetId);
      if (target.updatedAt.toISOString() !== input.expectedUpdatedAt)
        throw new AppError(409, "RESOURCE_CONFLICT", "The user changed. Reload and confirm again.");
      if (target.email !== input.confirmationEmail)
        throw new AppError(400, "VALIDATION_FAILED", "The confirmation email does not match.");
      if (target.role === "ADMIN") {
        const administrators = await this.users.countAdministrators(transaction);
        if (administrators <= 1)
          throw new AppError(403, "AUTH_FORBIDDEN", "The last administrator cannot be deleted.");
      }
      const ownedFiles = await transaction.file.findMany({
        where: { ownerId: targetId },
        select: { storageKey: true },
      });
      for (const file of ownedFiles) {
        try {
          await this.storage.remove(file.storageKey);
        } catch (error) {
          if (!(error instanceof StorageError && error.kind === "not-found"))
            throw new AppError(503, "SERVICE_UNAVAILABLE", "User cleanup can be retried.");
        }
      }
      const actorEvents = await transaction.auditLog.findMany({
        where: { actorId: targetId },
        select: { id: true, metadata: true },
      });
      for (const event of actorEvents) {
        const current =
          event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata)
            ? event.metadata
            : {};
        await transaction.auditLog.update({
          where: { id: event.id },
          data: { actorId: null, metadata: { ...current, actorState: "DELETED" } },
        });
      }
      await transaction.refreshToken.deleteMany({ where: { userId: targetId } });
      await transaction.verificationCode.deleteMany({ where: { userId: targetId } });
      await transaction.file.deleteMany({ where: { ownerId: targetId } });
      await transaction.folder.deleteMany({ where: { ownerId: targetId } });
      await transaction.user.delete({ where: { id: targetId } });
      });
    } catch (error) {
      if (isTransactionConflict(error))
        throw new AppError(409, "RESOURCE_CONFLICT", "The user changed. Reload and confirm again.");
      throw error;
    }
    await this.audit.bestEffort(
      adminAudit("admin.user.permanently_deleted", actorId, "USER", targetId, requestId),
    );
  }
}
