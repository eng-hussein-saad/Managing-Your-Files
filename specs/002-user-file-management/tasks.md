---
description: "Dependency-ordered implementation tasks for User File Management"
---

# Tasks: User File Management

**Input**: Design documents from `/specs/002-user-file-management/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Tests are required by FR-035, the requirement verification map, and SC-001–SC-012. Test tasks appear before the behavior they verify.

**Organization**: Tasks are grouped by user story so each story can be implemented, demonstrated, and accepted as an independent increment after the shared foundation is complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it changes different files and does not depend on an incomplete task in the same phase
- **[Story]**: Maps the task to its specification user story
- Every task names an exact file or directory path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Pin compatible file-processing dependencies, synchronize configuration, prepare the approved lifecycle migration, and create reusable fixtures.

- [X] T001 Add pinned Node 24-compatible Multer 2, Supabase JavaScript v2, `file-type`, PDF.js, ZIP inspection, and required type packages to server/package.json and pnpm-lock.yaml
- [X] T002 Add an ESM compatibility smoke test for MIME detection, DOCX ZIP inspection, PDF worker startup, and Supabase Storage client construction in server/tests/unit/file-dependency-compatibility.test.ts
- [X] T003 [P] Add and validate all ten Phase 2 server configuration keys, fixed limits, MIME allowlist, page-size relationships, secret classification, and safe examples in server/src/config/env.ts, server/.env.example, and server/tests/unit/config.test.ts
- [X] T004 [P] Document the ten Phase 2 settings and their Vercel/Render deployment mappings without exposing the Supabase secret, and record the current absence or required synchronization disposition of Docker/deployment configuration in docs/deployment.md
- [X] T005 Create the reviewed lifecycle migration preflight and migration that adds USER.deletedAt and removes FILE.deletedAt and FOLDER.deletedAt, with no other schema difference, in server/prisma/migrations/002_user_file_management/migration.sql and server/prisma/schema.prisma
- [X] T006 Add clean-database, legacy-non-null preflight refusal, and canonical six-entity schema comparison coverage for the migration in server/tests/integration/file-lifecycle-migration.integration.test.ts
- [X] T007 [P] Create deterministic PDF, TXT, JPEG, PNG, WebP, DOCX, generic ZIP, malformed, exact-boundary, and extraction-limit fixture builders in server/tests/fixtures/files.ts
- [X] T008 [P] Create browser upload fixtures and provider-failure controls for mixed batches and exact byte boundaries in tests/e2e/fixtures/files.ts

**Checkpoint**: Dependencies resolve under Node 24, invalid Phase 2 configuration fails before startup, the migration is safely reviewable, and reusable file fixtures are available.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish browser-safe contracts, replaceable storage boundaries, injected test doubles, common file-domain mapping, safe errors, and audit primitives used across stories.

**Critical**: No user story work begins until this phase is complete.

- [X] T009 [P] Define public file, upload-policy, quota, page, detail, extraction, and preview schemas with decimal-string byte counts in packages/contracts/src/public/files.ts
- [X] T010 [P] Define public folder, breadcrumb, contents, create, rename, and file-move schemas in packages/contracts/src/public/folders.ts
- [X] T011 [P] Define public file-statistics, normalized distribution, IANA timezone, and 30-day history schemas in packages/contracts/src/public/file-statistics.ts
- [X] T012 Export the Phase 2 browser-safe contracts and stable file/folder error codes in packages/contracts/src/public/index.ts and packages/contracts/src/public/envelopes.ts
- [X] T013 [P] Define file-domain MIME/category/preview/extraction mappings and public metadata projection that excludes storageKey in server/src/modules/files/file.types.ts and server/src/modules/files/file.mapper.ts
- [X] T014 [P] Define overwrite-disabled upload, authorized read, size-aware stream, idempotent remove, and provider-error semantics in server/src/modules/files/ports/storage.port.ts
- [X] T015 [P] Create configurable fake storage and extraction adapters for success, absence, delay, abort, and operational/compensation failures in server/tests/fakes/fake-storage.ts and server/tests/fakes/fake-extractor.ts
- [X] T016 Add dedicated-private-bucket adapter contract tests for upload, download, remove, not-found classification, bucket privacy, and secret-safe failures in server/tests/integration/supabase-storage.integration.test.ts
- [X] T017 Implement the server-only Supabase Storage adapter behind StoragePort with generated keys, overwrite disabled, bounded reads, idempotent absence, and sanitized errors in server/src/infrastructure/storage/supabase-storage.ts
- [X] T018 Implement startup/readiness verification that rejects a missing or public configured bucket before file traffic is accepted in server/src/infrastructure/storage/storage-readiness.ts and server/src/server.ts
- [X] T019 [P] Add allowlisted file/folder audit event builders and minimal sanitized metadata for upload, download, move, delete, create, and rename in server/src/modules/audit/file-audit.ts
- [X] T020 [P] Define safe validation, not-found, quota, conflict, preview, and retryable partial-operation errors without existence distinctions or provider details in server/src/modules/files/file.errors.ts and server/src/modules/folders/folder.errors.ts
- [X] T021 Extend the Express test harness to inject StoragePort, extraction behavior, audit failures, and authenticated users without real provider credentials in server/tests/helpers/app.ts
- [X] T022 Compose shared file-management dependencies and authenticated route groups without coupling controllers to Prisma or Supabase in server/src/app.ts

**Checkpoint**: Shared contracts compile, the private storage boundary is replaceable and provider-verified, and every story can use deterministic fakes and safe common outcomes.

---

## Phase 3: User Story 1 - Upload Files with Clear Feedback (Priority: P1) — MVP

**Goal**: Let an authenticated user submit an ordered batch of up to ten files with authoritative validation, concurrency-safe quota admission, safe extraction, per-file progress, and independent outcomes.

**Independent Test**: Upload a mixed ordered batch through picker and drag-and-drop, including valid, invalid, quota-rejected, and infrastructure-failed files; verify every item has a final outcome, successful rows have private content, and unsuccessful items have no accessible record or retained quota.

### Tests for User Story 1

- [X] T023 [P] [US1] Add upload-policy and one-file multipart contract tests for envelopes, exact 5 MB handling, supported types, batch policy, folder ownership, quota metadata, and safe errors in server/tests/contract/file-upload.contract.test.ts
- [X] T024 [P] [US1] Add byte-authoritative validation tests for PDF/JPEG/PNG/WebP signatures, DOCX container entries, fatal UTF-8 text, controls, spoofed metadata, filenames, and unsupported content in server/tests/unit/file-content-validation.test.ts
- [X] T025 [P] [US1] Add bounded extraction tests for empty/normal TXT, PDF worker timeout, page/character/byte ceilings, worker termination, malformed PDFs, images, and DOCX in server/tests/unit/file-extraction.test.ts
- [X] T026 [P] [US1] Add upload integration tests for trusted object keys, owned folders, duplicate names, object-first metadata commit, temporary-file cleanup, audit fail-open behavior, and compensation outcomes in server/tests/integration/file-upload.integration.test.ts
- [X] T027 [P] [US1] Add a PostgreSQL stress test proving at least 20 same-user uploads serialize quota admission, never exceed 104857600 bytes, and release capacity on failure in server/tests/integration/file-quota-concurrency.integration.test.ts
- [X] T028 [P] [US1] Add upload queue component tests for picker/drop, eleven-file rejection, displayed-order sequencing, Axios progress, retry, partial success, quota snapshots, and accessible announcements in client/tests/component/file-upload.test.tsx
- [X] T029 [P] [US1] Add secret and partial-record security tests for storage keys, provider URLs/errors, filenames, extracted content, temporary paths, and credentials in server/tests/security/file-upload.security.test.ts

### Implementation for User Story 1

- [X] T030 [P] [US1] Define upload-policy and multipart field schemas plus exact limit constants from validated configuration in server/src/http/schemas/file-upload.schemas.ts
- [X] T031 [P] [US1] Implement route-scoped Multer temporary-disk intake with random names, single-file/part/field limits, abort handling, and guaranteed cleanup in server/src/http/middleware/file-upload.ts
- [X] T032 [P] [US1] Implement safe display-name normalization and authoritative PDF/JPEG/PNG/WebP/DOCX/TXT byte inspection in server/src/infrastructure/file-content/content-detector.ts and server/src/infrastructure/file-content/filename.ts
- [X] T033 [P] [US1] Define the bounded extraction port and implement TXT extraction plus terminable PDF.js worker processing in server/src/modules/files/ports/extraction.port.ts, server/src/infrastructure/extraction/text-extractor.ts, server/src/infrastructure/extraction/pdf-extractor.ts, and server/src/infrastructure/extraction/pdf.worker.ts
- [X] T034 [US1] Implement owner/folder lookups, USER row quota locking, authoritative FILE.size summation, and metadata insertion in server/src/modules/files/repositories/file.repository.ts
- [X] T035 [US1] Implement upload policy and object-first upload orchestration with ordered quota snapshots, generated IDs/keys, final extraction state, compensation, cleanup, and fail-open audit in server/src/modules/files/services/upload-file.service.ts
- [X] T036 [US1] Implement thin upload-policy/upload controllers and authenticated routes with one-file multipart semantics in server/src/http/controllers/file-upload.controller.ts and server/src/http/routes/file.routes.ts
- [X] T037 [P] [US1] Implement typed upload-policy and progress-enabled one-file upload calls in client/src/features/files/api/file-upload.api.ts
- [X] T038 [US1] Implement the sequential client upload queue state machine that preserves displayed order and earlier successes in client/src/features/files/upload/use-upload-queue.ts and client/src/features/files/upload/upload.types.ts
- [X] T039 [P] [US1] Build accessible drag-and-drop/picker selection, per-item progress, result, quota, retry, and batch-limit components in client/src/features/files/components/upload-dropzone.tsx and client/src/features/files/components/upload-queue.tsx
- [X] T040 [US1] Compose the upload experience and initial My Files shell in client/src/app/(protected)/files/page.tsx and client/src/components/navigation/app-navigation.tsx
- [X] T041 [US1] Add the independently runnable mixed-batch, deterministic quota, exact-boundary, extraction-state, and eleven-file browser journey in tests/e2e/file-upload.spec.ts
- [X] T042 [US1] Record mixed-batch item outcomes, 20-upload quota totals, boundary results, and private-object checks for SC-001/SC-004/SC-012 in specs/002-user-file-management/evidence/upload-quota.md
- [X] T043 [US1] Verify every upload-path function, method, arrow assignment, and callback has an accurate immediately preceding intent comment in server/src/modules/files/, server/src/infrastructure/extraction/, server/src/infrastructure/file-content/, and client/src/features/files/

**Checkpoint**: User Story 1 works independently and is the suggested MVP acceptance boundary.

---

## Phase 4: User Story 2 - Find and Inspect Owned Files (Priority: P1)

**Goal**: Let an authenticated user search, filter, sort, paginate, and inspect only owned files with deterministic results and distinct loading, empty, no-match, and failure states.

**Independent Test**: Seed over one page of varied owned files and foreign files, exercise every combined query and sort, repeat unchanged pages, open details, and prove malformed/foreign/deleted identifiers reveal nothing.

### Tests for User Story 2

- [X] T044 [P] [US2] Add list/detail contract tests for combined query validation, defaults, decimal bytes, stable pagination metadata, extraction details, and generic safe not-found outcomes in server/tests/contract/file-discovery.contract.test.ts
- [X] T045 [P] [US2] Add PostgreSQL integration tests for ownership filters, case-insensitive search, normalized types, root/folder filtering, every sort direction, FILE.id tie-breaks, totals, and 10,000-row query timing in server/tests/integration/file-discovery.integration.test.ts
- [X] T046 [P] [US2] Add collection/detail component tests for responsive list/grid views, filter state, valid-page clamping, loading, no-files, no-matches, stale requests, errors, and extracted-content states in client/tests/component/file-discovery.test.tsx
- [X] T047 [P] [US2] Add direct-request ownership-isolation tests for list filters, details, malformed UUIDs, deleted IDs, and public-field allowlisting in server/tests/security/file-discovery.security.test.ts

### Implementation for User Story 2

- [X] T048 [P] [US2] Define validated list query, identifier, pagination, filter, and sort schemas from the OpenAPI defaults in server/src/http/schemas/file-query.schemas.ts
- [X] T049 [US2] Implement owner-scoped combined queries, stable FILE.id secondary ordering, counts, page bounds, and owned detail/folder-path lookup in server/src/modules/files/repositories/file.repository.ts
- [X] T050 [US2] Implement list/detail orchestration and derived public metadata without storage references in server/src/modules/files/services/find-files.service.ts
- [X] T051 [US2] Add thin list/detail controller handlers and authenticated GET routes in server/src/http/controllers/file-query.controller.ts and server/src/http/routes/file.routes.ts
- [X] T052 [P] [US2] Implement typed file query/detail API calls, query keys, cancellation, and React Query hooks in client/src/features/files/api/files.api.ts, client/src/features/files/query-keys.ts, and client/src/features/files/hooks/use-files.ts
- [X] T053 [P] [US2] Build reusable query toolbar, responsive collection, pagination, and distinct empty/no-match state components in client/src/features/files/components/file-query-toolbar.tsx, client/src/features/files/components/file-collection.tsx, and client/src/features/files/components/file-pagination.tsx
- [X] T054 [P] [US2] Build the owned file metadata, folder path, extraction state/content, and available-action detail panel in client/src/features/files/components/file-details.tsx
- [X] T055 [US2] Integrate discovery controls and details into the My Files route while resetting or clamping pages after query and lifecycle changes in client/src/app/(protected)/files/page.tsx
- [X] T056 [US2] Add the independently runnable search/filter/sort/pagination/details and cross-owner browser journey in tests/e2e/file-discovery.spec.ts
- [X] T057 [US2] Record 10,000-row response timing, stable-page repetitions, action-count usability, and ownership-isolation results for SC-002/SC-003/SC-005 in specs/002-user-file-management/evidence/discovery.md

**Checkpoint**: User Story 2 independently returns only owned deterministic results and exposes complete safe details.

---

## Phase 5: User Story 3 - Preview and Download Files Securely (Priority: P1)

**Goal**: Let an authenticated owner preview supported content and download every accepted file through request-bound server streaming with safe headers and no reusable storage access.

**Independent Test**: Preview image/PDF/TXT content, open DOCX fallback, download all accepted formats, and directly attempt foreign, deleted, malformed, missing-object, and in-flight deletion cases.

### Tests for User Story 3

- [X] T058 [P] [US3] Add preview/download contract tests for supported/unsupported types, inline/attachment disposition, verified type/length, private no-store, nosniff, audit fail-open, and safe errors in server/tests/contract/file-content.contract.test.ts
- [X] T059 [P] [US3] Add unit tests for CRLF/path/control/Unicode filename handling and standards-compliant Content-Disposition fallback/encoding in server/tests/unit/content-disposition.test.ts
- [X] T060 [P] [US3] Add integration tests for authorization-before-storage, provider absence/failure, request abort, bounded streaming, download audit, and deletion winning an in-flight request in server/tests/integration/file-content.integration.test.ts
- [X] T061 [P] [US3] Add accessible preview component tests for image, PDF, text, DOCX/unavailable fallback, object URL cleanup, download, loading, and retry states in client/tests/component/file-preview.test.tsx

### Implementation for User Story 3

- [X] T062 [P] [US3] Implement safe inline/attachment Content-Disposition and verified private content headers in server/src/infrastructure/file-content/content-response.ts
- [X] T063 [US3] Implement owner-scoped lifecycle recheck and bounded StoragePort retrieval for preview/download without exposing storageKey in server/src/modules/files/services/get-file-content.service.ts
- [X] T064 [US3] Implement abort-aware streaming, preview-type rejection, download audit attempts, and thin content handlers/routes in server/src/http/controllers/file-content.controller.ts and server/src/http/routes/file.routes.ts
- [X] T065 [P] [US3] Implement authorized blob/text preview and attachment download API calls with cancellation in client/src/features/files/api/file-content.api.ts and client/src/features/files/hooks/use-file-content.ts
- [X] T066 [P] [US3] Build reusable image, PDF, text, unsupported-preview, and download components with accessible labels and object URL cleanup in client/src/features/files/components/file-preview.tsx and client/src/features/files/components/file-download.tsx
- [X] T067 [US3] Integrate preview/download actions into owned file details without adding provider URLs to page state in client/src/features/files/components/file-details.tsx
- [X] T068 [US3] Add the independently runnable supported-preview, DOCX fallback, header, download, cross-owner, deleted, and missing-object browser journey in tests/e2e/file-content.spec.ts
- [X] T069 [US3] Record preview sample outcomes, download content/header checks, and zero storage-reference exposure for SC-002/SC-006 in specs/002-user-file-management/evidence/content-access.md

**Checkpoint**: User Story 3 independently previews supported content, explains unsupported previews, and downloads owned files without disclosing provider access.

---

## Phase 6: User Story 4 - Organize Files in Nested Folders (Priority: P2)

**Goal**: Let an authenticated user create and rename a fixed-parent hierarchy through level ten, browse breadcrumbs/contents, and move owned files between root and owned folders.

**Independent Test**: Create ten levels, navigate breadcrumbs, rename without moving descendants, move files between root/nested folders, and reject level eleven, duplicate siblings, foreign identifiers, parent changes, and concurrency races.

### Tests for User Story 4

- [X] T070 [P] [US4] Add folder list/detail/create/rename and file-move contract tests for schemas, breadcrumbs, conflicts, depth, immutable parents, safe 404s, and audit outcomes in server/tests/contract/folder-management.contract.test.ts
- [X] T071 [P] [US4] Add PostgreSQL hierarchy integration tests for same-owner ancestors, levels 1–10, level 11 rejection, root semantics, case-insensitive trimmed sibling uniqueness, rename, and file moves in server/tests/integration/folder-management.integration.test.ts
- [X] T072 [P] [US4] Add concurrent create/rename/child-operation tests proving owner-scoped locks prevent duplicate siblings and invalid/deleted ancestor chains in server/tests/integration/folder-concurrency.integration.test.ts
- [X] T073 [P] [US4] Add folder navigation component tests for root, children, breadcrumbs, create/rename dialogs, depth errors, destinations, move outcomes, keyboard access, and responsive states in client/tests/component/folder-management.test.tsx
- [X] T074 [P] [US4] Add cross-owner hierarchy security tests for every folder read/mutation and move destination with no hierarchy disclosure in server/tests/security/folder-ownership.security.test.ts

### Implementation for User Story 4

- [X] T075 [P] [US4] Define folder identifier, name normalization, parent, create, rename, contents, and move-file HTTP schemas in server/src/http/schemas/folder.schemas.ts
- [X] T076 [US4] Implement owner-scoped folder locking, ancestor traversal, depth checks, sibling-name comparison, contents, breadcrumbs, create, and rename persistence in server/src/modules/folders/repositories/folder.repository.ts
- [X] T077 [US4] Implement create/rename/list/detail orchestration with fixed-parent rules, safe conflicts, and fail-open audit in server/src/modules/folders/services/manage-folders.service.ts
- [X] T078 [US4] Implement owned file moves that change only folderId/updatedAt and attempt sanitized audit in server/src/modules/files/services/move-file.service.ts and server/src/modules/files/repositories/file.repository.ts
- [X] T079 [US4] Add thin folder and move controllers plus authenticated folder routes and file PATCH route in server/src/http/controllers/folder.controller.ts, server/src/http/controllers/file-move.controller.ts, server/src/http/routes/folder.routes.ts, and server/src/http/routes/file.routes.ts
- [X] T080 [P] [US4] Implement typed folder/move APIs, cache keys, and React Query hooks with affected collection invalidation in client/src/features/folders/api/folders.api.ts, client/src/features/folders/query-keys.ts, and client/src/features/folders/hooks/use-folders.ts
- [X] T081 [P] [US4] Build accessible folder contents, breadcrumbs, create, rename, and fixed-parent dialogs in client/src/features/folders/components/folder-browser.tsx, client/src/features/folders/components/breadcrumbs.tsx, and client/src/features/folders/components/folder-dialogs.tsx
- [X] T082 [P] [US4] Build root/owned-folder destination selection and move feedback in client/src/features/folders/components/file-move-dialog.tsx
- [X] T083 [US4] Integrate folder navigation, location-aware file lists, and move actions into client/src/app/(protected)/files/page.tsx and client/src/features/files/components/file-details.tsx
- [X] T084 [US4] Add the independently runnable ten-level hierarchy, breadcrumb, rename, move, duplicate, and cross-owner browser journey in tests/e2e/folder-management.spec.ts
- [X] T085 [US4] Record level-boundary, concurrency, reachability, and ownership results for SC-002/SC-007 in specs/002-user-file-management/evidence/folders.md
- [X] T086 [US4] Verify every folder and move function, method, arrow assignment, and callback has an accurate immediately preceding intent comment in server/src/modules/folders/, client/src/features/folders/, and the changed file-management modules

**Checkpoint**: User Story 4 independently preserves an owned, reachable, fixed-parent hierarchy and safe file locations.

---

## Phase 7: User Story 5 - Permanently Delete Files and Empty Folders (Priority: P2)

**Goal**: Let an authenticated owner permanently delete a file or empty folder after explicit confirmation, with idempotent provider-first file removal, exact quota reclamation, and safe partial-failure outcomes.

**Independent Test**: Cancel and confirm file/folder deletion, retry file deletion after an unknown result, simulate each provider/database/audit failure, verify exact quota change, and reject non-empty or foreign folders without cascades.

### Tests for User Story 5

- [X] T087 [P] [US5] Add file/folder delete contract tests for confirmations' server outcomes, 204 success, generic 404, non-empty conflict, retryable partial failures, and idempotent provider absence in server/tests/contract/permanent-deletion.contract.test.ts
- [X] T088 [P] [US5] Add integration tests for provider-first file deletion, metadata failure, repeated calls, exact-once quota reclamation, audit fail-open behavior, and no soft-deleted rows in server/tests/integration/file-deletion.integration.test.ts
- [X] T089 [P] [US5] Add locked empty-folder deletion tests for files, child folders, concurrent child creation, no cascade, parent reachability, and cross-owner identifiers in server/tests/integration/folder-deletion.integration.test.ts
- [X] T090 [P] [US5] Add accessible irreversible-confirmation component tests for cancel, pending, success, non-empty guidance, retryable partial failure, focus restoration, and cache removal in client/tests/component/permanent-deletion.test.tsx

### Implementation for User Story 5

- [X] T091 [US5] Implement provider-first idempotent file deletion, owner-scoped metadata removal, known-partial retryable outcomes, exact quota semantics, and fail-open audit in server/src/modules/files/services/delete-file.service.ts
- [X] T092 [US5] Implement locked owned-empty-folder checks and permanent non-cascading removal with fail-open audit in server/src/modules/folders/services/delete-folder.service.ts and server/src/modules/folders/repositories/folder.repository.ts
- [X] T093 [US5] Add thin file/folder delete handlers and authenticated DELETE routes in server/src/http/controllers/file-delete.controller.ts, server/src/http/controllers/folder.controller.ts, server/src/http/routes/file.routes.ts, and server/src/http/routes/folder.routes.ts
- [X] T094 [P] [US5] Implement typed file/folder deletion mutations and invalidate files, folders, quota policy, and statistics only after confirmed outcomes in client/src/features/files/hooks/use-delete-file.ts and client/src/features/folders/hooks/use-delete-folder.ts
- [X] T095 [P] [US5] Build a reusable accessible irreversible-action confirmation dialog and file/folder-specific retry guidance in client/src/components/confirmation/permanent-delete-dialog.tsx
- [X] T096 [US5] Integrate permanent deletion actions into file details and folder browsing while preserving state on cancellation or retryable failure in client/src/features/files/components/file-details.tsx and client/src/features/folders/components/folder-browser.tsx
- [X] T097 [US5] Add the independently runnable cancel/confirm, exact quota, repeated delete, compensation, empty/non-empty folder, and cross-owner browser journey in tests/e2e/permanent-deletion.spec.ts
- [X] T098 [US5] Record provider/metadata outcome matrix, quota deltas, non-cascade evidence, and absence across all surfaces for SC-002/SC-008 in specs/002-user-file-management/evidence/deletion.md

**Checkpoint**: User Story 5 independently proves irreversible deletion, exact quota reclamation, safe retries, and no cascading or soft-delete state.

---

## Phase 8: User Story 6 - Understand Personal Storage Activity (Priority: P3)

**Goal**: Show ownership-scoped current totals, quota, normalized type distribution, and exactly 30 local-date upload buckets with useful empty and retry states.

**Independent Test**: Seed known files around timezone/DST boundaries, delete selected files, compare every aggregate in two timezones, reject invalid zones, and prove foreign data is excluded and empty users receive zeros.

### Tests for User Story 6

- [X] T099 [P] [US6] Add statistics contract tests for required IANA timezone, decimal bytes, quota, normalized categories, exactly 30 oldest-first buckets, validation, and safe errors in server/tests/contract/file-statistics.contract.test.ts
- [X] T100 [P] [US6] Add PostgreSQL aggregate tests for ownership, deleted-row absence, zero values, type normalization, original createdAt grouping, Cairo/alternate timezone boundaries, DST, and zero filling in server/tests/integration/file-statistics.integration.test.ts
- [X] T101 [P] [US6] Add dashboard component tests for totals, quota meter, distributions, 30-day history, empty charts, loading, safe retry, timezone forwarding, accessibility, and responsive layouts in client/tests/component/file-dashboard.test.tsx

### Implementation for User Story 6

- [X] T102 [P] [US6] Define strict statistics query validation and local-date boundary utilities for validated IANA zones in server/src/http/schemas/file-statistics.schemas.ts and server/src/modules/statistics/local-dates.ts
- [X] T103 [US6] Implement ownership-scoped count, BigInt byte sum, normalized distribution, and UTC-range upload-history queries in server/src/modules/statistics/file-statistics.repository.ts
- [X] T104 [US6] Implement quota projection and exactly 30 zero-filled local-date buckets from immutable createdAt values in server/src/modules/statistics/file-statistics.service.ts
- [X] T105 [US6] Add the thin authenticated statistics controller and route in server/src/http/controllers/file-statistics.controller.ts and server/src/http/routes/file-statistics.routes.ts
- [X] T106 [P] [US6] Implement typed statistics API/query hooks using the browser IANA timezone in client/src/features/dashboard/api/file-statistics.api.ts and client/src/features/dashboard/hooks/use-file-statistics.ts
- [X] T107 [P] [US6] Build accessible total, quota, type-distribution, history, empty, and retry components in client/src/features/dashboard/components/file-statistics.tsx
- [X] T108 [US6] Compose the personal file activity dashboard and current-data states in client/src/app/(protected)/dashboard/page.tsx
- [X] T109 [US6] Add the independently runnable known-dataset, deletion-update, empty-user, cross-owner, and timezone-boundary browser journey in tests/e2e/file-statistics.spec.ts

**Checkpoint**: User Story 6 independently matches the authoritative owned FILE dataset in every total and local-date bucket.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Close shared accessibility, security, performance, documentation, schema, configuration, and complete-journey evidence gates.

- [X] T110 [P] Extend prohibited-pattern scanning to responses, logs, audits, traces, fixtures, environment examples, built client assets, storage keys, provider URLs, temporary paths, and file/extracted content in tests/security/prohibited-patterns.ts and tests/security/secret-redaction.test.ts
- [X] T111 [P] Add a Phase 2 audit completeness/fail-open matrix covering upload, download, move, file deletion, and folder create/rename/delete with prohibited metadata assertions in server/tests/integration/file-audit-matrix.integration.test.ts
- [X] T112 [P] Add accessible light-theme contrast, keyboard, focus, labels, progress, confirmation, error recovery, reduced motion, and mobile/desktop layout coverage across file workflows in client/tests/component/file-management-accessibility.test.tsx
- [X] T113 Add the complete upload-to-organize-to-preview/download-to-delete-to-dashboard browser journey with two-user isolation in tests/e2e/file-management-completion.spec.ts
- [ ] T114 Run the SC-003 benchmark exactly as specified: production-built API on Linux with at least 2 dedicated CPU cores and 4 GB RAM, same-host PostgreSQL, the deterministic 10,000-owner/1,000-foreign fixture, one warm-up per Q1–Q5 template, then 20 measured repetitions per template at concurrency 5; record the fixture seed, hardware, versions, commit, per-template results, p50/p95/maximum, failures, stable ordering, and the separate at-least-20-upload quota benchmark with final retained bytes in specs/002-user-file-management/evidence/performance.md
- [X] T115 [P] Update local setup, private-bucket provisioning, all ten configuration keys, migration preflight, provider-test isolation, and Phase 2 verification commands in README.md
- [X] T116 Compare database-schema.mmd, server/prisma/schema.prisma, and server/prisma/migrations/002_user_file_management/migration.sql field-by-field and record only the approved lifecycle change in specs/002-user-file-management/evidence/schema-alignment.md
- [X] T117 Run startup with missing/malformed settings, private/public/missing buckets, and both safe example configurations; inventory ./ for Docker/deployment configuration, synchronize every discovered artifact with the ten Phase 2 keys, and record either the updated artifacts or an explicit not-applicable result when none exist in specs/002-user-file-management/evidence/configuration.md
- [ ] T118 Run typecheck, lint, unit, contract, PostgreSQL integration, provider adapter, security, Playwright, and production build commands and record reproducible results in specs/002-user-file-management/evidence/automated-verification.md
- [ ] T119 Run the SC-001/SC-005/SC-011 usability protocol to obtain exactly 10 valid first-time-participant sessions using one prewritten neutral script, seeded dataset, device class, starting route, and prewritten scoring key; capture anonymized per-participant completion time, action count, assistance, outcomes, state interpretations, viewport, exclusions and replacements, aggregate pass counts, plus the responsive keyboard/accessibility review in specs/002-user-file-management/evidence/usability-accessibility.md
- [X] T120 Reconcile implementation, comments, routes, contracts, environment keys, schema/migration, fixtures, docs, and evidence against spec.md, plan.md, quickstart.md, file-management.openapi.yaml, constitution.md, and database-schema.mmd in specs/002-user-file-management/evidence/final-convergence.md

**Checkpoint**: All Phase 2 acceptance evidence is reproducible, the repository remains runnable, and no implementation or configuration artifact diverges from the approved contracts.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: Starts immediately.
- **Phase 2 — Foundational**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 — US1**: Depends only on Phase 2 and creates the file content used by later end-to-end scenarios.
- **Phase 4 — US2**: Depends only on Phase 2 when fixtures provide files; sequential product delivery should follow US1.
- **Phase 5 — US3**: Depends on the owned metadata lookup delivered by US2; tests can use fixtures while US2 is in progress.
- **Phase 6 — US4**: Depends on shared file lookup and benefits from US2 collection integration; it can otherwise proceed after Phase 2.
- **Phase 7 — US5**: File deletion depends on US1 storage/metadata behavior and folder deletion depends on US4 hierarchy behavior.
- **Phase 8 — US6**: Depends only on authoritative FILE rows after Phase 2 for isolated tests; final dashboard integration should follow US1 and US5 lifecycle behavior.
- **Phase 9 — Polish**: Depends on every story selected for the Phase 2 release.

### User Story Dependency Graph

```text
Setup → Foundation → US1 ───────────────┐
                   ├→ US2 → US3         ├→ US5
                   ├→ US4 ──────────────┘
                   └→ US6
US1 + US2 + US3 + US4 + US5 + US6 → Polish
```

US1, US2, US4, and US6 remain independently testable after Foundation through fixtures and injected ports. US3 intentionally reuses US2's owner-scoped detail lookup. US5 intentionally reuses US1's provider-backed files and US4's folder invariants.

### Within Each User Story

- Write contract, unit, integration, security, component, and browser tests before the implementation they verify and confirm they fail for the intended missing behavior.
- Implement boundary schemas and repositories before services.
- Implement services before controllers/routes, API clients/hooks, components, and pages.
- Complete the story browser journey and evidence record before accepting its checkpoint.
- Every project-authored function, method, arrow assignment, and inline callback introduced or changed by a task includes an accurate immediately preceding intent comment.

## Parallel Execution Examples

### User Story 1

```text
Parallel tests: T023 upload contracts, T024 validation, T025 extraction, T026 integration, T027 quota concurrency, T028 components, T029 security
Parallel implementation after tests: T030 schemas, T031 intake, T032 detection/names, T033 extraction, T037 client API, T039 components
Sequential integration: T034 → T035 → T036 → T038 → T040 → T041 → T042/T043
```

### User Story 2

```text
Parallel tests: T044 contract, T045 persistence/performance, T046 components, T047 security
Parallel implementation after tests: T048 schemas, T052 client API/hooks, T053 collection controls, T054 details
Sequential integration: T049 → T050 → T051 → T055 → T056 → T057
```

### User Story 3

```text
Parallel tests: T058 contract, T059 header utility, T060 integration, T061 components
Parallel implementation after tests: T062 response headers, T065 client API/hooks, T066 preview components
Sequential integration: T063 → T064 → T067 → T068 → T069
```

### User Story 4

```text
Parallel tests: T070 contract, T071 hierarchy, T072 concurrency, T073 components, T074 security
Parallel implementation after tests: T075 schemas, T080 client API/hooks, T081 folder components, T082 move dialog
Sequential integration: T076 → T077/T078 → T079 → T083 → T084 → T085/T086
```

### User Story 5

```text
Parallel tests: T087 contract, T088 file deletion, T089 folder deletion, T090 components
Parallel implementation after tests: T091 file service, T092 folder service, T094 hooks, T095 confirmation component
Sequential integration: T091/T092 → T093 → T096 → T097 → T098
```

### User Story 6

```text
Parallel tests: T099 contract, T100 integration, T101 components
Parallel implementation after tests: T102 validation/dates, T106 client API/hook, T107 dashboard components
Sequential integration: T103 → T104 → T105 → T108 → T109
```

## Implementation Strategy

### MVP First — User Story 1

1. Complete Setup and Foundational phases.
2. Complete US1 tests and implementation.
3. Stop at T043 and independently demonstrate ordered mixed-batch upload, exact boundaries, extraction states, private storage, and concurrent quota safety.
4. Accept or deploy this upload MVP before adding discovery, content access, organization, deletion, or analytics.

### Incremental Delivery

1. Deliver US1 for secure upload and quota control.
2. Deliver US2 for owned discovery and details.
3. Deliver US3 for secure preview and download.
4. Deliver US4 for nested organization and file moves.
5. Deliver US5 for permanent deletion and quota reclamation.
6. Deliver US6 for current personal storage activity.
7. Complete Polish for cross-story security, accessibility, performance, and reproducible evidence.

### Parallel Team Strategy

After Foundation, separate contributors can prepare US1, US2, US4, and US6 tests in parallel because fixtures isolate their boundaries. US3 follows the US2 lookup contract, while US5 follows the US1 storage and US4 hierarchy contracts. Cross-cutting evidence runs after the selected stories integrate.

## Notes

- `[P]` tasks use different files and have no dependency on an incomplete task in the same parallel group.
- Tests must fail for the intended missing behavior before implementation begins.
- JSON byte counts are decimal strings; database FILE.size remains the sole user-quota authority.
- Uploaded filenames never determine storage paths, and storageKey/provider URLs never enter public contracts, audits, logs, or browser state.
- Files and folders are permanently deleted; no task may add soft-delete, trash, restore, outbox, storage-operation, quota-counter, reservation, normalized-name, reconciliation, or unapproved index state.
- The only approved schema change adds USER.deletedAt and removes FILE.deletedAt/FOLDER.deletedAt; every other database difference requires a new explicit approval.
- Audit persistence is fail-open after important successful operations and never gates successful downloads or reverses completed business state.
- Use `prisma migrate deploy`, never schema push, for deployment evidence.
- Phase 2 ships a complete accessible light theme; dark/system theme support remains Phase 3 work.
- Commit after each task or cohesive task group and validate at every checkpoint.
