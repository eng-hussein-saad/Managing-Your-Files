# Feature Specification: User File Management

**Feature Branch**: `main` (no branch-creation hook configured)

**Created**: 2026-08-21

**Status**: Draft

**Input**: User description: "Read IMPLEMENTATION_PLAN.md and create a specification for phase 2 ONLY."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Upload Files with Clear Feedback (Priority: P1)

An authenticated user adds one or several files by dragging them into the application or selecting them from the device. The user sees validation results and progress for each file, so one rejected or failed item does not obscure the outcome of the others.

**Why this priority**: Uploading creates the content that every other Phase 2 experience organizes, discovers, previews, downloads, or summarizes.

**Independent Test**: Upload a mixed batch containing valid, invalid, and operationally failed files through both input methods; verify per-file progress and outcomes, persisted metadata for successful files, and no accessible partial records for unsuccessful files.

**Acceptance Scenarios**:

1. **Given** an authenticated user and one allowed file within the configured size limit, **When** the user uploads it with the file picker, **Then** the user sees its progress and completion and the file appears in their active files.
2. **Given** an authenticated user and several allowed files, **When** the user drops them into the upload area, **Then** each file has independent progress and outcome feedback and every successful file becomes available without requiring the entire batch to succeed.
3. **Given** a file whose size or verified content type is not allowed, **When** it is selected, **Then** immediate feedback identifies the affected file and rule, and authoritative validation prevents it from being stored even if client-side checks are bypassed.
4. **Given** a file accepted initially but whose storage or metadata operation fails, **When** the upload ends, **Then** the user sees a safe retryable failure for that file and the system leaves no active file record that points to unavailable content.
5. **Given** a successful upload, **When** storage and audit records are inspected, **Then** the stored object uses a system-generated key rather than the submitted filename as a path and the audit event contains no private file content.
6. **Given** a supported text-bearing file, **When** processing completes, **Then** extracted text is available from the file details; an unsupported or failed extraction instead produces an explicit unavailable state without making the uploaded file unusable.

---

### User Story 2 - Find and Inspect Owned Files (Priority: P1)

An authenticated user browses only their active files, narrows the collection through search and filters, changes its order, moves between result pages, and opens a file to inspect its metadata and available content.

**Why this priority**: Users need to reliably locate and understand uploaded content before organization features or analytics provide meaningful value.

**Independent Test**: Seed more files than fit on one page across several names, types, dates, sizes, and folders; exercise each query control and open a result while attempting the same operations against another user's identifiers.

**Acceptance Scenarios**:

1. **Given** an authenticated user with active files, **When** the user opens My Files, **Then** a responsive paginated collection displays only that user's active files with appropriate loading and failure states.
2. **Given** files with varied names and types, **When** the user searches, filters, sorts, or changes page, **Then** the returned collection and result count reflect the combined server-evaluated query and retain a deterministic order.
3. **Given** no matching active files, **When** a collection or query is shown, **Then** the user receives a clear empty state that distinguishes no uploads from no search matches.
4. **Given** one of the user's active files, **When** the user opens its details, **Then** the original filename, type, size, upload date, folder location, and extracted-content availability are shown.
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
4. **Given** an owned active file, **When** the user downloads it, **Then** the complete content is returned with the original filename and correct content metadata and a sanitized download audit event is recorded.
5. **Given** another user's, deleted, or nonexistent file, **When** preview or download is requested directly, **Then** access is denied before any content or storage location is exposed.

---

### User Story 4 - Organize Files in Nested Folders (Priority: P2)

An authenticated user creates a personal folder hierarchy, browses it with breadcrumbs, renames folders, and moves active files between the root and owned folders.

**Why this priority**: Organization becomes valuable after upload and discovery work, especially as a user's collection grows.

**Independent Test**: Create at least three nested levels, navigate by folder and breadcrumb, rename a folder, move files between root and nested locations, and attempt cross-user and cyclic hierarchy changes.

**Acceptance Scenarios**:

1. **Given** an authenticated user at the root or inside an owned active folder, **When** the user creates a valid uniquely named child folder, **Then** it appears in that location and a sanitized folder-creation audit event is recorded.
2. **Given** an owned active folder, **When** the user renames it to a valid name not already used by a sibling active folder, **Then** the new name is shown throughout navigation without changing its contents.
3. **Given** nested owned folders, **When** the user browses into one or selects a breadcrumb ancestor, **Then** the correct child folders and files are shown and every breadcrumb segment resolves to an owned active folder.
4. **Given** an owned active file, **When** the user moves it to the root or another owned active folder, **Then** it disappears from the old location, appears in the destination, and remains owned by the same user.
5. **Given** a request involving another user's folder, **When** the user attempts to read, rename, delete, parent, or move a file into it, **Then** the operation is denied without disclosing the other folder's details.
6. **Given** an owned folder, **When** the user tries to make it its own descendant, **Then** the operation is rejected and the hierarchy remains unchanged.

---

### User Story 5 - Delete Files and Empty Folders Safely (Priority: P2)

An authenticated user deletes an active file after confirmation and may delete an empty folder. Normal deletion removes items from everyday use without immediately erasing their records or stored file content.

**Why this priority**: Users need control over clutter and unwanted content, while conservative deletion prevents accidental cascading loss and preserves future administrative lifecycle options.

**Independent Test**: Confirm and cancel file deletion, inspect normal queries and statistics afterward, delete an empty folder, reject deletion of a non-empty folder, and attempt deletion using another user's identifiers.

**Acceptance Scenarios**:

1. **Given** an owned active file, **When** the user confirms deletion, **Then** the file is marked deleted, disappears from normal browsing, preview, download, search, and dashboard statistics, and a sanitized deletion audit event is recorded.
2. **Given** a pending file or folder deletion, **When** the user cancels the confirmation, **Then** no data, content, location, or audit state changes.
3. **Given** an owned active folder with no active files or active child folders, **When** the user confirms deletion, **Then** the folder is marked deleted, removed from normal navigation, and audited.
4. **Given** a folder containing any active file or active child folder, **When** deletion is requested, **Then** deletion is rejected with guidance to empty the folder first and nothing is cascaded.
5. **Given** a deleted item, **When** the normal user attempts to restore or permanently delete it in Phase 2, **Then** no such operation is available.
6. **Given** another user's, already-deleted, or nonexistent item, **When** deletion is requested directly, **Then** the operation does not alter data or disclose protected item details.

---

### User Story 6 - Understand Personal Storage Activity (Priority: P3)

An authenticated user opens a dashboard to understand current file count, current storage use, file-type distribution, and upload activity over time without manually processing the whole file collection.

**Why this priority**: Analytics improve awareness and planning but depend on the core upload and lifecycle behaviors.

**Independent Test**: Prepare known active and deleted files across types and dates, open the dashboard, and compare every displayed aggregate with the expected values while verifying another user's data is excluded.

**Acceptance Scenarios**:

1. **Given** an authenticated user with active and deleted files, **When** the dashboard loads, **Then** total file count and storage usage include only that user's active files.
2. **Given** active files of several content types, **When** file-type distribution is shown, **Then** every active file is counted once in a clear normalized type category.
3. **Given** uploads across the dashboard's displayed date range, **When** upload history is shown, **Then** counts are grouped by upload date, include zero-value periods needed for continuity, and use the user's displayed local dates.
4. **Given** a user with no active files, **When** the dashboard loads, **Then** all totals show zero and charts present a clear empty state rather than an error.
5. **Given** dashboard data is unavailable, **When** the user opens the dashboard, **Then** a safe error and retry path appear without stale values being presented as current.

### Edge Cases

- Two files with the same original filename are uploaded to the same folder; both remain distinct, safely stored items and are distinguishable by metadata.
- A submitted filename contains path separators, control characters, misleading extensions, or unusual Unicode; it is preserved only as safe display metadata and never controls storage location or response headers unsafely.
- Client-reported type and verified content type disagree; authoritative validation uses the verified result and rejects disallowed content.
- An upload reaches the configured size boundary exactly; the authoritative inclusive/exclusive rule is consistent in immediate and server validation and is documented beside the configured limit.
- A multi-file batch is interrupted or partially fails; completed files remain available, failed files are individually retryable, and incomplete storage artifacts are not exposed as active files.
- Extraction is slow or fails; per-file progress remains active until the upload outcome is resolved, and an extraction failure leaves the successful file usable with an unavailable state without exposing processing errors.
- A file is deleted or moved while its list, preview, download, or dashboard request is in flight; the latest authorized lifecycle state wins and stale content is not newly exposed.
- Pagination changes after a deletion or concurrent upload; the user is returned to a valid page and receives no duplicate rows within one ordered result set.
- Search text is empty, whitespace-only, very long, or contains special characters; it is safely normalized or rejected and cannot alter authorization boundaries.
- Folder names differ only by surrounding whitespace or letter case; sibling-name comparison uses trimmed, case-insensitive names to prevent confusing duplicates.
- A parent folder is deleted or moved concurrently with a child operation; the hierarchy remains acyclic and no active item becomes reachable through a deleted ancestor.
- Stored content is missing or unavailable for an otherwise active record; preview and download fail safely with an actionable message and no storage internals.
- Audit recording fails during an important state change; the operation fails without committing the state change so required audit history and business state cannot diverge.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Every Phase 2 operation MUST require an authenticated user and MUST enforce ownership at the authoritative service boundary for files, folders, previews, downloads, queries, and statistics.
- **FR-002**: File and folder operations involving another user's, deleted, malformed, or nonexistent identifier MUST fail without returning protected metadata, content, storage references, hierarchy details, or existence-sensitive distinctions.
- **FR-003**: Users MUST be able to select files through drag-and-drop and a traditional picker and submit one or multiple files in one interaction.
- **FR-004**: The upload experience MUST show validation, progress, success, and failure independently for every selected file and MUST allow successful items in a partial batch to remain successful.
- **FR-005**: Uploads MUST be authoritatively validated against configurable maximum file size and allowed verified content types; immediate validation MAY provide earlier feedback but MUST NOT authorize storage.
- **FR-006**: The system MUST safely normalize display filenames and MUST generate storage identifiers that cannot be controlled as paths by a submitted filename.
- **FR-007**: A successful upload MUST atomically result in accessible stored content and an active metadata record containing owner, optional folder, original display name, storage reference, verified content type, size, and lifecycle timestamps; failures MUST leave no active dangling record or accessible partial content.
- **FR-008**: Supported text-bearing formats MUST make extracted text available from file details. The final upload outcome MUST distinguish available and unavailable extraction, and extraction failure MUST NOT invalidate an otherwise successful upload.
- **FR-009**: Users MUST be able to browse a responsive collection of only their own active files with distinct loading, no-files, no-matches, and error states.
- **FR-010**: File collections MUST support combined server-evaluated search by original filename, filtering by normalized file-type category and folder location, sorting by original filename, size, or upload date in either direction, and pagination.
- **FR-011**: Collection requests MUST validate query values, use documented defaults and maximum page size, return total matching count and page information, and apply a stable secondary order so records do not unpredictably repeat or disappear between pages of unchanged data.
- **FR-012**: Users MUST be able to view an owned active file's original filename, verified content type, size, upload date, current folder path, extracted-content state and content when available, preview availability, download action, and deletion action.
- **FR-013**: The system MUST preview owned active images, browser-previewable PDFs or documents, and available text content through accessible reusable experiences; every other type MUST show an explicit unsupported-preview state.
- **FR-014**: Preview access MUST be time-limited or request-bound, MUST recheck current authorization and lifecycle state before content is exposed, and MUST NOT reveal reusable storage credentials or internal storage locations.
- **FR-015**: Users MUST be able to download an owned active file in full with a safely encoded original filename, correct content type, and correct content length when known.
- **FR-016**: Users MUST be able to create nested owned folders at the root or beneath another owned active folder, browse folder contents, and navigate to active ancestors through breadcrumbs.
- **FR-017**: Active sibling folders MUST have non-empty names that are unique after trimming surrounding whitespace and comparing without letter-case differences.
- **FR-018**: Users MUST be able to rename an owned active folder without changing its contents or parent, subject to the same folder-name rules as creation.
- **FR-019**: Users MUST be able to move an owned active file between the root and any owned active folder without changing ownership or file metadata unrelated to location.
- **FR-020**: Folder relationships MUST remain within one owner, MUST never form a cycle, and MUST never place an active folder or file beneath a deleted ancestor.
- **FR-021**: Breadcrumbs MUST start at the user's file root, show each active ancestor in order, and provide navigation only to authorized active locations.
- **FR-022**: File deletion MUST require explicit confirmation and MUST mark the owned active file as deleted rather than immediately deleting its metadata or stored content.
- **FR-023**: Folder deletion MUST require explicit confirmation and MUST be allowed only for an owned active folder with no active child folders and no active files; Phase 2 MUST NOT cascade folder deletion.
- **FR-024**: Deleted files and folders MUST be excluded from all normal user lists, searches, navigation, details, previews, downloads, destination choices, and user statistics.
- **FR-025**: Phase 2 MUST NOT expose restore, trash browsing, storage purge, or permanent-delete operations. Deleted records and stored file content MUST be retained without automated deletion pending a later approved lifecycle policy.
- **FR-026**: The dashboard MUST return ownership-scoped aggregate data for total active file count, total active storage bytes, active-file distribution by normalized type category, and upload counts over a documented date range and interval.
- **FR-027**: Dashboard aggregates MUST be calculated from authoritative records, MUST exclude deleted files and every other user's data, and MUST return zero-valued results and continuity periods where needed for a useful empty or time-series display.
- **FR-028**: User-facing asynchronous workflows MUST provide responsive, keyboard-operable, accessibly labeled loading, success, empty, validation, confirmation, and error states in the existing complete light theme.
- **FR-029**: Upload, download, file deletion, folder creation, folder rename, folder deletion, and file move outcomes MUST produce audit events through the shared audit capability with actor, action, target, outcome, timestamp, and sanitized useful metadata.
- **FR-030**: Required audit events MUST NOT contain file content, extracted text, submitted path fragments, storage credentials, internal storage locations, authentication secrets, or more filename information than operationally necessary.
- **FR-031**: When required audit persistence fails, the associated important state-changing operation MUST fail without committing its business-state change; failed preview and download authorization MUST expose no content, while successful downloads MUST have a completed audit event.
- **FR-032**: All Phase 2 inputs, including uploaded content, filenames, folder names, identifiers, query controls, and configuration, MUST be validated at the authoritative boundary and failures MUST use the existing safe predictable response contract.
- **FR-033**: Normal file, folder, and aggregate queries MUST align with the approved `FILE` and `FOLDER` ownership, hierarchy, metadata, and soft-deletion contracts in `database-schema.mmd`; no schema deviation is authorized by this specification.
- **FR-034**: The system MUST document every Phase 2 configuration setting with a non-secret example, classification, purpose, validation rule, and deployment mapping and MUST refuse startup when a required value is missing or invalid.
- **FR-035**: Phase 2 verification MUST include upload-boundary, ownership-isolation, query-combination, pagination-stability, preview/download authorization, hierarchy-cycle, empty-folder deletion, soft-deletion exclusion, dashboard-accuracy, audit-redaction, configuration, accessibility, and responsive-layout evidence.

### Requirement Verification Map

| Requirement group | Acceptance evidence |
| --- | --- |
| FR-001–FR-002, FR-032–FR-035 | Cross-user direct-request tests, invalid-input contract checks, schema comparison, configuration checks, responsive accessibility review, and the Phase 2 completion journey |
| FR-003–FR-008 | User Story 1 scenarios plus boundary-size, spoofed-type, partial-batch, interrupted-upload, storage-failure, and extraction-state tests |
| FR-009–FR-012 | User Story 2 scenarios plus combined-query, invalid-query, deterministic-pagination, empty-state, and concurrent-change tests |
| FR-013–FR-015 | User Story 3 scenarios plus content-header, expired-access, deleted-during-request, and missing-storage-object tests |
| FR-016–FR-021 | User Story 4 scenarios plus sibling-name, cross-owner, deleted-ancestor, cycle, and concurrent-hierarchy tests |
| FR-022–FR-025 | User Story 5 scenarios plus cancel-confirmation, repeated deletion, normal-query exclusion, retention, and unavailable-restore checks |
| FR-026–FR-027 | User Story 6 scenarios plus deleted-file, cross-user, zero-period, normalized-category, and displayed-date-boundary checks |
| FR-028–FR-031 | All user stories plus keyboard/accessibility review and audit completeness, failure consistency, and prohibited-data scans |

### Key Entities

- **File**: One user-owned uploaded item matching the approved `FILE` contract, with an optional folder, original display filename, generated storage reference, verified content type, byte size, optional extracted text, soft-deletion timestamp, and lifecycle timestamps.
- **Folder**: One user-owned organizational location matching the approved `FOLDER` contract, with a name, optional same-owner parent, soft-deletion timestamp, and lifecycle timestamps. Active parent relationships form an acyclic hierarchy rooted at the user's virtual file root.
- **Audit Event**: An immutable record of an important Phase 2 action matching the approved `AUDIT_LOG` contract, including actor, action, target, timestamp, and sanitized metadata. Phase 2 creates events but provides no audit-reading interface.
- **File Query**: A transient ownership-scoped request describing search text, type and folder filters, sort field and direction, page, and page size, with a result containing matching active files and pagination metadata.
- **User File Statistics**: A transient ownership-scoped summary of active file count, active storage bytes, normalized type distribution, and upload counts grouped over a displayed time range.

### Configuration Contract

The following names are the Phase 2 configuration contract. Planning MAY refine documented non-security defaults but MUST update this specification before renaming, adding, or removing a key.

| Setting | Classification | Purpose / validation |
| --- | --- | --- |
| `UPLOAD_MAX_FILE_SIZE_BYTES` | Non-secret, server-only | Positive integer maximum applied authoritatively to each file; the client may receive the effective public limit for immediate feedback |
| `UPLOAD_ALLOWED_MIME_TYPES` | Non-secret, server-only | Non-empty explicit list of verified content types accepted for upload; the client may receive the effective public list for immediate feedback |
| `UPLOAD_MAX_FILES_PER_BATCH` | Non-secret, server-only | Positive integer limiting one multi-file submission; the client may receive the effective public limit for immediate feedback |
| `FILE_STORAGE_DRIVER` | Non-secret, server-only | Required identifier selecting one supported storage implementation; unsupported values prevent startup |
| `FILE_STORAGE_LOCAL_ROOT` | Non-secret, server-only | Required absolute writable directory only when the local storage implementation is selected; must not resolve inside a public static-content directory |
| `FILE_QUERY_DEFAULT_PAGE_SIZE` | Non-secret, server-only | Positive default number of collection results per page |
| `FILE_QUERY_MAX_PAGE_SIZE` | Non-secret, server-only | Positive maximum at least as large as the default; larger requests are rejected or safely capped according to the documented contract |
| `FILE_EXTRACTION_MAX_BYTES` | Non-secret, server-only | Positive maximum content size eligible for text extraction; larger accepted files remain downloadable and show extraction unavailable |

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: At least 90% of first-time test participants can upload a valid three-file batch through either drag-and-drop or the picker and correctly identify each file's progress and final outcome without assistance in under 2 minutes.
- **SC-002**: In ownership-isolation testing across at least two users and every file and folder read or mutation path, 100% of cross-user attempts are denied with zero protected metadata, content, hierarchy, or storage references disclosed.
- **SC-003**: At least 95% of file collection requests containing up to 10,000 owned records present the first page or a clear failure state within 2 seconds under the agreed verification environment, and unchanged ordered results contain no duplicates across consecutive pages.
- **SC-004**: In a mixed batch of at least 20 files containing valid, oversized, disallowed, and operationally failed items, 100% receive an individual final status and 100% of successful files remain usable without an active dangling record for failed files.
- **SC-005**: Users can locate a known file by search or type/folder filter, open its details, and initiate preview or download in no more than 5 user actions from My Files in at least 90% of usability trials.
- **SC-006**: 100% of supported preview samples render an appropriate representation, 100% of unsupported samples show a clear fallback, and every tested owned active file remains downloadable with the expected filename and content.
- **SC-007**: In hierarchy tests at least three levels deep, 100% of valid create, rename, navigate, breadcrumb, and move actions preserve ownership and reachability, while 100% of cyclic, deleted-ancestor, cross-user, and non-empty-folder deletion attempts are rejected without data loss.
- **SC-008**: After file and empty-folder deletion, 100% of tested normal lists, searches, details, previews, downloads, destination choices, breadcrumbs, and dashboard aggregates exclude the deleted item, while its metadata and stored content remain retained.
- **SC-009**: Dashboard totals and distributions match a known verification dataset exactly, and every time-series bucket differs from its expected active-upload count by zero.
- **SC-010**: 100% of required successful Phase 2 state changes and downloads produce structurally complete audit events, with zero prohibited secrets, file content, extracted text, or storage locations found in audit and error-output scans.
- **SC-011**: At least 90% of usability participants correctly understand upload rejection, no-results, unsupported-preview, non-empty-folder deletion, and retryable failure states without assistance.

## Assumptions

- Phase 1 authentication, authorization, common response contracts, application shells, user identity, file/folder data foundations, and audit capability are complete and available to Phase 2.
- Phase 2 provides a complete accessible light theme; dark and system theme controls remain Phase 3 work.
- Allowed upload types, maximum size, maximum batch count, extraction size, and page sizes are environment-configured and surfaced to users where they affect interaction; this specification does not prescribe deployment-specific numeric values.
- Text extraction is required for plain-text-compatible content and PDFs whose text can be safely extracted within configured limits. Other formats may be added during planning only if they preserve the same available and unavailable user contract.
- Multiple files may have the same original filename, including in the same folder. Folder names, unlike file display names, are unique among active siblings after trimming and case-insensitive comparison.
- Search matches original filenames case-insensitively. File-type filters use a documented normalized category derived from the verified content type rather than trusting the filename extension.
- The default file order is newest upload first with a stable identifier as a tie-breaker. Default and maximum page sizes are finalized through the configuration contract during planning.
- The user's virtual root is not a persisted folder and cannot be renamed or deleted.
- Users move files during Phase 2, but moving folders is deferred; nested folder placement is selected at creation.
- Deleting a folder requires it to contain no active child folder and no active file. Deleted descendants do not block deletion because they are unavailable to the normal user surface.
- Phase 2 has no trash, restore, purge, or permanent-delete experience. Soft-deleted metadata and stored content remain retained without automated deletion until a later approved lifecycle policy defines authorized access, duration, disposition, migration impact, and verification.
- Dashboard storage usage is the sum of authoritative byte sizes for active owned files; upload history is based on original upload timestamps, not move or update time.
- Displayed upload-history dates use the user's browser-displayed local timezone while authoritative timestamps remain unambiguous.
- Required Phase 2 audit failure prevents the associated important state change from committing. Successful download is considered complete only when its required audit event is recorded before content delivery begins.
- Audit records continue to follow the constitutional default: no application-facing read API or UI and no automated deletion. Audit viewing remains Phase 3 work.

## Dependencies

- A completed Phase 1 identity and authorization layer capable of identifying the current user for every protected operation.
- The approved `database-schema.mmd` file, folder, user, and audit contracts and an applied compatible data schema.
- A configured writable file-storage implementation accessed through the project's storage boundary.
- The shared audit capability and safe common success/error contracts established in Phase 1.
- Browser capabilities for file selection, drag-and-drop, progress presentation, image/document display, and downloads.

## Out of Scope

- Administrator user management, role changes, global file management, administrator statistics, and audit-log viewing (Phase 3).
- Dark and system theme support and the theme selector (Phase 3).
- User-facing trash browsing, restore, permanent deletion, automated storage cleanup, and a replacement retention policy unless introduced by a later approved feature.
- Moving folders after creation, folder sharing, file sharing, collaboration, version history, editing file contents, and public links.
- Production object-storage migration, Docker support, deployment hardening, the complete cross-phase automated test suite, and final developer documentation beyond Phase 2 configuration changes (Phase 4).
- Changes to the approved database schema; any proposed difference must follow the constitution's explicit planning-time comparison and maintainer-approval process.
