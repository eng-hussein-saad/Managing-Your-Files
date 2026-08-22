import type { PrismaClient } from "@prisma/client";
import { fileNotFound } from "../file.errors.js";
import { categoryForMime, previewForMime } from "../file.mapper.js";
import type { FileTypeCategory } from "../file.types.js";
import { FileRepository } from "../repositories/file.repository.js";

type DiscoveryQuery = {
  search?: string;
  type?: FileTypeCategory;
  folderId?: string;
  sort: "name" | "size" | "uploadedAt";
  direction: "asc" | "desc";
  page: number;
  pageSize: number;
};
type SummaryRow = {
  id: string;
  originalName: string;
  mimeType: string;
  size: bigint;
  folder: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
  extractedContent: string | null;
};

/** Reads owner-scoped public file metadata without projecting storage keys. */
export class FindFilesService {
  /** Creates the discovery service over its focused persistence boundary. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly repository = new FileRepository(),
  ) {}
  /** Projects one persistence row into the strict browser-safe summary contract. */
  private summary(row: SummaryRow) {
    return {
      id: row.id,
      originalName: row.originalName,
      mimeType: row.mimeType,
      typeCategory: categoryForMime(row.mimeType as never),
      sizeBytes: row.size.toString(),
      folder: row.folder ? { id: row.folder.id, name: row.folder.name } : null,
      uploadedAt: row.createdAt.toISOString(),
      previewKind: previewForMime(row.mimeType as never),
      extractionState:
        row.extractedContent === null
          ? ("unavailable" as const)
          : ("available" as const),
    };
  }
  /** Returns a deterministic owner-only page with accurate combined-filter totals. */
  async list(ownerId: string, query: DiscoveryQuery) {
    if (
      query.folderId &&
      query.folderId !== "root" &&
      !(await this.repository.ownedFolder(this.prisma, ownerId, query.folderId))
    )
      throw fileNotFound();
    const { rows, totalItems } = await this.repository.list(
      this.prisma,
      ownerId,
      query,
    );
    return {
      data: rows.map(
        /** Maps one source item into its derived public representation. */ (
          row,
        ) => this.summary(row),
      ),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / query.pageSize),
      },
    };
  }
  /** Returns one current owner-scoped detail record with complete folder ancestry. */
  async detail(ownerId: string, id: string) {
    const row = await this.repository.detail(this.prisma, ownerId, id);
    if (!row) throw fileNotFound();
    const folderPath = await this.repository.folderPath(
      this.prisma,
      ownerId,
      row.folderId,
    );
    if (row.folderId && folderPath.length === 0) throw fileNotFound();
    return {
      ...this.summary(row),
      folderPath,
      extractedContent: row.extractedContent,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
