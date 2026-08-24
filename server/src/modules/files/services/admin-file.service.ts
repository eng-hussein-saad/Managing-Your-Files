import type { PrismaClient } from "@prisma/client";
import type { AdminFileQuery } from "@gold-era/contracts/public";
import { AppError } from "../../auth/auth.errors.js";
import { categoryForMime } from "../file.mapper.js";
import { AdminFileRepository } from "../repositories/admin-file.repository.js";
import type { DeleteFileService } from "./delete-file.service.js";

type AdminFileRow = NonNullable<Awaited<ReturnType<AdminFileRepository["detail"]>>>;

/** Projects one database row into metadata-only administrator output. */
function toAdminFile(row: AdminFileRow) {
  return {
    id: row.id,
    owner: row.owner,
    originalName: row.originalName,
    mimeType: row.mimeType,
    type: categoryForMime(row.mimeType as never),
    sizeBytes: row.size.toString(),
    folder: row.folder,
    uploadedAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Coordinates global metadata visibility and trusted permanent deletion. */
export class AdminFileService {
  /** Configures global file administration without content-access capabilities. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly deletion?: DeleteFileService,
    private readonly repository = new AdminFileRepository(),
  ) {}
  /** Returns a deterministic metadata-only global file page without auditing. */
  async list(query: AdminFileQuery) {
    const result = await this.repository.list(this.prisma, query);
    return {
      data: result.rows.map(toAdminFile),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.ceil(result.totalItems / query.pageSize),
      },
    };
  }
  /** Returns metadata for one file without granting preview or download authority. */
  async detail(fileId: string) {
    const row = await this.repository.detail(this.prisma, fileId);
    if (!row) throw new AppError(404, "RESOURCE_NOT_FOUND", "The file was not found.");
    return toAdminFile(row);
  }
  /** Delegates confirmed permanent removal using the trusted database owner. */
  async delete(
    actorId: string,
    fileId: string,
    input: { expectedUpdatedAt: string; confirmationOriginalName: string },
    requestId?: string,
  ): Promise<void> {
    if (!this.deletion)
      throw new AppError(503, "SERVICE_UNAVAILABLE", "File cleanup is unavailable.");
    await this.deletion.deleteAsAdministrator(actorId, fileId, input, requestId);
  }
}
