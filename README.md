# Fileora

Fileora is a secure file-organizing application with user-owned private storage,
folders, search, previews and downloads, exact dashboards, and a metadata-only
administrator console. Its tagline is **“Your files. Organized your way.”**

## Architecture

- `client/`: Next.js 16 App Router UI, React 19, TanStack React Query, and the
  first-party authentication gateway.
- `server/`: Express 5 authority, Prisma 7, PostgreSQL, JWT access tokens,
  opaque refresh sessions, SMTP verification, and private Supabase Storage.
- `packages/contracts/`: strict shared browser-safe Zod contracts.
- `tests/`: cross-cutting security, integration, and Playwright journeys.
- `database-schema.mmd`: canonical maintainer-approved database contract.

Express authenticates and authorizes all sensitive operations. Next.js stores
the raw refresh value only in an `HttpOnly` same-origin cookie; browser code
keeps the short-lived access token in memory. Administrators can read file
metadata across owners and permanently delete files, but they never gain
preview, download, signed-access, storage-key, or extracted-content authority.

## Prerequisites

- Node.js 24.x and Corepack
- pnpm 10.17.1 (pinned by `packageManager`)
- PostgreSQL 17 for local database-backed tests and execution
- SMTP credentials or a local mail catcher
- A private Supabase Storage bucket and server-only `sb_secret_...` key
- Docker with Compose for the container workflow (optional)

## Configuration

Copy the safe examples, then replace every placeholder locally:

```powershell
corepack enable
pnpm install --frozen-lockfile
Copy-Item -LiteralPath 'client/.env.example' -Destination 'client/.env.local'
Copy-Item -LiteralPath 'server/.env.example' -Destination 'server/.env'
```

Never commit populated environment files. `JWT_ACCESS_SECRET`,
`BFF_SHARED_SECRET`/`AUTH_BFF_SHARED_SECRET`, `DATABASE_URL`, SMTP credentials,
administrator credentials, and `SUPABASE_SECRET_KEY` are secrets. Only
`NEXT_PUBLIC_API_BASE_URL` is browser-visible. All other client keys are
server-only or non-secret cookie policy. Express and the Next.js gateway reject
missing or invalid required values during startup/use without printing values.

The Supabase bucket must be private. Never expose provider keys, storage keys,
private content, refresh values, access tokens, passwords, or verification codes
through `NEXT_PUBLIC_*`, logs, API responses, test reports, or image layers.

## Database and administrator initialization

```powershell
pnpm --filter @gold-era/server prisma:generate
pnpm --filter @gold-era/server prisma:migrate:deploy
pnpm --filter @gold-era/server admin:bootstrap
```

Use `prisma migrate deploy`, never schema push. Bootstrap is repeatable: it
preserves the configured administrator and refuses to promote an existing normal
user. The Phase 3 forward migration fails closed if legacy non-null
`USER.deletedAt` values exist, then removes that approved legacy column.

The current lifecycle is permanent-only: `USER` has no soft-deletion field, file
and folder deletion is permanent, administrator user deletion permanently
removes required owned state, and Fileora has no Trash or restore workflow.

## Local development

```powershell
pnpm dev
```

Next.js defaults to `http://localhost:3000` and Express to
`http://localhost:3001`. Verification codes are delivered only through the SMTP
adapter. Provision the configured storage bucket before exercising file flows.

## Container workflow

Export the required values named in `server/.env.example`, plus
`POSTGRES_PASSWORD`, and ensure `DATABASE_URL` uses the Compose PostgreSQL host
(`postgres`). Then run:

```powershell
docker compose config
docker compose build
docker compose up
```

Compose starts healthy PostgreSQL, runs migrations once, then starts Express and
Next.js after their dependencies are healthy. Database state persists in the
named `fileora-postgres` volume. Restarting the stack preserves data and the
repeatable administrator bootstrap can be run independently when required.

Stop without destroying data:

```powershell
docker compose down
```

Use `docker compose down --volumes` only for an explicitly disposable database.
Secrets are runtime environment values, not Docker build arguments or image
environment declarations; the only build-visible value is the classified public
`NEXT_PUBLIC_API_BASE_URL`.

## Verification

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:security
pnpm test:e2e
pnpm audit:comments
pnpm build
pnpm verify:phase3
pnpm verify:critical:triple
```

Database integration tests require a migrated disposable database. Playwright
requires the documented app/server infrastructure. Provider-adapter tests must
use a disposable private bucket, never production data. Scale evidence uses:

```powershell
pnpm --filter @gold-era/server exec tsx prisma/seed-admin-performance.ts
```

This creates 1,000 deterministic users and 10,000 deterministic files for
administrator query-plan and interaction measurements. It adds no indexes;
index changes require a separately documented exact proposal and explicit
maintainer approval before a new migration.

## Deployment and operational assumptions

- Terminate TLS in production, set trusted proxy headers correctly, use secure
  refresh cookies, and configure only explicit CORS origins.
- Run migrations as a one-shot release step before serving traffic.
- Keep SMTP and Supabase external credentials in the deployment secret store.
- Retain audit rows indefinitely until a later approved retention policy exists.
- Audit writes are centralized, sanitized, and fail-open; operational audit
  failures are logged without secret or private metadata.
- External object cleanup is object-first and retryable. Missing objects are
  accepted during retries; the API never reports permanent deletion success
  while required storage cleanup is known to have failed.
- Back up PostgreSQL according to the deployment recovery objective and apply an
  equivalent provider policy to the private object bucket.

See [deployment guidance](docs/deployment.md), the Phase 3
[quickstart](specs/003-administration-final-quality/quickstart.md), and
[performance evidence](specs/003-administration-final-quality/performance.md).
