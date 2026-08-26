# Backend overview

The `server` workspace is an Express 5 REST API and the authoritative application backend. It validates configuration before startup, manages users and sessions in PostgreSQL through Prisma, enforces role and ownership rules, coordinates private Supabase object storage, sends verification email through SMTP, and returns stable public envelopes.

## Responsibilities

Express is authoritative for:

- Registration, email verification, password checks, token issuance/rotation/revocation.
- Bearer authentication against current verified database authority.
- Administrator role enforcement and owner-scoped resource access.
- Upload byte/type/quota/folder validation and generated storage keys.
- File/folder lifecycle, statistics, and database mutations.
- Private-object upload/download/removal and streamed content headers.
- Administrator user/file actions and their safeguards.
- Best-effort audit writes and sanitized administrator audit reads.
- Request validation, request IDs, exact-origin CORS, and safe error translation.

It does not render application pages or store raw refresh tokens. Browser navigation guards are not trusted as authorization evidence.

## Startup and composition

`src/server.ts` loads dotenv, parses the complete environment, creates Prisma and Supabase adapters, proves the bucket private, runs repeatable administrator bootstrap, creates the SMTP mailer, and starts Express. It handles SIGINT/SIGTERM by closing the listener and disconnecting Prisma.

`src/app.ts` is the composition root. It constructs token services and domain services, injects controllers/middleware, and mounts routes. Tests call `createApp` directly and can inject fake storage/extraction/audit or deterministic identities. File/folder/statistics routes are composed when storage and extraction dependencies are present; production startup always supplies both.

## HTTP architecture

Routes live under:

- `/health`: liveness.
- `/api/v1/auth`: public registration and verification.
- `/internal/v1/auth`: trust-protected login/refresh/logout for the Next.js BFF.
- `/api/v1/users`, `files`, `folders`, `file-statistics`: bearer-protected user APIs.
- `/api/v1/admin`: bearer plus administrator-role APIs.

Routes attach middleware and controllers. Controllers own HTTP parsing, status, headers, and safe response projection. Services own business rules and orchestration. Repositories centralize complex or reusable Prisma query boundaries. Infrastructure adapters implement tokens, hashing, mail, extraction, storage, logging, time/IDs, and Prisma creation.

## Validation and errors

Shared public/internal Zod contracts validate cross-workspace shapes. Server HTTP schema modules validate route-specific parameters, query strings, multipart fields, and administrator commands. Multer limits multipart structure and writes isolated temporary files.

Expected failures use `AppError`; Zod and Multer errors have dedicated translation. Unknown failures are logged and returned as redacted `503 SERVICE_UNAVAILABLE`. All JSON failures use the public envelope and normally include a request ID. See [Request Lifecycle](request-lifecycle.md) and [API](api.md).

## Persistence and external services

Prisma accesses PostgreSQL through the configured driver adapter. Serializable transactions and owner row locks protect refresh rotation, verification, quota, folder hierarchy, and administrator lifecycle changes.

`StoragePort` isolates domain services from Supabase. The production adapter disables Supabase auth persistence/refresh and uses only server-side Storage APIs against a private bucket. `MailPort` similarly isolates SMTP. PDF extraction runs in a terminable worker; text extraction is strict UTF-8.

## Audit behavior

The current audit allowlist records successful:

- Administrator bootstrap.
- Admin role change, permanent user deletion, permanent file deletion.
- User file upload, move, delete.
- Folder create, rename, delete.

Writes occur after the main operation and are best effort. Audit persistence failure is logged as critical but does not reverse a successful business mutation. Audit list reads do not create new audit events. Authentication successes/failures, content reads, list/detail reads, and statistics reads are not written as audit events by this implementation.

## Administrator boundary

Every admin route attaches bearer authentication and role middleware. User changes use stale-state confirmation, prohibit self-role/self-delete, and preserve the last administrator. Global file APIs expose metadata and deletion, never content. Permanent user deletion coordinates external objects and explicit foreign-key-safe cleanup while retaining detached audit history.

Continue with [Folder Structure](folder-structure.md), [Services and Data Access](services-and-data-access.md), and the system-wide [Authorization](../authorization.md).
