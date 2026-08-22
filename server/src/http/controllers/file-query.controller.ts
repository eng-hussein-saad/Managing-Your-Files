import type { RequestHandler } from "express";
import {
  fileIdSchema,
  fileQuerySchema,
} from "../schemas/file-query.schemas.js";
import { success } from "../respond.js";
import type { FindFilesService } from "../../modules/files/services/find-files.service.js";
import { fileNotFound } from "../../modules/files/file.errors.js";
/** Builds owner-scoped file discovery endpoints. */
export function fileQueryController(service: FindFilesService) {
  /** Returns a validated owner-scoped collection page. */ const list: RequestHandler =
    async (request, response, next) => {
      try {
        const query = fileQuerySchema.parse(request.query);
        const result = await service.list(
          (response.locals.identity as { subject: string }).subject,
          query,
        );
        response.status(200).json({ success: true, ...result });
      } catch (error) {
        next(error);
      }
    };
  /** Returns safe details while converging malformed and absent identifiers. */ const detail: RequestHandler =
    async (request, response, next) => {
      try {
        const parsed = fileIdSchema.safeParse(request.params.fileId);
        if (!parsed.success) throw fileNotFound();
        success(
          response,
          200,
          await service.detail(
            (response.locals.identity as { subject: string }).subject,
            parsed.data,
          ),
        );
      } catch (error) {
        next(error);
      }
    };
  return { list, detail };
}
