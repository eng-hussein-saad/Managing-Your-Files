import type { RequestHandler } from "express";
import {
  createFolderSchema,
  folderIdSchema,
  folderListQuerySchema,
  renameFolderSchema,
} from "../schemas/folder.schemas.js";
import { success } from "../respond.js";
import { folderNotFound } from "../../modules/folders/folder.errors.js";
import type { ManageFoldersService } from "../../modules/folders/services/manage-folders.service.js";
import type { DeleteFolderService } from "../../modules/folders/services/delete-folder.service.js";

/** Builds authenticated fixed-parent folder handlers. */
export function folderController(
  service: ManageFoldersService,
  deletion: DeleteFolderService,
) {
  /** Lists virtual-root or owned-folder contents. */
  const list: RequestHandler = async (request, response, next) => {
    try {
      const query = folderListQuerySchema.parse(request.query);
      success(
        response,
        200,
        await service.list(
          (response.locals.identity as { subject: string }).subject,
          query.parentId ?? null,
        ),
      );
    } catch (error) {
      next(error);
    }
  };
  /** Returns one owned folder detail and breadcrumb chain. */
  const detail: RequestHandler = async (request, response, next) => {
    try {
      const parsed = folderIdSchema.safeParse(request.params.folderId);
      if (!parsed.success) throw folderNotFound();
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
  /** Creates one fixed-parent folder. */
  const create: RequestHandler = async (request, response, next) => {
    try {
      success(
        response,
        201,
        await service.create(
          (response.locals.identity as { subject: string }).subject,
          createFolderSchema.parse(request.body),
        ),
      );
    } catch (error) {
      next(error);
    }
  };
  /** Renames one owned folder. */
  const rename: RequestHandler = async (request, response, next) => {
    try {
      const parsed = folderIdSchema.safeParse(request.params.folderId);
      if (!parsed.success) throw folderNotFound();
      success(
        response,
        200,
        await service.rename(
          (response.locals.identity as { subject: string }).subject,
          parsed.data,
          renameFolderSchema.parse(request.body).name,
        ),
      );
    } catch (error) {
      next(error);
    }
  };
  /** Permanently deletes one owned empty folder. */
  const remove: RequestHandler = async (request, response, next) => {
    try {
      const parsed = folderIdSchema.safeParse(request.params.folderId);
      if (!parsed.success) throw folderNotFound();
      await deletion.delete(
        (response.locals.identity as { subject: string }).subject,
        parsed.data,
      );
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  };
  return { list, detail, create, rename, remove };
}
