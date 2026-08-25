import type { RequestHandler } from "express";
import type { AuthenticatedIdentity } from "./authenticate.js";
import { failure } from "../respond.js";
/** Enforces administrator role claims at the Express boundary. */
export function requireAdmin(): RequestHandler {
  return (_request, response, next) => {
    const identity = response.locals.identity as
      | AuthenticatedIdentity
      | undefined;
    if (identity?.role !== "ADMIN") {
      failure(
        response,
        403,
        "AUTH_FORBIDDEN",
        "Administrator permission is required.",
      );
      return;
    }
    next();
  };
}
