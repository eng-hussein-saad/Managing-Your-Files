import type { PrismaClient } from "@prisma/client";

/** Reads exact current platform aggregates and a bounded recent-file window. */
export class AdminStatisticsRepository {
  /** Returns canonical rows needed for one read-time administrator snapshot. */
  async current(prisma: PrismaClient) {
    const [totalUsers, files, recentUploads] = await Promise.all([
      prisma.user.count(),
      prisma.file.findMany({ select: { size: true, mimeType: true } }),
      prisma.file.findMany({
        include: {
          owner: { select: { id: true, name: true, email: true } },
          folder: { select: { id: true, name: true } },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 10,
      }),
    ]);
    return { totalUsers, files, recentUploads };
  }
}
