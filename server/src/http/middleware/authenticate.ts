import type { RequestHandler } from "express";
import type { PrismaClient } from "@prisma/client";
import type { AccessTokenService } from "../../infrastructure/security/access-tokens.js";
import { UserRepository } from "../../modules/users/user.repository.js";
import { failure } from "../respond.js";

export interface AuthenticatedIdentity {
  subject: string;
  role: "USER" | "ADMIN";
}
/** Validates bearer credentials and exposes only fail-closed identity claims. */
export function authenticate(
  accessTokens: AccessTokenService,
  prisma: PrismaClient,
  users = new UserRepository(),
): RequestHandler {
  return async (request, response, next) => {
    const header = request.header("authorization");
    if (!header?.startsWith("Bearer ")) {
      failure(response, 401, "AUTH_REQUIRED", "Authentication is required.");
      return;
    }
    try {
      const claims = await accessTokens.verify(header.slice(7));
      const authority = await users.findVerifiedAuthority(prisma, claims.subject);
      if (!authority || authority.role !== claims.role) throw new Error("stale identity");
      response.locals.identity = claims;
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
