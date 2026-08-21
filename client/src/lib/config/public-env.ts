import { z } from "zod";
const publicEnvSchema = z
  .object({ NEXT_PUBLIC_API_BASE_URL: z.url() })
  .strict();
/** Validates the only configuration value permitted in browser bundles. */
export function publicEnv() {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  });
}
