/** Produces safe display-only filenames while preserving a useful human label. */
export function normalizeDisplayName(value: string): string {
  // Control ranges and path separators cannot remain in a display label.
  // eslint-disable-next-line no-control-regex
  const normalized = value.normalize("NFC").replace(/[\u0000-\u001F\u007F/\\]/g, " ").trim();
  return normalized.slice(0, 255) || "unnamed-file";
}
