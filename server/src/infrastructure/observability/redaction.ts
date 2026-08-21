const sensitiveKeys =
  /password|code(?:hash)?|token|authorization|cookie|secret|database_url|connection/i;

/** Deeply replaces credential-bearing structured fields before operational output. */
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        sensitiveKeys.test(key) ? "[REDACTED]" : redact(child),
      ]),
    );
  return value;
}
