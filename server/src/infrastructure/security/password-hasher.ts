import { hash, verify } from "@node-rs/argon2";

export interface PasswordHasher {
  hash(value: string): Promise<string>;
  verify(hashValue: string, value: string): Promise<boolean>;
}
export const passwordHasher: PasswordHasher = {
  /** Hashes a password with Argon2id defaults hardened for interactive authentication. */
  hash: (value) =>
    hash(value, {
      algorithm: 2,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    }),
  /** Compares a password with an encoded Argon2id hash. */
  verify: (hashValue, value) => verify(hashValue, value),
};
