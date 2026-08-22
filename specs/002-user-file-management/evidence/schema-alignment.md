# Phase 2 schema alignment

Reviewed `database-schema.mmd`, `server/prisma/schema.prisma`, and migration `002_user_file_management`.

The only approved lifecycle change is present:

- `USER.deletedAt` is nullable and added by the migration.
- `FILE.deletedAt` is removed after the migration preflight rejects non-null legacy values.
- `FOLDER.deletedAt` is removed after the migration preflight rejects non-null legacy values.

The six canonical entities, their identifiers, ownership relationships, file storage key, byte-size authority, and existing constraints remain unchanged. No new table, quota counter, outbox, soft-delete state, or index is introduced.
