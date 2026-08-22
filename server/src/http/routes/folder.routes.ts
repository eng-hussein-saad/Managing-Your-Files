import { Router, type RequestHandler } from "express";
import type { folderController } from "../controllers/folder.controller.js";
/** Creates protected folder browsing and mutation routes. */
export function folderRoutes(
  authenticate: RequestHandler,
  controller: ReturnType<typeof folderController>,
) {
  const router = Router();
  router.get("/", authenticate, controller.list);
  router.post("/", authenticate, controller.create);
  router.get("/:folderId", authenticate, controller.detail);
  router.patch("/:folderId", authenticate, controller.rename);
  router.delete("/:folderId", authenticate, controller.remove);
  return router;
}
