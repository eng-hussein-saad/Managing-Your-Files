# Feature Specification: User File Management

**Feature Branch**: `main` (no branch-creation hook configured)

**Created**: 2026-08-21

**Status**: Draft

**Input**: User description: "Read IMPLEMENTATION_PLAN.md and create a specification for phase 2 ONLY. Use Supabase Storage for object/file storage only. Limit each file to 5 MB and each user to 100 MB of total stored file content because the Supabase Free plan provides 1 GB of file storage. Do not soft-delete files or folders; soft deletion applies only to users."

## Clarifications

### Session 2026-08-22

- Q: Which file formats must Phase 2 accept at launch? → A: PDF, plain text, JPEG, PNG, WebP, and DOCX.
- Q: How should DOCX files be previewed in Phase 2? → A: Show preview unavailable and provide download only.
- Q: What period and grouping should the Phase 2 upload-history chart use? → A: Last 30 local calendar days, grouped daily.
- Q: How deeply may users nest folders in Phase 2? → A: Maximum 10 folder levels beneath the root.
- Q: How many files may a user submit in one upload batch? → A: Maximum 10 files per batch.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Upload Files with Clear Feedback (Priority: P1)

An authenticated user adds one or several files by dragging them into the application or selecting them from the device. The user sees validation results and progress for each file, so one rejected or failed item does not obscure the outcome of the others.

**Why this priority**: Uploading creates the content that every other Phase 2 experience organizes, discovers, previews, downloads, or summarizes.

**Independent Test**: Upload a mixed batch containing valid, invalid, and operationally failed files through both input methods; verify per-file progress and outcomes, persisted metadata for successful files, and no accessible partial records for unsuccessful files.

**Acceptance Scenarios**:

1. **Given** an authenticated user and one allowed file within the configured size limit, **When** the user uploads it with the file picker, **Then** the user sees its progress and completion and the file appears in their files.
2. **Given** an authenticated user and several allowed files, **When** the user drops them into the upload area, **Then** each file has independent progress and outcome feedback and every successful file becomes available without requiring the entire batch to succeed.
3. **Given** a file whose size or verified content type is not allowed, **When** it is selected, **Then** immediate feedback identifies the affected file and rule, and authoritative validation prevents it from being stored even if client-side checks are bypassed.
4. **Given** a file accepted initially but whose storage or metadata operation fails, **When** the upload ends, **Then** the user sees a safe retryable failure for that file and the system leaves no accessible file record that points to unavailable content.
5. **Given** a successful upload, **When** storage and audit records are inspected, **Then** the object is held in the configured private Supabase Storage bucket under a system-generated key rather than the submitted filename as a path, and the audit event contains no private file content.
6. **Given** a supported text-bearing file, **When** processing completes, **Then** extracted text is available from the file details; an unsupported or failed extraction instead produces an explicit unavailable state without making the uploaded file unusable.
7. **Given** a file of exactly 5 MB, **When** an eligible user uploads it, **Then** it passes the size boundary; a file even one byte larger is rejected before storage with a clear per-file message.
8. **Given** an upload would raise the user's currently stored content above 100 MB, **When** quota admission is evaluated, **Then** that file is rejected without storing content or metadata and the user sees current usage, remaining capacity, and the 100 MB limit.
9. **Given** a multi-file batch is individually valid but cannot fit entirely within the user's remaining quota, **When** it is processed, **Then** files are admitted in the user's displayed selection order while capacity remains and every remaining file receives an individual quota-exceeded result.
10. **Given** a PDF, plain-text, JPEG, PNG, WebP, or DOCX file that satisfies the size and content checks, **When** the user uploads it, **Then** the format is accepted; every other format is rejected as unsupported at launch.
11. **Given** a user selects up to 10 files, **When** the batch is submitted, **Then** each file is processed independently; selecting more than 10 files is rejected before upload with a clear batch-limit message.

---

### User Story 2 - Find and Inspect Owned Files (Priority: P1)

An authenticated user browses only their existing files, narrows the collection through search and filters, changes its order, moves between result pages, and opens a file to inspect its metadata and available content.

**Why this priority**: Users need to reliably locate and understand uploaded content before organization features or analytics provide meaningful value.

**Independent Test**: Seed more files than fit on one page across several names, types, dates, sizes, and folders; exercise each query control and open a result while attempting the same operations against another user's identifiers.

**Acceptance Scenarios**:

1. **Given** an authenticated user with files, **When** the user opens My Files, **Then** a responsive paginated collection displays only that user's existing files with appropriate loading and failure states.
2. **Given** files with varied names and types, **When** the user searches, filters, sorts, or changes page, **Then** the returned collection and result count reflect the combined server-evaluated query and retain a deterministic order.
3. **Given** no matching files, **When** a collection or query is shown, **Then** the user receives a clear empty state that distinguishes no uploads from no search matches.
4. **Given** one of the user's files, **When** the user opens its details, **Then** the original filename, type, size, upload date, folder location, and extracted-content availability are shown.
5. **Given** a file owned by another user or an unknown or deleted file identifier, **When** the user requests its list entry or details directly, **Then** no file metadata or existence-sensitive information is disclosed.

---

### User Story 3 - Preview and Download Files Securely (Priority: P1)

An authenticated user previews supported content and downloads an owned file with its expected filename and content information. Unsupported previews remain understandable and never prevent downloading an otherwise valid file.

**Why this priority**: Viewing and retrieving content are the core payoff of secure file storage and require strict ownership enforcement.

**Independent Test**: Preview an image, a PDF or browser-previewable document, text content, and an unsupported type; download each owned file and directly attempt preview and download of another user's file.

**Acceptance Scenarios**:

1. **Given** an owned active image, **When** the user requests a preview, **Then** the image is displayed without exposing storage credentials or a reusable unauthorized access path.
2. **Given** an owned active PDF, browser-previewable document, or text-bearing file, **When** the user requests a preview, **Then** the supported representation is shown in an accessible reusable preview experience.
3. **Given** an owned file whose format cannot be previewed, **When** the preview area opens, **Then** it explains that preview is unavailable and keeps the download action available.
4. **Given** an owned file, **When** the user downloads it, **Then** the complete content is returned with the original filename and correct content metadata and a sanitized download audit event is recorded.
5. **Given** another user's, deleted, or nonexistent file, **When** preview or download is requested directly, **Then** access is denied before any content or storage location is exposed.
6. **Given** an owned DOCX file, **When** the user opens its preview area, **Then** an explicit unsupported-preview state is shown and the original file remains available to download.

---

### User Story 4 - Organize Files in Nested Folders (Priority: P2)

An authenticated user creates a personal folder hierarchy, browses it with breadcrumbs, renames folders, and moves files between the root and owned folders.

**Why this priority**: Organization becomes valuable after upload and discovery work, especially as a user's collection grows.

**Independent Test**: Create at least three nested levels, navigate by folder and breadcrumb, rename a folder, move files between root and nested locations, and attempt cross-user folder access and mutations.

**Acceptance Scenarios**:

1. **Given** an authenticated user at the root or inside an owned folder, **When** the user creates a valid uniquely named child folder, **Then** it appears in that location and a sanitized folder-creation audit event is recorded.
2. **Given** an owned folder, **When** the user renames it to a valid name not already used by a sibling folder, **Then** the new name is shown throughout navigation without changing its contents.
3. **Given** nested owned folders, **When** the user browses into one or selects a breadcrumb ancestor, **Then** the correct child folders and files are shown and every breadcrumb segment resolves to an owned existing folder.
4. **Given** an owned file, **When** the user moves it to the root or another owned folder, **Then** it disappears from the old location, appears in the destination, and remains owned by the same user.
5. **Given** a request involving another user's folder, **When** the user attempts to read, rename, delete, create a child beneath it, or move a file into it, **Then** the operation is denied without disclosing the other folder's details.
6. **Given** an owned folder at level ten beneath the virtual root, **When** the user attempts to create a child folder, **Then** creation is rejected with a clear nesting-limit message and the hierarchy remains unchanged.

---

### User Story 5 - Permanently Delete Files and Empty Folders (Priority: P2)

An authenticated user permanently deletes an owned file after a clear irreversible-action confirmation and may permanently delete an empty owned folder. Successful file deletion removes both its metadata and stored object and immediately returns its size to the user's available quota.

**Why this priority**: Users need control over unwanted content and scarce storage quota, while explicit confirmation and empty-folder rules prevent accidental cascading loss.

**Independent Test**: Confirm and cancel permanent file deletion, verify metadata and stored content removal plus reclaimed quota, permanently delete an empty folder, reject deletion of a non-empty folder, and attempt deletion using another user's identifiers.

**Acceptance Scenarios**:

1. **Given** an owned file, **When** the user starts deletion, **Then** the confirmation clearly states that deletion is permanent; when the user confirms and deletion succeeds, its Supabase object and metadata record are removed, it becomes unavailable everywhere, its byte size is returned to the user's quota, and a sanitized deletion audit event remains recorded.
2. **Given** a pending file or folder deletion, **When** the user cancels the confirmation, **Then** no data, content, location, or audit state changes.
3. **Given** an owned folder with no files or child folders, **When** the user confirms deletion, **Then** its metadata record is permanently removed from navigation and the action is audited.
4. **Given** a folder containing any file or child folder, **When** deletion is requested, **Then** deletion is rejected with guidance to empty the folder first and nothing is cascaded.
5. **Given** file-object or metadata removal cannot be completed, **When** deletion is attempted, **Then** the operation is not reported as successful, quota is not overstated as reclaimed, and a safe retryable outcome is provided while reconciliation prevents a usable orphan or dangling file state.
6. **Given** another user's or nonexistent item, **When** deletion is requested directly, **Then** the operation does not alter data or disclose protected item details.

---

### User Story 6 - Understand Personal Storage Activity (Priority: P3)

An authenticated user opens a dashboard to understand current file count, current storage use, file-type distribution, and upload activity over time without manually processing the whole file collection.

**Why this priority**: Analytics improve awareness and planning but depend on the core upload and lifecycle behaviors.

**Independent Test**: Prepare known files across types and dates, permanently delete selected files, open the dashboard, and compare every displayed aggregate and quota value with the remaining stored files while verifying another user's data is excluded.

**Acceptance Scenarios**:

1. **Given** an authenticated user with stored files and files that were permanently deleted, **When** the dashboard loads, **Then** total file count and storage usage include exactly that user's currently stored file records.
2. **Given** stored files of several content types, **When** file-type distribution is shown, **Then** every existing file is counted once in a clear normalized type category.
3. **Given** uploads within and before the rolling 30-day window, **When** upload history is shown, **Then** it contains one daily bucket for each of the last 30 local calendar dates including today, counts files by original upload date, includes zero-value days, and excludes earlier uploads.
4. **Given** a user with no files, **When** the dashboard loads, **Then** all totals show zero and charts present a clear empty state rather than an error.
5. **Given** dashboard data is unavailable, **When** the user opens the dashboard, **Then** a safe error and retry path appear without stale values being presented as current.
6. **Given** an authenticated user, **When** storage quota status is shown, **Then** it displays current stored-file usage, remaining capacity, and the 100 MB limit; after permanent deletion succeeds, usage decreases by the deleted file's byte size.

### Edge Cases

- Two files with the same original filename are uploaded to the same folder; both remain distinct, safely stored items and are distinguishable by metadata.
- A submitted filename contains path separators, control characters, misleading extensions, or unusual Unicode; it is preserved only as safe display metadata and never controls storage location or response headers unsafely.
- Client-reported type and verified content type disagree; authoritative validation uses the verified result and rejects disallowed content.
- An upload reaches the configured size boundary exactly; the authoritative inclusive/exclusive rule is consistent in immediate and server validation and is documented beside the configured limit.
- Two uploads for the same user concurrently pass initial client checks near the 100 MB boundary; authoritative admission ensures their combined stored content never exceeds 100 MB and rejects whichever file falls after the available capacity is reserved.
- A quota-admitted upload fails before becoming a stored object; any provisional capacity is released so a failed upload does not consume the user's quota.
- A file deletion is retried after a timeout or unknown result; the operation is idempotent, does not delete another object, and converges on one permanently deleted file with quota reclaimed once.
- A multi-file batch is interrupted or partially fails; completed files remain available, failed files are individually retryable, and incomplete storage artifacts are not exposed as files.
- Extraction is slow or fails; per-file progress remains active until the upload outcome is resolved, and an extraction failure leaves the successful file usable with an unavailable state without exposing processing errors.
- A file is deleted or moved while its list, preview, download, or dashboard request is in flight; the latest authorized lifecycle state wins and stale content is not newly exposed.
- Pagination changes after a deletion or concurrent upload; the user is returned to a valid page and receives no duplicate rows within one ordered result set.
- Search text is empty, whitespace-only, very long, or contains special characters; it is safely normalized or rejected and cannot alter authorization boundaries.
- Folder names differ only by surrounding whitespace or letter case; sibling-name comparison uses trimmed, case-insensitive names to prevent confusing duplicates.
- A parent folder is permanently deleted concurrently with a child operation; the empty-folder rule prevents any existing item from being stranded and the hierarchy remains acyclic.
- A user attempts to create a folder beneath a level-ten folder; authoritative validation rejects the operation without creating a partial folder or changing the existing hierarchy.
- Stored content is missing or unavailable for an otherwise active record; preview and download fail safely with an actionable message and no storage internals.
- Audit recording fails during an important state change; the operation fails without committing the state change so required audit history and business state cannot diverge.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Every Phase 2 operation MUST require an authenticated user and MUST enforce ownership at the authoritative service boundary for files, folders, previews, downloads, queries, and statistics.
- **FR-002**: File and folder operations involving another user's, deleted, malformed, or nonexistent identifier MUST fail without returning protected metadata, content, storage references, hierarchy details, or existence-sensitive distinctions.
- **FR-003**: Users MUST be able to select files through drag-and-drop and a traditional picker and submit between 1 and 10 files in one interaction. A selection above 10 files MUST be rejected before content upload with a clear batch-limit message.
- **FR-004**: The upload experience MUST show validation, progress, success, and failure independently for every selected file and MUST allow successful items in a partial batch to remain successful.
- **FR-005**: Every uploaded file MUST be authoritatively limited to 5 MB, defined as 5,242,880 bytes. Files at exactly that size MAY pass other validation, while any larger file MUST be rejected before storage. The launch allowlist MUST accept PDF, plain text, JPEG, PNG, WebP, and DOCX files after authoritative content-type verification and MUST reject every other format; immediate validation MAY provide earlier feedback but MUST NOT authorize storage.
- **FR-006**: The system MUST safely normalize display filenames and MUST generate storage identifiers that cannot be controlled as paths by a submitted filename.
- **FR-007**: A successful upload MUST atomically result in accessible stored content and an active metadata record containing owner, optional folder, original display name, storage reference, verified content type, size, and lifecycle timestamps; failures MUST leave no active dangling record or accessible partial content.
- **FR-008**: Supported text-bearing formats MUST make extracted text available from file details. The final upload outcome MUST distinguish available and unavailable extraction, and extraction failure MUST NOT invalidate an otherwise successful upload.
- **FR-009**: Users MUST be able to browse a responsive collection of only their own existing files with distinct loading, no-files, no-matches, and error states.
- **FR-010**: File collections MUST support combined server-evaluated search by original filename, filtering by normalized file-type category and folder location, sorting by original filename, size, or upload date in either direction, and pagination.
- **FR-011**: Collection requests MUST validate query values, use documented defaults and maximum page size, return total matching count and page information, and apply a stable secondary order so records do not unpredictably repeat or disappear between pages of unchanged data.
- **FR-012**: Users MUST be able to view an owned file's original filename, verified content type, size, upload date, current folder path, extracted-content state and content when available, preview availability, download action, and deletion action.
- **FR-013**: The system MUST preview owned active JPEG, PNG, and WebP images, PDFs, and plain-text content through accessible reusable experiences. DOCX files and every other unsupported type MUST show an explicit unsupported-preview state while preserving the download action; Phase 2 MUST NOT convert DOCX files into another preview format.
- **FR-014**: Preview access MUST be time-limited or request-bound, MUST recheck current authorization and lifecycle state before content is exposed, and MUST NOT reveal reusable storage credentials or internal storage locations.
- **FR-015**: Users MUST be able to download an owned file in full with a safely encoded original filename, correct content type, and correct content length when known.
- **FR-016**: Users MUST be able to create nested owned folders at the root or beneath another owned folder, browse folder contents, and navigate to existing ancestors through breadcrumbs. A hierarchy MUST contain no more than 10 persisted folder levels beneath the virtual root, and attempts to create level 11 MUST be rejected without mutation.
- **FR-017**: Active sibling folders MUST have non-empty names that are unique after trimming surrounding whitespace and comparing without letter-case differences.
- **FR-018**: Users MUST be able to rename an owned folder without changing its contents or parent, subject to the same folder-name rules as creation.
- **FR-019**: Users MUST be able to move an owned file between the root and any owned folder without changing ownership or file metadata unrelated to location.
- **FR-020**: A folder's parent MUST be selected only when the folder is created, MUST belong to the same owner, and MUST NOT be changed afterward in Phase 2; the empty-folder deletion rule MUST prevent a file or folder from being stranded beneath a removed ancestor.
- **FR-021**: Breadcrumbs MUST start at the user's file root, show each active ancestor in order, and provide navigation only to authorized active locations.
- **FR-022**: File deletion MUST require explicit irreversible-action confirmation and, on success, MUST permanently remove both the owned file's metadata record and corresponding Supabase Storage object. It MUST emit the required sanitized audit event and return the deleted file's byte size to available user quota exactly once.
- **FR-023**: Folder deletion MUST require explicit irreversible-action confirmation and MUST permanently remove only an owned folder with no child folders and no files; deletion MUST NOT cascade.
- **FR-024**: Files and folders MUST NOT have soft-delete markers, trash states, restore operations, or retained deleted records. After successful deletion, their identifiers MUST no longer resolve through lists, searches, navigation, details, previews, downloads, destination choices, or statistics.
- **FR-025**: File deletion MUST be idempotent and MUST not be reported as successful until metadata, stored-object, quota, and audit outcomes are consistent. Partial provider or persistence failures MUST produce a safe retryable outcome and MUST be reconciled without exposing a usable orphaned object, leaving an accessible metadata record that points to missing content, or reclaiming quota more than once.
- **FR-026**: The dashboard MUST return ownership-scoped aggregate data for total file count, total stored bytes, file-type distribution, upload counts in daily buckets for the rolling 30 local calendar days including the current day, total quota usage, remaining quota capacity, and the fixed 100 MB quota.
- **FR-027**: Dashboard aggregates and quota usage MUST be calculated from authoritative currently stored file records, MUST exclude permanently deleted files and every other user's data, and MUST return zero-valued results and continuity periods where needed for a useful empty or time-series display.
- **FR-028**: User-facing asynchronous workflows MUST provide responsive, keyboard-operable, accessibly labeled loading, success, empty, validation, confirmation, and error states in the existing complete light theme.
- **FR-029**: Upload, download, file deletion, folder creation, folder rename, folder deletion, and file move outcomes MUST produce audit events through the shared audit capability with actor, action, target, outcome, timestamp, and sanitized useful metadata.
- **FR-030**: Required audit events MUST NOT contain file content, extracted text, submitted path fragments, storage credentials, internal storage locations, authentication secrets, or more filename information than operationally necessary.
- **FR-031**: When required audit persistence fails, the associated important state-changing operation MUST fail without committing its business-state change; failed preview and download authorization MUST expose no content, while successful downloads MUST have a completed audit event.
- **FR-032**: All Phase 2 inputs, including uploaded content, filenames, folder names, identifiers, query controls, and configuration, MUST be validated at the authoritative boundary and failures MUST use the existing safe predictable response contract.
- **FR-033**: File, folder, and aggregate behavior MUST align with the approved `FILE` and `FOLDER` ownership, hierarchy, metadata, and permanent-deletion contracts in `database-schema.mmd`. The approved schema change removes `FILE.deletedAt` and `FOLDER.deletedAt` and adds `USER.deletedAt`; no other schema deviation is authorized by this specification.
- **FR-034**: The system MUST document every Phase 2 configuration setting with a non-secret example, classification, purpose, validation rule, and deployment mapping and MUST refuse startup when a required value is missing or invalid.
- **FR-035**: Phase 2 verification MUST include upload-boundary, ownership-isolation, query-combination, pagination-stability, preview/download authorization, fixed folder-parent behavior, permanent file and empty-folder deletion, quota reclamation, dashboard accuracy, audit redaction, configuration, accessibility, and responsive-layout evidence.
- **FR-036**: Supabase Storage MUST be the Phase 2 object/file-storage provider and MUST remain behind the project's storage boundary. The configured bucket MUST be private; privileged Supabase credentials MUST remain server-only; and every upload, preview, download, and future storage mutation MUST first pass the application's own authentication, ownership, lifecycle, and validation rules. Phase 2 MUST NOT use Supabase Authentication, Supabase Database, or other Supabase products as replacements for the approved application identity or persistence systems.
- **FR-037**: Each user MUST be limited to 100 MB of currently stored file content, defined as 104,857,600 bytes. The quota MUST count each owned stored file object exactly once and MUST exclude failed uploads and successfully deleted objects.
- **FR-038**: Before storing each file, the system MUST authoritatively admit its byte size against the user's remaining quota in a concurrency-safe manner so simultaneous uploads and multi-file batches cannot raise retained usage above 100 MB. A failed storage or metadata operation MUST release any provisional quota capacity.
- **FR-039**: Quota rejection MUST identify the affected file and safely report the user's current retained usage, remaining capacity, and fixed limit. Multi-file batches MUST evaluate files in displayed selection order and preserve successful earlier files while individually rejecting files that no longer fit.

### Requirement Verification Map

| Requirement group | Acceptance evidence |
| --- | --- |
| FR-001–FR-002, FR-032–FR-036 | Cross-user direct-request tests, invalid-input contract checks, schema comparison, private-storage and secret-exposure checks, configuration checks, responsive accessibility review, and the Phase 2 completion journey |
| FR-003–FR-008, FR-037–FR-039 | User Story 1 scenarios plus exact 5 MB boundary, exact 100 MB boundary, concurrent quota admission, deterministic partial-batch, quota-release, spoofed-type, interrupted-upload, storage-failure, and extraction-state tests |
| FR-009–FR-012 | User Story 2 scenarios plus combined-query, invalid-query, deterministic-pagination, empty-state, and concurrent-change tests |
| FR-013–FR-015 | User Story 3 scenarios plus content-header, expired-access, deleted-during-request, and missing-storage-object tests |
| FR-016–FR-021 | User Story 4 scenarios plus sibling-name, cross-owner, fixed-parent, deleted-ancestor, and concurrent create/delete tests |
| FR-022–FR-025 | User Story 5 scenarios plus irreversible confirmation, cancel, repeated deletion, object/metadata consistency, empty-folder enforcement, audit preservation, and exact quota-reclamation checks |
| FR-026–FR-027 | User Story 6 scenarios plus post-deletion usage, cross-user isolation, zero-period, normalized-category, and displayed-date-boundary checks |
| FR-028–FR-031 | All user stories plus keyboard/accessibility review and audit completeness, failure consistency, and prohibited-data scans |

### Key Entities

- **File**: One user-owned uploaded item matching the approved `FILE` contract, with an optional folder, original display filename, generated storage reference, verified content type, byte size, optional extracted text, and lifecycle timestamps. It has no soft-delete marker and is removed permanently with its stored object.
- **Folder**: One user-owned organizational location matching the approved `FOLDER` contract, with a name, optional same-owner parent, and lifecycle timestamps. Parent relationships form an acyclic hierarchy rooted at the user's virtual file root; an empty folder is removed permanently.
- **Audit Event**: An immutable record of an important Phase 2 action matching the approved `AUDIT_LOG` contract, including actor, action, target, timestamp, and sanitized metadata. Phase 2 creates events but provides no audit-reading interface.
- **File Query**: A transient ownership-scoped request describing search text, type and folder filters, sort field and direction, page, and page size, with a result containing matching existing files and pagination metadata.
- **User File Statistics**: A transient ownership-scoped summary of current file count, stored bytes, normalized type distribution, upload counts grouped over a displayed time range, and quota status.

### Configuration Contract

The following names are the Phase 2 configuration contract. Planning MAY refine documented non-security defaults but MUST update this specification before renaming, adding, or removing a key.

| Setting | Classification | Purpose / validation |
| --- | --- | --- |
| `UPLOAD_MAX_FILE_SIZE_BYTES` | Non-secret, server-only | Required value `5242880`, representing the fixed inclusive 5 MB per-file limit; any other value is invalid unless this specification is revised |
| `USER_STORAGE_QUOTA_BYTES` | Non-secret, server-only | Required value `104857600`, representing the fixed 100 MB currently stored-content quota per user; any other value is invalid unless this specification is revised |
| `UPLOAD_ALLOWED_MIME_TYPES` | Non-secret, server-only | Required explicit allowlist matching the launch formats PDF, plain text, JPEG, PNG, WebP, and DOCX; the client may receive the effective public list for immediate feedback, and changing the supported format set requires revising this specification |
| `UPLOAD_MAX_FILES_PER_BATCH` | Non-secret, server-only | Required value `10`; the client may receive the effective public limit for immediate feedback, and any other value is invalid unless this specification is revised |
| `SUPABASE_URL` | Non-secret, server-only | Required absolute project API URL used only by the server-side Supabase Storage integration |
| `SUPABASE_SECRET_KEY` | Secret, server-only | Required current-format `sb_secret_...` credential used only by the trusted server for Storage operations; must never enter browser code, responses, URLs, logs, or public-prefixed configuration |
| `SUPABASE_STORAGE_BUCKET` | Non-secret, server-only | Required existing private bucket name dedicated to application file objects; startup verification must reject a missing or public bucket |
| `FILE_QUERY_DEFAULT_PAGE_SIZE` | Non-secret, server-only | Positive default number of collection results per page |
| `FILE_QUERY_MAX_PAGE_SIZE` | Non-secret, server-only | Positive maximum at least as large as the default; larger requests are rejected or safely capped according to the documented contract |
| `FILE_EXTRACTION_MAX_BYTES` | Non-secret, server-only | Positive maximum content size eligible for text extraction; larger accepted files remain downloadable and show extraction unavailable |

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: At least 90% of first-time test participants can upload a valid three-file batch through either drag-and-drop or the picker and correctly identify each file's progress and final outcome without assistance in under 2 minutes.
- **SC-002**: In ownership-isolation testing across at least two users and every file and folder read or mutation path, 100% of cross-user attempts are denied with zero protected metadata, content, hierarchy, or storage references disclosed.
- **SC-003**: At least 95% of file collection requests containing up to 10,000 owned records present the first page or a clear failure state within 2 seconds under the agreed verification environment, and unchanged ordered results contain no duplicates across consecutive pages.
- **SC-004**: In a mixed batch of 10 files containing valid, oversized, disallowed, and operationally failed items, 100% receive an individual final status and 100% of successful files remain usable without an active dangling record for failed files; an 11-file selection is rejected before upload.
- **SC-005**: Users can locate a known file by search or type/folder filter, open its details, and initiate preview or download in no more than 5 user actions from My Files in at least 90% of usability trials.
- **SC-006**: 100% of supported preview samples render an appropriate representation, 100% of unsupported samples show a clear fallback, and every tested owned existing file remains downloadable with the expected filename and content.
- **SC-007**: In hierarchy tests through the ten-level boundary, 100% of valid folder creation, rename, navigation, breadcrumb, and file-move actions preserve ownership and reachability, while 100% of level-eleven creation, folder-parent changes, deleted-ancestor access, cross-user access, and non-empty-folder deletion attempts are rejected without data loss.
- **SC-008**: After successful file or empty-folder deletion, 100% of tested lists, searches, details, previews, downloads, destination choices, breadcrumbs, and dashboard aggregates exclude the item; its metadata record is absent, deleted file content is absent from storage, and quota decreases by exactly the deleted file size.
- **SC-009**: Dashboard totals and distributions match a known verification dataset exactly, and each of the 30 daily upload-history buckets differs from its expected original-upload count by zero, including days with no uploads and records on local-date boundaries.
- **SC-010**: 100% of required successful Phase 2 state changes and downloads produce structurally complete audit events, with zero prohibited secrets, file content, extracted text, or storage locations found in audit and error-output scans.
- **SC-011**: At least 90% of usability participants correctly understand upload rejection, no-results, unsupported-preview, non-empty-folder deletion, and retryable failure states without assistance.
- **SC-012**: In boundary and concurrency tests, 100% of files larger than 5,242,880 bytes are rejected, files exactly at the boundary remain eligible, and no user's currently stored content exceeds 104,857,600 bytes even when at least 20 uploads are submitted concurrently.

## Assumptions

- Phase 1 authentication, authorization, common response contracts, application shells, user identity, file/folder data foundations, and audit capability are complete and available to Phase 2.
- Phase 2 provides a complete accessible light theme; dark and system theme controls remain Phase 3 work.
- The per-file limit is fixed at 5 MB (5,242,880 bytes), the per-user currently stored-content quota is fixed at 100 MB (104,857,600 bytes), the launch format allowlist is fixed, and the maximum batch count is fixed at 10. Extraction size and page sizes remain environment-configured and are surfaced to users where they affect interaction.
- One upload batch contains at most 10 files; the client may surface this server-enforced limit before submission.
- Text extraction is required for plain text and PDFs whose text can be safely extracted within configured limits. Images remain usable with extraction unavailable. DOCX files are accepted for storage and download but have extraction and preview unavailable in Phase 2. Additional upload formats require a specification revision and must preserve the same available and unavailable user contract.
- Multiple files may have the same original filename, including in the same folder. Folder names, unlike file display names, are unique among active siblings after trimming and case-insensitive comparison.
- Search matches original filenames case-insensitively. File-type filters use a documented normalized category derived from the verified content type rather than trusting the filename extension.
- The default file order is newest upload first with a stable identifier as a tie-breaker. Default and maximum page sizes are finalized through the configuration contract during planning.
- The user's virtual root is not a persisted folder and cannot be renamed or deleted.
- Folder depth counts persisted folders beneath the virtual root; levels one through ten are allowed, and level eleven is rejected.
- Users move files during Phase 2, but moving folders is deferred; nested folder placement is selected at creation.
- Deleting a folder requires it to contain no child folder and no file. Files and folders are permanently deleted and have no deleted state or restore path.
- Dashboard storage usage and quota usage are both the sum of authoritative byte sizes for currently stored owned files; upload history is based on original upload timestamps, not move or update time.
- Upload history covers the rolling 30 local calendar days including today, uses one bucket per day, and uses the user's browser-displayed local timezone while authoritative timestamps remain unambiguous.
- Required Phase 2 audit failure prevents the associated important state change from committing. Successful download is considered complete only when its required audit event is recorded before content delivery begins.
- Audit records continue to follow the constitutional default: no application-facing read API or UI and no automated deletion. Audit viewing remains Phase 3 work.
- Supabase is used only for object/file storage. The existing application server remains responsible for authentication, authorization, metadata persistence, audit decisions, and generation of any narrowly time-limited file access. Supabase Authentication, Supabase Database, and direct browser use of privileged Supabase credentials are not part of Phase 2.
- The application uses a private Supabase Storage bucket and a backend-only current-format Supabase secret key. Legacy `service_role` credentials and browser-side publishable keys are not required by this Phase 2 storage contract.
- The 100 MB per-user quota is a product allocation chosen to conserve the Supabase Free plan's current 1 GB organization-level file-storage allowance. It does not by itself guarantee that aggregate usage across more than ten fully allocated users remains within the provider allowance; provider-wide capacity monitoring or admission control is a separate operational concern unless added through an approved requirement.

## Dependencies

- A completed Phase 1 identity and authorization layer capable of identifying the current user for every protected operation.
- The approved `database-schema.mmd` file, folder, user, and audit contracts and an applied compatible data schema.
- A Supabase project with an existing private Storage bucket and a rotatable backend-only secret key, accessed through the project's storage boundary.
- The shared audit capability and safe common success/error contracts established in Phase 1.
- Browser capabilities for file selection, drag-and-drop, progress presentation, image/document display, and downloads.

## Out of Scope

- Administrator user management, role changes, global file management, administrator statistics, and audit-log viewing (Phase 3).
- Dark and system theme support and the theme selector (Phase 3).
- File/folder trash browsing, restore, retention after deletion, or soft deletion. These entities are permanently deleted in Phase 2.
- Moving folders after creation, folder sharing, file sharing, collaboration, version history, editing file contents, and public links.
- DOCX text extraction, visual conversion, and preview rendering; accepted DOCX files remain downloadable.
- Docker support, deployment hardening, the complete cross-phase automated test suite, and final developer documentation beyond Phase 2 configuration changes (Phase 4). Supabase Storage provider selection and integration are Phase 2 responsibilities, not a deferred Phase 4 migration.
- Supabase Authentication, Supabase Database, Supabase Realtime, and any Supabase product other than Storage.
- Upload formats other than PDF, plain text, JPEG, PNG, WebP, and DOCX.
- Further changes to the approved database schema beyond the explicitly approved move of nullable `deletedAt` from `FILE` and `FOLDER` to `USER`; any additional difference must follow the constitution's planning-time comparison and maintainer-approval process.
