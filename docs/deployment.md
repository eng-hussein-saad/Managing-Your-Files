# Phase 1 deployment

## Client (Vercel-compatible Node runtime)

Configure `NEXT_PUBLIC_API_BASE_URL` as the public Express origin. Configure the server-only values `AUTH_API_BASE_URL`, `AUTH_BFF_SHARED_SECRET`, `REFRESH_COOKIE_NAME`, `REFRESH_COOKIE_PATH=/api/auth`, `REFRESH_COOKIE_SAME_SITE=strict`, `REFRESH_COOKIE_SECURE=true`, and `REFRESH_TOKEN_TTL`.

Only `NEXT_PUBLIC_API_BASE_URL` is browser-public. Never public-prefix the BFF trust secret or cookie configuration.

## Server (Render-compatible Node service)

Configure `PORT`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`, `BFF_SHARED_SECRET`, `CORS_ALLOWED_ORIGINS`, `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME`.

`CORS_ALLOWED_ORIGINS` must list the exact unrelated client origin; wildcard origins are rejected. Cross-origin API calls are credentialless and send only the short-lived bearer token.

## Release order

1. Provision PostgreSQL and secret-managed environment values.
2. Confirm client `AUTH_BFF_SHARED_SECRET` exactly matches server `BFF_SHARED_SECRET`.
3. Confirm both `REFRESH_TOKEN_TTL` values match.
4. Run `pnpm --filter @gold-era/server prisma:migrate:deploy` before releasing server code.
5. Run the repeatable administrator bootstrap.
6. Deploy Express, then the Next.js application.
7. Verify exact-origin CORS, trusted-route denial, secure cookie attributes, renewal, and logout.

## Audit access and retention

Phase 1 retains audit records without automated deletion. Application routes and interfaces provide no audit-reading capability. Direct database access is restricted through infrastructure permissions to authorized operational personnel. A replacement policy requires an approved duration, disposition, migration impact, and verification plan.
