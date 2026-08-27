# Development setup

This guide takes a new contributor from a fresh clone to a running Fileora environment and maps common changes to the repository's conventions.

## Prerequisites and installation

- Node.js 24.x. The root engine range is `>=24 <25`; Docker pins 24.7.0.
- Corepack and pnpm 10.17.1.
- PostgreSQL, an SMTP server or mail catcher, and a private Supabase Storage bucket.
- Optional Docker Engine and Docker Compose.

```powershell
git clone <repository-url>
Set-Location <repository-directory>
corepack enable
pnpm install --frozen-lockfile
Copy-Item -LiteralPath 'client/.env.example' -Destination 'client/.env.local'
Copy-Item -LiteralPath 'server/.env.example' -Destination 'server/.env'
```

Both destination files are ignored. Keep tracked examples placeholder-only.

## Environment variables

### Next.js and the authentication BFF

| Variable | Consumer | Required | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Browser | Yes | Public Express origin, such as `http://localhost:3001`. It is the only browser-public setting. |
| `AUTH_API_BASE_URL` | Next.js server | Yes | Express origin used by BFF Route Handlers. |
| `AUTH_BFF_SHARED_SECRET` | Next.js server | Yes | At least 32 characters; must equal server `BFF_SHARED_SECRET`. |
| `REFRESH_COOKIE_NAME` | Next.js server | Yes | Host-only refresh-cookie name. |
| `REFRESH_COOKIE_PATH` | Next.js server | Yes | Must be exactly `/api/auth`. |
| `REFRESH_COOKIE_SAME_SITE` | Next.js server | Yes | `strict`, `lax`, or `none`; the example uses `strict`. |
| `REFRESH_COOKIE_SECURE` | Next.js server | Yes | `false` is for local HTTP only; production validation requires `true`. |
| `REFRESH_TOKEN_TTL` | Next.js server | Yes | Cookie lifetime such as `30d`; must match Express. |

### Express, database, authentication, and CORS

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | Listener; defaults to 3001 when absent. |
| `DATABASE_URL` | Yes | Secret PostgreSQL URL used by Prisma and the runtime. |
| `JWT_ACCESS_SECRET` | Yes | At least 32 characters; signs HS256 access tokens. |
| `ACCESS_TOKEN_TTL` | No | Compact duration; defaults to `15m`. |
| `REFRESH_TOKEN_TTL` | No | Compact duration; defaults to `30d` and must match the BFF value. |
| `BFF_SHARED_SECRET` | Yes | At least 32 characters; must equal `AUTH_BFF_SHARED_SECRET`. |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-separated explicit absolute browser origins. Wildcards are rejected. |

Duration suffixes are `s`, `m`, `h`, and `d`.

### Email

| Variable | Required | Purpose |
| --- | --- | --- |
| `EMAIL_FROM` | Yes | Sender identity passed to Nodemailer. |
| `SMTP_HOST` | Yes | SMTP hostname. |
| `SMTP_PORT` | Yes | SMTP port from 1 through 65535. |
| `SMTP_SECURE` | Yes | Boolean string selecting TLS-at-connect behavior. |
| `SMTP_USER` | Yes | Non-empty SMTP credential. |
| `SMTP_PASSWORD` | Yes | SMTP password; keep it secret. |

### Object storage and upload policy

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Yes | Supabase project URL used only by Express. |
| `SUPABASE_SECRET_KEY` | Yes | Server-only `sb_secret_...` value. |
| `SUPABASE_STORAGE_BUCKET` | Yes | Existing private bucket; startup proves it is not public. |
| `UPLOAD_MAX_FILE_SIZE_BYTES` | Yes | Must currently be `5242880` (5 MiB). |
| `USER_STORAGE_QUOTA_BYTES` | Yes | Must currently be `104857600` (100 MiB). |
| `UPLOAD_ALLOWED_MIME_TYPES` | Yes | Must match the six comma-separated values in the example: PDF, plain text, JPEG, PNG, WebP, and the official DOCX MIME (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`). |
| `UPLOAD_MAX_FILES_PER_BATCH` | Yes | Must currently be `10`. |
| `FILE_EXTRACTION_MAX_BYTES` | Yes | Maximum input passed to PDF/text extraction; example is 5 MiB. |

The server validator treats size, quota, batch count, and MIME list as fixed policy. Changing only an environment value fails startup; update validation, services, contracts, documentation, and tests together.

### Administrator bootstrap

| Variable | Required | Purpose |
| --- | --- | --- |
| `ADMIN_EMAIL` | Yes | Normalized bootstrap identity. |
| `ADMIN_PASSWORD` | Yes | Password of 8–1024 characters, stored as an Argon2id hash. |
| `ADMIN_NAME` | Yes | Display name up to 120 characters. |

Bootstrap is idempotent for an existing administrator with this email and refuses to promote an existing normal user.

## Database, storage, and administrator setup

Create the PostgreSQL database referenced by `server/.env`, then run:

```powershell
pnpm --filter @gold-era/server prisma:generate
pnpm --filter @gold-era/server prisma:migrate:deploy
pnpm --filter @gold-era/server admin:bootstrap
```

`prisma:generate` creates Prisma Client; `prisma:migrate:deploy` applies committed migrations without authoring new ones. For a disposable local database only:

```powershell
pnpm --filter @gold-era/server prisma:migrate:reset
```

That script passes `--force` and destroys database contents.

Create the configured Supabase bucket and keep it private. Supabase supplies object storage only; Fileora identity remains in PostgreSQL. Point SMTP variables at a real service or mail catcher. Verification codes are sent through SMTP and are not printed.

The E2E mailbox helper uses `E2E_MAIL_API_URL` when set and otherwise polls `http://localhost:8025/api/v2/messages`. This is a test-harness setting, not an application environment variable.

## Run the application

```powershell
pnpm dev
```

The root `predev` builds `@gold-era/contracts`; `dev` then runs workspace dev scripts in parallel. Next.js defaults to port 3000 and the example Express config uses 3001.

Focused processes are also available:

```powershell
pnpm contracts:build
pnpm --filter @gold-era/client dev
pnpm --filter @gold-era/server dev
```

## Checks, tests, and builds

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:security
pnpm test:e2e
pnpm build
```

`pnpm test` runs unit, contract, and component projects. Integration tests use and reset the database named by `DATABASE_URL`, so point them at a disposable migrated database. See [Testing](testing.md).

There is no repository `format` script or Prettier dependency. The maintained static checks are ESLint and TypeScript. Additional focused scripts are:

```powershell
pnpm audit:comments
pnpm verify:phase3
pnpm verify:critical:triple
```

## Docker Compose

Compose reads an ignored root `.env`. Supply all server/client variables above plus `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_PORT`. Inside Compose, `DATABASE_URL` must use host `postgres`; `NEXT_PUBLIC_API_BASE_URL` must remain browser-reachable.

```powershell
docker compose config
docker compose build
docker compose up
```

The one-shot `migrate` service waits for PostgreSQL, the API waits for migrations, and the client waits for API health. `docker compose down` retains the `fileora-postgres` volume; `docker compose down --volumes` deliberately destroys it.

## Debugging guide

- **Startup failure:** inspect `server/src/config/env.ts`. Missing values, wildcard CORS, weak secrets, changed fixed upload policy, or a public/unavailable bucket fail early.
- **Prisma failure:** verify `DATABASE_URL`, generate Prisma Client, and deploy all committed migrations.
- **Reload signs out:** inspect BFF cookie settings, matching trust/TTL values, the refresh request, and the persisted refresh-token row.
- **Protected API returns 401:** inspect the bearer header, current database user/role, and renewal. Use the response `x-request-id` to correlate server logs.
- **Browser CORS failure:** compare the page origin exactly with `CORS_ALLOWED_ORIGINS`. Direct API calls do not carry cookies.
- **Upload failure:** inspect policy, byte-detected MIME, size, quota, folder ownership, storage readiness, and the safe error envelope.
- **Preview/download failure:** confirm ownership, preview support, object existence and exact size, and stream errors.
- **Admin mismatch:** client guards are not authoritative. Check the Express access endpoint and current database role.

## Common development tasks

### Add a database field

1. Update `server/prisma/schema.prisma`.
2. Author and review a migration under `server/prisma/migrations`. There is no migration-development alias; invoke the Prisma CLI through the server workspace when intentionally creating one.
3. Run `pnpm --filter @gold-era/server prisma:generate`.
4. Update validation, contracts, repositories, services, and projections.
5. Add relevant unit, contract, migration, integration, and security tests.
6. Apply the migration to a disposable database and run the checks.

Do not substitute `db push` for committed deployment migrations.

### Add a backend endpoint

1. Choose the matching domain in `server/src/modules`.
2. Add shared Zod contracts when shapes cross workspace boundaries.
3. Add HTTP validation, then implement business behavior in a service and persistence in a repository where that module uses one.
4. Keep request/status/header concerns in a controller.
5. Register the route with authentication/role middleware and compose dependencies in `server/src/app.ts`.
6. Add contract, integration, and security tests as appropriate.

The usual direction is route → middleware/validation → controller → service → repository/Prisma or external port.

### Add a frontend page

1. Add `page.tsx` under the public root, `(auth)`, `(protected)`, or `admin` tree in `client/src/app`.
2. Keep page orchestration in the route; put domain UI in `features/<domain>/components` and generic UI in `components`.
3. Load server state through a feature API function plus React Query hook.
4. Include loading, empty, error, and retry states.
5. Add component tests and a Playwright journey when behavior crosses the application.

### Add an API integration

1. Put the Axios call in `client/src/features/<domain>/api`.
2. Define a stable key in `query-keys.ts`.
3. Wrap reads/mutations in a hook; forward `AbortSignal` for reads.
4. Update a narrow detail cache or invalidate affected prefixes on success.
5. Do not automatically retry destructive or confirmation-sensitive mutations.
6. Surface the public error envelope through explicit UI feedback.

### Add an environment variable

1. Classify it as browser-public, Next.js-server-only, or Express-server-only. Secrets never use `NEXT_PUBLIC_`.
2. Add a safe placeholder to the relevant `.env.example`.
3. Add strict validation in the appropriate client or server config module.
4. Thread it through Compose/Docker only where consumed.
5. Update this guide and [Deployment](deployment.md).
6. Extend configuration/security parity tests.

### Add a test

- Pure logic/configuration: workspace `tests/unit`.
- Express envelope/contract behavior: `server/tests/contract`.
- React behavior: `client/tests/component`; BFF/renewal: `client/tests/integration`.
- Prisma transactions: `server/tests/integration` with disposable PostgreSQL.
- Ownership, role, origin, or secret boundaries: `server/tests/security` or `tests/security`.
- End-to-end browser behavior: `tests/e2e`.

Continue with [Frontend Folder Structure](client/folder-structure.md), [Backend Folder Structure](server/folder-structure.md), and [Testing](testing.md).
