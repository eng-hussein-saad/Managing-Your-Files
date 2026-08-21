import type { RequestHandler } from "express";
import type { AuditService } from "../../modules/audit/audit.service.js";
import type { AuthenticatedIdentity } from "./authenticate.js";
import { failure } from "../respond.js";
/** Enforces administrator role claims at the Express boundary and audits denials. */
export function requireAdmin(audit: AuditService): RequestHandler {
  return async (_request, response, next) => {
    const identity = response.locals.identity as
      | AuthenticatedIdentity
      | undefined;
    if (identity?.role !== "ADMIN") {
      await audit.bestEffort({
        actorId: identity?.subject,
        action: "auth.authorization_denied",
        entityType: "USER",
        entityId: identity?.subject,
        metadata: { outcome: "DENIED", reasonCode: "ROLE_REQUIRED" },
      });
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
