import type { Prisma, PrismaClient } from "@prisma/client";
import type { FileTypeCategory } from "../file.types.js";

type Database = PrismaClient | Prisma.TransactionClient;
type ListQuery = {
  search?: string;
  type?: FileTypeCategory;
  folderId?: string;
  sort: "name" | "size" | "uploadedAt";
  direction: "asc" | "desc";
  page: number;
  pageSize: number;
};

const categoryMimes: Record<FileTypeCategory, string[]> = {
  pdf: ["application/pdf"],
  text: ["text/plain"],
  image: ["image/jpeg", "image/png", "image/webp"],
  document: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

/** Encapsulates owner-scoped file persistence, discovery, and quota calculations. */
export class FileRepository {
  /** Returns retained bytes for display without acquiring an admission lock. */
  async usedBytesForOwner(
    database: Database,
    ownerId: string,
  ): Promise<bigint> {
    const total = await database.file.aggregate({
      where: { ownerId },
      _sum: { size: true },
    });
    return total._sum.size ?? 0n;
  }
  /** Locks a user row and returns authoritative retained bytes. */
  async quotaForOwner(database: Database, ownerId: string): Promise<bigint> {
    await database.$queryRaw`SELECT id FROM "USER" WHERE id = ${ownerId}::uuid FOR UPDATE`;
    return this.usedBytesForOwner(database, ownerId);
  }
  /** Ensures an optional destination folder belongs to the requesting owner. */
  async ownedFolder(
    database: Database,
    ownerId: string,
    folderId: string | undefined | null,
  ): Promise<boolean> {
    if (!folderId) return true;
    return Boolean(
      await database.folder.findFirst({
        where: { id: folderId, ownerId },
        select: { id: true },
      }),
    );
  }
  /** Inserts canonical metadata only after private object persistence succeeds. */
  async create(
    database: Database,
    input: {
      id: string;
      ownerId: string;
      folderId?: string;
      originalName: string;
      storageKey: string;
      mimeType: string;
      size: bigint;
      extractedContent: string | null;
      now: Date;
    },
  ) {
    const { now, ...data } = input;
    return database.file.create({
      data: {
        ...data,
        folderId: input.folderId ?? null,
        createdAt: now,
        updatedAt: now,
      },
      include: { folder: { select: { id: true, name: true } } },
    });
  }
  /** Returns a stable owner-scoped page with all filters applied before counting. */
  async list(database: Database, ownerId: string, query: ListQuery) {
    const where: Prisma.FileWhereInput = {
      ownerId,
      ...(query.search
        ? { originalName: { contains: query.search, mode: "insensitive" } }
        : {}),
      ...(query.type ? { mimeType: { in: categoryMimes[query.type] } } : {}),
      ...(query.folderId === "root"
        ? { folderId: null }
        : query.folderId
          ? { folderId: query.folderId }
          : {}),
    };
    const sortField = {
      name: "originalName",
      size: "size",
      uploadedAt: "createdAt",
    }[query.sort] as "originalName" | "size" | "createdAt";
    const orderBy: Prisma.FileOrderByWithRelationInput[] = [
      { [sortField]: query.direction },
      { id: query.direction },
    ];
    const [rows, totalItems] = await Promise.all([
      database.file.findMany({
        where,
        include: { folder: { select: { id: true, name: true } } },
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      database.file.count({ where }),
    ]);
    return { rows, totalItems };
  }
  /** Returns one current file only when it belongs to the asserted owner. */
  async detail(database: Database, ownerId: string, id: string) {
    return database.file.findFirst({
      where: { id, ownerId },
      include: { folder: { select: { id: true, name: true, parentId: true } } },
    });
  }
  /** Resolves a root-first, same-owner folder path and denies broken chains. */
  async folderPath(
    database: Database,
    ownerId: string,
    folderId: string | null,
  ): Promise<Array<{ id: string; name: string }>> {
    const result: Array<{ id: string; name: string }> = [];
    const visited = new Set<string>();
    let cursor = folderId;
    while (cursor) {
      if (visited.has(cursor)) return [];
      visited.add(cursor);
      const folder = await database.folder.findFirst({
        where: { id: cursor, ownerId },
        select: { id: true, name: true, parentId: true },
      });
      if (!folder) return [];
      result.unshift({ id: folder.id, name: folder.name });
      cursor = folder.parentId;
    }
    return result;
  }
  /** Moves an owned file and returns its complete public projection source. */
  async move(
    database: Database,
    ownerId: string,
    id: string,
    folderId: string | null,
    now: Date,
  ) {
    const current = await database.file.findFirst({
      where: { id, ownerId },
      select: { id: true },
    });
    if (!current) return null;
    return database.file.update({
      where: { id },
      data: { folderId, updatedAt: now },
      include: { folder: { select: { id: true, name: true } } },
    });
  }
}
