import type { PrismaClient } from "@prisma/client";
import type { AuditService } from "../../audit/audit.service.js";
import { fileAudit } from "../../audit/file-audit.js";
import { folderNotEmpty, folderNotFound } from "../folder.errors.js";
import { FolderRepository } from "../repositories/folder.repository.js";

/** Permanently deletes only an owned empty folder without cascading. */
export class DeleteFolderService {
  /** Creates deletion orchestration over locking and audit boundaries. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly audit: AuditService,
    private readonly repository = new FolderRepository(),
  ) {}
  /** Locks the hierarchy, proves emptiness, and permanently removes one folder. */
  async delete(ownerId: string, id: string): Promise<void> {
    const result = await this.prisma.$transaction(
      /** Runs the atomic persistence work inside the surrounding transaction. */ async (
        transaction,
      ) => {
        await this.repository.lockOwner(transaction, ownerId);
        return this.repository.deleteEmpty(transaction, ownerId, id);
      },
    );
    if (result === "not-found") throw folderNotFound();
    if (result === "not-empty") throw folderNotEmpty();
    await this.audit.bestEffort(
      fileAudit("folder.delete", ownerId, "FOLDER", id, "SUCCESS"),
    );
  }
}
