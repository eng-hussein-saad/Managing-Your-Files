import { Router, type RequestHandler } from "express";
import type { fileStatisticsController } from "../controllers/file-statistics.controller.js";
/** Creates the authenticated file-statistics route. */
export function fileStatisticsRoutes(
  authenticate: RequestHandler,
  controller: ReturnType<typeof fileStatisticsController>,
) {
  const router = Router();
  router.get("/", authenticate, controller.get);
  return router;
}
