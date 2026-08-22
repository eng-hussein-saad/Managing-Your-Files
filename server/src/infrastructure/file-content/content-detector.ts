import { fileTypeFromBuffer } from "file-type";
import yauzl, { type Entry } from "yauzl";
import type { AllowedMimeType } from "../../modules/files/file.types.js";

const docxMime =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document" as const;
/** Detects permitted bytes without trusting browser-provided MIME data or extensions. */
export async function detectAllowedMime(
  bytes: Uint8Array,
): Promise<AllowedMimeType | null> {
  const detected = await fileTypeFromBuffer(bytes).catch(
    /** Converts the rejected operation into its documented safe fallback. */ () =>
      undefined,
  );
  if (
    detected?.mime === "application/pdf" ||
    detected?.mime === "image/jpeg" ||
    detected?.mime === "image/png" ||
    detected?.mime === "image/webp"
  )
    return detected.mime;
  if (detected?.mime === "application/zip" && (await hasDocxMarkers(bytes)))
    return docxMime;
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return hasProhibitedTextControl(decoded) ? null : "text/plain";
  } catch {
    return null;
  }
}
/** Rejects C0 controls other than tab, line feed, and carriage return. */
function hasProhibitedTextControl(value: string): boolean {
  return [...value].some(
    /** Evaluates this collection item against the surrounding predicate. */ (
      character,
    ) => {
      const code = character.codePointAt(0) ?? 0;
      return code < 32 && code !== 9 && code !== 10 && code !== 13;
    },
  );
}
/** Checks DOCX ZIP member names before classifying a generic ZIP as a document. */
function hasDocxMarkers(bytes: Uint8Array): Promise<boolean> {
  return new Promise(
    /** Executes the bounded callback owned by this constructed operation. */ (
      resolve,
    ) => {
      yauzl.fromBuffer(
        Buffer.from(bytes),
        { lazyEntries: true },
        /** Executes the callback required by the surrounding operation. */ (
          error,
          zip,
        ) => {
          if (error || !zip) return resolve(false);
          const names = new Set<string>();
          zip.on(
            "entry",
            /** Handles the named one-shot or streamed infrastructure event. */ (
              entry: Entry,
            ) => {
              names.add(entry.fileName);
              if (
                names.has("[Content_Types].xml") &&
                names.has("word/document.xml")
              ) {
                zip.close();
                resolve(true);
                return;
              }
              zip.readEntry();
            },
          );
          zip.on(
            "end",
            /** Handles the named one-shot or streamed infrastructure event. */ () =>
              resolve(false),
          );
          zip.on(
            "error",
            /** Handles the named one-shot or streamed infrastructure event. */ () =>
              resolve(false),
          );
          zip.readEntry();
        },
      );
    },
  );
}
