# Deployment

The repository automates production builds through multi-stage Dockerfiles and provides a local/hosted-container topology through Docker Compose. It does not contain a CI/CD workflow or provider-specific infrastructure definition, so hosted database, Supabase, SMTP, TLS, DNS, secrets, backups, and release orchestration must be configured in the deployment platform.

## Live deployment

| Service | Provider | URL |
| --- | --- | --- |
| Next.js frontend | Vercel | [https://fileora-wheat.vercel.app](https://fileora-wheat.vercel.app) |
| Express API | Render | [https://managing-your-files.onrender.com](https://managing-your-files.onrender.com) |
| API liveness | Render | [https://managing-your-files.onrender.com/health](https://managing-your-files.onrender.com/health) |

On 27 August 2026, the frontend rendered successfully, `GET /health` returned HTTP 200 with `{ "success": true, "data": { "status": "ok" } }`, and a browser-equivalent preflight confirmed that the API allows the exact Vercel origin. These are reachability and configuration checks, not substitutes for authenticated smoke tests of SMTP, PostgreSQL, Supabase, refresh rotation, uploads, owner isolation, or administrator authorization after each release.

## Build artifacts

### Express

The root `Dockerfile` uses the repository root as build context so it can install shared workspaces. It:

1. Installs the server dependency graph with the frozen lockfile.
2. Builds `@gold-era/contracts`.
3. Generates Prisma Client and compiles Express.
4. Creates production deployments for both the API and migration target.
5. Produces:
   - `migrate`: runs `prisma migrate deploy`.
   - `server`: runs `node dist/server.js` as the non-root `node` user.

The server image defaults to `PORT=8080` and exposes 8080. Runtime configuration may override `PORT`; the platform's container port must match it.

### Next.js

`client/Dockerfile` also requires root context. It installs the client graph, builds shared contracts, and runs `next build`. Outside Vercel, `next.config.ts` produces standalone output, which the runtime image serves as non-root `node` on port 3000.

`NEXT_PUBLIC_API_BASE_URL` is a build argument because Next.js embeds browser-public variables into the bundle. All trust, cookie, database, SMTP, administrator, and storage secrets remain runtime values and must not be build arguments.

The Next.js config disables standalone output when `VERCEL` is present, making the source compatible with the live Vercel runtime. Deployment is performed by Vercel rather than by a repository-owned CI workflow.

## Compose topology

`compose.yaml` defines:

1. PostgreSQL 17.6 with a named `fileora-postgres` volume and health check.
2. A one-shot migration container that waits for PostgreSQL.
3. Express, which waits for successful migrations and exposes a `/health` check.
4. Next.js, which waits for Express health.

Validate and start:

```powershell
docker compose config
docker compose build
docker compose up
```

`docker compose down` preserves the database volume. Only use `docker compose down --volumes` for intentionally disposable data.

## Release order

For separate hosted services:

1. Provision PostgreSQL and apply a backup/restore policy.
2. Create a private Supabase Storage bucket and provision a server-only secret key.
3. Provision SMTP credentials and sender identity.
4. Configure secret and non-secret environment values in the hosting provider.
5. Confirm `AUTH_BFF_SHARED_SECRET` equals `BFF_SHARED_SECRET`, and client/server `REFRESH_TOKEN_TTL` values match.
6. Run `pnpm --filter @gold-era/server prisma:migrate:deploy` as a one-shot release step.
7. Deploy Express. Startup validates configuration, proves the bucket private, and runs repeatable administrator bootstrap before listening.
8. Build/deploy Next.js with the final public API origin.
9. Verify health, registration mail, login, refresh rotation, logout, exact-origin CORS, owner isolation, and admin denial.

For the current hosted topology, Render must apply `prisma migrate deploy` before starting the new Express release. This includes the query-index migration used by the statistics and discovery paths; deploying application code without its migration leaves production performance behavior incomplete.

Rolling a schema change backwards may not be safe; review each committed migration and coordinate application/database compatibility.

## Environment configuration

Every application variable in the tracked examples is documented in [Development](development.md). Deployment-specific points:

- `DATABASE_URL`, JWT/BFF secrets, SMTP credentials, administrator credentials, and `SUPABASE_SECRET_KEY` belong in a secret manager.
- Only `NEXT_PUBLIC_API_BASE_URL` is browser-visible.
- `AUTH_API_BASE_URL` is the server-to-server Express authority from the Next.js runtime; it may be an internal service URL.
- `NEXT_PUBLIC_API_BASE_URL` must be reachable by users' browsers and therefore normally differs from an internal service URL.
- `CORS_ALLOWED_ORIGINS` must list exact frontend origins. Wildcards fail validation.
- `REFRESH_COOKIE_SECURE=true` is mandatory in production.
- `REFRESH_COOKIE_PATH` must remain `/api/auth`; `SameSite` must match the chosen same-origin hosting topology.
- Upload policy variables currently have fixed validated values and cannot be changed as deployment tuning alone.

Compose additionally consumes `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_PORT`. These configure the Compose database rather than application validation.

## Network and cookie topology

Normal browser API traffic goes directly to the public Express origin and carries a short-lived bearer token without cookies. Express CORS is credentialless and allows only configured origins, methods, and headers.

Refresh cookies are sent only to same-origin Next.js `/api/auth/*` routes. Those Route Handlers enforce a matching `Origin` and call Express internal auth routes using the BFF trust secret. Do not expose `/internal/v1/auth` as a browser integration or place the trust secret in client-side code.

Terminate TLS before both public services. Preserve correct `Host`, `X-Forwarded-Host`, and `X-Forwarded-Proto` values because same-origin validation uses them. Configure proxy trust and forwarding in the hosting layer; Express itself does not set a trust-proxy policy in this repository.

## Database and object storage operations

Migrations are automated by the Compose migration service; for other platforms they are a manual/release-pipeline responsibility. Prisma Client generation occurs in container builds.

The deployment operator must:

- Keep the Supabase bucket private.
- Back up PostgreSQL and configure an equivalent recovery/retention policy for file objects.
- Monitor for provider failures and possible orphan objects after best-effort upload compensation; there is no reconciliation worker.
- Preserve object-first deletion semantics during incident retries.
- Protect audit rows according to organizational policy. The application has no audit-retention deletion job.

## Health and observability

`GET /health` returns a liveness envelope and is used by Compose. It does not prove PostgreSQL or Supabase health on every request; storage readiness is checked at startup. Express assigns/reflects a bounded `x-request-id` and includes it in safe error envelopes. Unexpected failures and best-effort audit persistence failures are logged through the server logger with redaction.

## What is and is not automated

| Automated in repository | Manual/platform responsibility |
| --- | --- |
| Frozen dependency installation and production builds | DNS, TLS certificates, routing, and scaling |
| Prisma Client generation | PostgreSQL provisioning, backups, and recovery testing |
| Compose migration ordering and health dependencies | Hosted migration job when not using Compose |
| Non-root runtime users in images | Secret-store population and rotation |
| Startup env validation, storage readiness, admin bootstrap | Supabase bucket creation/policies and SMTP provisioning |
| Liveness endpoint | Monitoring, alerting, log retention, and orphan-object reconciliation |
