import type { PrismaClient } from "@prisma/client";
import type { AuditService } from "../../audit/audit.service.js";
import { fileAudit } from "../../audit/file-audit.js";
import {
  fileNotFound,
  previewUnavailable,
  retryableFileFailure,
} from "../file.errors.js";
import { previewForMime } from "../file.mapper.js";
import { StorageError, type StoragePort } from "../ports/storage.port.js";

/** Authorizes current ownership before and after retrieving private content. */
export class GetFileContentService {
  /** Creates request-bound content access over private storage and audit boundaries. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly storage: StoragePort,
    private readonly audit: AuditService,
  ) {}
  /** Returns one verified owner-scoped object only while its metadata remains current. */
  async get(ownerId: string, fileId: string, mode: "preview" | "download") {
    const file = await this.prisma.file.findFirst({
      where: { id: fileId, ownerId },
    });
    if (!file) throw fileNotFound();
    if (
      mode === "preview" &&
      previewForMime(file.mimeType as never) === "unavailable"
    )
      throw previewUnavailable();
    let object;
    try {
      object = await this.storage.download(file.storageKey, Number(file.size));
    } catch (error) {
      if (error instanceof StorageError && error.kind === "not-found")
        throw fileNotFound();
      throw retryableFileFailure();
    }
    const stillCurrent = await this.prisma.file.findFirst({
      where: { id: fileId, ownerId, storageKey: file.storageKey },
      select: { id: true },
    });
    if (!stillCurrent) {
      object.stream.destroy();
      throw fileNotFound();
    }
    if (object.size !== Number(file.size)) {
      object.stream.destroy();
      throw retryableFileFailure();
    }
    return {
      fileId: file.id,
      stream: object.stream,
      size: object.size,
      mimeType: file.mimeType,
      originalName: file.originalName,
    };
  }
  /** Attempts a sanitized download audit after the response finishes successfully. */
  async auditDownload(ownerId: string, fileId: string): Promise<void> {
    await this.audit.bestEffort(
      fileAudit("file.download", ownerId, "FILE", fileId, "SUCCESS"),
    );
  }
}
