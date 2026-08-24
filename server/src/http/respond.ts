import type { Response } from "express";
import type { ErrorCode } from "@gold-era/contracts/public";

/** Sends a typed success result using the one public envelope. */
export function success(
  response: Response,
  status: number,
  data: unknown,
  meta?: Record<string, unknown>,
): void {
  response.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
}
/** Sends a safe failure using the one public error envelope. */
export function failure(
  response: Response,
  status: number,
  code: ErrorCode,
  message: string,
  fields?: Array<{ field: string; message: string }>,
  meta?: Record<string, unknown>,
): void {
  response.status(status).json({
    success: false,
    error: {
      code,
      message,
      fields,
      requestId: response.locals.requestId as string | undefined,
    },
    ...(meta ? { meta } : {}),
  });
}
