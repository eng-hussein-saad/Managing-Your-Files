import type { PrismaClient } from "@prisma/client";
import type { RequestHandler } from "express";
import type { AuthenticatedIdentity } from "../middleware/authenticate.js";
import { toSafeUser } from "../../modules/users/user.mapper.js";
import { failure, success } from "../respond.js";
/** Returns only the authenticated account's safe public profile. */
export function profileController(prisma: PrismaClient): RequestHandler {
  return async (_request, response, next) => {
    try {
      const identity = response.locals.identity as AuthenticatedIdentity;
      const user = await prisma.user.findUnique({
        where: { id: identity.subject },
      });
      if (!user) {
        failure(response, 401, "AUTH_REQUIRED", "Authentication is required.");
        return;
      }
      success(response, 200, toSafeUser(user));
    } catch (error) {
      next(error);
    }
  };
}
