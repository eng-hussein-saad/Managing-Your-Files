import type { PrismaClient } from "@prisma/client";

/** Reads ownership-scoped aggregates without materializing every file row. */
export class FileStatisticsRepository {
  /** Groups current counts and bytes by MIME type inside PostgreSQL. */
  async current(prisma: PrismaClient, ownerId: string) {
    return prisma.file.groupBy({
      by: ["mimeType"],
      where: { ownerId },
      _count: { _all: true },
      _sum: { size: true },
    });
  }
  /** Groups the bounded upload window into caller-local calendar dates in PostgreSQL. */
  async history(
    prisma: PrismaClient,
    ownerId: string,
    timeZone: string,
    start: Date,
    end: Date,
  ) {
    return prisma.$queryRaw<Array<{ date: string; count: number }>>`
      SELECT
        to_char(timezone(${timeZone}, "createdAt"), 'YYYY-MM-DD') AS date,
        COUNT(*)::integer AS count
      FROM "FILE"
      WHERE "ownerId" = ${ownerId}::uuid
        AND "createdAt" >= ${start}
        AND "createdAt" < ${end}
      GROUP BY 1
      ORDER BY 1
    `;
  }
}
