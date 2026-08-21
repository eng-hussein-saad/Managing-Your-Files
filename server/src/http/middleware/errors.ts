import type { ErrorRequestHandler, RequestHandler } from "express";
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
      failure(response, error.status, error.code, error.message, error.fields);
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
