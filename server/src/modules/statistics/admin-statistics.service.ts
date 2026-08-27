import type { PrismaClient } from "@prisma/client";
import { categoryForMime } from "../files/file.mapper.js";
import { AdminStatisticsRepository } from "./admin-statistics.repository.js";

const categories = ["pdf", "text", "image", "document"] as const;

/** Builds exact unaudited platform statistics from current canonical rows. */
export class AdminStatisticsService {
  /** Configures statistics over its narrow read repository. */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly repository = new AdminStatisticsRepository(),
  ) {}
  /** Computes current totals, distribution, and newest uploads at read time. */
  async get(now = new Date()) {
    const current = await this.repository.current(this.prisma);
    const counts = new Map(categories.map((type) => [type, 0]));
    let totalFiles = 0;
    let storedBytes = 0n;
    for (const group of current.groups) {
      const count = group._count._all;
      totalFiles += count;
      storedBytes += group._sum.size ?? 0n;
      const type = categoryForMime(group.mimeType as never);
      counts.set(type, (counts.get(type) ?? 0) + count);
    }
    return {
      totalUsers: current.totalUsers,
      totalFiles,
      storedBytes: storedBytes.toString(),
      typeDistribution: categories.map((type) => ({ type, count: counts.get(type) ?? 0 })),
      recentUploads: current.recentUploads.map((file) => ({
        id: file.id,
        owner: file.owner,
        originalName: file.originalName,
        mimeType: file.mimeType,
        type: categoryForMime(file.mimeType as never),
        sizeBytes: file.size.toString(),
        folder: file.folder,
        uploadedAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
      })),
      computedAt: now.toISOString(),
    };
  }
}
