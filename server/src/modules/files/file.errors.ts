import { AppError } from "../auth/auth.errors.js";
export const fileNotFound =
  /** Implements the local fileNotFound operation. */ () =>
    new AppError(
      404,
      "RESOURCE_NOT_FOUND",
      "The requested resource was not found.",
    );
export const fileTooLarge =
  /** Implements the local fileTooLarge operation. */ () =>
    new AppError(413, "FILE_TOO_LARGE", "The file exceeds the 5 MB limit.");
export const unsupportedFile =
  /** Implements the local unsupportedFile operation. */ () =>
    new AppError(
      415,
      "FILE_TYPE_UNSUPPORTED",
      "This file type is not supported.",
    );
export const quotaExceeded =
  /** Implements the local quotaExceeded operation. */ (
    quota = { usedBytes: "0", remainingBytes: "0", limitBytes: "104857600" },
  ) =>
    new AppError(
      422,
      "FILE_QUOTA_EXCEEDED",
      "This upload exceeds your available storage.",
      undefined,
      quota,
    );
export const previewUnavailable =
  /** Implements the local previewUnavailable operation. */ () =>
    new AppError(
      415,
      "PREVIEW_UNAVAILABLE",
      "Preview is unavailable for this file.",
    );
export const retryableFileFailure =
  /** Implements the local retryableFileFailure operation. */ () =>
    new AppError(
      503,
      "SERVICE_UNAVAILABLE",
      "The file operation can be retried.",
    );
