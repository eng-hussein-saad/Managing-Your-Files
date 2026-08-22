import { z } from "zod";
import {
  decimalBytesSchema,
  fileTypeCategorySchema,
  quotaSnapshotSchema,
} from "./files.js";

export const ianaTimeZoneSchema = z
  .string()
  .min(1)
  .max(100)
  .refine((value) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Must be an IANA time zone");
export const fileStatisticsSchema = z
  .object({
    fileCount: z.number().int().nonnegative(),
    storedBytes: decimalBytesSchema,
    quota: quotaSnapshotSchema,
    typeDistribution: z.array(
      z
        .object({
          type: fileTypeCategorySchema,
          count: z.number().int().nonnegative(),
        })
        .strict(),
    ),
    uploadHistory: z
      .array(
        z
          .object({ date: z.iso.date(), count: z.number().int().nonnegative() })
          .strict(),
      )
      .length(30),
    timeZone: ianaTimeZoneSchema,
  })
  .strict();
export type FileStatistics = z.infer<typeof fileStatisticsSchema>;
