import type { RequestHandler } from "express";
import { statisticsQuerySchema } from "../schemas/file-statistics.schemas.js";
import { success } from "../respond.js";
import type { FileStatisticsService } from "../../modules/statistics/file-statistics.service.js";
/** Builds the owner-authorized current file statistics endpoint. */
export function fileStatisticsController(service: FileStatisticsService) {
  const get: RequestHandler = async (request, response, next) => {
    try {
      const { timeZone } = statisticsQuerySchema.parse(request.query);
      success(
        response,
        200,
        await service.get(
          (response.locals.identity as { subject: string }).subject,
          timeZone,
        ),
      );
    } catch (error) {
      next(error);
    }
  };
  return { get };
}
