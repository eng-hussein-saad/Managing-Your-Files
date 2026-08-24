import type { RequestHandler } from "express";
import type { AdminFileService } from "../../modules/files/services/admin-file.service.js";
import { success } from "../respond.js";
import {
  adminFileDeleteSchema,
  adminFileIdParamsSchema,
  adminFileQuerySchema,
  parseAdminParams,
  parseAdminQuery,
} from "../schemas/admin.schemas.js";

/** Builds metadata-only global file administration handlers. */
export function adminFileController(service: AdminFileService) {
  /** Lists a validated deterministic global file page. */
  const list: RequestHandler = async (request, response, next) => {
    try {
      const result = await service.list(parseAdminQuery(adminFileQuerySchema, request.query));
      success(response, 200, result.data, result.meta);
    } catch (error) {
      next(error);
    }
  };
  /** Returns one metadata-only file detail. */
  const detail: RequestHandler = async (request, response, next) => {
    try {
      const { fileId } = parseAdminParams(adminFileIdParamsSchema, request.params);
      success(response, 200, await service.detail(fileId));
    } catch (error) {
      next(error);
    }
  };
  /** Permanently removes one file after target-specific confirmation. */
  const remove: RequestHandler = async (request, response, next) => {
    try {
      const { fileId } = parseAdminParams(adminFileIdParamsSchema, request.params);
      const body = adminFileDeleteSchema.parse(request.body);
      const actorId = (response.locals.identity as { subject: string }).subject;
      await service.delete(actorId, fileId, body, response.locals.requestId as string);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  };
  return { list, detail, remove };
}
