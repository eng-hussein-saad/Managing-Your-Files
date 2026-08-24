import type { Prisma, PrismaClient } from "@prisma/client";
import type { AdminFileQuery } from "@gold-era/contracts/public";

const categoryMimes = {
  pdf: ["application/pdf"],
  text: ["text/plain"],
  image: ["image/jpeg", "image/png", "image/webp"],
  document: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
} as const;

/** Owns deterministic metadata-only cross-owner file queries. */
export class AdminFileRepository {
  /** Returns one bounded filtered global file page with stable tie-breaking. */
  async list(prisma: PrismaClient, query: AdminFileQuery) {
    const uploadedFrom = query.uploadedFrom
      ? new Date(`${query.uploadedFrom}T00:00:00.000Z`)
      : undefined;
    const where: Prisma.FileWhereInput = {
      ...(query.search
        ? { originalName: { contains: query.search, mode: "insensitive" } }
        : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.type ? { mimeType: { in: [...categoryMimes[query.type]] } } : {}),
      ...(query.folder === "root"
        ? { folderId: null }
        : query.folder === "foldered"
          ? { folderId: { not: null } }
          : {}),
      ...(uploadedFrom || query.uploadedBefore
        ? {
            createdAt: {
              ...(uploadedFrom ? { gte: uploadedFrom } : {}),
              ...(query.uploadedBefore ? { lt: new Date(query.uploadedBefore) } : {}),
            },
          }
        : {}),
      ...(query.minSizeBytes !== undefined || query.maxSizeBytes !== undefined
        ? {
            size: {
              ...(query.minSizeBytes !== undefined ? { gte: query.minSizeBytes } : {}),
              ...(query.maxSizeBytes !== undefined ? { lte: query.maxSizeBytes } : {}),
            },
          }
        : {}),
    };
    const primary: Prisma.FileOrderByWithRelationInput =
      query.sort === "owner"
        ? { owner: { name: query.direction } }
        : {
            [{ name: "originalName", size: "size", uploadedAt: "createdAt" }[query.sort]]:
              query.direction,
          };
    const [rows, totalItems] = await Promise.all([
      prisma.file.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          folder: { select: { id: true, name: true } },
        },
        orderBy: [primary, { id: query.direction }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.file.count({ where }),
    ]);
    return { rows, totalItems };
  }
  /** Loads trusted metadata and owner identity for one current file. */
  detail(prisma: PrismaClient | Prisma.TransactionClient, fileId: string) {
    return prisma.file.findUnique({
      where: { id: fileId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        folder: { select: { id: true, name: true } },
      },
    });
  }
}
