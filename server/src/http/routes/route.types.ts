import type { registrationController } from "../controllers/registration.controller.js";
import type { trustedAuthController } from "../controllers/trusted-auth.controller.js";
export type ReturnTypeRegistrationController = ReturnType<
  typeof registrationController
>;
export type ReturnTypeTrustedAuthController = ReturnType<
  typeof trustedAuthController
>;
