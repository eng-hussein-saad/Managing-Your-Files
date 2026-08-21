import { Router } from "express";
import { success } from "../respond.js";
/** Creates the non-sensitive liveness route. */
export function healthRoutes(): Router {
  const router = Router();
  router.get("/health", (_request, response) =>
    success(response, 200, { status: "ok" }),
  );
  return router;
}
