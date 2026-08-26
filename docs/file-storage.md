# File storage and lifecycle

Fileora keeps each file in two coordinated systems:

- The **binary object** lives in a private Supabase Storage bucket under a generated key.
- **File metadata** lives in PostgreSQL: owner, optional folder, display name, storage key, detected MIME type, byte size, optional extracted text, and timestamps.

The browser never receives Supabase credentials, storage keys, or signed provider URLs. Express authorizes each operation and accesses Supabase through the `StoragePort` abstraction. Supabase authentication is disabled in this adapter; Fileora's application authentication remains owned by Express and PostgreSQL.

## Selection and upload queue

The files page loads `GET /api/v1/files/policy` before accepting a selection. The response includes the server's allowed MIME list, 5 MiB size limit, ten-file batch limit, and current 100 MiB owner quota.

`UploadDropzone` accepts drag/drop and picker input. `useUploadQueue` rejects an entire new selection if policy is unavailable, the active pending/error queue plus selection exceeds ten, any item is oversized or has an unsupported browser-reported MIME, or selected bytes exceed advertised remaining quota. These checks improve feedback only; the server repeats authoritative checks.

The queue sends files sequentially, one multipart request per file. Axios reports byte progress for the active item. A later failure does not roll back earlier successful requests, and each failed item can be retried independently.

## Server upload pipeline

1. `POST /api/v1/files` requires a current bearer identity.
2. Multer accepts exactly one `file` part plus at most one field, writes a generated temporary filename under the operating system temp directory, and rejects transport size beyond the limit.
3. The controller validates optional `folderId` and normalizes the multipart filename encoding.
4. `UploadFileService` reads the temporary bytes and enforces the 5 MiB ceiling.
5. `detectAllowedMime` inspects the content rather than trusting the browser or extension:
   - PDF, JPEG, PNG, and WebP use detected signatures.
   - DOCX must be a ZIP containing `[Content_Types].xml` and `word/document.xml`.
   - Text must decode as strict UTF-8 and contain no prohibited control characters.
6. The service generates `users/{ownerId}/files/{fileId}`; the original filename cannot become a provider path.
7. Inside a transaction it validates folder ownership, locks the owner's lifecycle, recalculates quota, and rejects totals above 100 MiB.
8. It uploads the object with overwrite disabled.
9. PDF and text extraction runs best-effort within byte, time, page, and character bounds. Images and DOCX have no extraction implementation.
10. It inserts canonical metadata and returns a browser-safe summary.
11. A successful mutation appends a best-effort audit row.
12. Response completion or connection close schedules temporary-file removal.

Display filenames are Unicode-normalized, have control/path separators replaced, are trimmed to 255 characters, and fall back to `unnamed-file`.

## Extraction, preview, and download

Text extraction accepts strict UTF-8 text up to the configured extraction byte limit and one million characters. PDF extraction runs PDF.js in a worker, bounded to five seconds, 200 pages, and one million characters. Extraction errors do not fail upload; metadata stores `extractedContent=null` and reports extraction unavailable.

Preview support is derived from detected MIME:

| Type | Inline preview | Extracted text |
| --- | --- | --- |
| PDF | Yes, browser iframe | Best effort |
| UTF-8 text | Yes, browser iframe | Best effort |
| JPEG/PNG/WebP | Yes, image element | No |
| DOCX | No; download remains available | No |

Preview and download call Express, not Supabase. The service:

1. Loads metadata by both file ID and authenticated owner.
2. Rejects preview when the MIME has no preview kind.
3. Downloads the object through `StoragePort` with the expected maximum size.
4. Rechecks the same owner and storage key after retrieval.
5. Requires the returned byte count to equal metadata.
6. Streams with private/no-store, no-sniff, safe content-disposition, length, and MIME headers.

The browser creates a short-lived object URL for the returned Blob and revokes it after use. Downloads use an attachment disposition; previews use inline disposition.

## Discovery and folders

File search, filter, sort, and pagination are server-driven:

- Case-insensitive name search, up to 200 characters.
- Type categories: `pdf`, `text`, `image`, or `document`.
- Optional root/owned-folder scope.
- Sort by name, size, or upload time in ascending or descending direction.
- Page sizes 5, 10, or 20; default 20.

Counts and pages use the same owner-scoped filters and deterministic tie-breaking. Detail adds the complete root-first folder path and extracted content.

Folders have a virtual root, fixed parent, maximum depth ten, and owner-scoped breadcrumbs. Sibling names are compared after trim, Unicode normalization, and case folding. Folder deletion is permanent and allowed only when no direct children or files remain. Moving a file accepts either root or another owned folder.

## Deletion and quota

User file deletion is permanent; there is no soft-delete column, Trash, or restore flow. Deletion locks the owner's lifecycle, removes the storage object first, and deletes metadata only afterward. A provider not-found is treated as idempotent absence. Other storage failures become a retryable `503`, leaving metadata intact.

Administrator file deletion follows the same object-first path but uses the trusted database owner and requires exact filename plus `updatedAt` confirmation. Administrators can see metadata and delete; they cannot preview or download another user's content.

Quota is the sum of current `FILE.size` rows for the owner. The upload transaction locks that owner's lifecycle before recalculating and inserting, preventing concurrent requests from independently overspending the 100 MiB allowance. Deletion reduces used quota when metadata is removed.

## Failure and consistency behavior

### Storage upload succeeds, metadata creation fails

`UploadFileService` tracks whether upload completed. Any later error triggers best-effort `StoragePort.remove(key)` before rethrowing. If compensation also fails, the request still fails and an orphan object may remain; there is no background reconciliation worker in this repository.

### Metadata exists, storage deletion fails

The service does not delete metadata and returns `503 SERVICE_UNAVAILABLE`. Retrying is safe. If the provider reports the object absent, metadata deletion proceeds.

### Provider is unavailable

Startup refuses traffic when it cannot prove the configured bucket exists and is private. Runtime upload/download/delete failures are mapped to safe retryable responses without provider details.

### Invalid upload

Multer transport violations become `400 VALIDATION_FAILED` or `413 FILE_TOO_LARGE`. Byte validation returns `415 FILE_TYPE_UNSUPPORTED`; quota returns `422 FILE_QUOTA_EXCEEDED` with a quota snapshot in `meta`.

### Cross-owner access

List, detail, move, preview, download, and delete all use the authenticated owner ID. Another user's identifier returns the same generic not-found response as an absent resource.

### Extraction fails

Upload remains successful. Extraction state becomes unavailable, but preview/download can still operate when the original MIME supports them.

See [Architecture](architecture.md), [Authorization](authorization.md), and [Services and Data Access](server/services-and-data-access.md).
