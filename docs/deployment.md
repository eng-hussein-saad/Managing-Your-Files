# Phase 1 deployment

## Client (Vercel-compatible Node runtime)

Configure `NEXT_PUBLIC_API_BASE_URL` as the public Express origin. Configure the server-only values `AUTH_API_BASE_URL`, `AUTH_BFF_SHARED_SECRET`, `REFRESH_COOKIE_NAME`, `REFRESH_COOKIE_PATH=/api/auth`, `REFRESH_COOKIE_SAME_SITE=strict`, `REFRESH_COOKIE_SECURE=true`, and `REFRESH_TOKEN_TTL`.

Only `NEXT_PUBLIC_API_BASE_URL` is browser-public. Never public-prefix the BFF trust secret or cookie configuration.

## Server (Render-compatible Node service)

Configure `PORT`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`, `BFF_SHARED_SECRET`, `CORS_ALLOWED_ORIGINS`, `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME`.

For Phase 2 add the eight server-only settings: `UPLOAD_MAX_FILE_SIZE_BYTES=5242880`, `USER_STORAGE_QUOTA_BYTES=104857600`, `UPLOAD_ALLOWED_MIME_TYPES`, `UPLOAD_MAX_FILES_PER_BATCH=10`, `SUPABASE_URL`, secret `SUPABASE_SECRET_KEY`, private `SUPABASE_STORAGE_BUCKET`, and `FILE_EXTRACTION_MAX_BYTES`. File page size is selected in the client UI from 5, 10, or 20 items, defaulting to 20. Do not expose the secret or any file-management setting through `NEXT_PUBLIC_*` variables. Vercel hosts the client only; Render stores the eight server settings as environment variables.

Container deployments use the root `Dockerfile` for the server and `client/Dockerfile` for the client. Both Dockerfiles require the repository root as the build context because they install shared workspace packages. For example, build them with `docker build --target server .` and `docker build -f client/Dockerfile .`. On Back4App Containers, select the repository root so the platform finds the server Dockerfile and retains access to every workspace package.

The server image provides runtime defaults for `PORT`, token lifetimes, upload limits, the MIME allowlist, and the extraction limit. Runtime environment variables can override those defaults. Keep environment-specific non-secrets such as origins, mail routing, and Supabase location in the deployment environment, and inject all credentials and secrets there; never bake them into the image.

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
