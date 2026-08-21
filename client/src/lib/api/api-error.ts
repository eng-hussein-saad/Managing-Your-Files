import axios from "axios";
import type { ErrorCode, ErrorEnvelope } from "@gold-era/contracts/public";

/** Extracts a documented API error code for flow-specific recovery. */
export function apiErrorCode(error: unknown): ErrorCode | undefined {
  if (
    axios.isAxiosError<ErrorEnvelope>(error) &&
    error.response?.data.success === false
  ) {
    return error.response.data.error.code;
  }
  return undefined;
}

/** Extracts a safe display message from a documented API failure. */
export function apiErrorMessage(error: unknown): string {
  if (
    axios.isAxiosError<ErrorEnvelope>(error) &&
    error.response?.data.success === false
  )
    return error.response.data.error.message;
  return "Something went wrong. Please try again.";
}
