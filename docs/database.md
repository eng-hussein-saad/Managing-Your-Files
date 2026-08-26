# Database and Prisma

Fileora uses PostgreSQL as the relational source of truth and Prisma ORM 7 for typed access. Prisma Client is generated from `server/prisma/schema.prisma`; runtime creation uses the PostgreSQL driver adapter in `server/src/infrastructure/persistence/prisma.ts`. Deployment applies the committed SQL under `server/prisma/migrations`.

An ORM (object-relational mapper) maps database rows and relations into typed application operations. Prisma does not replace the domain services: services still enforce ownership, quota, lifecycle, and authorization rules before repositories call Prisma.

The repository also includes [`database-schema.mmd`](../database-schema.mmd), a Mermaid entity relationship diagram. The Prisma schema and applied migrations remain the executable source of truth.

## Models

### `User` → `USER`

Stores UUID identity, name, unique normalized email, Argon2id password hash, string role, verification state, and explicit creation/update timestamps. It owns verification codes, refresh sessions, folders, files, and optional audit-actor relationships.

Only email has an explicit non-primary unique index. Role values are constrained by application validation and projections rather than a PostgreSQL enum.

### `VerificationCode` → `VERIFICATION_CODE`

Stores a UUID, required user foreign key, Argon2id code hash, expiration, optional use/invalidation timestamps, and creation time. Services use newest-first eligibility and transactional conditional updates to make codes current and single-use.

### `RefreshToken` → `REFRESH_TOKEN`

Stores a UUID, required user foreign key, SHA-256 refresh-token hash, expiration, optional revocation time, and creation time. One user can have many independently revocable sessions. Raw refresh values never enter PostgreSQL.

### `Folder` → `FOLDER`

Stores UUID, required owner, optional self-referencing parent, name, and timestamps. A null parent represents the virtual root. The database relation permits a tree; services additionally enforce same-owner ancestry, no cycles/broken chains during traversal, case-folded sibling uniqueness, a ten-level maximum, and empty-only deletion.

### `File` → `FILE`

Stores UUID, required owner, optional folder, normalized display name, private storage key, byte-detected MIME, `BIGINT` size, optional extracted text, and timestamps. The binary is not stored in PostgreSQL. Quota, discovery, ownership, and statistics operate on these rows.

### `AuditLog` → `AUDIT_LOG`

Stores UUID, optional actor, allowlisted action text, optional entity type/ID, sanitized JSON metadata, and creation time. The actor is nullable so retained history can survive user deletion; the deletion service sets an `actorState` marker before detaching the relation.

## Relationships and deletion

All IDs are UUID primary keys. Foreign keys reference users, folders, and audit actors with `ON DELETE NO ACTION`; the application performs lifecycle cleanup explicitly rather than relying on cascading deletion. This is particularly important for storage objects and retained audit history.

Current deletion is permanent:

- File deletion removes the object first, then its `FILE` row.
- Folder deletion requires an empty owned folder.
- Administrator user deletion removes owned objects, detaches historical audit actors, then explicitly deletes refresh tokens, codes, file metadata, folders, and the user.

There are no current soft-delete columns. The second and third migrations deliberately refuse to drop legacy lifecycle columns if non-null legacy values exist.

## Constraints and indexes

The committed SQL creates primary-key indexes and the unique `USER.email` index. No additional explicit application indexes appear in the current migrations. Query ordering commonly adds ID as a stable tie-breaker; performance changes that require indexes should be introduced as reviewed migrations rather than assumed in documentation.

Important invariants such as role values, fixed upload limits, sibling folder-name conflicts, last-administrator protection, and confirmation timestamps are enforced in validation/services, not solely by database constraints.

## Transactions and concurrency

Authentication registration, verification, refresh rotation, role changes, and several lifecycle operations use serializable transactions. File/folder mutations additionally lock the owner `USER` row with `SELECT ... FOR UPDATE` to serialize quota and hierarchy/lifecycle changes.

`serializable` retries recognized transaction conflicts where retry is safe. Confirmation-sensitive administrator operations use a one-attempt variant and translate conflicts into `409 RESOURCE_CONFLICT`, requiring the operator to reload and reconfirm.

Storage is external to PostgreSQL and cannot participate in a database transaction. Upload and deletion services therefore use explicit ordering and compensation described in [File Storage](file-storage.md).

## Migration history

1. `001_platform_auth_foundation` creates all six tables, primary keys, unique email, and foreign keys. Its original file/folder schema included legacy nullable deletion columns.
2. `002_user_file_management` refuses to discard any non-null legacy file/folder deletion state, removes those columns, and temporarily adds a legacy user deletion column.
3. `003_administration_final_quality` similarly refuses non-null legacy user lifecycle state and removes that final column.

Keep these migrations tracked and immutable after release; create a new migration for future changes.

## Safely changing the schema

1. Point `DATABASE_URL` at a disposable development database.
2. Update `server/prisma/schema.prisma`.
3. Use the Prisma CLI through the server workspace to author a new migration; the repository intentionally exposes deploy/reset aliases, not a preconfigured development-migration alias.
4. Review generated SQL, especially data loss, foreign keys, defaults, locks, and backward compatibility.
5. Generate the client:

   ```powershell
   pnpm --filter @gold-era/server prisma:generate
   ```

6. Update contracts, runtime validation, repositories, services, projections, seed/bootstrap code, and tests.
7. Apply committed migrations:

   ```powershell
   pnpm --filter @gold-era/server prisma:migrate:deploy
   ```

8. Run type checking plus migration and integration tests. Update `database-schema.mmd` and this document when relationships change.

For a disposable reset only:

```powershell
pnpm --filter @gold-era/server prisma:migrate:reset
```

This destroys data. Production releases should run `prisma:migrate:deploy` as a one-shot step before serving the new API.
