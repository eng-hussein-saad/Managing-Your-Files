import { Router, type RequestHandler } from "express";
/** Mounts administrator operations behind authentication and role enforcement. */
export function adminRoutes(
  authenticate: RequestHandler,
  authorize: RequestHandler,
  access: RequestHandler,
): Router {
  const router = Router();
  router.get("/access-check", authenticate, authorize, access);
  return router;
}
