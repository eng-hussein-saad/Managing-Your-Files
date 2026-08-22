# Implementation Plan: User File Management

**Branch**: `002-user-file-management` | **Date**: 2026-08-22 | **Spec**: [`spec.md`](./spec.md)

**Input**: Feature specification from `/specs/002-user-file-management/spec.md`

**Planning status**: **COMPLETE THROUGH PHASE 1 DESIGN**

## Summary

Phase 2 adds secure, ownership-scoped file and folder management to the existing Express/Next.js monorepo. Express accepts bounded one-file multipart requests, verifies content from bytes, serializes each user's 100 MB quota, stores bytes in one private Supabase Storage bucket through a replaceable adapter, and persists canonical PostgreSQL metadata. The client submits batches of at most ten files sequentially for deterministic per-file progress and outcomes. The same service boundary provides paginated discovery, details, request-bound preview/download, fixed-parent nested folders, permanent deletion, and 30-day statistics.

Cross-system failures follow Constitution v3.0.0: private objects and metadata use best-effort compensation, known partial failures are reported safely and retryably, audit writes are attempted after successful important operations but fail open, and no durable outbox or unapproved schema entity is introduced.

## Technical Context

**Language/Version**: Node.js 24 LTS; TypeScript 5.9 strict mode

**Primary Dependencies**: Existing Next.js 16, React 19, Express 5, Zod 4, Prisma 7, PostgreSQL, Axios, TanStack React Query, Tailwind CSS, and Framer Motion; add server-only Multer 2, `@supabase/supabase-js` v2, `file-type`, and `pdfjs-dist` at Node 24-compatible versions pinned by pnpm

**Storage**: PostgreSQL canonical metadata/audit records plus one existing private Supabase Storage bucket for object bytes only; temporary upload files use a bounded server-local directory and are always cleaned up

**Testing**: Existing Vitest, Supertest, Testing Library, and Playwright projects; fake storage/extraction ports; PostgreSQL integration and concurrency tests; dedicated private-bucket adapter verification

**Target Platform**: Linux Express API, Vercel-compatible Next.js client, PostgreSQL, Supabase Storage, evergreen desktop/mobile browsers

**Project Type**: TypeScript web application monorepo (`client/`, `server/`, `packages/contracts/`)

**Performance Goals**: Under the SC-003 reference protocol (production-built API on Linux, at least 2 dedicated CPU cores and 4 GB RAM, same-host PostgreSQL, deterministic 10,000-owner/1,000-foreign fixture, one warm-up per Q1–Q5 template, then 20 measured repetitions per template at concurrency 5), at least 95 measured successful file-list requests complete within two seconds; stable page ordering; usable per-file progress; quota remains correct under at least 20 concurrent upload attempts

**Constraints**: 5,242,880 bytes/file inclusive; 104,857,600 retained bytes/user; 1–10 files/client batch; PDF/TXT/JPEG/PNG/WebP/DOCX only; private bucket and server-only secret; folder depth 10; permanent file/folder deletion; no unapproved database difference; JSON byte counts are decimal strings

**Scale/Scope**: Six user stories; 14 authenticated HTTP operations; 10,000-row acceptance datasets; 30 timezone-aware daily history buckets; bounded 5 MB object transfers

## Constitution Check

*GATE: Evaluated before Phase 0 and re-evaluated after Phase 1. All gates pass.*

| Principle / gate | Design evidence | Pre-research | Post-design |
| --- | --- | --- | --- |
| I. Strict TypeScript and layered design | Controllers coordinate; services own rules; repositories and storage/extraction ports isolate infrastructure; shared Zod schemas define public contracts. | PASS | PASS |
| II. Server-enforced security | Bearer authentication, owner-scoped lookup, byte-based validation, generated keys, private storage, safe not-found behavior, and authorization before streaming are contract requirements. | PASS | PASS |
| III. Stable contracts and replaceable infrastructure | `contracts/file-management.openapi.yaml` documents envelopes, queries, binary responses, and errors; Supabase is behind `StoragePort`. | PASS | PASS |
| IV. Complete reusable UX | Feature modules provide hooks and reusable upload, collection, preview, folder, statistics, state, confirmation, and accessibility patterns. | PASS | PASS |
| V. Verified environment contract | All ten Phase 2 settings are named in the spec and quickstart, validated at startup, mapped to server configuration, and kept out of client bundles. Phase 2 inventories Docker/deployment configuration, synchronizes every existing artifact, and records an explicit not-applicable result when none exists. | PASS | PASS |
| VI. Audit important operations | Successful important operations attempt sanitized events. Audit failure is fail-open with operational logging. Storage/database divergence uses permitted best-effort compensation. | PASS | PASS |
| VII. Spec-driven tested delivery | Quickstart scenarios and contract/data-model rules map to FR-001–FR-039 and retain risk-based security/concurrency evidence. | PASS | PASS |
| VIII. Comment every function/method | Implementation tasks and review must require an intent comment above every new or changed function, method, and callback. | PASS | PASS |
| IX. Maintainer-approved database contract | Phase 2 uses exactly the six canonical entities. The only migration adds `USER.deletedAt` and removes `FILE.deletedAt`/`FOLDER.deletedAt`, already approved and present in `database-schema.mmd`. No other schema difference is planned. | PASS | PASS |

### Database comparison and migration boundary

The Phase 1 runtime Prisma schema is behind the canonical diagram in one already approved way: it lacks nullable `USER.deletedAt` and still contains nullable `FILE.deletedAt` and `FOLDER.deletedAt`. Phase 2 will create one reviewable migration that:

1. adds nullable `USER.deletedAt` without backfill;
2. performs a preflight and refuses or pauses if either old file/folder soft-delete column contains non-null data;
3. drops `FILE.deletedAt` and `FOLDER.deletedAt` only after the preflight succeeds; and
4. changes no other existing entity, field, key, relationship, constraint, or index.

`FILE.storageKey` remains an internal provider reference, `FILE.size` remains the quota authority, and `AUDIT_LOG` remains audit data rather than workflow state. No `STORAGE_OPERATION`, quota counter, normalized-name field, or performance index is introduced.

## Phase 0: Research

Research decisions are recorded in [`research.md`](./research.md). All clarification markers are resolved. Key decisions are:

- proxy private storage through a server-only `StoragePort` backed by Supabase Storage;
- send a displayed client batch as sequential one-file multipart requests;
- use Multer temporary-disk intake with strict limits and guaranteed cleanup;
- detect binary formats from bytes and accept text only after strict UTF-8/content checks;
- extract TXT directly and PDF through bounded PDF.js processing; expose explicit unavailable states for images and DOCX extraction;
- serialize quota admission per user while computing `SUM(FILE.size)` rather than adding schema state;
- use object-first uploads and provider-first permanent deletion with safe retryable outcomes and best-effort compensation;
- proxy preview/download after current ownership checks and never expose storage keys or reusable privileged URLs;
- use validated offset pagination with a stable `FILE.id` tie-breaker and timezone-aware zero-filled statistics.

## Phase 1: Design and Contracts

### Data design

[`data-model.md`](./data-model.md) maps File, Folder, Audit Log, and transient query/statistics/upload state to the canonical entities. Root folders remain virtual (`folderId`/`parentId` null), folder parents are immutable, folder depth is derived by ancestor traversal, extraction availability is derived from MIME type plus `extractedContent`, and quota is computed from canonical `FILE` rows.

### External interface

[`contracts/file-management.openapi.yaml`](./contracts/file-management.openapi.yaml) defines the authenticated Phase 2 API:

- upload policy and one-file multipart upload;
- file list, detail, preview, download, move, and permanent delete;
- folder children list, create, breadcrumb detail, rename, and permanent delete;
- user-owned file statistics for a validated IANA timezone.

All JSON responses retain the existing success/error envelope. Protected or absent identifiers converge on the same safe `404` contract. Preview/download return authorized content directly and never include `storageKey`.

### Validation guide

[`quickstart.md`](./quickstart.md) defines prerequisites, safe configuration, migration checks, commands, and end-to-end scenarios covering upload boundaries, mixed batches, concurrency, ownership, browsing, previews, folders, deletion/compensation, audit failure, and statistics.

## Cross-System Operation Design

### Upload

1. Authenticate, validate request framing, normalize the display name, and inspect the temporary file from bytes.
2. Resolve and authorize the optional folder and derive extraction without allowing extraction failure to invalidate accepted content.
3. Acquire the per-user database lock, recompute retained bytes, and reject safely if the next file does not fit.
4. Generate trusted file/object UUIDs and upload to the private bucket with overwrite disabled.
5. Insert the canonical `FILE` row while the quota lock remains held. If insertion fails, attempt object removal and log only a sanitized code if compensation fails.
6. Release the lock, attempt the sanitized upload audit, and return the file plus extraction availability.
7. Remove the local temporary file on every exit path.

Only a committed `FILE` row is visible and counted. A crash may leave a private inaccessible object, explicitly tolerated by FR-007/FR-025 and Constitution VI.

### Permanent file deletion

1. Authenticate and owner-scope the lookup while capturing the trusted storage key.
2. Remove the private object. Provider not-found is idempotent success; operational failure is retryable and leaves metadata/quota unchanged.
3. Permanently delete the owner-scoped `FILE` row. A database failure is reported as partial/retryable and sanitized; quota is not reported reclaimed until metadata absence is confirmed.
4. Attempt the sanitized deletion audit after the primary outcome; audit failure does not reverse deletion.

Retries converge without deleting any different object because only the stored trusted key is used. The API does not distinguish foreign, deleted, malformed, or nonexistent resources in an existence-sensitive way.

### Folder mutation and deletion

Owner-scoped locks serialize sibling-name checks and create/rename/delete conflicts. Creation walks same-owner ancestors and rejects level 11. Parent never changes. Empty-folder deletion checks both child folders and files inside the same transaction, never cascades, then attempts audit after commit.

## Project Structure

### Documentation (this feature)

```text
specs/002-user-file-management/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── file-management.openapi.yaml
└── tasks.md                         # generated by $speckit-tasks, not this command
```

### Source Code (repository root)

```text
client/src/
├── app/(protected)/
│   ├── dashboard/
│   └── files/
└── features/
    ├── files/{api,hooks,components,upload}/
    ├── folders/{api,hooks,components}/
    └── dashboard/{api,hooks,components}/

packages/contracts/src/public/
├── files.ts
├── folders.ts
└── file-statistics.ts

server/src/
├── http/{controllers,routes,schemas}/
├── modules/
│   ├── files/{ports,services,repositories}/
│   ├── folders/{services,repositories}/
│   └── statistics/
└── infrastructure/
    ├── storage/
    ├── extraction/
    └── file-content/

server/tests/{unit,contract,integration,security}/
client/tests/{unit,component,integration}/
tests/e2e/
```

**Structure Decision**: Extend the existing client/server monorepo. Express remains the authoritative policy and content boundary. Provider/parsing details stay in infrastructure adapters; application services own authorization, quota, hierarchy, audit attempts, and compensation. Shared public contracts remain in `packages/contracts`; client pages compose reusable feature hooks/components.

## Complexity Tracking

No constitution violations or approved exceptions remain. The storage adapter, extraction port, and focused repositories are required boundaries under Principles I and III, not exceptions.
