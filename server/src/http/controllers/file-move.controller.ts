import type { RequestHandler } from "express";
import { fileIdSchema } from "../schemas/file-query.schemas.js";
import { moveFileSchema } from "../schemas/folder.schemas.js";
import { success } from "../respond.js";
import { fileNotFound } from "../../modules/files/file.errors.js";
import type { MoveFileService } from "../../modules/files/services/move-file.service.js";

/** Builds the owner-authorized file move endpoint. */
export function fileMoveController(service: MoveFileService) {
  /** Validates both identifiers and returns the updated public file representation. */
  const move: RequestHandler = async (request, response, next) => {
    try {
      const parsed = fileIdSchema.safeParse(request.params.fileId);
      if (!parsed.success) throw fileNotFound();
      const input = moveFileSchema.parse(request.body);
      success(
        response,
        200,
        await service.move(
          (response.locals.identity as { subject: string }).subject,
          parsed.data,
          input.folderId,
        ),
      );
    } catch (error) {
      next(error);
    }
  };
  return { move };
}
