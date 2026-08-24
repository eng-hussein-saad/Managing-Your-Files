# Data Model: Administration and Final Quality

## Approval and baseline

The maintainer approved removal of `USER.deletedAt` on 2026-08-23. The
canonical `database-schema.mmd` is synchronized by this planning workflow. The
implementation must next remove the corresponding Prisma field and database
column through a reviewable Phase 3 migration and update fixtures, queries,
contracts, tests, and documentation. No field is added to `USER`, `FILE`, or
`FOLDER`, and no relationship is changed.

## Persisted entities

### User (`USER`)

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key, immutable |
| `name` | string | Non-empty display identity; never copied into audit history on deletion |
| `email` | string | Unique normalized identity; sensitive to administrator-only surfaces |
| `passwordHash` | string | Never exposed |
| `role` | string | Persisted values limited to `USER` and `ADMIN` |
| `isEmailVerified` | boolean | Required |
| `createdAt` | timestamptz | Required |
| `updatedAt` | timestamptz | Required mutation version and display timestamp |

There is no deleted state. Permanent deletion is the only administrator-driven
account deletion transition.

Relationships: one user owns zero or more verification codes, refresh tokens,
folders, and files. A user may be the actor for zero or more audit logs. Those
audit references are nullable and are cleared before the user is deleted.

### Verification record (`VERIFICATION_CODE`)

Fields remain `id`, `userId`, `codeHash`, `expiresAt`, nullable `usedAt`,
nullable `invalidatedAt`, and `createdAt`. Hash and lifecycle fields are never
exposed through administrator contracts. All records for a permanently deleted
user are removed in the final database transaction.

### Refresh session (`REFRESH_TOKEN`)

Fields remain `id`, `userId`, `tokenHash`, `expiresAt`, nullable `revokedAt`,
and `createdAt`. The opaque raw token is never persisted. A role change deletes
or revokes every current session for the target user in the same transaction as
the role update; a permanent user deletion removes all session rows before the
user row. Existing access JWTs are short-lived, but all refresh renewal becomes
impossible immediately after the transaction.

### Folder (`FOLDER`)

Fields remain `id`, `ownerId`, nullable `parentId`, `name`, `createdAt`, and
`updatedAt`. A folder belongs to exactly one user and optionally one parent.
There is no deleted state. User cleanup deletes the complete owned hierarchy
only after all associated stored file objects have been confirmed absent.

### File (`FILE`)

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key |
| `ownerId` | UUID | Required user owner; trusted authority for storage cleanup |
| `folderId` | UUID? | Optional owned folder |
| `originalName` | string | Display/search value only, never a storage path |
| `storageKey` | string | Private server-only provider key; never in public/admin response |
| `mimeType` | string | Validated upload type; admin filter/display field |
| `size` | bigint | Non-negative stored byte count; serialized as a decimal string |
| `extractedContent` | text? | Private content; never returned by admin metadata operations |
| `createdAt` | timestamptz | Upload timestamp |
| `updatedAt` | timestamptz | Mutation version and display timestamp |

There is no deleted state. Owner and administrator deletion share object-first,
metadata-second permanent semantics. Provider `not-found` is treated as already
cleaned; other provider failures do not produce deletion success.

### Audit event (`AUDIT_LOG`)

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key |
| `actorId` | UUID? | Optional live user reference; set to null before actor deletion |
| `action` | string | Must be from the centralized action allowlist |
| `entityType` | string? | Allowlisted operational entity category |
| `entityId` | string? | Stable target identifier when useful |
| `metadata` | JSON? | Small allowlisted object; may carry non-PII `actorState: DELETED`, but no request bodies, credentials, tokens, content, keys, or actor snapshots |
| `createdAt` | timestamptz | Event timestamp; immutable |

Audit events are append-only and retained without automated expiration in this
phase. Read projection joins the live actor when present. During actor deletion,
the same transaction adds `actorState: DELETED` and then clears `actorId`; those
rows render as `Deleted user`. An originally actorless event has no discriminator
and renders as `System`. Audit write failure is fail-open for the primary
successful operation and emits sanitized operational logging.

Within administrator capabilities, the centralized action allowlist includes
only user role change, permanent user deletion, and permanent administrator file
deletion. Administrator list/detail, statistics, and audit-history reads create
no audit records.

## Non-persisted models

### Theme preference

Browser-local enum: `light | dark | system`. Invalid or inaccessible stored
values resolve to `system`. `system` remains the saved value while the effective
theme follows `prefers-color-scheme`. This is not a database entity.

### Platform statistics view

A read-time projection containing current user count, current file count, total
stored bytes, file-type distribution, and a bounded recent-upload list. It is
derived from live `USER` and `FILE` rows and is never persisted as a snapshot.

### Administrator list projections

- **Admin user summary**: `id`, `name`, `email`, `role`, verification state,
  `createdAt`, `updatedAt`; excludes password, token, verification, and audit
  metadata.
- **Admin file summary**: `id`, owner `{id,name,email}`, original name,
  MIME/type category, decimal size, optional folder `{id,name}`, `createdAt`,
  and `updatedAt`; excludes storage key, extracted content, signed URL, preview,
  and download capability.

## Validation and query rules

- IDs are UUIDs; timestamps are ISO-8601 UTC on the wire.
- Pages are one-based and bounded; page size is one of `5`, `10`, or `20`.
- User search covers normalized name/email. File search covers original name and
  owner name/email. Audit search is limited to action, entity type/id, and live
  actor identity plus explicit filters.
- Every order adds `id` as a final deterministic tie-breaker. Default order is
  newest first (`createdAt desc`, `id desc`).
- File filters support owner UUID, type category/MIME group, inclusive upload
  dates, and folder presence (`any`, `root`, `foldered`). Audit filters support
  action, entity type, actor UUID, and inclusive time range.
- `expectedUpdatedAt` must exactly match the current user/file version for
  destructive or role mutations. Mismatch is a 409 conflict, never a retry.
- A role must be `USER` or `ADMIN`, differ from the target's current role, and
  cannot be changed for the acting administrator. Deleting/demoting the last
  administrator is prohibited inside the same serializable transaction.

## State transitions

### User role

```text
USER --eligible admin command--> ADMIN
ADMIN --eligible admin command--> USER
```

Both transitions atomically update `updatedAt`, invalidate all target refresh
sessions, and attempt an audit event after success. Self-transition, no-op,
unsupported role, stale version, or last-admin demotion is rejected.

### Permanent user deletion

```text
present
  -> lifecycle lock + current-state validation
  -> storage objects confirmed absent (missing is acceptable)
  -> atomic dependent-row cleanup + audit actor nulling + USER delete
  -> absent
```

If storage cleanup fails, the database transaction is rolled back and the user
remains present for an idempotent retry. Already removed objects remain safely
absent. No intermediate deleted-user state is persisted.

### Permanent file deletion

```text
present -> object confirmed absent -> FILE row deleted -> absent
```

Provider failure keeps the row and returns a sanitized retryable failure. A
stale administrator version returns conflict before mutation. The success audit
is best-effort after primary completion.
