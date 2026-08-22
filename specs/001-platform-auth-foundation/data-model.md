# Phase 1 Data Model: Platform Authentication Foundation

## Canonical-schema comparison

Source of truth: [`database-schema.mmd`](../../database-schema.mmd).

| Canonical entity | Phase 1 Prisma model | Alignment |
|------------------|----------------------|-----------|
| `USER` | `User` mapped to `USER` | Exact fields, email unique key, nullability, and outgoing relationships |
| `VERIFICATION_CODE` | `VerificationCode` mapped to `VERIFICATION_CODE` | Exact fields; use and supersession use `usedAt` and `invalidatedAt` |
| `REFRESH_TOKEN` | `RefreshToken` mapped to `REFRESH_TOKEN` | Exact fields; one row per issued opaque token; no session/family model |
| `FOLDER` | `Folder` mapped to `FOLDER` | Exact owner and nullable parent self-relation; behavior deferred |
| `FILE` | `File` mapped to `FILE` | Exact owner and nullable folder/content fields; behavior deferred |
| `AUDIT_LOG` | `AuditLog` mapped to `AUDIT_LOG` | Exact fields; required event outcome is an allowlisted metadata property |

There is no proposed entity, field, type, key, nullability, or relationship difference. Phase 1 creates only the primary keys, `USER.email` unique constraint, and foreign keys shown in the canonical diagram. Additional indexes or constraints—including on token hashes, active codes, folder names, storage keys, user soft-deletion queries, or audit history—must be proposed against the canonical diagram and explicitly approved before a later migration adds them.

### Maintainer-approved lifecycle schema revision (2026-08-22)

The maintainer explicitly approved moving soft deletion exclusively to users. Relative to the earlier runtime schema, the approved canonical change is exactly:

- add nullable `USER.deletedAt` with no backfill so existing users remain active;
- remove nullable `FOLDER.deletedAt`;
- remove nullable `FILE.deletedAt`;
- preserve all existing entities, keys, types, and relationships.

The implementation plan for Phase 2 MUST include a reviewable migration that adds the user field and drops the two file/folder fields after confirming no deployed behavior depends on their values. Authentication queries, fixtures, and tests must treat non-null `USER.deletedAt` as inactive. File/folder deletion logic, fixtures, and tests must use permanent deletion. Until that migration is applied, the existing runtime schema is not aligned with this revised canonical design.

## PostgreSQL and Prisma mapping rules

- `uuid` → Prisma `String @db.Uuid`; IDs use application/migration UUID defaults.
- `string` → Prisma `String` backed by PostgreSQL `text`.
- `text` → Prisma `String` backed by PostgreSQL `text`.
- `boolean` → Prisma `Boolean`.
- `datetime` → Prisma `DateTime @db.Timestamptz(3)`; authoritative comparisons use database/server UTC time.
- `bigint` → Prisma `BigInt @db.BigInt`; public JSON contracts serialize file size as a decimal string to avoid JavaScript precision loss.
- `json` → Prisma `Json` backed by PostgreSQL `jsonb`.
- Canonical camelCase column names are retained. Prisma model names map to the uppercase canonical table names.
- Required relations use restrictive/no-action deletion behavior in Phase 1. User deletion is later implemented by setting `USER.deletedAt`; file and folder deletion is permanent and its safe relation/storage behavior is deferred to Phase 2.

## User

Represents a regular or administrator identity.

| Field | Type | Rules |
|-------|------|-------|
| `id` | UUID, primary key | Immutable |
| `name` | String | Trimmed, non-empty display name; safe profile field |
| `email` | String, unique | Trim surrounding whitespace, lowercase entire value, then validate email; immutable in Phase 1 |
| `passwordHash` | String | Argon2id encoded hash only; never returned or audited |
| `role` | String | Service-level allowlist: `USER` or `ADMIN`; no unapproved database enum |
| `isEmailVerified` | Boolean | `false` for registration, `true` after atomic verification; bootstrap administrator is verified |
| `deletedAt` | Nullable DateTime | Sole soft-deletion marker; null for active accounts and set by the Phase 3 administrator workflow |
| `createdAt` | DateTime | Set once on insertion |
| `updatedAt` | DateTime | Updated on persisted account changes |

Relationships: one user has zero or many verification codes, refresh tokens, folders, files, and audit logs; an audit actor may be absent.

State transitions:

```text
absent ──register──> USER / unverified ──valid current code──> USER / verified
absent ──bootstrap─> ADMIN / verified
existing USER + configured ADMIN_EMAIL ──bootstrap──> startup conflict (no mutation)
active user ──Phase 3 administrator deletion──> soft-deleted user / authentication denied
```

There is no Phase 1 role change, profile edit, password reset, lockout, or user deletion.

## VerificationCode

Represents the one email-verification proof type supported in Phase 1.

| Field | Type | Rules |
|-------|------|-------|
| `id` | UUID, primary key | Immutable |
| `userId` | UUID, foreign key | Required owning `USER` |
| `codeHash` | String | Argon2id encoded hash of an eight-digit cryptographically random code |
| `expiresAt` | DateTime | Exactly ten minutes after issuance |
| `usedAt` | Nullable DateTime | Set once when successfully consumed |
| `invalidatedAt` | Nullable DateTime | Set when superseded or otherwise made ineligible |
| `createdAt` | DateTime | Issuance time and resend-rate window source |

Eligibility at authoritative server time requires all of:

- belongs to the target user;
- `usedAt` is null;
- `invalidatedAt` is null;
- `expiresAt` is strictly later than current time;
- Argon2id verification succeeds.

State transitions:

```text
current ──valid submission──> used
current ──replacement issued──> invalidated
current ──time reaches expiry──> expired (timestamps unchanged)
used / invalidated / expired ──submission──> rejected
```

Verification and resend serialize on the owning user/eligible records so overlapping requests cannot verify a superseded code. Resend allows one issuance per 60 seconds and five in a rolling hour per user, invalidates all earlier unused codes, inserts the replacement, and commits before mail delivery. Purpose is implicit because email verification is the only Phase 1 code purpose; no lineage field is required to reject prior codes.

## RefreshToken

Represents one independently revocable opaque renewal credential.

| Field | Type | Rules |
|-------|------|-------|
| `id` | UUID, primary key | Immutable record identifier |
| `userId` | UUID, foreign key | Required owning `USER` |
| `tokenHash` | String | SHA-256 hash of a uniformly random 32-byte raw token |
| `expiresAt` | DateTime | Default issuance time plus 30 days |
| `revokedAt` | Nullable DateTime | Set when the refresh token is revoked, such as during rotation, logout, or replay handling |
| `createdAt` | DateTime | Issuance time |

Eligibility requires a matching hash, `revokedAt` null, `expiresAt` later than current server time, and an active verified user. Because the canonical schema does not mark `tokenHash` unique or indexed, lookup remains correct but initially scan-based; an optimization requires schema approval.

State transitions:

```text
active ──successful rotation──> revoked + one new active row
active ──logout or explicit revocation──> revoked
active ──time reaches expiry──> expired (timestamps unchanged)
revoked / expired ──replay/presentation──> rejected
```

Rotation uses a conditional revoke and replacement insert in one serializable transaction. Each sign-in creates a distinct record, and logout affects only the presented record. No raw value, session family, or rotation lineage is persisted.

## Folder

Phase 1 establishes only the later ownership/hierarchy contract.

| Field | Type | Rules |
|-------|------|-------|
| `id` | UUID, primary key | Immutable |
| `ownerId` | UUID, foreign key | Required owning `USER` |
| `parentId` | Nullable UUID, self foreign key | Optional parent `FOLDER`; hierarchy behavior deferred |
| `name` | String | Behavior/validation deferred to Phase 2 |
| `createdAt` | DateTime | Set on insertion |
| `updatedAt` | DateTime | Updated on mutation |

Phase 1 creates no folder route, default folder, hierarchy mutation, or uniqueness constraint.

## File

Phase 1 establishes only the later ownership/storage metadata contract.

| Field | Type | Rules |
|-------|------|-------|
| `id` | UUID, primary key | Immutable |
| `ownerId` | UUID, foreign key | Required owning `USER` |
| `folderId` | Nullable UUID, foreign key | Optional containing `FOLDER` |
| `originalName` | String | Future display metadata, never a trusted storage path |
| `storageKey` | String | Future provider-independent generated key |
| `mimeType` | String | Future authoritative upload metadata |
| `size` | BigInt | Future byte count |
| `extractedContent` | Nullable Text | Future extracted text; no distinct Phase 1 extraction status |
| `createdAt` | DateTime | Set on insertion |
| `updatedAt` | DateTime | Updated on mutation |

Phase 1 creates no file row, storage operation, upload, query, preview, download, extraction, or deletion behavior.

## AuditLog

Append-only security event written through one audit service.

| Field | Type | Rules |
|-------|------|-------|
| `id` | UUID, primary key | Immutable |
| `actorId` | Nullable UUID, foreign key | Known authenticated/identified actor when safe |
| `action` | String | Stable allowlisted action identifier |
| `entityType` | Nullable String | Stable target type when applicable |
| `entityId` | Nullable String | Target identifier when applicable |
| `metadata` | Nullable JSON | Allowlisted context including required `outcome`; never arbitrary request data |
| `createdAt` | DateTime | Event timestamp |

Phase 1 actions include registration, verification success, sign-in success, refresh rotation, logout/revocation, bootstrap creation, delivery failure, and authorization denial. Metadata may contain safe keys such as `outcome`, `reasonCode`, or request correlation identifiers. It must never contain passwords, code values or hashes, raw access/refresh credentials, trust secrets, connection strings, or private content.

Successful privilege/state changes include their audit insert in the same transaction and fail closed if it cannot be recorded. Logout still revokes a known credential if audit persistence alone fails. A denied request remains denied and produces a sanitized critical operational fallback if its audit record cannot be stored.

## Concurrency and consistency matrix

| Operation | Concurrency control | Required atomic result |
|-----------|---------------------|------------------------|
| Registration | Normalized email unique key + serializable retry | At most one user; user/code/audit together |
| Administrator bootstrap | Normalized email unique key + serializable retry | One verified admin or sanitized regular-user conflict |
| Verification | Conditional eligibility checks in serializable transaction | Consume current code, verify user, invalidate competitors, audit |
| Resend | Per-user serializable transaction | Check rate, invalidate old, create one current code, audit |
| Sign-in | Transaction | Create refresh record and success audit before issue |
| Rotation | Conditional revoke in serializable transaction | Revoke exactly one old row and create one replacement without audit noise |
| Logout | Conditional idempotent revoke | Presented row revoked; repeated requests safe |

## Migration and compatibility impact

The initial migration creates the exact canonical schema. There is no legacy data migration because this feature initializes a greenfield repository. Prisma schema, generated migration SQL, seed/bootstrap behavior, test fixtures, and this document must be compared with `database-schema.mmd` during review. Production uses `prisma migrate deploy`; schema push is not a deployment path.
