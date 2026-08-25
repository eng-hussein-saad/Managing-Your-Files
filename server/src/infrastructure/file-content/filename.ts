/** Repairs UTF-8 multipart filename bytes exposed by parsers as Latin-1 text. */
export function decodeMultipartFilename(value: string): string {
  // A correctly decoded non-Latin filename must never be passed through Latin-1.
  if (Array.from(value).some((character) => character.codePointAt(0)! > 255))
    return value;

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      Buffer.from(value, "latin1"),
    );
  } catch {
    // Preserve genuine Latin-1 text when its bytes are not valid UTF-8.
    return value;
  }
}

/** Produces safe display-only filenames while preserving a useful human label. */
export function normalizeDisplayName(value: string): string {
  // Control ranges and path separators cannot remain in a display label.
  // eslint-disable-next-line no-control-regex
  const normalized = value.normalize("NFC").replace(/[\u0000-\u001F\u007F/\\]/g, " ").trim();
  return normalized.slice(0, 255) || "unnamed-file";
}
