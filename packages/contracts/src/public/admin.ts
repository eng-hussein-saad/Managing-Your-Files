import { z } from "zod";
import { successEnvelope } from "./envelopes.js";
export const adminAccessResponseSchema = successEnvelope(
  z.object({ allowed: z.literal(true) }).strict(),
);
