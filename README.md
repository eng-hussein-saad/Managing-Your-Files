# Gold Era

Gold Era Phase 1 is a strict-TypeScript authentication foundation: a Next.js application, an Express authentication authority, a canonical PostgreSQL schema, and a browser-safe shared contract package.

## Prerequisites

- Node.js 24 LTS and Corepack
- pnpm 10.17.1 (pinned in `package.json`)
- PostgreSQL with a disposable development/test database
- SMTP credentials or a local mail catcher

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

PostgreSQL integration and Playwright journeys require migrated disposable infrastructure and populated test configuration. The refresh concurrency suite proves one renewal for a burst of 20 expired requests and one replay per request.

## Security boundary

- Express alone validates credentials, creates and verifies JWTs, rotates opaque refresh tokens, and enforces roles.
- Next.js coordinates only login, refresh, and logout. Raw refresh values remain in a first-party `HttpOnly` cookie.
- Browser-protected operations call Express directly with a memory-only bearer token.
- Trusted auth operations require the server-only `X-Gold-Era-BFF-Trust` credential.
- Audit capability is write-only. Phase 1 has no audit read API/UI or automated deletion.

See [deployment guidance](docs/deployment.md) and the feature [quickstart](specs/001-platform-auth-foundation/quickstart.md).

