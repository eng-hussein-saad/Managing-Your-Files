import type { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { AppError } from "../../modules/auth/auth.errors.js";
import type { Logger } from "../../infrastructure/observability/logger.js";
import { failure } from "../respond.js";

/** Produces a stable not-found failure without exposing routing internals. */
export const notFound: RequestHandler = (_request, response) =>
  failure(
    response,
    404,
    "VALIDATION_FAILED",
    "The requested resource was not found.",
  );
/** Translates known operational errors and redacts unexpected failures. */
export function errorHandler(log: Logger): ErrorRequestHandler {
  return (error: unknown, _request, response, next) => {
    void next;
    if (error instanceof AppError) {
      failure(
        response,
        error.status,
        error.code,
        error.message,
        error.fields,
        error.meta,
      );
      return;
    }
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        failure(
          response,
          413,
          "FILE_TOO_LARGE",
          "The file exceeds the 5 MB limit.",
        );
        return;
      }
      failure(
        response,
        400,
        "VALIDATION_FAILED",
        "Attach exactly one file using valid multipart fields.",
      );
      return;
    }
    if (error instanceof ZodError) {
      failure(
        response,
        400,
        "VALIDATION_FAILED",
        "The request contains invalid values.",
        error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      );
      return;
    }
    log.error("Unhandled request failure", { error });
    failure(
      response,
      503,
      "SERVICE_UNAVAILABLE",
      "The service is temporarily unavailable.",
    );
  };
}
