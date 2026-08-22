import type { PrismaClient } from "@prisma/client";
import type { AuditService } from "../../audit/audit.service.js";
import { fileAudit } from "../../audit/file-audit.js";
import { fileNotFound, retryableFileFailure } from "../file.errors.js";
import { StorageError, type StoragePort } from "../ports/storage.port.js";
/** Permanently removes owner-scoped metadata only after private-object removal. */
export class DeleteFileService {
  /** Creates permanent deletion over explicit persistence, storage, and audit boundaries. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly storage: StoragePort,
    private readonly audit: AuditService,
  ) {}
  /** Deletes the trusted provider object first and then its canonical metadata. */
  async delete(ownerId: string, id: string): Promise<void> {
    const file = await this.prisma.file.findFirst({ where: { id, ownerId } });
    if (!file) throw fileNotFound();
    try {
      await this.storage.remove(file.storageKey);
    } catch (error) {
      if (!(error instanceof StorageError && error.kind === "not-found"))
        throw retryableFileFailure();
    }
    try {
      await this.prisma.file.delete({ where: { id: file.id } });
    } catch {
      throw retryableFileFailure();
    }
    await this.audit.bestEffort(
      fileAudit("file.delete", ownerId, "FILE", id, "SUCCESS"),
    );
  }
}
