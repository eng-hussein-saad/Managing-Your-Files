import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../../modules/auth/auth.errors.js";

/** Validates and replaces the request body with the normalized schema output. */
export function validateBody(schema: ZodType): RequestHandler {
  return (request, _response, next) => {
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      next(
        new AppError(
          400,
          "VALIDATION_FAILED",
          "Correct the highlighted fields.",
          parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        ),
      );
      return;
    }
    request.body = parsed.data;
    next();
  };
}
