import { AppError } from "../auth/auth.errors.js";
export const folderNotFound =
  /** Implements the local folderNotFound operation. */ () =>
    new AppError(
      404,
      "RESOURCE_NOT_FOUND",
      "The requested resource was not found.",
    );
export const folderNameConflict =
  /** Implements the local folderNameConflict operation. */ () =>
    new AppError(
      409,
      "FOLDER_NAME_CONFLICT",
      "A folder with that name already exists here.",
    );
export const folderDepthExceeded =
  /** Implements the local folderDepthExceeded operation. */ () =>
    new AppError(
      422,
      "FOLDER_DEPTH_EXCEEDED",
      "Folders can be nested up to ten levels.",
    );
export const folderNotEmpty =
  /** Implements the local folderNotEmpty operation. */ () =>
    new AppError(
      409,
      "FOLDER_NOT_EMPTY",
      "Empty this folder before deleting it.",
    );
