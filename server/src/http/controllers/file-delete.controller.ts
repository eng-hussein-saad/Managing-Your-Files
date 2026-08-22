import type { RequestHandler } from "express";
import { fileIdSchema } from "../schemas/file-query.schemas.js";
import type { DeleteFileService } from "../../modules/files/services/delete-file.service.js";
import { fileNotFound } from "../../modules/files/file.errors.js";
/** Builds the permanent owner-authorized file deletion handler. */
export function fileDeleteController(service: DeleteFileService) {
  /** Permanently removes an owned file while converging malformed identifiers. */ const remove: RequestHandler =
    async (request, response, next) => {
      try {
        const parsed = fileIdSchema.safeParse(request.params.fileId);
        if (!parsed.success) throw fileNotFound();
        await service.delete(
          (response.locals.identity as { subject: string }).subject,
          parsed.data,
        );
        response.status(204).end();
      } catch (error) {
        next(error);
      }
    };
  return { remove };
}
