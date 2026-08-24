import { z } from "zod";
import {
  adminAuditQuerySchema,
  adminFileDeleteSchema,
  adminFileQuerySchema,
  adminRoleChangeSchema,
  adminUserDeleteSchema,
  adminUserQuerySchema,
} from "@gold-era/contracts/public";

export const adminUserIdParamsSchema = z.object({ userId: z.uuid() }).strict();
export const adminFileIdParamsSchema = z.object({ fileId: z.uuid() }).strict();
export {
  adminAuditQuerySchema,
  adminFileDeleteSchema,
  adminFileQuerySchema,
  adminRoleChangeSchema,
  adminUserDeleteSchema,
  adminUserQuerySchema,
};

/** Parses route parameters through a strict administrator boundary schema. */
export function parseAdminParams<T>(schema: z.ZodType<T>, value: unknown): T {
  return schema.parse(value);
}

/** Parses and normalizes administrator query input through a strict schema. */
export function parseAdminQuery<T>(schema: z.ZodType<T>, value: unknown): T {
  return schema.parse(value);
}
