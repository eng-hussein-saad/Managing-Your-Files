# Backend folder structure

```text
server/
├── prisma/
│   ├── migrations/       Reviewed SQL migration history
│   ├── schema.prisma     Current relational model
│   ├── seed.ts           Administrator bootstrap CLI
│   └── seed-admin-performance.ts
├── src/
│   ├── config/           Strict environment parsing
│   ├── http/             Express routes, middleware, controllers, schemas
│   ├── infrastructure/   Prisma, security, storage, mail, extraction, logging, runtime
│   ├── modules/          Domain services, repositories, ports, errors, mapping
│   ├── app.ts            Dependency composition and route mounting
│   └── server.ts         Production startup and shutdown
├── tests/                Unit, contract, integration, security, fakes, fixtures, helpers
├── .env.example
├── prisma.config.ts
├── package.json
└── tsconfig*.json
```

## Entry points

`src/server.ts` is the executable entry point. Keep startup-only work here: configuration, infrastructure construction/readiness, bootstrap, listener creation, and graceful shutdown.

`src/app.ts` is the application composition root. It wires services to controllers and route factories without opening a network port. Tests use it to replace external boundaries. New cross-module dependencies should be made explicit here rather than imported through hidden singletons.

## `src/http`

### Routes

`http/routes` defines endpoint paths/order and attaches middleware. Route factories accept handlers as dependencies, which keeps route contracts testable. Routes should not perform business logic.

### Middleware

`http/middleware` contains cross-request boundaries:

- Request ID assignment/reflection.
- Exact explicit-origin, credentialless CORS.
- BFF trust-secret verification.
- Bearer authentication against tokens and current database authority.
- Administrator-role authorization.
- Reusable body validation.
- Multer upload intake and temporary-file cleanup.
- Not-found and error translation.

### Controllers

`http/controllers` translates Express requests into service calls. Controllers parse parameters/query/body through Zod, obtain authenticated identity from `response.locals`, select status codes/headers, and return safe projections. File-content controllers also manage abort-aware streaming.

Keep transactions, ownership decisions, storage ordering, and other business rules in services.

### Schemas and responses

`http/schemas` owns route-specific runtime validation not already represented by shared contracts. `http/respond.ts` centralizes success/failure envelopes.

## `src/modules`

### `auth`

Registration, verification/resend, login, refresh rotation, logout, repositories for token/code persistence, safe application errors, and the mail port. Auth services coordinate hashes, tokens, clock/IDs, transactions, and mail without depending on Express.

### `users`

Safe user mapping/repository, admin browsing/role mutation, administrator bootstrap, and permanent user deletion. User deletion coordinates audit retention, refresh/code cleanup, owned storage and metadata, folders, and final user removal.

### `files`

File errors/mapping/types, storage and extraction ports, owner/admin repositories, and services for upload, discovery, content, move, deletion, and admin metadata. Storage keys never enter public mappers.

### `folders`

Folder errors, hierarchy repository, and management/deletion services. The repository owns owner-scoped ancestry and sibling checks; services enforce depth, locking, audit, and public projection.

### `statistics`

Owner and administrator aggregate repositories/services plus local-date helpers. Statistics are computed from current canonical file rows at read time, with MIME/byte totals and local-date history grouped inside PostgreSQL rather than materialized as complete file-row collections.

### `audit`

Allowlisted audit event types/factories, append/list repository, best-effort write service, and sanitized retained admin projections.

The project does not enforce one mechanical file template for every module. Use routes/controllers outside modules for HTTP concerns, and add service/repository/schema/types only when the domain actually needs that responsibility.

## `src/infrastructure`

- `persistence`: Prisma client creation and transaction helpers.
- `security`: JWT access tokens, Argon2id passwords/codes, opaque refresh generation/hashing, constant-time BFF trust.
- `storage`: Supabase adapter and private-bucket readiness.
- `mail`: Nodemailer SMTP adapter.
- `extraction`: bounded text and worker-based PDF extraction.
- `file-content`: byte MIME detection, filename normalization, and content headers.
- `observability`: structured logger and redaction.
- `runtime`: injectable clock and identifiers.

Infrastructure implements domain ports or low-level capabilities. It should not decide who owns a file or whether an admin action is allowed.

## `prisma`

`schema.prisma` defines models; `migrations` are tracked executable history. `seed.ts` runs the same repeatable admin bootstrap used by production startup. `seed-admin-performance.ts` creates deterministic scale data for explicit performance work and is not part of normal startup.

## `tests`

Unit tests isolate helpers/config; contract tests exercise HTTP envelopes with fakes; integration tests exercise Prisma transactions/migrations and optional Supabase; security tests focus on ownership and role boundaries. `fakes`, `fixtures`, and `helpers` are shared test infrastructure.

## Where do I make a change?

| Task | Start here |
| --- | --- |
| Add an API endpoint | Matching `src/http/routes` factory |
| Change request/status/header handling | Matching controller |
| Add/modify business rules | Matching `src/modules/*/service` |
| Centralize a complex data query | Matching repository |
| Add request validation | Shared contracts and/or `src/http/schemas` |
| Change authentication/session behavior | `modules/auth`, security infrastructure, and auth middleware |
| Change role authorization | `http/middleware/authorize-role.ts` plus domain safeguards |
| Change ownership rules | File/folder service and repository queries |
| Change database schema | `prisma/schema.prisma` plus a new migration |
| Change object storage | `modules/files/ports/storage.port.ts` and `infrastructure/storage` |
| Change email | Auth mail port and `infrastructure/mail` |
| Change audit actions/projection | `modules/audit` and calling services |
| Change environment config | `src/config/env.ts`, example, Compose, docs, tests |
| Add backend tests | Matching `server/tests` category |
