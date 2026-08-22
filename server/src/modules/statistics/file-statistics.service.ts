import type { PrismaClient } from "@prisma/client";
import { categoryForMime } from "../files/file.mapper.js";
import { FileStatisticsRepository } from "./file-statistics.repository.js";
import { localIsoDate, thirtyDayUtcRange } from "./local-dates.js";

const categories = ["pdf", "text", "image", "document"] as const;

/** Builds owner-scoped current storage statistics from canonical FILE rows. */
export class FileStatisticsService {
  /** Creates statistics orchestration over its bounded aggregate repository. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly repository = new FileStatisticsRepository(),
  ) {}
  /** Returns current totals and exactly thirty zero-filled local upload buckets. */
  async get(ownerId: string, timeZone: string, now = new Date()) {
    const range = thirtyDayUtcRange(timeZone, now);
    const [current, historyRows] = await Promise.all([
      this.repository.current(this.prisma, ownerId),
      this.repository.history(this.prisma, ownerId, range.start, range.end),
    ]);
    const distribution = new Map(categories.map((type) => [type, 0]));
    current.rows.forEach((row) => {
      const type = categoryForMime(row.mimeType as never);
      distribution.set(type, (distribution.get(type) ?? 0) + 1);
    });
    const counts = new Map(range.dates.map((date) => [date, 0]));
    historyRows.forEach((row) => {
      const date = localIsoDate(row.createdAt, timeZone);
      if (counts.has(date)) counts.set(date, (counts.get(date) ?? 0) + 1);
    });
    const remaining = 104_857_600n - current.bytes;
    return {
      fileCount: current.count,
      storedBytes: current.bytes.toString(),
      quota: {
        usedBytes: current.bytes.toString(),
        remainingBytes: (remaining > 0n ? remaining : 0n).toString(),
        limitBytes: "104857600",
      },
      typeDistribution: categories.map((type) => ({
        type,
        count: distribution.get(type) ?? 0,
      })),
      uploadHistory: range.dates.map((date) => ({
        date,
        count: counts.get(date) ?? 0,
      })),
      timeZone,
    };
  }
}
