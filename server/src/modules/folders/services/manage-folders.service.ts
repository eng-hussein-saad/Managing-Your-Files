import type { PrismaClient } from "@prisma/client";
import type { AuditService } from "../../audit/audit.service.js";
import { fileAudit } from "../../audit/file-audit.js";
import type { Clock } from "../../../infrastructure/runtime/clock.js";
import type { Identifiers } from "../../../infrastructure/runtime/identifiers.js";
import { categoryForMime, previewForMime } from "../../files/file.mapper.js";
import {
  folderDepthExceeded,
  folderNameConflict,
  folderNotFound,
} from "../folder.errors.js";
import { FolderRepository } from "../repositories/folder.repository.js";

type FolderRow = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Applies fixed-parent folder browsing, creation, and rename rules. */
export class ManageFoldersService {
  /** Creates hierarchy orchestration with explicit runtime and audit dependencies. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly clock: Clock,
    private readonly ids: Identifiers,
    private readonly audit: AuditService,
    private readonly repository = new FolderRepository(),
  ) {}
  /** Projects a stored folder and derived depth to its public contract. */
  private publicFolder(folder: FolderRow, depth: number) {
    return {
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      depth,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    };
  }
  /** Projects one file row into its browser-safe summary. */
  private publicFile(
    file: Awaited<ReturnType<FolderRepository["contents"]>>["files"][number],
  ) {
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
        file.extractedContent === null
          ? ("unavailable" as const)
          : ("available" as const),
    };
  }
  /** Lists root or owned-folder contents with root-first breadcrumbs. */
  async list(ownerId: string, parentId: string | null) {
    const path = await this.repository.ancestry(this.prisma, ownerId, parentId);
    if (!path) throw folderNotFound();
    const { folders, files } = await this.repository.contents(
      this.prisma,
      ownerId,
      parentId,
    );
    const depth = path.length;
    return {
      folder: parentId ? this.publicFolder(path.at(-1)!, depth) : null,
      breadcrumbs: path.map(
        /** Maps one source item into its derived public representation. */ (
          item,
        ) => ({ id: item.id, name: item.name }),
      ),
      folders: folders.map(
        /** Maps one source item into its derived public representation. */ (
          item,
        ) => this.publicFolder(item, depth + 1),
      ),
      files: files.map(
        /** Maps one source item into its derived public representation. */ (
          item,
        ) => this.publicFile(item),
      ),
    };
  }
  /** Returns one owned folder and its complete root-first breadcrumb path. */
  async detail(ownerId: string, id: string) {
    const path = await this.repository.ancestry(this.prisma, ownerId, id);
    if (!path?.length) throw folderNotFound();
    return {
      folder: this.publicFolder(path.at(-1)!, path.length),
      breadcrumbs: path.map(
        /** Maps one source item into its derived public representation. */ (
          item,
        ) => ({ id: item.id, name: item.name }),
      ),
    };
  }
  /** Creates an owner-scoped root or child folder within the ten-level limit. */
  async create(
    ownerId: string,
    input: { name: string; parentId: string | null },
  ) {
    const folder = await this.prisma.$transaction(
      /** Runs the atomic persistence work inside the surrounding transaction. */ async (
        transaction,
      ) => {
        await this.repository.lockOwner(transaction, ownerId);
        const path = await this.repository.ancestry(
          transaction,
          ownerId,
          input.parentId,
        );
        if (!path) throw folderNotFound();
        if (path.length >= 10) throw folderDepthExceeded();
        if (
          await this.repository.siblingExists(
            transaction,
            ownerId,
            input.parentId,
            input.name,
          )
        )
          throw folderNameConflict();
        return this.repository.create(transaction, {
          id: this.ids.uuid(),
          ownerId,
          parentId: input.parentId,
          name: input.name.trim().normalize("NFC"),
          now: this.clock.now(),
        });
      },
    );
    await this.audit.bestEffort(
      fileAudit("folder.create", ownerId, "FOLDER", folder.id, "SUCCESS"),
    );
    const path = await this.repository.ancestry(
      this.prisma,
      ownerId,
      folder.id,
    );
    return this.publicFolder(folder, path?.length ?? 1);
  }
  /** Renames one owned folder without altering parentage or descendants. */
  async rename(ownerId: string, id: string, name: string) {
    const folder = await this.prisma.$transaction(
      /** Runs the atomic persistence work inside the surrounding transaction. */ async (
        transaction,
      ) => {
        await this.repository.lockOwner(transaction, ownerId);
        const current = await this.repository.owned(transaction, ownerId, id);
        if (!current) throw folderNotFound();
        if (
          await this.repository.siblingExists(
            transaction,
            ownerId,
            current.parentId,
            name,
            id,
          )
        )
          throw folderNameConflict();
        return this.repository.rename(
          transaction,
          id,
          name.trim().normalize("NFC"),
          this.clock.now(),
        );
      },
    );
    await this.audit.bestEffort(
      fileAudit("folder.rename", ownerId, "FOLDER", folder.id, "SUCCESS"),
    );
    const path = await this.repository.ancestry(
      this.prisma,
      ownerId,
      folder.id,
    );
    return this.publicFolder(folder, path?.length ?? 1);
  }
}
