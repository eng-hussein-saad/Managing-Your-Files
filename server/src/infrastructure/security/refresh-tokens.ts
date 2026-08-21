import { createHash, randomBytes } from "node:crypto";

/** Generates a uniformly random opaque refresh credential. */
export function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}
/** Creates the one-way database lookup representation of a refresh credential. */
export function hashRefreshToken(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
