# Phase 0 Research: Platform Authentication Foundation

## Runtime and dependency baseline

**Decision**: Use Node.js 24 LTS, TypeScript 5.9, pnpm 10 workspaces, Next.js 16/React 19, Express 5, Prisma ORM 7 with the PostgreSQL driver adapter, and exact versions captured in `pnpm-lock.yaml` and the root `packageManager` field.

**Rationale**: This is a greenfield strict-TypeScript monorepo, and Node 24 provides an LTS production baseline. The selected framework generations support the required App Router, ESM server, and PostgreSQL architecture. Pinning the toolchain prevents independent client/server drift. Official references: [Node release status](https://nodejs.org/en/about/previous-releases), [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Express installation](https://expressjs.com/en/starter/installing.html), and [Prisma ORM documentation](https://www.prisma.io/docs/orm).

**Alternatives considered**: Node 22 has a shorter remaining support runway; Node 26 is not the chosen LTS baseline. npm workspaces would work, but pnpm's explicit filtering and deterministic workspace links are preferable. Turborepo/Nx adds orchestration that two applications and one shared package do not yet need.

## Monorepo and contract sharing

**Decision**: Use `client/`, `server/`, and `packages/contracts` workspaces. Publish separate `public` and import-restricted `internal` contract entry points backed by Zod schemas. Do not share controllers, persistence models, or framework request types.

**Rationale**: Shared runtime schemas keep browser, gateway, and Express envelopes aligned without coupling layers. Separating internal raw-refresh schemas reduces the chance that trusted response types enter client components or browser bundles.

**Alternatives considered**: Duplicated DTOs invite drift; one unrestricted shared package makes secret-bearing types easy to misuse; proxying every API operation through Next.js contradicts the narrow-gateway requirement.

## Runtime validation

**Decision**: Validate bodies, parameters, query values, JWT claims, internal authority responses, and each process's environment with Zod. Infer TypeScript types from schemas. Normalize email once with trim plus full lowercase before persistence or lookup.

**Rationale**: Static types do not validate external values. A single runtime/schema source produces predictable field errors and enforces fail-closed boundaries.

**Alternatives considered**: TypeScript-only validation is ineffective at runtime; unrelated validation libraries plus handwritten DTOs duplicate contracts.

## Authentication authority and gateway boundary

**Decision**: Express alone validates credentials, signs/verifies access JWTs, generates/rotates/revokes refresh tokens, persists token hashes, and enforces roles. Next.js Route Handlers coordinate only login, refresh, and logout. Direct browser calls to normal Express APIs use an in-memory bearer token and credentialless exact-origin CORS.

**Rationale**: Vercel and Render origins cannot share a first-party cookie. The narrow gateway gives the refresh cookie a first-party application origin without splitting authority or adding a proxy hop to normal APIs. Next.js Route Handlers support request cookies and server-side request handling; see [Route Handler documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) and [Next.js BFF guidance](https://nextjs.org/docs/app/guides/backend-for-frontend).

**Alternatives considered**: A cross-site refresh cookie depends on third-party-cookie policy; a full BFF duplicates the API; allowing Next.js to mint or validate credentials creates two authorities.

## Trusted Express authentication interface

**Decision**: Every Express response containing raw refresh material requires HTTPS and a dedicated fixed header containing `BFF_SHARED_SECRET`, checked before request processing with constant-time comparison. The corresponding Next value is `AUTH_BFF_SHARED_SECRET`; neither value enters public contracts, browser code, logs, errors, or audit metadata.

**Rationale**: CORS is not access control, and the authority is publicly reachable. This fulfills the server-only trust boundary without assuming private networking.

**Alternatives considered**: CORS alone is insufficient. Mutual TLS or a private network is stronger but is not available across the assumed hosts. Next-signed assertions would add key and validation complexity without changing the trust problem.

## Access and refresh credentials

**Decision**: Access tokens are 15-minute JWTs with a pinned algorithm, issuer, audience, subject, role, issued-at, and expiry. Refresh tokens are 32 random bytes encoded base64url, live for 30 days, and are stored only as SHA-256 hashes. Rotation conditionally revokes the active/unexpired row and creates one replacement in a serializable transaction; a zero-row update is a replay/revocation failure.

**Rationale**: JWTs support stateless authorization for normal API calls, while opaque per-device refresh records support independent revocation. A fast hash is appropriate for a uniformly random 256-bit token and permits lookup without keeping reusable raw material.

**Alternatives considered**: JWT refresh tokens, plaintext persistence, and refresh-session/family tables conflict with the specification. Password hashing refresh tokens would prevent efficient lookup without improving high-entropy token protection.

## Cookie handling

**Decision**: Centralize a host-only cookie with `HttpOnly`, production `Secure`, `SameSite=Strict`, `Path=/api/auth`, no `Domain`, and `Max-Age` equal to the refresh-token lifetime. The trusted login and refresh responses contain the access token, safe user data, and raw refresh token. Next.js stores the refresh token in the cookie and returns the access token plus safe user data to the frontend. If cookie creation fails, Next.js returns an authentication error and does not return the access token.

**Rationale**: `Strict` is compatible with same-origin gateway POSTs and gives stronger CSRF resistance; `/api/auth` is the narrowest path common to all handlers. This keeps the gateway stateless and the normal authentication flow to one request while preventing the frontend from receiving authenticated state when the gateway cannot create the cookie.

**Alternatives considered**: `Path=/` is broader; `SameSite=None` is unnecessary. Additional cookie-verification, temporary state, and compensating revocation flows were rejected as disproportionate complexity for Phase 1.

## Password and verification-code protection

**Decision**: Store passwords and cryptographically generated eight-digit email codes with Argon2id encoded hashes. Codes expire after ten minutes. Resend allows one issuance per 60 seconds and five in a rolling hour per user, using canonical verification rows and server time; it invalidates all earlier unused codes before creating one replacement.

**Rationale**: Argon2id is a memory-hard password storage choice and also makes offline enumeration of low-entropy verification codes costly without adding a new secret key to the closed configuration contract. OWASP recommends Argon2id for password storage; see the [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). Database-backed limits work across service instances.

**Alternatives considered**: A bare fast code hash is vulnerable to offline enumeration; an HMAC design needs a dedicated code secret or questionable key reuse; an in-memory limiter fails across instances; a new rate-limit table or Redis adds unapproved infrastructure.

## Transaction and audit behavior

**Decision**: Keep transactions short and retry bounded serialization conflicts. Registration persists user, current code, and audit atomically before sending mail. Verification consumes the current code, verifies the user, invalidates competitors, and audits atomically. Sign-in persists the refresh row and audit together; rotation revokes/inserts/audits together. Logout always prioritizes revocation even if audit insertion fails. A denied request remains denied if its audit write fails and emits a sanitized critical operational record.

**Rationale**: This makes privilege-granting operations fail closed and preserves the registration account when SMTP fails. External network calls and expensive hashing stay outside transactions. Prisma supports interactive transactions but advises keeping them short; see [Prisma transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).

**Alternatives considered**: Sending mail inside a transaction holds locks across an external call. Best-effort auditing for successful privilege changes cannot prove FR-027. Refusing logout because telemetry failed can leave a known credential active.

## Canonical database mapping

**Decision**: Map precisely the six diagram entities and their exact camelCase fields: UUID IDs, PostgreSQL text for diagram strings, `timestamptz(3)` for datetimes, `bigint` for file size, `jsonb` for metadata, nullable fields exactly as labeled, and only the declared primary keys, unique email, and foreign keys. Keep `role` as a validated string. Add no extra field, enum, constraint, or index in Phase 1.

**Rationale**: Constitution Principle IX makes `database-schema.mmd` the maintainer-approved contract. `AuditLog.metadata.outcome`, `VerificationCode.invalidatedAt`, and nullable `File.extractedContent` satisfy Phase 1 needs without a deviation. The spec was narrowed to defer a distinct extraction status to Phase 2 planning.

**Alternatives considered**: Database enums, token-hash uniqueness/indexes, folder-name uniqueness, extraction status, code purpose/lineage, and a refresh-session table are absent from the approved diagram and therefore require an explicit future schema proposal. Correctness takes precedence over silently adding performance indexes.

## Administrator bootstrap

**Decision**: Normalize `ADMIN_EMAIL`, hash the configured password outside the transaction, then use a serializable transaction with retry. Create one verified `ADMIN` only when absent. If an existing account is `USER`, abort startup with a sanitized conflict. If it is already `ADMIN`, preserve its password and role and complete idempotently.

**Rationale**: The unique email key resolves concurrent initializers without auto-promoting or overwriting an existing account.

**Alternatives considered**: A blind upsert can promote a regular user or replace administrator credentials. A separate administrator table is not canonical.

## Client renewal coordination

**Decision**: Use separate Axios instances for direct Express traffic and same-origin gateway traffic. A module-scoped `refreshPromise` coalesces eligible authentication `401`s; a typed retry marker permits one replay, replaces the bearer header after success, and clears memory state plus auth-scoped query cache on failure.

**Rationale**: This directly proves the concurrency criterion and prevents refresh loops or competing token rotations.

**Alternatives considered**: Per-request refresh races rotation; a proactive timer alone does not cover reloads or server rejection; per-page logic duplicates security behavior.

## Test stack and deployment

**Decision**: Use Vitest, Supertest, React Testing Library/MSW, and Playwright against a migrated disposable PostgreSQL database, fake mail for services, and an SMTP catcher for end-to-end validation. Deploy Next.js Route Handlers on a Node runtime and Express on a Linux Node service; run `prisma migrate deploy` before server release.

**Rationale**: PostgreSQL integration is required to prove unique-email races and transactional consumption/rotation; browser automation is required to inspect first-party cookies, memory-only state, unrelated-origin behavior, and accessibility.

**Alternatives considered**: SQLite and repository mocks cannot prove PostgreSQL concurrency semantics. Unit tests alone cannot prove the BFF/cookie boundary. Edge runtime provides no required benefit.

## Configuration resolution

**Decision**: Preserve the specification's exact environment names and add only `PORT`, a non-secret server listener value required by the Render-style deployment. It defaults to 3001 locally and validates as 1–65535. Do not add `NODE_ENV`, an OTP pepper, a refresh signing secret, a test-only database URL, or a separate cookie-age key.

**Rationale**: Explicit cookie flags drive secure behavior; tests override `DATABASE_URL`; refresh TTL drives both database and cookie lifetime. Adding `PORT` to `spec.md` resolves the only missing required runtime input while keeping `client/.env.example`, `server/.env.example`, validation, docs, and deployment mapping synchronized.

**Alternatives considered**: Silently consuming platform `PORT` would violate the configuration contract. Additional derived-value keys increase drift without a requirement.

## Clarification status

All Technical Context unknowns are resolved. No database deviation or unjustified constitution exception remains.
