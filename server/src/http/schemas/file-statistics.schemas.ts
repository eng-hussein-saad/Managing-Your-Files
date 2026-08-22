import { z } from "zod";
export const statisticsQuerySchema = z
  .object({
    timeZone: z
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
      }),
  })
  .strict();
