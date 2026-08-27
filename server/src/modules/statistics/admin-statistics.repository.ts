import type { PrismaClient } from "@prisma/client";

/** Reads exact database aggregates and a bounded recent-file window. */
export class AdminStatisticsRepository {
  /** Returns grouped totals without materializing the platform's complete file table. */
  async current(prisma: PrismaClient) {
    const [totalUsers, groups, recentUploads] = await Promise.all([
      prisma.user.count(),
      prisma.file.groupBy({
        by: ["mimeType"],
        _count: { _all: true },
        _sum: { size: true },
      }),
      prisma.file.findMany({
        include: {
          owner: { select: { id: true, name: true, email: true } },
          folder: { select: { id: true, name: true } },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 10,
      }),
    ]);
    return { totalUsers, groups, recentUploads };
  }
}
