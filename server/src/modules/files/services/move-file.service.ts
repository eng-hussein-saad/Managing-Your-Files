import type { PrismaClient } from "@prisma/client";
import type { AuditService } from "../../audit/audit.service.js";
import { fileAudit } from "../../audit/file-audit.js";
import type { Clock } from "../../../infrastructure/runtime/clock.js";
import { fileNotFound } from "../file.errors.js";
import { categoryForMime, previewForMime } from "../file.mapper.js";
import { FileRepository } from "../repositories/file.repository.js";

/** Moves an owned file only to root or another owned folder. */
export class MoveFileService {
  /** Creates movement orchestration with persistence, time, and audit dependencies. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly clock: Clock,
    private readonly audit: AuditService,
    private readonly files = new FileRepository(),
  ) {}
  /** Updates only the location and timestamp after authorizing both file and destination. */
  async move(ownerId: string, id: string, folderId: string | null) {
    const row = await this.prisma.$transaction(
      /** Runs the atomic persistence work inside the surrounding transaction. */ async (
        transaction,
      ) => {
        await transaction.$queryRaw`SELECT id FROM "USER" WHERE id = ${ownerId}::uuid FOR UPDATE`;
        if (!(await this.files.ownedFolder(transaction, ownerId, folderId)))
          throw fileNotFound();
        const moved = await this.files.move(
          transaction,
          ownerId,
          id,
          folderId,
          this.clock.now(),
        );
        if (!moved) throw fileNotFound();
        return moved;
      },
    );
    await this.audit.bestEffort(
      fileAudit("file.move", ownerId, "FILE", id, "SUCCESS"),
    );
    return {
      id: row.id,
      originalName: row.originalName,
      mimeType: row.mimeType,
      typeCategory: categoryForMime(row.mimeType as never),
      sizeBytes: row.size.toString(),
      folder: row.folder,
      uploadedAt: row.createdAt.toISOString(),
      previewKind: previewForMime(row.mimeType as never),
      extractionState:
        row.extractedContent === null
          ? ("unavailable" as const)
          : ("available" as const),
    };
  }
}
