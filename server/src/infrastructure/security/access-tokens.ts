import { jwtVerify, SignJWT } from "jose";
import type { Role } from "@gold-era/contracts/public";

export interface AccessClaims {
  subject: string;
  role: Role;
}
export interface AccessTokenService {
  issue(claims: AccessClaims): Promise<string>;
  verify(token: string): Promise<AccessClaims>;
}

/** Builds the pinned-algorithm access-token authority. */
export function createAccessTokenService(
  secret: string,
  issuer: string,
  audience: string,
  ttlSeconds: number,
): AccessTokenService {
  const key = new TextEncoder().encode(secret);
  return {
    /** Signs one short-lived access credential with required identity claims. */
    issue: async ({ subject, role }) =>
      new SignJWT({ role })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(subject)
        .setIssuer(issuer)
        .setAudience(audience)
        .setIssuedAt()
        .setExpirationTime(`${ttlSeconds}s`)
        .sign(key),
    /** Verifies signature, algorithm, issuer, audience, identity, role, and expiry. */
    verify: async (token) => {
      const result = await jwtVerify(token, key, {
        algorithms: ["HS256"],
        issuer,
        audience,
      });
      if (
        !result.payload.sub ||
        (result.payload.role !== "USER" && result.payload.role !== "ADMIN")
      )
        throw new Error("Invalid access-token claims");
      return { subject: result.payload.sub, role: result.payload.role };
    },
  };
}
