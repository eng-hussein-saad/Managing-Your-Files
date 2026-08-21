import { redact } from "./redaction.js";
export interface Logger {
  error(message: string, context?: unknown): void;
  critical(message: string, context?: unknown): void;
}
export const logger: Logger = {
  /** Emits a redacted structured error to the operational stream. */
  error: (message, context) =>
    console.error(
      JSON.stringify({ level: "error", message, context: redact(context) }),
    ),
  /** Emits a redacted critical fallback when security audit persistence fails. */
  critical: (message, context) =>
    console.error(
      JSON.stringify({ level: "critical", message, context: redact(context) }),
    ),
};
