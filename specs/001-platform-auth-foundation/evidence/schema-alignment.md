# Canonical schema alignment

Reviewed `server/prisma/schema.prisma` and migration `001_platform_auth_foundation/migration.sql` field-by-field against `database-schema.mmd` on 2026-08-20.

- Entities: exact six (`USER`, `VERIFICATION_CODE`, `REFRESH_TOKEN`, `FOLDER`, `FILE`, `AUDIT_LOG`).
- Fields, types, key/nullability, table/column mappings, and relationships: aligned.
- Constraints/indexes: primary keys, `USER.email` uniqueness, and declared foreign keys only.
- No refresh-session/family entity, database role enum, code-purpose/lineage field, extraction-status field, or extra performance index.
- `AuditLog.metadata.outcome` provides event outcome without a schema deviation.

Result: no unapproved canonical-schema deviation found.
