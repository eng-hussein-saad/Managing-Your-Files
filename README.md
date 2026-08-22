# Gold Era

Gold Era Phase 1 is a strict-TypeScript authentication foundation: a Next.js application, an Express authentication authority, a canonical PostgreSQL schema, and a browser-safe shared contract package.

## Prerequisites

- Node.js 24 LTS and Corepack
- pnpm 10.17.1 (pinned in `package.json`)
- PostgreSQL with a disposable development/test database
- SMTP credentials or a local mail catcher
- A Supabase project with a dedicated private Storage bucket and a server-only `sb_secret_...` key
- A Supabase project with a dedicated private Storage bucket and a server-only `sb_secret_...` key

## Configure and install

```powershell
corepack enable
pnpm install --frozen-lockfile
Copy-Item -LiteralPath 'client/.env.example' -Destination 'client/.env.local'
Copy-Item -LiteralPath 'server/.env.example' -Destination 'server/.env'
```

Replace every placeholder in the copied files. Use distinct high-entropy values for `JWT_ACCESS_SECRET` and the matching `BFF_SHARED_SECRET` / `AUTH_BFF_SHARED_SECRET`. Never commit populated environment files.

## Database and administrator

```powershell
pnpm --filter @gold-era/server prisma:generate
pnpm --filter @gold-era/server prisma:migrate:deploy
pnpm --filter @gold-era/server admin:bootstrap
```

The migration creates exactly the six entities in `database-schema.mmd`. Deployment uses `prisma migrate deploy`, never schema push. Bootstrap is repeatable: it preserves an existing administrator and refuses to promote an existing regular user.

## Phase 2 file management

Keep existing Phase 1 settings and add the ten server-only values in `server/.env`: `UPLOAD_MAX_FILE_SIZE_BYTES=5242880`, `USER_STORAGE_QUOTA_BYTES=104857600`, `UPLOAD_ALLOWED_MIME_TYPES`, `UPLOAD_MAX_FILES_PER_BATCH=10`, `SUPABASE_URL`, secret `SUPABASE_SECRET_KEY`, private `SUPABASE_STORAGE_BUCKET`, `FILE_QUERY_DEFAULT_PAGE_SIZE`, `FILE_QUERY_MAX_PAGE_SIZE`, and `FILE_EXTRACTION_MAX_BYTES`.

Provision the bucket as private before starting Express. Never expose the service key, storage keys, provider URLs, or content through `NEXT_PUBLIC_*`, commits, or logs. The lifecycle migration refuses to discard non-null legacy file/folder soft-delete data; resolve it before `prisma:migrate:deploy`. Provider checks must use a dedicated private test bucket, never production data.

## Phase 2 file management

Keep the existing Phase 1 settings and add these ten server-only values to `server/.env`:

```dotenv
UPLOAD_MAX_FILE_SIZE_BYTES=5242880
USER_STORAGE_QUOTA_BYTES=104857600
UPLOAD_ALLOWED_MIME_TYPES=application/pdf,text/plain,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document
UPLOAD_MAX_FILES_PER_BATCH=10
SUPABASE_URL=https://project-ref.supabase.co
SUPABASE_SECRET_KEY=sb_secret_replace_me
SUPABASE_STORAGE_BUCKET=private-user-files
FILE_QUERY_DEFAULT_PAGE_SIZE=20
FILE_QUERY_MAX_PAGE_SIZE=100
FILE_EXTRACTION_MAX_BYTES=5242880
```

Provision the bucket as **private** before starting Express. The server performs a bucket-readiness check before accepting file traffic. Never expose the service key, storage keys, provider URLs, or uploaded content to `NEXT_PUBLIC_*` configuration, commits, logs, or test fixtures. The lifecycle migration refuses to drop legacy `FILE.deletedAt` or `FOLDER.deletedAt` if either contains non-null data; resolve such rows before `prisma:migrate:deploy`.

## Develop

```powershell
pnpm dev
```

The default local origins are `http://localhost:3000` for Next.js and `http://localhost:3001` for Express. Verification codes are delivered through the configured SMTP adapter; codes and credentials are never written to logs.

## Verify

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm test:integration
pnpm test:security
pnpm test:e2e
pnpm build
```

For a dedicated provider-adapter check, use a disposable private Supabase bucket and test key; do not run it against production objects.

PostgreSQL integration and Playwright journeys require migrated disposable infrastructure and populated test configuration. The refresh concurrency suite proves one renewal for a burst of 20 expired requests and one replay per request.

## Security boundary

- Express alone validates credentials, creates and verifies JWTs, rotates opaque refresh tokens, and enforces roles.
- Next.js coordinates only login, refresh, and logout. Raw refresh values remain in a first-party `HttpOnly` cookie.
- Browser-protected operations call Express directly with a memory-only bearer token.
- Trusted auth operations require the server-only `X-Gold-Era-BFF-Trust` credential.
- Audit capability is write-only. Phase 1 has no audit read API/UI or automated deletion.

See [deployment guidance](docs/deployment.md), the Phase 1 [quickstart](specs/001-platform-auth-foundation/quickstart.md), and the Phase 2 [quickstart](specs/002-user-file-management/quickstart.md).

