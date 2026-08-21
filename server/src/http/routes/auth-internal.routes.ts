import { Router } from "express";
import {
  loginRequestSchema,
  optionalRawRefreshRequestSchema,
  rawRefreshRequestSchema,
} from "@gold-era/contracts/internal";
import type { ReturnTypeTrustedAuthController } from "./route.types.js";
import { validateBody } from "../middleware/validate.js";
/** Mounts trust-protected operations that may handle raw refresh material. */
export function authInternalRoutes(
  controller: ReturnTypeTrustedAuthController,
): Router {
  const router = Router();
  router.post("/login", validateBody(loginRequestSchema), controller.login);
  router.post(
    "/refresh",
    validateBody(rawRefreshRequestSchema),
    controller.refresh,
  );
  router.post(
    "/logout",
    validateBody(optionalRawRefreshRequestSchema),
    controller.logout,
  );
  return router;
}
