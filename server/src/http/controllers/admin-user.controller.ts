import type { RequestHandler } from "express";
import type { AdminUserService } from "../../modules/users/admin-user.service.js";
import type { AdminUserDeletionService } from "../../modules/users/admin-user-deletion.service.js";
import { success } from "../respond.js";
import {
  adminRoleChangeSchema,
  adminUserDeleteSchema,
  adminUserIdParamsSchema,
  adminUserQuerySchema,
  parseAdminParams,
  parseAdminQuery,
} from "../schemas/admin.schemas.js";

/** Builds strict administrator user request handlers. */
export function adminUserController(
  service: AdminUserService,
  deletion?: AdminUserDeletionService,
) {
  /** Lists a validated deterministic user page. */
  const list: RequestHandler = async (request, response, next) => {
    try {
      const result = await service.list(parseAdminQuery(adminUserQuerySchema, request.query));
      success(response, 200, result.data, result.meta);
    } catch (error) {
      next(error);
    }
  };
  /** Returns one validated browser-safe user detail. */
  const detail: RequestHandler = async (request, response, next) => {
    try {
      const { userId } = parseAdminParams(adminUserIdParamsSchema, request.params);
      success(response, 200, await service.detail(userId));
    } catch (error) {
      next(error);
    }
  };
  /** Applies one confirmed role mutation without automatic retry. */
  const changeRole: RequestHandler = async (request, response, next) => {
    try {
      const { userId } = parseAdminParams(adminUserIdParamsSchema, request.params);
      const body = adminRoleChangeSchema.parse(request.body);
      const actorId = (response.locals.identity as { subject: string }).subject;
      success(
        response,
        200,
        await service.changeRole(actorId, userId, body, response.locals.requestId as string),
      );
    } catch (error) {
      next(error);
    }
  };
  /** Permanently deletes one target after strict typed confirmation. */
  const remove: RequestHandler = async (request, response, next) => {
    try {
      if (!deletion) throw new Error("Administrator deletion storage is unavailable");
      const { userId } = parseAdminParams(adminUserIdParamsSchema, request.params);
      const body = adminUserDeleteSchema.parse(request.body);
      const actorId = (response.locals.identity as { subject: string }).subject;
      await deletion.delete(actorId, userId, body, response.locals.requestId as string);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  };
  return { list, detail, changeRole, remove };
}
