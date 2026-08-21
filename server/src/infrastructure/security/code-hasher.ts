import { randomInt } from "node:crypto";
import { passwordHasher, type PasswordHasher } from "./password-hasher.js";

/** Generates an unpredictable fixed-width decimal verification code. */
export function generateVerificationCode(): string {
  return randomInt(0, 100_000_000).toString().padStart(8, "0");
}
export const codeHasher: PasswordHasher = passwordHasher;
