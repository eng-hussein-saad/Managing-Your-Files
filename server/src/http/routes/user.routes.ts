import { Router, type RequestHandler } from "express";
/** Mounts authenticated user operations. */
export function userRoutes(
  authenticate: RequestHandler,
  profile: RequestHandler,
): Router {
  const router = Router();
  router.get("/me", authenticate, profile);
  return router;
}
