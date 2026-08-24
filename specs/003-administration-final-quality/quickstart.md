# Quickstart Validation: Administration and Final Quality

This guide is the Phase 3 end-to-end acceptance runbook. It describes the
expected completed implementation; it does not replace the repository README or
provider setup guidance.

## Prerequisites

- Node.js 24.x and pnpm 10.17.1
- PostgreSQL reachable through a disposable development/test database
- A disposable private Supabase Storage bucket, or the repository's faithful
  fake storage for automated integration tests
- Docker Engine with Compose v2 for the container scenario
- Non-secret local origins `http://localhost:3000` and
  `http://localhost:3001`

Read [the data model](data-model.md) for cleanup and state rules and
[the administration API contract](contracts/admin-api.yaml) for exact response
shapes and access boundaries.

## 1. Configure without committing secrets

From the repository root in PowerShell:

```powershell
Copy-Item -LiteralPath server/.env.example -Destination server/.env
Copy-Item -LiteralPath client/.env.example -Destination client/.env
```

Replace every secret placeholder in those untracked files with disposable
development values. Use a private test bucket and a non-production administrator
identity. Do not place secrets in `NEXT_PUBLIC_*` values, Compose YAML,
Dockerfiles, build arguments, image labels, or shell history.

Expected outcome: server and client configuration tests accept all required
keys; missing/invalid values stop only the affected process with a sanitized
message that does not print the value.

## 2. Install, migrate, and start locally

```powershell
pnpm install --frozen-lockfile
pnpm --filter @gold-era/server prisma:generate
pnpm --filter @gold-era/server prisma:migrate:deploy
pnpm --filter @gold-era/server admin:bootstrap
pnpm dev
```

Expected outcome:

- migration history includes the Phase 3 forward migration and `USER` no longer
  contains `deletedAt`;
- administrator bootstrap is idempotent;
- Express becomes healthy on port 3001 after database/storage readiness;
- Next.js serves Fileora on port 3000 with no user-facing Gold Era identity; and
- the initial page uses the effective theme without an impairing wrong-theme
  flash.

## 3. Verify administrator authorization

Use the seeded admin and a seeded normal user. Exercise every operation in
`contracts/admin-api.yaml` three ways: no bearer token, normal-user token, and
administrator token.

Expected outcome:

- unauthenticated requests return 401 in the standard error envelope;
- normal-user requests return 403 before administrator data is disclosed;
- administrators receive strict success shapes; and
- no `/api/v1/admin/files/{id}/preview` or `/download` capability exists.

Also confirm that the owner-scoped preview/download routes still authorize only
the signed-in owner. Being an administrator does not permit another user's
content access.

## 4. Validate user administration and concurrency

Seed at least two administrators and a target user with active refresh sessions,
verification records, nested folders, files, and stored objects.

1. Search and page the user directory, including an empty/out-of-range page.
2. Open the same target state in two administrator sessions.
3. Change the target role from the first session.
4. Submit the stale change from the second session.
5. Attempt refresh and an authenticated request using the target's prior session.
6. Try self-demotion/self-deletion and concurrent operations that would remove
   the last administrator.

Expected outcome: the first eligible command succeeds, the stale command returns
409 and requires reload/reconfirmation, all old target sessions fail immediately,
self-actions are rejected, and concurrent commands never leave zero admins.

For deletion, confirm the dialog names the email and irreversible consequences,
then permanently delete the seeded target. Verify zero target refresh tokens,
verification records, folders, files, stored objects, and user rows remain.
Retained audit events show `Deleted user` with no name/email snapshot.

## 5. Inject partial storage cleanup failure

Use fake storage or a disposable provider fixture with multiple user-owned
objects. Configure one removal to fail after earlier removals succeeded.

Expected outcome: the deletion does not report success, the user and database
inventory remain available, no content becomes newly accessible, and operational
logging contains no provider secret/key. Remove the failure and retry. Already
absent objects count as cleaned; remaining objects and dependent rows are
removed before success.

Repeat the failure/success path for administrator permanent file deletion.
Statistics and storage totals change only after successful completion.

## 6. Validate global files, statistics, and audit history

Seed at least 1,000 users and 10,000 files with varied owners, types, sizes,
folders, and dates plus known audit events.

- Combine filename/owner search with owner, type, size, date, and folder filters.
- Exercise every sort direction and verify `id` tie-breaking and exact totals.
- Confirm admin file detail exposes metadata but no extracted content, storage
  key, signed URL, preview action, or download action.
- Compare total users, total files, stored bytes, every type count, and recent
  ordering with direct seeded expectations before and after upload/deletion.
- Locate known audit events by supported filters; inspect live, deleted, and
  system actor presentations and safe metadata.
- Execute successful authentication, upload, download, permanent file/folder
  deletion, folder mutation, user role change, permanent user deletion, and
  permanent administrator file deletion; verify each attempts a centralized
  sanitized audit event. Inject an audit-write
  failure for each operation class and verify the primary operation remains
  governed by its own contract while sanitized operational evidence is emitted.
- Execute administrator user/file list and detail, statistics, and audit-history
  reads and verify they create zero audit events.

Expected outcome: results are exact and deterministic per request. In the agreed
environment, at least 95% of requested administrator pages render within two
seconds. Capture API/query timing and `EXPLAIN ANALYZE` for any route missing its
diagnostic budget. Record an index candidate as advisory only; do not implement
it until the exact proposal receives explicit maintainer approval, all governed
artifacts are synchronized, and a new reviewable migration is planned.

## 7. Validate themes, accessibility, and responsive behavior

At 360 px, 768 px, and 1440 px widths, use keyboard-only navigation through
authentication, user files/folders, profile, admin dashboard, users, files, and
audit history.

Create `async-workflows.md` as the authoritative inventory of every
user-facing asynchronous page and action. For every entry, exercise loading,
empty, validation, success, and error states where applicable and record a
specific reason for each state that does not apply. The gate fails if any
inventory entry lacks evidence; representative sampling is not sufficient.

For each `light`, `dark`, and `system` selection:

1. navigate, reload, and revisit;
2. in system mode, change the emulated operating-system scheme;
3. inspect charts, tables/cards, forms, menus, drawers, dialogs, previews,
   feedback states, navigation, and footer; and
4. repeat with reduced motion.

Expected outcome: the saved selection persists, system remains saved while its
effective palette follows the OS, critical content and focus remain perceivable,
all actions remain available, and the footer never overlays content. Dialogs
contain focus, close on Escape when safe, and restore focus to their trigger.
Every destructive confirmation identifies its target and permanent consequence.

## 8. Run automated quality gates

```powershell
pnpm typecheck
pnpm lint
pnpm audit:comments
pnpm test
pnpm test:integration
pnpm test:security
pnpm test:e2e
pnpm build
```

Run the documented critical-behavior suite three consecutive times from a clean
test database.

Expected outcome: all runs pass without intermittent concurrency or cleanup
failures; client and server production builds complete; test output and reports
contain no credentials, raw tokens, verification codes, storage keys, private
content, or connection strings.

## 9. Validate the container workflow

With the implemented root Compose file and runtime environment populated:

```powershell
docker compose config
docker compose build --no-cache
docker compose up --wait
docker compose ps
```

Expected outcome: PostgreSQL becomes healthy, the one-shot migration completes,
then Express and Next.js become healthy. An unfamiliar maintainer can reach the
working application within 20 minutes. Restart the stack and confirm migrations,
bootstrap behavior, and stored data are idempotent/persistent.

Inspect image configuration/history and the resolved Compose configuration.
Expected outcome: no usable secret is embedded in an image or committed file;
only `NEXT_PUBLIC_API_BASE_URL` is browser-visible. Starting with a required key
missing or invalid fails clearly without printing its value.

Stop the stack with `docker compose down`. Do not add `--volumes` unless the
disposable PostgreSQL data is intentionally being destroyed.

## 10. Documentation and final review

Follow the completed README from a clean checkout. Confirm it covers product
overview, architecture, repository layout, prerequisites, configuration
classification, migrations, admin initialization, local/container execution,
tests, storage, deployment, assumptions, and design decisions.

Expected outcome: the README explicitly states that administrator user deletion
and current file/folder deletion are permanent, `USER` has no soft-deletion
field, and Trash/restore is not part of the product. Record evidence for every
SC-001 through SC-014 item and resolve every critical authorization, ownership,
content-access, or permanent-deletion defect before Phase 3 completion.
