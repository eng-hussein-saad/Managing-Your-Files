import type { RequestHandler } from "express";
import type { AdminStatisticsService } from "../../modules/statistics/admin-statistics.service.js";
import type { AuditService } from "../../modules/audit/audit.service.js";
import { success } from "../respond.js";
import { adminAuditQuerySchema, parseAdminQuery } from "../schemas/admin.schemas.js";

/** Builds unaudited administrator statistics and audit-history handlers. */
export function adminMonitoringController(
  statistics: AdminStatisticsService,
  audit: AuditService,
) {
  /** Returns an exact read-time platform snapshot. */
  const getStatistics: RequestHandler = async (_request, response, next) => {
    try {
      success(response, 200, await statistics.get());
    } catch (error) {
      next(error);
    }
  };
  /** Returns one validated sanitized retained audit page. */
  const listAuditEvents: RequestHandler = async (request, response, next) => {
    try {
      const result = await audit.list(parseAdminQuery(adminAuditQuerySchema, request.query));
      success(response, 200, result.data, result.meta);
    } catch (error) {
      next(error);
    }
  };
  return { getStatistics, listAuditEvents };
}
