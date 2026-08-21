import type { RequestHandler } from "express";
import type { AccessTokenService } from "../../infrastructure/security/access-tokens.js";
import { failure } from "../respond.js";

export interface AuthenticatedIdentity {
  subject: string;
  role: "USER" | "ADMIN";
}
/** Validates bearer credentials and exposes only fail-closed identity claims. */
export function authenticate(accessTokens: AccessTokenService): RequestHandler {
  return async (request, response, next) => {
    const header = request.header("authorization");
    if (!header?.startsWith("Bearer ")) {
      failure(response, 401, "AUTH_REQUIRED", "Authentication is required.");
      return;
    }
    try {
      response.locals.identity = await accessTokens.verify(header.slice(7));
      next();
    } catch {
      failure(
        response,
        401,
        "AUTH_ACCESS_INVALID",
        "The access credential is invalid or expired.",
      );
    }
  };
}
