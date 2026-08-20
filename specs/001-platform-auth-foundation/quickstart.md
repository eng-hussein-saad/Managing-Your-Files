# Phase 1 Quickstart and Validation Guide

This guide defines the clean-run evidence required after implementation. It is not an implementation script. Interface details are in [`contracts/public-api.openapi.yaml`](./contracts/public-api.openapi.yaml) and [`contracts/bff-auth.openapi.yaml`](./contracts/bff-auth.openapi.yaml); persistence rules are in [`data-model.md`](./data-model.md).

## Prerequisites

- Node.js 24 LTS and the repository-pinned pnpm 10 release through Corepack
- PostgreSQL reachable through a dedicated development/test database
- SMTP credentials or a local SMTP catcher that exposes delivered verification messages
- Two local origins, for example Next.js on `http://localhost:3000` and Express on `http://localhost:3001`

## Clean setup

From the repository root after Phase 1 implementation:

```powershell
corepack enable
pnpm install --frozen-lockfile
Copy-Item -LiteralPath 'client/.env.example' -Destination 'client/.env.local'
Copy-Item -LiteralPath 'server/.env.example' -Destination 'server/.env'
pnpm --filter server prisma:generate
pnpm --filter server prisma:migrate:deploy
pnpm --filter server admin:bootstrap
pnpm typecheck
pnpm lint
```

Populate both local environment files only with local/test values. At minimum, validate every key listed in the specification's Configuration Contract. Use distinct high-entropy values for `JWT_ACCESS_SECRET` and the matched `BFF_SHARED_SECRET`/`AUTH_BFF_SHARED_SECRET`; never use example placeholders outside local disposable environments.

Expected setup outcomes:

- dependency installation uses the committed lockfile;
- migrations create exactly the six entities in `database-schema.mmd`;
- bootstrap creates or confirms one verified `ADMIN` and prints no password/hash;
- both configuration validators reject missing, malformed, public-exposed, or insecure production settings;
- typecheck and lint pass, including the project function-comment rule.

## Start the applications

In separate terminals:

```powershell
pnpm --filter server dev
pnpm --filter client dev
```

Expected startup outcomes:

- Express listens on validated `PORT` (3001 by local default);
- Next.js serves the application origin on port 3000;
- browser-to-Express CORS accepts the configured application origin and required bearer headers, but rejects an unlisted origin;
- trusted Express auth endpoints reject direct browser/curl requests lacking the BFF trust credential;
- no secret value appears in startup output.

## Automated verification

Run the full Phase 1 evidence suite:

```powershell
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm build
```

Expected outcomes:

- Vitest unit/service/component suites pass;
- Supertest contract and PostgreSQL integration suites pass against migrated schema;
- Playwright passes local and production-like unrelated-origin projects;
- client and server production builds complete without secret-bearing values in the client output.

## Scenario 1: Registration, delivery failure, verification, and resend

1. Register a mixed-case, whitespace-padded email and a password of at least 12 characters.
2. Confirm one normalized lowercase `USER` row and one eligible verification row exist, with only Argon2id hashes persisted.
3. Submit the delivered eight-digit code before ten minutes elapse.
4. Confirm the user becomes verified and the code receives `usedAt` atomically.
5. Request a resend for another unverified account; confirm the earlier unused code receives `invalidatedAt` and cannot verify.
6. Repeat before the one-minute interval and after five rolling-hour issuances; confirm safe `429` behavior with retry guidance and no account disclosure.
7. Configure the mail adapter to fail after registration persistence; confirm the unverified account remains, the response identifies delivery pending without exposing the code, and resend remains available.

Expected contract evidence: registration `201`, verification `200`, generic resend `202`, stable validation/rate/delivery errors, and no secret values in bodies or logs.

## Scenario 2: Sign-in and cookie handling

1. Attempt sign-in as an unverified user and confirm a safe verification-required denial.
2. Sign in as a verified user through the same-origin `/api/auth/login` gateway.
3. Confirm the response emits the configured `HttpOnly` cookie and returns the Express-issued short-lived access JWT plus safe user data in the same response.
4. Inspect local/session storage, IndexedDB, URLs, network JSON, logs, and analytics; confirm the raw refresh token never appears and the access token is not persisted.
5. Simulate cookie creation failure; confirm the gateway returns an authentication error and does not return the access token.

Expected browser evidence: host-only cookie, `HttpOnly`, configured `SameSite`, path `/api/auth`, production `Secure`, and lifetime aligned with `REFRESH_TOKEN_TTL`.

## Scenario 3: Protected profile and role boundary

1. Request `/api/v1/users/me` with no bearer token, a malformed token, and an expired token; confirm `401` common errors.
2. Request it with the verified user's token; confirm only that user's safe fields are returned.
3. Request `/api/v1/admin/access-check` as the regular user; confirm `403` and a sanitized denial audit event.
4. Sign in through the same flow as the bootstrapped administrator and repeat; confirm `200`.
5. Call the administrator operation directly, bypassing navigation guards; confirm Express remains the enforcing boundary.

## Scenario 4: Renewal, concurrency, replay, and reload

1. Expire the access token while keeping the refresh cookie valid.
2. Trigger at least 20 protected requests concurrently.
3. Confirm one gateway refresh/rotation occurs, every eligible original request retries no more than once, and at least 95% succeed.
4. Replay the old refresh credential at the trusted integration boundary; confirm it is rejected and creates no authenticated state.
5. Reload the page; confirm the memory access token is absent initially, one renewal restores state, and the cookie remains unreadable to JavaScript.
6. Test expired, revoked, and malformed refresh credentials; confirm state/cache/cookie clearing and a request to sign in again.
7. Return a non-authentication error from a protected operation; confirm the interceptor does not refresh or retry it.

## Scenario 5: Logout and multiple devices

1. Sign in twice using isolated browser contexts and confirm two active refresh rows.
2. Log out in the first context and repeat logout once.
3. Confirm its row is revoked, its cookie and memory/query state are cleared, renewal fails there, and both logout calls are safe.
4. Confirm the second context can still renew.
5. Simulate audit insertion failure during logout; confirm revocation and local clearing still take priority and a sanitized critical operational record is emitted.

## Scenario 6: Bootstrap, audit, redaction, and configuration

1. Run bootstrap repeatedly and concurrently with a new configured email; confirm exactly one verified administrator.
2. Configure `ADMIN_EMAIL` to an existing regular user; confirm startup refuses with a sanitized conflict and does not promote or overwrite the account.
3. Exercise registration, verification, sign-in, rotation, logout, and role denial; confirm structurally complete audit events with actor when known, action, target, `metadata.outcome`, and timestamp.
4. Inject database/audit failures into privilege-granting operations; confirm no partial authenticated state or credentials are returned.
5. Scan response fixtures, browser traces, application logs, audit rows, URLs, built assets, and both application `.env.example` files for passwords, code values/hashes, raw access/refresh credentials, trust secrets, connection strings, and private content; expect zero findings.
6. Start each process with one required variable absent or malformed; confirm failure before serving traffic. Confirm production rejects insecure cookie settings and wildcard CORS.

## Schema alignment review

Before accepting Phase 1, compare all of the following with `database-schema.mmd`:

- Prisma models and table/column mappings;
- generated migration SQL;
- database constraints and indexes;
- seed/bootstrap data;
- integration fixtures;
- `data-model.md`.

Expected result: exact entity, field, type, key, nullability, and relationship alignment, no refresh-session table, and no unapproved index or extraction-status field.

## Completion evidence

Phase 1 is ready for convergence only when all commands and scenarios above pass, both applications start from the documented non-secret example configuration in under the SC-008 target, and the end-to-end verified-user journey works in local and unrelated-origin production-like arrangements.
