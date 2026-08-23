# Phase 0 Research: Administration and Final Quality

## 1. Canonical user lifecycle migration

**Decision**: Add a new forward Prisma migration; do not rewrite applied Phase 2
history. The migration first aborts if any `USER.deletedAt` value is non-null,
then drops the column. Update `database-schema.mmd`, Prisma, generated client,
fixtures, queries, contracts, tests, and docs in the Phase 3 implementation.
There is currently no user-soft-deletion-only index to remove.

**Rationale**: The maintainer explicitly approved the design change. A
fail-closed preflight prevents old lifecycle markers from being silently
discarded, while a forward migration remains reproducible for databases that
already applied migration `002_user_file_management`.

**Alternatives considered**: Unconditional drop was rejected because it loses
unresolved lifecycle meaning. Rewriting migration 002 was rejected because it
breaks deployed migration history. Automatically deleting or reactivating
marked users was rejected as an unapproved data policy.

## 2. User deletion ordering and idempotency

**Decision**: Run permanent user deletion in one bounded interactive database
transaction that acquires the shared administrator lifecycle lock, locks and
reloads the target, validates actor/version/last-admin invariants, enumerates
trusted file storage keys, and removes objects. Only a classified storage
`not-found` response counts as already cleaned. After all objects are absent,
delete refresh tokens, verification records, files, folders, mark/null affected
audit actors, and delete the user in foreign-key-safe order. Commit first, then
attempt the success audit through the existing best-effort service.

**Rationale**: Database rows remain the retry inventory until every required
object is absent. A failure rolls the database work back; objects already
removed stay securely absent and a later retry accepts them. The existing
upload path already establishes an object operation inside a user-bound
transaction, so extending a common owner lifecycle lock prevents a concurrent
upload from creating an orphan during deletion without adding deletion state.

**Alternatives considered**: Database-first cleanup loses storage keys and can
orphan private objects. Unlocked provider-first cleanup races current owner
mutations. A deletion-state field, durable outbox, or reconciliation worker
would expand the approved schema and is not required by the constitution.

## 3. Stale administrator commands and last-admin safety

**Decision**: Use `updatedAt` as the mutation version carried as
`expectedUpdatedAt`. All role/deletion commands take a fixed PostgreSQL
transaction advisory lock for the cross-target administrator invariant, then
lock/reload the target and validate version, self-action, and current admin
count. A stale, missing-after-confirmation, lock, or serialization conflict maps
to a sanitized 409 and is never automatically retried. Role update and removal
of all target refresh tokens are atomic.

**Rationale**: The shared transaction lock makes concurrent demotion/deletion
of different last-admin candidates deterministic, while the row version binds
the command to what the acting administrator confirmed. No new version column
is needed. The existing generic serializable helper retries conflicts, so these
administrator commands need an attempts-one path to honor FR-009.

**Alternatives considered**: An unconditional write permits stale actions. A
new version field is an unapproved schema change. Automatic serialization retry
could execute a command against state the administrator did not reconfirm.

## 4. Immediate session invalidation after role change

**Decision**: At the authentication boundary, load the live user for each
protected request and reject when the account is absent, unverified, or its
persisted role differs from the access-token role claim. The role transaction
removes all refresh sessions. Existing access tokens then fail immediately and
the target must sign in again.

**Rationale**: Removing refresh tokens alone prevents renewal but leaves an
already-issued access token usable until expiry. Comparing the short token claim
with current persisted authority closes that gap using the existing repository
and middleware layering.

**Alternatives considered**: Waiting for the 15-minute access-token expiry does
not satisfy “all existing sessions.” A session-version field or token blacklist
adds state not approved for this phase.

## 5. Audit history after actor deletion

**Decision**: Keep nullable `AUDIT_LOG.actorId` and the existing `NO ACTION`
foreign key. In the user-deletion transaction, safely merge the non-PII marker
`actorState: DELETED` into affected audit metadata and then set `actorId` to
null. Reads left-join live actors and project one of live user, `Deleted user`,
or `System`; arbitrary stored JSON never passes directly to the client.

**Rationale**: Events remain retained and understandable without a name/email
snapshot. The discriminator distinguishes an actor who was deleted from an
event that was system-originated, while avoiding any new field or relationship.

**Alternatives considered**: `ON DELETE SET NULL` changes referential behavior
and cannot distinguish system events. Name/email snapshots violate the approved
privacy rule. Deleting actor events violates audit retention.

## 6. Administrator API and query contracts

**Decision**: Extend the existing `/api/v1/admin` router and strict success/error
envelopes. Keep one-based offset pages with existing sizes `5 | 10 | 20`,
normalized case-insensitive search capped at 200 characters, and `(selected
field, id)` deterministic ordering. Expose:

- users list/detail, role change, and permanent deletion;
- global file list/detail and permanent deletion;
- current platform statistics; and
- sanitized audit-event history.

The exact paths and shapes are in `contracts/admin-api.yaml`. Global file
contracts contain metadata only and define no preview/download route. Byte
counts remain decimal strings. Deletion bodies bind the displayed version and
target identity rather than accept a generic boolean.

**Rationale**: This preserves the project's current Express, Zod, error,
pagination, and React Query conventions while satisfying direct-call security
and deterministic query requirements. Offset pages fit the existing UI and
required total counts at the specified scale.

**Alternatives considered**: Cursor pagination has stronger deep-page stability
but would create a second application pattern without demonstrated need. A
generic `confirmed: true` does not protect a stale dialog. Admin content URLs
would violate the explicit access boundary.

## 7. Statistics and query performance

**Decision**: Compute statistics from current rows using database aggregates,
grouped file categories, and a bounded recent-upload query. Establish a
diagnostic budget of warmed API p95 at or below one second, leaving the rest of
the two-second SC-004 interaction target for network and rendering. Seed at
least 1,000 users and 10,000 files, capture query timings/`EXPLAIN ANALYZE`, and
add indexes only where measurements show an important plan problem.

On the client, debounce text queries, cancel superseded requests, keep previous
page data, use complete normalized query keys, and invalidate only affected
lists/statistics after mutations.

**Rationale**: Read-time aggregates stay exact after uploads/deletions and avoid
new lifecycle/cache infrastructure. Measured optimization satisfies the spec
and constitution without speculative redesign.

**Alternatives considered**: Materialized statistics or a broad cache require
invalidation machinery and can become stale. Unmeasured indexes increase write
cost. Broad query invalidation creates unnecessary traffic and visual churn.

## 8. Theme, shell, and accessible interaction

**Decision**: Persist `light | dark | system` only after explicit selection in
a namespaced browser storage key. A pre-hydration script applies the effective
`data-theme` and `color-scheme` before paint. A ThemeProvider retains `system`
as the saved selection and listens to `prefers-color-scheme` changes only in
system mode. Invalid/unavailable storage falls back to system.

Place shared Fileora identity, theme control, and a normal-flow responsive
footer in reusable shell primitives. Convert colors to semantic tokens for both
palettes. Extend one modal/drawer behavior with initial focus, focus containment,
Escape handling, scroll/background containment, and focus restoration. Use URL
query state for admin pages and semantic tables or complete labeled mobile
cards. Validate 360 px, 768 px, and 1440 px plus reduced motion.

**Rationale**: Pre-paint application prevents an impairing wrong-theme flash,
browser storage needs no API/schema change, and shared shell/interaction
primitives reduce drift across public, user, and admin surfaces.

**Alternatives considered**: Post-mount theme effects flash. CSS-only media
queries cannot persist explicit overrides. Server cookies add plumbing and
still do not know first-visit system preference. Per-layout footers and modal
copies risk inconsistent coverage.

## 9. Verification and containers

**Decision**: Extend existing Vitest projects, Supertest, Testing Library, and
Playwright. Prioritize authorization matrices, deterministic queries, stale and
last-admin races, immediate session invalidation, partial cleanup/retry, safe
audit projection, exact statistics, async UI states, focus/keyboard behavior,
theme persistence/system changes, branding, and responsive journeys. Run the
critical suite three clean times and build both applications.

Add pinned Node 24/pnpm multi-stage client and server images, a secret-excluding
`.dockerignore`, and Compose services for PostgreSQL, migration, Express, and
Next.js. Supabase remains an injected external private storage dependency.
Secrets are runtime-only; the browser-visible `NEXT_PUBLIC_API_BASE_URL` is
explicitly classified. Health checks and dependency ordering prove startup.

**Rationale**: This reuses the established test architecture and produces the
reproducible handoff required by Phase 3. Separate app images keep runtime
boundaries clear and avoid secrets in layers.

**Alternatives considered**: A new test framework adds no required capability.
Bundling PostgreSQL and external storage into an app image breaks replaceable
infrastructure. Production provider provisioning and deployment execution are
outside scope.

## Resolution status

All Technical Context unknowns are resolved. No dependency replacement, new
application environment key, additional persisted entity, or unapproved schema
difference remains. Constitution gates pass before and after design.
