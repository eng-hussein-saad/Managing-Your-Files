import { Router, type RequestHandler } from "express";
import type { ReturnTypeFileUploadController } from "./file.route.types.js";
import {
  cleanupUploadedFile,
  oneFileUpload,
} from "../middleware/file-upload.js";
import type { fileQueryController } from "../controllers/file-query.controller.js";
import type { fileContentController } from "../controllers/file-content.controller.js";
import type { fileDeleteController } from "../controllers/file-delete.controller.js";
import type { fileMoveController } from "../controllers/file-move.controller.js";
/** Creates protected routes for one-file uploads. */
export function fileRoutes(
  authenticate: RequestHandler,
  controller: ReturnTypeFileUploadController,
  queryController?: ReturnType<typeof fileQueryController>,
  contentController?: ReturnType<typeof fileContentController>,
  deleteController?: ReturnType<typeof fileDeleteController>,
  moveController?: ReturnType<typeof fileMoveController>,
) {
  const router = Router();
  router.get("/policy", authenticate, controller.getPolicy);
  router.post(
    "/",
    authenticate,
    oneFileUpload,
    cleanupUploadedFile,
    controller.upload,
  );
  if (queryController) {
    router.get("/", authenticate, queryController.list);
    router.get("/:fileId", authenticate, queryController.detail);
  }
  if (contentController) {
    router.get("/:fileId/preview", authenticate, contentController.preview);
    router.get("/:fileId/download", authenticate, contentController.download);
  }
  if (deleteController)
    router.delete("/:fileId", authenticate, deleteController.remove);
  if (moveController)
    router.patch("/:fileId", authenticate, moveController.move);
  return router;
}
