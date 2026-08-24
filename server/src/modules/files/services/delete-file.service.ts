import type { PrismaClient } from "@prisma/client";
import type { AuditService } from "../../audit/audit.service.js";
import { fileAudit } from "../../audit/file-audit.js";
import { fileNotFound, retryableFileFailure } from "../file.errors.js";
import { StorageError, type StoragePort } from "../ports/storage.port.js";
import { FileRepository } from "../repositories/file.repository.js";
import { isTransactionConflict, serializableOnce } from "../../../infrastructure/persistence/transactions.js";
import { AppError } from "../../auth/auth.errors.js";
import { adminAudit } from "../../audit/admin-audit.js";
/** Permanently removes owner-scoped metadata only after private-object removal. */
export class DeleteFileService {
  /** Creates permanent deletion over explicit persistence, storage, and audit boundaries. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly storage: StoragePort,
    private readonly audit: AuditService,
    private readonly repository = new FileRepository(),
  ) {}
  /** Deletes the trusted provider object first and then its canonical metadata. */
  async delete(ownerId: string, id: string): Promise<void> {
    await this.removeTrusted(ownerId, id);
    await this.audit.bestEffort(
      fileAudit("file.delete", ownerId, "FILE", id, "SUCCESS"),
    );
  }
  /** Permanently removes a confirmed file under trusted administrator authority. */
  async deleteAsAdministrator(
    actorId: string,
    id: string,
    input: { expectedUpdatedAt: string; confirmationOriginalName: string },
    requestId?: string,
  ): Promise<void> {
    await this.removeTrusted(undefined, id, input);
    await this.audit.bestEffort(
      adminAudit("admin.file.permanently_deleted", actorId, "FILE", id, requestId),
    );
  }
  /** Removes a trusted object first and its metadata inside one owner lifecycle lock. */
  private async removeTrusted(
    assertedOwnerId: string | undefined,
    id: string,
    confirmation?: { expectedUpdatedAt: string; confirmationOriginalName: string },
  ): Promise<void> {
    try {
      await serializableOnce(
        this.prisma,
        /** Performs the object-first removal under the owner's lifecycle lock. */ async (transaction) => {
      const initial = await transaction.file.findUnique({ where: { id } });
      if (!initial || (assertedOwnerId && initial.ownerId !== assertedOwnerId))
        throw fileNotFound();
      await this.repository.lockOwnerLifecycle(transaction, initial.ownerId);
      const file = await transaction.file.findUnique({ where: { id } });
      if (!file) throw fileNotFound();
      if (
        confirmation &&
        (file.updatedAt.toISOString() !== confirmation.expectedUpdatedAt ||
          file.originalName !== confirmation.confirmationOriginalName)
      )
        throw new AppError(409, "RESOURCE_CONFLICT", "The file changed. Reload and confirm again.");
      try {
        await this.storage.remove(file.storageKey);
      } catch (error) {
        if (!(error instanceof StorageError && error.kind === "not-found"))
          throw retryableFileFailure();
      }
      await transaction.file.delete({ where: { id: file.id } });
        },
      );
    } catch (error) {
      if (isTransactionConflict(error))
        throw new AppError(409, "RESOURCE_CONFLICT", "The file changed. Reload and confirm again.");
      if (error instanceof AppError) throw error;
      throw retryableFileFailure();
    }
  }
}
