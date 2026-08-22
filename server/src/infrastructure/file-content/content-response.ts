import type { Response } from "express";

/** Produces a header-safe fallback filename for legacy user agents. */
// Control ranges are intentionally removed from HTTP header values.
// eslint-disable-next-line no-control-regex
function fallbackName(value: string): string { return value.normalize("NFC").replace(/[\r\n\\/\u0000-\u001F\u007F]/g, "_").replace(/[^\x20-\x7E]/g, "_").slice(0, 150) || "download"; }
/** Applies private, verified content headers without exposing storage details. */
// Control ranges are intentionally removed from HTTP header values.
// eslint-disable-next-line no-control-regex
export function setContentHeaders(response: Response, input: { name: string; mimeType: string; size: number; disposition: "inline" | "attachment" }): void { const sanitized = input.name.normalize("NFC").replace(/[\r\n\\/\u0000-\u001F\u007F]/g, "_"); const fallback = fallbackName(sanitized); const encoded = encodeURIComponent(sanitized).replace(/['()]/g, escape); response.setHeader("Content-Type", input.mimeType); response.setHeader("Content-Length", String(input.size)); response.setHeader("Content-Disposition", `${input.disposition}; filename="${fallback}"; filename*=UTF-8''${encoded}`); response.setHeader("Cache-Control", "private, no-store"); response.setHeader("X-Content-Type-Options", "nosniff"); }
