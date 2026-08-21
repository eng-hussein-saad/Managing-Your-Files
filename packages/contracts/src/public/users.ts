import { z } from "zod";
import { successEnvelope } from "./envelopes.js";

export const roleSchema = z.enum(["USER", "ADMIN"]);
export const safeUserSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
    role: roleSchema,
    isEmailVerified: z.boolean(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const userResponseSchema = successEnvelope(safeUserSchema);
export type Role = z.infer<typeof roleSchema>;
export type SafeUser = z.infer<typeof safeUserSchema>;
