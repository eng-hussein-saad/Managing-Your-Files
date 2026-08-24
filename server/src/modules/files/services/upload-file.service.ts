import { readFile } from "node:fs/promises";
import type { PrismaClient } from "@prisma/client";
import type { AuditService } from "../../audit/audit.service.js";
import { fileAudit } from "../../audit/file-audit.js";
import type { Clock } from "../../../infrastructure/runtime/clock.js";
import type { Identifiers } from "../../../infrastructure/runtime/identifiers.js";
import { detectAllowedMime } from "../../../infrastructure/file-content/content-detector.js";
import { normalizeDisplayName } from "../../../infrastructure/file-content/filename.js";
import type { ExtractionPort } from "../ports/extraction.port.js";
import type { StoragePort } from "../ports/storage.port.js";
import {
  fileNotFound,
  fileTooLarge,
  quotaExceeded,
  unsupportedFile,
} from "../file.errors.js";
import { categoryForMime, previewForMime } from "../file.mapper.js";
import { FileRepository } from "../repositories/file.repository.js";

/** Orchestrates byte-authoritative, object-first uploads with best-effort compensation. */
export class UploadFileService {
  /** Creates upload orchestration from explicit persistence and infrastructure boundaries. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly storage: StoragePort,
    private readonly extractor: ExtractionPort,
    private readonly audit: AuditService,
    private readonly clock: Clock,
    private readonly ids: Identifiers,
    private readonly extractionMaxBytes = 5_242_880,
    private readonly repository = new FileRepository(),
  ) {}
  /** Stores one owned temporary upload and returns browser-safe persisted metadata. */
  async upload(
    ownerId: string,
    input: { path: string; originalName: string; folderId?: string },
  ) {
    const bytes = await readFile(input.path);
    if (bytes.byteLength > 5_242_880) throw fileTooLarge();
    const mimeType = await detectAllowedMime(bytes);
    if (!mimeType) throw unsupportedFile();
    const id = this.ids.uuid();
    const key = `users/${ownerId}/files/${id}`;
    const now = this.clock.now();
    let uploaded = false;
    try {
      const result = await this.prisma.$transaction(
        /** Runs the atomic persistence work inside the surrounding transaction. */ async (
          transaction,
        ) => {
          if (
            !(await this.repository.ownedFolder(
              transaction,
              ownerId,
              input.folderId,
            ))
          )
            throw fileNotFound();
          if (!(await this.repository.lockOwnerLifecycle(transaction, ownerId)))
            throw fileNotFound();
          const used = await this.repository.quotaForOwner(
            transaction,
            ownerId,
          );
          if (used + BigInt(bytes.byteLength) > 104_857_600n)
            throw quotaExceeded({
              usedBytes: used.toString(),
              remainingBytes: (104_857_600n - used > 0n
                ? 104_857_600n - used
                : 0n
              ).toString(),
              limitBytes: "104857600",
            });
          await this.storage.upload({ key, data: bytes, mimeType });
          uploaded = true;
          let extractedContent: string | null = null;
          try {
            extractedContent = await this.extractor.extract({
              bytes,
              mimeType,
              timeoutMs: 5_000,
              maxBytes: this.extractionMaxBytes,
              maxPages: 200,
              maxChars: 1_000_000,
            });
          } catch {
            extractedContent = null;
          }
          const file = await this.repository.create(transaction, {
            id,
            ownerId,
            folderId: input.folderId,
            originalName: normalizeDisplayName(input.originalName),
            storageKey: key,
            mimeType,
            size: BigInt(bytes.byteLength),
            extractedContent,
            now,
          });
          return {
            id: file.id,
            originalName: file.originalName,
            mimeType: file.mimeType,
            typeCategory: categoryForMime(file.mimeType as never),
            sizeBytes: file.size.toString(),
            folder: file.folder,
            uploadedAt: file.createdAt.toISOString(),
            previewKind: previewForMime(file.mimeType as never),
            extractionState:
              extractedContent === null
                ? ("unavailable" as const)
                : ("available" as const),
          };
        },
      );
      await this.audit.bestEffort(
        fileAudit("file.upload", ownerId, "FILE", result.id, "SUCCESS"),
      );
      return result;
    } catch (error) {
      if (uploaded) {
        try {
          await this.storage.remove(key);
        } catch {
          /* compensation is intentionally best effort */
        }
      }
      throw error;
    }
  }
  /** Returns the caller's current authoritative quota snapshot for upload planning. */
  async policyQuota(
    ownerId: string,
  ): Promise<{
    usedBytes: string;
    remainingBytes: string;
    limitBytes: string;
  }> {
    const limit = 104_857_600n;
    const used = await this.repository.usedBytesForOwner(this.prisma, ownerId);
    return {
      usedBytes: used.toString(),
      remainingBytes: (limit - used > 0n ? limit - used : 0n).toString(),
      limitBytes: limit.toString(),
    };
  }
}
