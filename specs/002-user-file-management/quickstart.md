# Phase 2 Quickstart: User File Management Validation

This guide validates the design end to end. It does not replace implementation tasks or contain application code. The public behavior is defined in [`contracts/file-management.openapi.yaml`](./contracts/file-management.openapi.yaml); persistence rules are in [`data-model.md`](./data-model.md).

## Prerequisites

- Node.js 24.x and pnpm 10.17.1
- PostgreSQL available through the existing `DATABASE_URL`
- Phase 1 identity/authentication completed and a verified regular user available
- A Supabase project with one existing private Storage bucket dedicated to this application
- A current server-side `sb_secret_...` key that can operate on that bucket
- A second verified user for ownership-isolation checks
- Test fixtures for PDF, TXT, JPEG, PNG, WebP, DOCX, a generic ZIP, malformed content, exact-boundary files, and extraction failures

Never use production credentials or user files in automated tests. The provider adapter suite must use a dedicated private test bucket.

## Configuration

Retain every Phase 1 setting and add these server-only values to the safe local environment:

```dotenv
UPLOAD_MAX_FILE_SIZE_BYTES=5242880
USER_STORAGE_QUOTA_BYTES=104857600
UPLOAD_ALLOWED_MIME_TYPES=application/pdf,text/plain,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document
UPLOAD_MAX_FILES_PER_BATCH=10
SUPABASE_URL=https://project-ref.supabase.co
SUPABASE_SECRET_KEY=sb_secret_replace_me
SUPABASE_STORAGE_BUCKET=private-user-files-test
FILE_EXTRACTION_MAX_BYTES=5242880
```

Expected configuration behavior:

- startup rejects missing, malformed, or spec-inconsistent settings;
- startup/readiness rejects a missing or public bucket;
- `SUPABASE_SECRET_KEY`, storage keys, provider URLs, and file content do not appear in client bundles, responses, audit metadata, or logs;
- the authenticated upload-policy response exposes only safe limits, allowlisted MIME values, and the current user's quota snapshot.

The Files UI offers 5, 10, and 20 results per page and defaults to 20; the API rejects other page-size values. Keep `server/.env.example`, deployment mappings, configuration tests, and setup documentation synchronized with the server-only settings during implementation.

## Install and Verify

From the repository root:

```sh
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm test:security
pnpm test:integration
pnpm build
```

Run the provider adapter checks only with the dedicated private test bucket configured. Run the end-to-end suite after the API and client are available:

```sh
pnpm test:e2e
```

Expected baseline: every command succeeds, the server refuses invalid configuration before accepting traffic, and no test depends on a public bucket or browser-side privileged credential.

## Migration Validation

Before applying the Phase 2 migration, inspect deployed data for non-null legacy values in `FILE.deletedAt` and `FOLDER.deletedAt`.

Expected outcomes:

1. If either legacy column contains non-null data, migration stops or is deliberately paused; no data is silently discarded.
2. With a clean preflight, the migration adds nullable `USER.deletedAt`, removes `FILE.deletedAt` and `FOLDER.deletedAt`, and changes nothing else.
3. The generated Prisma schema, clean-database migration result, fixtures, and `database-schema.mmd` have the same six entities, fields, nullability, keys, and relationships.
4. No storage-operation, outbox, quota, reservation, normalized-name, or reconciliation entity/field appears.

## Scenario 1: Upload Boundaries and Detection

1. Authenticate as User A and fetch the upload policy.
2. Upload one valid sample of PDF, UTF-8 text, JPEG, PNG, WebP, and DOCX.
3. Upload a file of exactly 5,242,880 bytes that otherwise passes its format checks.
4. Attempt a 5,242,881-byte file, a generic ZIP renamed `.docx`, invalid UTF-8 text, NUL-containing text, and content whose bytes disagree with its submitted extension/MIME.

Expected:

- all six valid formats create private objects and canonical `FILE` rows;
- exact 5 MB passes and one byte above returns the file-too-large contract before provider storage;
- authoritative bytes/container structure determine the type;
- generic ZIP, malformed text, spoofed metadata, and unsupported formats are rejected without an accessible row or retained quota;
- object keys contain only trusted user/file identifiers and are never public;
- local temporary files are removed on success, rejection, abort, and infrastructure failure.

## Scenario 2: Extraction and Preview Availability

1. Upload a normal TXT, an empty TXT, a text-bearing PDF, an image, and a DOCX.
2. Upload a valid PDF designed to exceed the five-second, 200-page, or 1,000,000-character extraction limit.
3. Open details for every file.

Expected:

- TXT and ordinary PDF details expose extracted content and `available` state;
- empty successfully extracted text remains `available` with an empty string;
- images and DOCX return `unavailable` extraction;
- resource-limited or failed PDF extraction terminates its worker, yields `unavailable`, and leaves the uploaded file usable;
- DOCX preview is explicitly unavailable but download remains enabled.

## Scenario 3: Mixed Batch and Deterministic Quota

1. Select ten files containing valid, invalid, and provider-failure fixtures in a known displayed order.
2. Submit them through the client upload queue.
3. Repeat near the quota boundary with several individually valid files whose combined size does not fit.
4. Attempt to select eleven files.

Expected:

- the client sends one multipart request at a time in displayed order;
- each item has independent validation, progress, success, rejection, or retryable failure;
- earlier successes remain visible when later items fail;
- quota admits files in displayed order and returns a safe quota snapshot for each rejected item;
- eleven files are rejected before content upload;
- no failed item consumes retained quota.

## Scenario 4: Concurrent Quota Admission

1. Seed User A just below 100 MB.
2. Start at least 20 simultaneous upload attempts across independent API connections, with candidates whose combined bytes exceed remaining capacity.
3. Query stored rows, provider calls, and the quota snapshot after all attempts settle.

Expected:

- the per-user lock serializes authoritative admission across connections;
- `SUM(FILE.size)` never exceeds 104,857,600;
- every committed row has available private content;
- database/provider failures release the lock and do not add quota;
- metadata failure after object upload triggers best-effort removal; any deliberately simulated failed compensation leaves only a private inaccessible orphan and a sanitized operational log.

## Scenario 5: Browse, Search, Filter, Sort, and Paginate

1. Seed more than one page of User A files across types, names, sizes, dates, and folders, including duplicate display names and sort ties.
2. Combine search, type, and folder filters; exercise each sort/direction and pages 1 through the end.
3. Repeat unchanged queries and mutate the collection between requests.
4. Test whitespace, overlong search, special characters, invalid sort/direction/page/pageSize, and an unauthorized folder filter.

Expected:

- only User A rows appear;
- counts and page metadata match the combined server query;
- `FILE.id` tie-breaking makes unchanged pages repeatable without duplicate rows;
- empty collection and no-match states are distinct;
- validation failures use the safe error envelope;
- after concurrent mutation, the client resets/clamps to a valid page and does not claim a stale result is current.

## Scenario 6: Ownership-Safe Details, Preview, and Download

1. As User A, open details and preview each supported kind; download every allowed format.
2. Inspect response headers for inline preview and attachment download.
3. As User B, directly request User A's identifiers; also test random, malformed, and permanently deleted identifiers.
4. Delete or move a file while content retrieval is in flight and simulate a missing provider object.

Expected:

- authorization and current lifecycle are checked before provider retrieval and before content exposure;
- responses use verified type/length, `private, no-store`, `nosniff`, and safe `Content-Disposition` values;
- no storage key, provider URL, or credential appears;
- foreign, missing, malformed, and deleted identifiers share the same existence-safe outcome;
- stale content is not newly exposed after deletion wins;
- missing storage content returns a safe retryable/not-found outcome without storage internals;
- successful download attempts sanitized audit recording, but audit failure never gates the bytes.

## Scenario 7: Folder Hierarchy

1. Create folders from root through stored level 10 and navigate each breadcrumb.
2. Attempt level 11, a foreign parent, an invalid parent chain, duplicate trimmed/case-insensitive sibling names, and concurrent duplicate creation.
3. Rename a folder and verify descendants remain in place.
4. Move files between root and owned folders; attempt a User B destination.

Expected:

- levels 1–10 work and level 11 creates no partial row;
- every ancestor and destination is owned by User A;
- sibling uniqueness survives concurrency without adding a schema column/index;
- parent is immutable and rename changes no contents;
- breadcrumbs start at virtual root and contain only current owned ancestors;
- file moves change only `folderId` and `updatedAt` and attempt a sanitized audit.

## Scenario 8: Permanent Deletion and Compensation

1. Cancel a file and folder deletion confirmation.
2. Confirm deletion of an owned file, retry the same result after a simulated timeout, and inspect quota.
3. Simulate provider operational failure, provider not-found, database failure after provider removal, and audit failure after successful deletion.
4. Delete an empty folder, then attempt a non-empty folder and concurrent child creation/deletion.

Expected:

- cancellation changes nothing and emits no successful-operation audit;
- full file deletion removes content and metadata, then reclaims the exact row size once;
- provider not-found converges idempotently; operational failure leaves metadata/quota and returns retryable failure;
- database failure after provider removal is not reported fully successful and reveals no internals;
- audit failure is logged safely and never reverses an otherwise successful delete;
- empty folders are permanently removed, non-empty folders never cascade, and locking prevents stranded children.

## Scenario 9: Statistics and Local Dates

1. Seed User A files across all type categories and around local-midnight/DST boundaries within and before the 30-day window.
2. Request statistics with `Africa/Cairo`, another valid IANA timezone, and invalid timezone strings.
3. Permanently delete selected files and request again.
4. Repeat with User B and a user with no files.

Expected:

- totals equal current owned `FILE` rows and byte sums are decimal strings;
- type categories count every current file exactly once;
- history contains exactly 30 oldest-to-newest local dates including today, with zero-filled gaps;
- original `createdAt`, not `updatedAt`, determines each bucket;
- invalid timezone fails validation;
- deletion immediately changes count, bytes, quota, distribution, and relevant history;
- User B is excluded and an empty user receives zeros rather than errors.

## Completion Evidence

Phase 2 is ready for task generation when:

- all contract, unit, integration, security, component, and end-to-end scenarios above have named task coverage;
- the canonical schema comparison passes with only the approved lifecycle migration;
- ten configuration settings are synchronized across validation, examples, docs, tests, and deployment mappings;
- provider adapter evidence proves the test bucket is private and credentials remain server-only;
- accessibility review covers keyboard operation, labels, progress, confirmations, error recovery, responsive layouts, and light-theme contrast;
- every new or changed function, method, arrow assignment, and inline callback is assigned an accurate intent comment requirement.
