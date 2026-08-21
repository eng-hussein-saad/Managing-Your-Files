import type { RequestHandler } from "express";
import { trustSecretMatches } from "../../infrastructure/security/trust-secret.js";
import { failure } from "../respond.js";
/** Rejects direct calls to credential-bearing authority operations. */
export function requireBffTrust(secret: string): RequestHandler {
  return (request, response, next) => {
    if (!trustSecretMatches(request.header("x-gold-era-bff-trust"), secret)) {
      failure(
        response,
        401,
        "TRUST_REQUIRED",
        "Trusted gateway authentication is required.",
      );
      return;
    }
    next();
  };
}
