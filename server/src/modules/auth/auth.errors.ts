import type { ErrorCode } from "@gold-era/contracts/public";

/** Represents a safe expected HTTP failure without internal details. */
export class AppError extends Error {
  /** Creates a safe operational error suitable for the common response envelope. */
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly fields?: Array<{ field: string; message: string }>,
  ) {
    super(message);
  }
}
