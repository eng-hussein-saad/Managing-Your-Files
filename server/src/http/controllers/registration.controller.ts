import type { RequestHandler } from "express";
import type {
  RegisterRequest,
  VerifyEmailRequest,
} from "@gold-era/contracts/public";
import type { RegistrationService } from "../../modules/auth/registration.service.js";
import type { VerificationService } from "../../modules/auth/verification.service.js";
import type { VerificationResendService } from "../../modules/auth/verification-resend.service.js";
import { success } from "../respond.js";

/** Creates thin public registration handlers around authentication services. */
export function registrationController(
  registration: RegistrationService,
  verification: VerificationService,
  resend: VerificationResendService,
): {
  register: RequestHandler;
  verify: RequestHandler;
  resend: RequestHandler;
} {
  return {
    register: async (request, response, next) => {
      try {
        success(
          response,
          201,
          await registration.register(request.body as RegisterRequest),
        );
      } catch (error) {
        next(error);
      }
    },
    verify: async (request, response, next) => {
      try {
        success(
          response,
          200,
          await verification.verify(request.body as VerifyEmailRequest),
        );
      } catch (error) {
        next(error);
      }
    },
    resend: async (request, response, next) => {
      try {
        const body = request.body as { email: string };
        success(response, 202, await resend.resend(body.email));
      } catch (error) {
        if (error instanceof Error && "status" in error && error.status === 429)
          response.setHeader("Retry-After", "60");
        next(error);
      }
    },
  };
}
