import type { PrismaClient } from "@prisma/client";

/** Reads ownership-scoped current totals and bounded upload-history rows. */
export class FileStatisticsRepository {
  /** Returns current aggregate inputs for all retained owner files. */
  async current(prisma: PrismaClient, ownerId: string) {
    const [aggregate, rows] = await Promise.all([
      prisma.file.aggregate({
        where: { ownerId },
        _count: { _all: true },
        _sum: { size: true },
      }),
      prisma.file.findMany({ where: { ownerId }, select: { mimeType: true } }),
    ]);
    return {
      count: aggregate._count._all,
      bytes: aggregate._sum.size ?? 0n,
      rows,
    };
  }
  /** Returns immutable upload timestamps inside one UTC-bounded local-date window. */
  async history(prisma: PrismaClient, ownerId: string, start: Date, end: Date) {
    return prisma.file.findMany({
      where: { ownerId, createdAt: { gte: start, lt: end } },
      select: { createdAt: true },
    });
  }
}
