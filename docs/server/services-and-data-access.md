# Services and data access

The backend separates HTTP translation, application rules, persistence queries, and external providers. The separation is pragmatic rather than ceremonial: not every module needs every file type, but dependencies should point inward from HTTP/infrastructure toward services and ports.

```text
Route → middleware/schema → controller → service
                                      ├→ repository / Prisma → PostgreSQL
                                      ├→ StoragePort → Supabase
                                      ├→ ExtractionPort → text/PDF implementation
                                      ├→ MailPort → SMTP
                                      └→ AuditService → Prisma
```

## Controllers

Controllers know Express. They read `request.params/query/body/file`, get identity/request ID from `response.locals`, invoke a service, choose HTTP status and headers, and shape an envelope. They catch and forward failures through `next`.

Controllers should not decide ownership, calculate quota, order external deletion, or open Prisma transactions. File streaming is an exception only for HTTP mechanics: the content controller sets headers, wires abort/close/error events, and pipes a stream returned by a service.

## Services

Services own use-case rules and orchestration. Examples:

- `RefreshService` atomically revokes one refresh session and creates its replacement.
- `UploadFileService` detects bytes, validates owner/folder/quota, orders storage/extraction/metadata, and compensates.
- `ManageFoldersService` enforces owner hierarchy, sibling conflict, depth, and audit rules.
- `AdminUserDeletionService` coordinates storage objects, retained audit actors, dependent rows, and user deletion.

Services may call Prisma directly for a focused query or use a repository when queries are reused/complex. Future contributors should preserve the domain boundary rather than forcing every one-line access through a repository or placing a complex query in a controller.

## Repositories and Prisma

Repositories encapsulate persistence concerns such as owner-scoped file discovery, hierarchy ancestry, deterministic admin filters, token lookup, and audit pages. They accept `PrismaClient` or a transaction client so services control transaction scope.

Statistics repositories aggregate in PostgreSQL rather than loading the full `FILE` table into Node.js. Prisma `groupBy` produces MIME counts and byte totals, while a parameterized timezone-aware query produces the personal 30-day local-date buckets. The administrator repository separately materializes only the ten recent uploads required by the response.

Prisma is configured in `prisma.config.ts` and instantiated through infrastructure with `@prisma/adapter-pg`. It is the only normal application path to PostgreSQL. Browser/client code never calls Prisma.

Database rows are mapped into safe response objects before leaving services/controllers. User mapping excludes password hashes; file mapping excludes storage keys from user summaries and excludes content/storage fields entirely from administrator projections. BigInt byte values become decimal strings for JSON safety.

## Transactions and locks

Serializable helpers retry known transaction conflicts for operations safe to replay. A one-attempt helper is used for confirmation-sensitive admin deletion/role operations; conflicts become `409` and require a fresh confirmation.

Owner-scoped file/folder lifecycle operations explicitly lock the owning `USER` row. This serializes quota calculation, upload/deletion, moves, and hierarchy changes for one owner without globally locking all users.

External storage and SMTP cannot join PostgreSQL transactions:

- Registration commits the user/code before sending email. Mail failure reports delivery pending; resend recovers.
- Upload stores the object inside the surrounding application flow before metadata insert, then best-effort removes it if later work fails.
- Delete removes/accepts absence of the object before deleting metadata.

See [File Storage](../file-storage.md) for exact failure outcomes.

## External ports and adapters

`StoragePort` exposes upload, bounded download, and remove. `SupabaseStorage` supplies the production adapter and maps provider details into `StorageError` categories. Startup's readiness adapter proves the bucket is private.

`ExtractionPort` returns text or null. The production composite handles strict UTF-8 text and bounded worker-based PDF extraction; failure is intentionally non-fatal to upload.

`MailPort` exposes verification delivery. Nodemailer provides SMTP transport; fake mailers capture codes in tests.

Ports keep domain services testable and prevent provider SDK responses/credentials from leaking into controllers or contracts.

## Audit logging

Mutation services create small allowlisted events containing actor, action, entity, and sanitized outcome/request/reason metadata. `AuditService.bestEffort` appends in a standalone transaction and logs a redacted critical message if persistence fails. This is fail-open telemetry: a completed upload or admin action is not reversed solely because its audit insert failed.

Administrator audit reads use a repository, allowlisted actions, deterministic paging, and a sanitized projection. When a user is deleted, historical actor links are cleared and metadata marks the actor as deleted.

Do not add arbitrary request bodies, filenames, tokens, credentials, provider errors, or extracted content to audit metadata.

## Error propagation

Services throw `AppError` for expected safe outcomes. Infrastructure errors are either classified by the calling service or allowed to reach the final redacted handler. Controllers do not leak stack traces or provider messages.

```text
AppError / Zod / Multer / unknown
  → controller next(error) or middleware
  → errorHandler
  → public failure envelope
  → Axios / React Query / UI
```

Use `RESOURCE_NOT_FOUND` for absent/cross-owner resources rather than revealing ownership. Use `RESOURCE_CONFLICT` for stale confirmed state, and retryable `SERVICE_UNAVAILABLE` when required external cleanup is not known to have completed.

## Placement rules

- HTTP parsing/status/headers: controller or middleware.
- Runtime input parsing: shared contract or HTTP schema.
- Business/authorization/ownership rule: service.
- Reusable or complex relational query: repository.
- Transaction boundary and external-operation ordering: service.
- Provider-specific SDK behavior: infrastructure adapter behind a port.
- Browser-safe mapping: explicit mapper/projection before response.
- Cross-domain composition: `src/app.ts`.
