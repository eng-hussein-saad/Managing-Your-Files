import { Router } from "express";
import {
  emailRequestSchema,
  registerRequestSchema,
  verifyEmailRequestSchema,
} from "@gold-era/contracts/public";
import type { ReturnTypeRegistrationController } from "./route.types.js";
import { validateBody } from "../middleware/validate.js";
/** Mounts public registration and email-verification operations. */
export function authPublicRoutes(
  controller: ReturnTypeRegistrationController,
): Router {
  const router = Router();
  router.post(
    "/register",
    validateBody(registerRequestSchema),
    controller.register,
  );
  router.post(
    "/verify-email",
    validateBody(verifyEmailRequestSchema),
    controller.verify,
  );
  router.post(
    "/resend-verification",
    validateBody(emailRequestSchema),
    controller.resend,
  );
  return router;
}
