# Implementation Plan: Platform Authentication Foundation

**Branch**: `001-platform-auth-foundation` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-platform-auth-foundation/spec.md`

## Summary

Create a strict-TypeScript monorepo with a Next.js App Router client and an Express REST API backed by Prisma/PostgreSQL. Express is the authentication and authorization authority: it registers and verifies users, issues short-lived JWT access tokens and opaque rotating refresh tokens, protects profile and administrator operations, bootstraps the administrator, and records sanitized audit events. A narrow Next.js Route Handler gateway handles only sign-in, renewal, and logout so the opaque refresh token can remain in a first-party `HttpOnly` cookie on the application origin while normal bearer-authenticated API traffic goes directly to Express.

The design matches `database-schema.mmd` exactly at the entity, field, type, key, nullability, and relationship level. Phase 1 creates all six canonical models, but exposes behavior only for identity, refresh tokens, verification codes, and audit recording; file and folder behavior remains deferred.

## Technical Context

**Language/Version**: Node.js 24 LTS; TypeScript 5.9 with `strict` and `noUncheckedIndexedAccess`

**Primary Dependencies**: pnpm 10 workspaces; Next.js 16 App Router, React 19, Tailwind CSS 4, Framer Motion, TanStack React Query 5, Axios 1; Express 5, Prisma ORM 7 with PostgreSQL adapter, Zod, `jose`, Argon2id, SMTP mail adapter

**Storage**: PostgreSQL through Prisma; access tokens only in client memory; opaque refresh token only in a first-party `HttpOnly` cookie and its SHA-256 hash in PostgreSQL

**Testing**: Vitest, Supertest, React Testing Library with MSW, Playwright, and a disposable PostgreSQL database migrated with Prisma

**Target Platform**: Next.js Node runtime on Vercel-compatible infrastructure; Express on a Linux Node service such as Render; modern browsers supported by the selected Next.js release; localhost HTTP for development

**Project Type**: Web application monorepo with independently deployable `client/` and `server/` applications and one shared contract package

**Performance Goals**: Meet SC-003 with exactly one renewal for at least 20 concurrent expired-access requests, no request retried more than once, and at least 95% success with a valid refresh token; meet the three-minute first-time verification usability target in SC-001 excluding mail latency

**Constraints**: Unrelated production origins; no browser-readable refresh token; memory-only access token; transactional token rotation and verification consumption; fail-closed validation and authorization; no Phase 1 sign-in throttling or lockout; rate-limited verification resend; no secrets in responses, logs, analytics, or audit metadata; every project-authored function and method has an intent comment

**Scale/Scope**: Two deployables, one shared contract package, six user stories, six canonical entities, three browser-facing gateway operations, public and trusted Express authentication/profile operations, two roles, and one administrator bootstrap path

## Constitution Check

*GATE: Passed before Phase 0 research and re-checked after Phase 1 design.*

| Principle / gate | Planned evidence | Status |
|------------------|------------------|--------|
| I. Strict TypeScript and layered design | Strict shared configuration; route handlers/controllers coordinate; services own rules; repositories own Prisma; mail, token, clock, and audit ports isolate infrastructure | PASS |
| II. Server-enforced security | Express authenticates and authorizes protected operations; the gateway cannot mint or validate credentials; all boundaries use runtime schemas; denial is the default | PASS |
| III. Stable contracts and replaceable infrastructure | Versioned OpenAPI contracts, shared envelope schemas, a mail abstraction, and repository boundaries are defined in `contracts/` and `research.md` | PASS |
| IV. Complete reusable UX | Route groups, reusable status/form components, React Query hooks, keyboard operation, focus management, reduced motion, and all required async states are planned | PASS |
| V. Verified environment contract | The specification includes every consumed key; server and gateway schemas validate before startup; both application `.env.example` files, deployment mapping, and clean-start checks move together | PASS |
| VI. Audit important changes | One audit service records FR-027 events; required successful state changes include audit writes transactionally; denial stays denied on audit failure and emits a sanitized fallback | PASS |
| VII. Spec-driven tests | Contract, unit, integration, browser, concurrency, authorization, redaction, configuration, and clean-start evidence map to FR-001–FR-032 and SC-001–SC-010 | PASS |
| VIII. Comment every function | Lint/review convention requires a short intent comment immediately above each project-authored function, method, callback, and route handler | PASS |
| IX. Canonical database schema | `data-model.md` compares all entities, fields, types, keys, nullability, and relations with `database-schema.mmd`; no deviation is proposed | PASS |

### Post-design re-check

Phase 1 adds no database entity, field, constraint, or index beyond the canonical diagram. `AuditLog.metadata.outcome` carries the required outcome without a column. `VerificationCode.invalidatedAt` represents supersession; email verification is the only Phase 1 code purpose. Nullable `File.extractedContent` is only the later-phase foundation; a distinct extraction-status field is not part of Phase 1. Index additions requested for later query scale require a future planning-time schema proposal and explicit maintainer confirmation. The constitution gate remains **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/001-platform-auth-foundation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── public-api.openapi.yaml
│   └── bff-auth.openapi.yaml
└── tasks.md                       # generated later by $speckit-tasks
```

### Source Code (repository root)

```text
client/
├── .env.example                   # Next.js public, BFF, cookie, and authority settings
├── package.json                   # Next.js workspace manifest and scripts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (protected)/
│   │   ├── admin/
│   │   └── api/auth/              # login, refresh, logout
│   ├── components/
│   ├── features/auth/
│   ├── lib/api/
│   └── providers/
└── tests/
    ├── component/
    └── integration/

server/
├── .env.example                   # Express, database, JWT, SMTP, CORS, and admin settings
├── package.json                   # Express/Prisma workspace manifest and scripts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── config/
│   ├── http/{controllers,middleware,routes,schemas}/
│   ├── modules/{auth,users,audit}/
│   ├── infrastructure/{mail,persistence,security}/
│   └── app.ts
└── tests/{contract,integration,unit}/

packages/
├── contracts/
│   ├── package.json
│   └── src/{public,internal}/
├── eslint-config/
│   └── package.json
└── typescript-config/
    └── package.json

tests/e2e/                          # cross-origin Playwright journeys
package.json                       # private workspace root and aggregate scripts
pnpm-lock.yaml
pnpm-workspace.yaml
README.md
```

**Structure Decision**: Use pnpm workspaces for `client`, `server`, and `packages/*` without an additional build orchestrator. Public runtime schemas and safe DTOs live in `packages/contracts/public`; raw refresh-token response schemas live in the import-restricted `internal` entry point used only by Express and server-side Next.js Route Handlers. Framework-specific types stay inside their applications.

## Architecture and Boundary Decisions

### Request paths

```text
Registration / verification / profile / admin proof
Browser ── bearer when protected ──> Express public REST API

Sign-in / renewal / logout
Browser ── same-origin ──> Next.js Route Handler
       └─────────────────> Express trusted auth endpoint
                           server trust header; no browser CORS surface
```

- Browser-facing successes use `{ "success": true, "data": ..., "meta"?: ... }`.
- Failures use `{ "success": false, "error": { "code", "message", "fields"?, "requestId"? } }` and never expose stacks or secret material.
- The gateway verifies same-origin state-changing requests, supplies the server-only trust credential, consumes raw refresh material, sets or clears the first-party cookie, and returns only the access token and safe user data.
- Express allows browser CORS only for exact `CORS_ALLOWED_ORIGINS`, required methods, `Content-Type`, and `Authorization`. Trusted auth endpoints reject requests without the constant-time-checked BFF credential regardless of CORS.

### Credential lifecycle

- Passwords and eight-digit cryptographically generated verification codes use Argon2id encoded hashes. Codes expire after ten minutes, can be used once, and are compared only against the current eligible record.
- Resend permits one issuance per 60 seconds and five in a rolling hour for an account. It atomically invalidates earlier unused codes and returns generic retry timing without disclosing account existence or protective thresholds.
- Access JWTs pin their algorithm and carry subject, role, issuer, audience, issued-at, and expiry claims; the default lifetime is 15 minutes and the token remains only in client memory.
- Refresh tokens are 32 random bytes encoded base64url. PostgreSQL stores only SHA-256 token hashes; the default lifetime is 30 days. Rotation conditionally revokes the presented active record and inserts one replacement atomically. Replay fails closed without lineage or session tables.
- The host-only cookie uses the configured name, `HttpOnly`, `Secure=true` in production, `SameSite=Strict`, `Path=/api/auth`, no `Domain`, and `Max-Age` equal to `REFRESH_TOKEN_TTL`. Plain-HTTP local development may set only `Secure=false`.
- On login or refresh, Express returns the access token, safe user data, and raw refresh token only to the trusted gateway. The gateway stores the refresh token in a first-party `HttpOnly` cookie and returns the access token plus safe user data to the frontend. If cookie creation fails, the gateway returns an authentication error and does not return the access token.
- Axios holds one module-scoped refresh promise. Eligible authentication `401`s share it, update memory state once, and retry each marked request at most once. Public/BFF requests and non-authentication failures never enter the loop.

### Transactions and external effects

- Normalized-email uniqueness is the final arbiter for concurrent registration and administrator bootstrap.
- Registration commits `User`, `VerificationCode`, and audit event in one short serializable transaction, then sends mail. Delivery failure retains the unverified account/current code and returns the delivery-pending outcome.
- Verification conditionally consumes the current code, verifies the user, invalidates other eligible codes, and records the audit event atomically.
- Resend rate-checks, invalidates earlier eligible codes, creates one replacement, and records the event atomically; SMTP work follows commit.
- Sign-in persists a refresh record and audit event before the trusted response. Rotation conditionally revokes the old row, creates the new row, and audits in one transaction.
- Logout prioritizes removal of access: it revokes idempotently and attempts its audit record; audit failure cannot keep a known token active. Role-denial remains denied if its audit write fails and emits a sanitized critical operational record.
- Password/code hashing and network calls never execute inside database transactions; serializable conflicts receive bounded retries.

## Configuration and Deployment Mapping

The implementation consumes the configuration keys defined in `spec.md`, including the planning-added `PORT` listener contract. Express validates database, access-token, BFF trust, CORS, SMTP, administrator, TTL, and port settings before opening its listener. The Next.js server runtime validates its authority URL, trust credential, cookie settings, and refresh TTL before serving auth handlers; only `NEXT_PUBLIC_API_BASE_URL` enters the browser bundle. Production rejects an insecure cookie, malformed absolute origins, wildcard CORS, empty/high-risk secrets, and an invalid bootstrap password.

Vercel receives the values documented by `client/.env.example`: `AUTH_API_BASE_URL`, `AUTH_BFF_SHARED_SECRET`, `NEXT_PUBLIC_API_BASE_URL`, the refresh cookie settings, and `REFRESH_TOKEN_TTL`. Render receives the values documented by `server/.env.example`: `PORT`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`, `BFF_SHARED_SECRET`, `CORS_ALLOWED_ORIGINS`, SMTP settings, and administrator settings. The two BFF trust values must match through secret management, and the duplicated refresh lifetime must match. Local populated files stay untracked; each example documents classification, validation, and safe placeholders for its application boundary.

## Verification Strategy

- **Contract**: validate all public and trusted operations against the OpenAPI envelopes, status codes, safe DTOs, and stable errors.
- **Service/integration**: cover normalized-email races, code expiry/use/resend overlap, mail failure, unverified sign-in, rotation/replay, idempotent logout, bootstrap conflicts, profile isolation, role denial, audit behavior, and persistence failure against PostgreSQL.
- **Client**: prove memory-only access state, complete route states, single-flight renewal for 20 concurrent `401`s, one retry per eligible request, no retry for other failures, no access-token return when cookie creation fails, and state clearing on renewal failure.
- **Browser/end-to-end**: inspect cookies and storage; exercise local and unrelated-origin production-like arrangements; verify sign-in, reload restoration, logout, keyboard/focus behavior, direct trusted-endpoint denial, and clean startup.
- **Redaction/configuration**: scan responses, errors, logs, audit metadata, built client assets, and example configuration for prohibited values; fail when required or malformed settings are accepted.

See [quickstart.md](./quickstart.md) for runnable validation scenarios.

## Complexity Tracking

No constitution violations require justification.
