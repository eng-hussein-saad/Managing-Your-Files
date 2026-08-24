import { Router, type RequestHandler } from "express";
import type { adminUserController } from "../controllers/admin-user.controller.js";
import type { adminFileController } from "../controllers/admin-file.controller.js";
import type { adminMonitoringController } from "../controllers/admin-monitoring.controller.js";
/** Mounts administrator operations behind authentication and role enforcement. */
export function adminRoutes(
  authenticate: RequestHandler,
  authorize: RequestHandler,
  access: RequestHandler,
  users?: ReturnType<typeof adminUserController>,
  files?: ReturnType<typeof adminFileController>,
  monitoring?: ReturnType<typeof adminMonitoringController>,
): Router {
  const router = Router();
  router.get("/access-check", authenticate, authorize, access);
  if (users) {
    router.get("/users", authenticate, authorize, users.list);
    router.get("/users/:userId", authenticate, authorize, users.detail);
    router.patch("/users/:userId/role", authenticate, authorize, users.changeRole);
    router.delete("/users/:userId", authenticate, authorize, users.remove);
  }
  if (files) {
    router.get("/files", authenticate, authorize, files.list);
    router.get("/files/:fileId", authenticate, authorize, files.detail);
    router.delete("/files/:fileId", authenticate, authorize, files.remove);
  }
  if (monitoring) {
    router.get("/statistics", authenticate, authorize, monitoring.getStatistics);
    router.get("/audit-events", authenticate, authorize, monitoring.listAuditEvents);
  }
  return router;
}
