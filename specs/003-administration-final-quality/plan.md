# Implementation Plan: Administration and Final Quality

**Branch**: `003-administration-final-quality` | **Date**: 2026-08-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-administration-final-quality/spec.md`

## Summary

Complete Fileora's administrator and final-quality layer without replacing the
existing architecture. Extend the Express/Prisma service layers and shared Zod
contracts with server-authorized user, global-file, statistics, and audit
operations; make destructive user cleanup retryable across PostgreSQL and
private storage; remove the approved `USER.deletedAt` field; and build the
administrator UI with existing React Query and reusable interaction patterns.
Finish the product-wide Fileora brand, persistent light/dark/system theming,
responsive and accessible states, risk-based automated verification, a
reproducible container workflow, and accurate maintainer documentation.

## Technical Context

**Language/Version**: TypeScript 5.9.2 in strict mode on Node.js 24.x

**Primary Dependencies**: Next.js 16 App Router, React 19, Express 5, Prisma 7,
PostgreSQL, Zod 4, TanStack React Query 5, Axios, Tailwind CSS 4, Framer Motion,
Supabase Storage adapter, JWT access tokens, and opaque refresh tokens

**Storage**: PostgreSQL for canonical records and private Supabase Storage for
file objects; browser `localStorage` for the non-sensitive theme preference

**Testing**: Vitest 3 projects (unit, contract, integration, component,
security), Supertest, Testing Library/jsdom, and Playwright 1.55 end-to-end

**Target Platform**: Modern evergreen browsers at representative 360 px,
768 px, and 1440 px widths; Node.js 24 Linux containers and local Node hosts

**Project Type**: TypeScript monorepo web application (Next.js client, Express
REST API, shared contract package)

**Performance Goals**: Correct deterministic queries over at least 1,000 users
and 10,000 files, with at least 95% of tested administrator page interactions
presenting the requested page within 2 seconds in the agreed test environment;
avoid full-table transfer and unnecessary React Query refetches

**Constraints**: Server-enforced admin authorization; no administrator content
preview/download privilege; permanent cleanup must not report false success;
stale mutations return 409 without automatic retry; no user/file/folder Trash
or recovery state; best-effort sanitized audit writes; no new secrets or
parallel infrastructure; all project-authored functions remain intent-commented;
no index may be added or altered without an exact recorded proposal, explicit
maintainer approval, synchronized canonical artifacts, and a new migration

**Scale/Scope**: Four administrator capabilities (users, global files,
statistics, audit history), application-wide branding/theme/UX completion,
schema synchronization, critical regression coverage, Docker workflow, and
README completion across the existing three workspaces

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-design gate

| Principle | Plan evidence | Status |
|---|---|---|
| I. Strict TypeScript and layered design | Shared Zod/types define the wire contract; controllers coordinate only; repositories own queries; services own deletion, concurrency, and audit orchestration. | PASS |
| II. Server-enforced security | Every `/api/admin/*` route composes authentication and administrator authorization before validation-driven disclosure or mutation. Admin file contracts expose metadata only and create no content route. | PASS |
| III. Stable contracts and replaceable infrastructure | The API contract extends existing envelopes and storage ports. All large collections are server-filtered, sorted, and paginated. | PASS |
| IV. Complete UX | Existing React Query, status, toast, dialog, and navigation patterns are extended for all async states, themes, responsive layouts, keyboard operation, and reduced motion. | PASS |
| V. Verified environment contract | No Phase 3 application key is introduced. Docker maps the existing validated keys, examples remain non-secret, and documentation/config tests verify parity. | PASS |
| VI. Audit important operations | New actions use the centralized best-effort audit service and allowlisted metadata; read access is admin-only and failure logs remain sanitized. | PASS |
| VII. Spec-driven delivery | Contracts, data design, validation scenarios, risk-based tests, and completion evidence are defined before tasks or implementation. | PASS |
| VIII. Comment every function | The comment audit remains a required verification command and applies to all changed functions/callbacks. | PASS |
| IX. Approved database contract | The maintainer explicitly approved removal of `USER.deletedAt` on 2026-08-23. This plan records exact impact and synchronizes `database-schema.mmd`; no other stored field, relationship, or index change is authorized. Performance analysis may identify index candidates but cannot implement them until a separate exact proposal is explicitly approved and synchronized. | PASS |

**Schema comparison and approval record**: The pre-plan baseline contained
nullable `USER.deletedAt`, matching the current Prisma schema and migration
history. The approved Phase 3 design removes only that column (and any
soft-deletion-only index, although none currently exists). `FILE` and `FOLDER`
remain permanent-only and unchanged. Audit actor removal uses the already
nullable `AUDIT_LOG.actorId`: the deletion transaction nulls live references
before deleting the user, so no foreign-key action or relationship change is
needed. Runtime Prisma schema, a reviewable Phase 3 migration, generated client,
fixtures, queries, contracts, tests, and docs must be synchronized during
implementation.

The approval does not cover new or altered indexes. Performance review records
query-plan evidence and recommendations only. If that evidence identifies an
index candidate, implementation pauses until the exact index, rationale,
migration and compatibility effects are added to the governed artifacts and
explicitly approved. An approved index uses a new reviewable migration; an
already-applied Phase 3 migration is never rewritten.

### Post-design gate

The completed [research](research.md), [data model](data-model.md),
[API contract](contracts/admin-api.yaml), and [quickstart](quickstart.md)
preserve all pre-design decisions. They add no unapproved entity, field,
relationship, dependency, configuration key, privileged content route, or
cross-system transaction requirement. All gates remain **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/003-administration-final-quality/
├── plan.md              # This file ($speckit-plan command output)
├── research.md          # Phase 0 output ($speckit-plan command)
├── data-model.md        # Phase 1 output ($speckit-plan command)
├── quickstart.md        # Phase 1 output ($speckit-plan command)
├── contracts/           # Phase 1 output ($speckit-plan command)
└── tasks.md             # Phase 2 output ($speckit-tasks command - NOT created by $speckit-plan)
```

### Source Code (repository root)

```text
client/
├── src/
│   ├── app/                 # App Router shells, user pages, and admin pages
│   ├── components/          # Shared navigation, footer, theme, state, dialog
│   ├── features/            # React Query API/hooks and feature UI
│   ├── lib/                 # Gateway, formatting, and configuration helpers
│   └── providers/           # Query, authentication, toast, and theme providers
└── tests/
    ├── component/
    ├── integration/
    └── unit/

server/
├── prisma/
│   ├── migrations/          # Approved USER.deletedAt removal migration
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── http/                # Admin schemas, routes, controllers, envelopes
│   ├── infrastructure/      # Prisma, storage, security, configuration, logging
│   └── modules/             # Users, files, statistics, audit business layers
└── tests/
    ├── contract/
    ├── integration/
    ├── security/
    └── unit/

packages/contracts/src/
├── internal/                # Trusted Next.js-to-Express auth contracts
└── public/                  # Browser-safe Zod contracts, including admin

tests/
├── e2e/                     # Cross-viewport/theme critical journeys
└── security/                # Cross-cutting security assertions

database-schema.mmd          # Canonical approved data baseline
scripts/                     # Intent-comment and repository verification tools
client/Dockerfile            # Planned multi-stage client image
Dockerfile                   # Planned multi-stage server image
compose.yaml                 # Planned app/PostgreSQL local workflow
.dockerignore                # Planned secret/sensitive context exclusions
```

**Structure Decision**: Extend the existing client/server/shared-contract
monorepo in place. Administrator pages live under `client/src/app/admin` and
feature-specific hooks/components under `client/src/features/admin`; Express
admin boundaries remain under `server/src/http`, while repositories and
services are added to the existing domain modules. No fourth application or
parallel auth, storage, audit, query, or component system is introduced.

## Design Decisions

### Administrator and concurrency boundaries

- Mount all feature endpoints below `/api/admin`; authentication and
  `requireAdmin` execute before handlers disclose or mutate data.
- Use stable `(sort field, id)` ordering and existing bounded page sizes (`5`,
  `10`, or `20`). Search is normalized and evaluated by PostgreSQL across
  explicitly supported fields.
- Role changes and user deletions carry `expectedUpdatedAt`. A serializable
  transaction locks the target account, rejects self/last-admin operations,
  compares the version, and maps a stale or serialization conflict to
  `RESOURCE_CONFLICT` (409) without retrying the administrator command.
- The authenticated identity boundary verifies that the JWT subject still
  exists and its current persisted role matches the token claim. A role change
  plus refresh-token removal therefore invalidates already-issued sessions
  immediately instead of waiting for access-token expiry.
- User deletion acquires the same owner lifecycle lock used by owner-scoped
  storage mutations, enumerates trusted storage keys, removes objects first
  (provider `not-found` means already cleaned), then atomically removes tokens,
  verification records and file/folder records, marks affected audit metadata
  with a non-PII deleted-actor discriminator, nulls actor references, and
  deletes the user. Storage failure rolls back database work and permits retry.
- Administrator file deletion reuses the permanent file deletion semantics but
  supplies the owner from the trusted database row, never from caller authority.
  No admin preview or download endpoint exists.
- The centralized audit matrix retains the constitution-required authentication,
  upload, download, file/folder deletion, and folder-mutation events. Within the
  administrator feature, only role change, permanent user deletion, and
  permanent administrator file deletion emit audit events. User/file list and
  detail reads, statistics reads, and audit-history reads emit none. Audit
  persistence remains fail-open with sanitized operational evidence.

### Read models and frontend behavior

- Statistics are computed at read time with database aggregates and bounded
  recent-upload/type queries; no snapshot table or cache invalidation system is
  added. Byte values cross JSON as decimal strings.
- Audit history joins the optional live actor. A safe `actorState: DELETED`
  discriminator written during user cleanup projects `Deleted user`; an event
  that was originally actorless projects `System`. Names and emails are never
  snapshotted. Metadata is allowlisted/sanitized before persistence and again
  projected through a narrow public schema.
- The theme selection (`light`, `dark`, `system`) is browser-local. A tiny
  pre-hydration document script applies the effective theme before paint; a
  provider listens to `prefers-color-scheme` only while `system` is selected.
- Administrator query state is URL-backed. React Query keys include normalized
  filters, sort, and pagination; successful mutations invalidate only affected
  admin summaries/lists plus relevant existing owner statistics.
- A maintained asynchronous-workflow inventory names every authentication,
  file, folder, dashboard, profile, and administrator page or action. Component
  and browser verification covers every applicable loading, empty, success,
  validation, and error state for every entry; any inapplicable state requires
  a recorded reason, so representative sampling cannot satisfy the gate.

### Configuration and deployment mapping

No new application environment variable is required. The container workflow
passes existing keys through runtime configuration as follows:

| Classification | Existing keys | Container handling |
|---|---|---|
| Server secrets | `DATABASE_URL`, `JWT_ACCESS_SECRET`, `BFF_SHARED_SECRET`, `SMTP_USER`, `SMTP_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SUPABASE_SECRET_KEY` | Runtime injection only; never `ARG`, `ENV`, image layer, log, or committed compose value |
| Server non-secrets | `PORT`, TTLs, CORS origin, mail host/from/port/security, admin name, storage URL/bucket and upload limits | Compose interpolation from local environment/example-derived file |
| Client public | `NEXT_PUBLIC_API_BASE_URL` | Explicit build/runtime public value; documented as browser-visible |
| Client server-only | `AUTH_API_BASE_URL`, `AUTH_BFF_SHARED_SECRET`, refresh-cookie settings and TTL | Runtime injection into the Next.js service only |

PostgreSQL is provided locally by Compose. SMTP and Supabase remain external or
test-substituted as already designed; Phase 3 does not provision providers.

## Verification Strategy

- Contract tests parse every success/error shape and prove unknown query/body
  fields are rejected.
- Integration/security tests cover the complete admin authorization matrix,
  deterministic pages, stale mutations, self/last-admin races, session
  invalidation, actor nulling, partial storage cleanup/retry, metadata-only file
  access, exact statistics, and sanitized audit projections.
- Component tests cover URL query state, mutation invalidation, dialog focus
  trapping/restoration, theme persistence, and system-theme changes. A checked
  inventory proves loading/empty/error/success/validation coverage for every
  user-facing asynchronous workflow rather than a representative subset.
- Authentication and file/folder regression tests preserve constitution-required
  audit coverage. Administrator tests prove role change, permanent user deletion,
  and permanent administrator file deletion attempt sanitized fail-open events,
  while all administrator reads create no audit records.
- Playwright covers representative journeys at 360, 768, and 1440 px in light,
  dark, and system modes with keyboard-only destructive workflows and reduced
  motion.
- Migration tests compare `database-schema.mmd`, Prisma, and PostgreSQL. Query
  plan review may record index candidates but fails the implementation gate if
  any unapproved index appears or an applied migration was rewritten. Clean
  container smoke tests start from non-secret example configuration. Lint,
  typecheck, intent-comment audit, all Vitest projects, three consecutive
  critical-suite runs, Playwright, and both production builds form the final
  evidence set.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations or justified exceptions are required.
