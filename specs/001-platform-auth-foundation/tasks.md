---

description: "Dependency-ordered implementation tasks for the Platform Authentication Foundation"
---

# Tasks: Platform Authentication Foundation

**Input**: Design documents from `/specs/001-platform-auth-foundation/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Tests are required by FR-032, the verification strategy, and the measurable success criteria. Test tasks appear before the behavior they verify.

**Organization**: Tasks are grouped by user story so each story can be implemented, demonstrated, and accepted as an independent increment after the shared foundation is complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it changes different files and does not depend on an incomplete task in the same phase
- **[Story]**: Maps the task to its specification user story
- Every task names an exact file or directory path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the strict TypeScript workspace, application shells, toolchain, and repeatable test commands.

- [ ] T001 Create the pnpm workspace and pin Node.js 24/pnpm 10 metadata and aggregate scripts in package.json, pnpm-workspace.yaml, and .npmrc
- [ ] T002 [P] Create the shared strict TypeScript presets with `noUncheckedIndexedAccess` in packages/typescript-config/package.json and packages/typescript-config/tsconfig.json
- [ ] T003 [P] Create the shared ESLint preset, including enforcement of intent comments above project-authored functions and methods, in packages/eslint-config/package.json and packages/eslint-config/index.mjs
- [ ] T004 Create the Express 5 TypeScript workspace manifest and scripts in server/package.json and server/tsconfig.json
- [ ] T005 [P] Create the Next.js 16, React 19, Tailwind CSS 4, React Query, Axios, and Framer Motion workspace manifest in client/package.json and client/tsconfig.json
- [ ] T006 [P] Create the public/internal contract package exports and build configuration in packages/contracts/package.json and packages/contracts/tsconfig.json
- [ ] T007 [P] Configure Vitest workspaces and shared unit, contract, integration, and component test commands in vitest.workspace.ts and package.json
- [ ] T008 [P] Configure Playwright projects for local and production-like unrelated origins in playwright.config.ts and tests/e2e/fixtures/environment.ts
- [ ] T009 Create the initial Next.js App Router shell and Tailwind entry styles in client/src/app/layout.tsx, client/src/app/page.tsx, and client/src/app/globals.css
- [ ] T010 Create the Express composition root and health endpoint shell in server/src/app.ts, server/src/server.ts, and server/src/http/routes/health.routes.ts

**Checkpoint**: Workspace packages install and the empty client, server, unit, integration, and browser test commands resolve.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared contracts, the canonical database, validated configuration, security primitives, persistence infrastructure, and cross-cutting HTTP behavior required by every story.

**Critical**: No user story work begins until this phase is complete.

- [ ] T011 Define the shared success/error envelopes, stable error codes, field issues, and safe user schemas in packages/contracts/src/public/envelopes.ts and packages/contracts/src/public/users.ts
- [ ] T012 [P] Define public registration, gateway-auth, profile, and administrator request/response schemas matching contracts/public-api.openapi.yaml in packages/contracts/src/public/auth.ts and packages/contracts/src/public/admin.ts
- [ ] T013 [P] Define import-restricted trusted login, refresh, logout, and raw-refresh schemas matching contracts/bff-auth.openapi.yaml in packages/contracts/src/internal/auth.ts and packages/contracts/src/internal/index.ts
- [ ] T014 Export only browser-safe schemas from packages/contracts/src/public/index.ts and verify the package export map prevents client imports of the internal entry point in packages/contracts/package.json
- [ ] T015 Implement fail-fast server environment validation for every server Configuration Contract key in server/src/config/env.ts and document safe classified placeholders in server/.env.example
- [ ] T016 [P] Implement fail-fast Next.js server/browser environment validation and public-variable isolation in client/src/lib/config/server-env.ts and client/src/lib/config/public-env.ts and document safe classified placeholders in client/.env.example
- [ ] T017 Model exactly the six canonical entities, fields, keys, nullability, mappings, and relationships from database-schema.mmd in server/prisma/schema.prisma
- [ ] T018 Generate and review the exact initial PostgreSQL migration with no unapproved fields, enums, constraints, or indexes in server/prisma/migrations/001_platform_auth_foundation/migration.sql
- [ ] T019 Implement Prisma 7 PostgreSQL adapter initialization and lifecycle management in server/src/infrastructure/persistence/prisma.ts
- [ ] T020 [P] Implement injectable clock, UUID, and bounded serializable-transaction retry utilities in server/src/infrastructure/runtime/clock.ts, server/src/infrastructure/runtime/identifiers.ts, and server/src/infrastructure/persistence/transactions.ts
- [ ] T021 [P] Implement Argon2id password/code hashing, SHA-256 refresh hashing, random code/token generation, and constant-time trust comparison in server/src/infrastructure/security/password-hasher.ts, server/src/infrastructure/security/code-hasher.ts, server/src/infrastructure/security/refresh-tokens.ts, and server/src/infrastructure/security/trust-secret.ts
- [ ] T022 [P] Implement pinned-algorithm JWT issue/verify behavior with issuer, audience, subject, role, issued-at, and expiry validation in server/src/infrastructure/security/access-tokens.ts
- [ ] T023 [P] Define the mail port, verification message DTO, SMTP adapter, and fake adapter in server/src/modules/auth/ports/mail.port.ts, server/src/infrastructure/mail/smtp-mailer.ts, and server/tests/fakes/fake-mailer.ts
- [ ] T024 Implement the allowlisted audit event API, repository, transactional writer, and sanitized operational fallback in server/src/modules/audit/audit.types.ts, server/src/modules/audit/audit.repository.ts, server/src/modules/audit/audit.service.ts, and server/src/infrastructure/observability/logger.ts
- [ ] T025 Implement request IDs, exact-origin credentialless CORS, JSON parsing limits, validation middleware, common response helpers, not-found handling, and redacted error handling in server/src/http/middleware/request-id.ts, server/src/http/middleware/cors.ts, server/src/http/middleware/validate.ts, server/src/http/respond.ts, and server/src/http/middleware/errors.ts
- [ ] T026 Create disposable PostgreSQL migration/reset helpers, canonical fixtures, and shared Express test harnesses in server/tests/helpers/database.ts, server/tests/fixtures/canonical.ts, and server/tests/helpers/app.ts

**Checkpoint**: The canonical migration deploys, configuration fails before serving on invalid input, common contracts compile, and reusable test infrastructure is ready.

---

## Phase 3: User Story 1 - Create and Verify an Account (Priority: P1) — MVP

**Goal**: Let a visitor register one normalized account, receive and resend a protected one-time code, and atomically verify the account.

**Independent Test**: Register a mixed-case whitespace-padded email, obtain the code through the fake mailer, verify once, then prove expired, used, incorrect, and superseded codes fail safely and resend limits apply.

### Tests for User Story 1

- [ ] T027 [P] [US1] Add public contract tests for register, verify-email, and resend-verification envelopes, statuses, field errors, and secret exclusion in server/tests/contract/registration.contract.test.ts
- [ ] T028 [P] [US1] Add registration integration tests for normalized-email uniqueness races, 12-character password policy, user/code/audit atomicity, and post-commit mail failure in server/tests/integration/registration.integration.test.ts
- [ ] T029 [P] [US1] Add verification integration tests for current-code consumption, exact-expiry rejection, overlap with resend, single use, supersession, and transaction rollback in server/tests/integration/verification.integration.test.ts
- [ ] T030 [P] [US1] Add resend integration tests for one-per-60-seconds, five-per-rolling-hour, generic account-safe outcomes, invalidation, and delivery failure in server/tests/integration/verification-resend.integration.test.ts
- [ ] T031 [P] [US1] Add accessible component tests for registration, verification, resend, delivery-pending, validation, loading, and success states in client/tests/component/registration-flow.test.tsx

### Implementation for User Story 1

- [ ] T032 [P] [US1] Implement normalized-email user persistence and safe-user mapping in server/src/modules/users/user.repository.ts and server/src/modules/users/user.mapper.ts
- [ ] T033 [P] [US1] Implement verification-code persistence, eligibility queries, invalidation, and resend-window counts in server/src/modules/auth/verification-code.repository.ts
- [ ] T034 [US1] Implement registration orchestration with pre-transaction hashing, serializable user/code/audit persistence, bounded conflict retry, and post-commit mail delivery in server/src/modules/auth/registration.service.ts
- [ ] T035 [US1] Implement atomic current-code consumption, user verification, competitor invalidation, and audit recording in server/src/modules/auth/verification.service.ts
- [ ] T036 [US1] Implement atomic resend rate checks, supersession, replacement issuance, audit recording, and post-commit mail delivery in server/src/modules/auth/verification-resend.service.ts
- [ ] T037 [P] [US1] Define Zod HTTP schemas and safe error mappings for registration, verification, and resend in server/src/http/schemas/registration.schemas.ts and server/src/modules/auth/auth.errors.ts
- [ ] T038 [US1] Implement thin registration, verification, and resend controllers and public routes in server/src/http/controllers/registration.controller.ts and server/src/http/routes/auth-public.routes.ts
- [ ] T039 [P] [US1] Implement typed public-auth API calls and React Query mutations in client/src/features/auth/api/registration.api.ts and client/src/features/auth/hooks/use-registration.ts
- [ ] T040 [P] [US1] Build reusable accessible auth form, field error, status, and verification-code components in client/src/components/auth/auth-form.tsx, client/src/components/auth/form-status.tsx, and client/src/components/auth/verification-code-input.tsx
- [ ] T041 [US1] Build registration and delivery-pending flows with resend navigation in client/src/app/(auth)/register/page.tsx and client/src/features/auth/components/register-form.tsx
- [ ] T042 [US1] Build verification, resend, expired/superseded-code, and success flows in client/src/app/(auth)/verify-email/page.tsx and client/src/features/auth/components/verify-email-form.tsx
- [ ] T043 [US1] Add the independently runnable registration-to-verification browser journey, including keyboard/focus behavior and no-secret assertions, in tests/e2e/account-verification.spec.ts

**Checkpoint**: User Story 1 works independently and is the suggested MVP acceptance boundary.

---

## Phase 4: User Story 2 - Sign In and Use Protected Pages (Priority: P1)

**Goal**: Let a verified user sign in through the narrow gateway, keep access state in memory, call Express directly with a bearer token, and view only their safe profile.

**Independent Test**: Sign in as a verified regular user, open the protected area and own profile, inspect storage/cookies, and prove anonymous, unverified, invalid-credential, direct-trusted-endpoint, and cookie-write-failure paths are denied safely.

### Tests for User Story 2

- [ ] T044 [P] [US2] Add trusted login and public profile contract tests, including BFF trust denial and safe credential errors, in server/tests/contract/login-profile.contract.test.ts
- [ ] T045 [P] [US2] Add sign-in integration tests for verified/unverified users, generic invalid credentials, distinct per-device refresh rows, and refresh/audit atomicity in server/tests/integration/login.integration.test.ts
- [ ] T046 [P] [US2] Add access-token claim, expiry, malformed-token, and own-profile isolation tests in server/tests/integration/access-profile.integration.test.ts
- [ ] T047 [P] [US2] Add gateway tests for same-origin enforcement, secure cookie attributes, raw-token stripping, trusted-authority failures, and simulated cookie-write failure in client/tests/integration/login-gateway.test.ts
- [ ] T048 [P] [US2] Add component tests for sign-in, verification-required, anonymous redirect, protected loading, and profile states in client/tests/component/sign-in-profile.test.tsx

### Implementation for User Story 2

- [ ] T049 [P] [US2] Implement refresh-token persistence for issuance and lookup without raw-token storage or session-family entities in server/src/modules/auth/refresh-token.repository.ts
- [ ] T050 [US2] Implement verified-user credential validation, access/opaque-refresh issuance, and transactional refresh-row/audit persistence in server/src/modules/auth/login.service.ts
- [ ] T051 [P] [US2] Implement BFF trust authentication and bearer authentication middleware with fail-closed claim/role validation in server/src/http/middleware/bff-trust.ts and server/src/http/middleware/authenticate.ts
- [ ] T052 [US2] Implement the trusted login controller/route and protected own-profile controller/route in server/src/http/controllers/trusted-auth.controller.ts, server/src/http/routes/auth-internal.routes.ts, server/src/http/controllers/profile.controller.ts, and server/src/http/routes/user.routes.ts
- [ ] T053 [P] [US2] Implement centralized refresh-cookie construction/clearing and same-origin request validation in client/src/lib/auth/refresh-cookie.ts and client/src/lib/auth/same-origin.ts
- [ ] T054 [US2] Implement the same-origin login Route Handler that calls the trusted authority, sets the cookie, strips raw refresh material, and withholds access state on cookie failure in client/src/app/api/auth/login/route.ts
- [ ] T055 [P] [US2] Implement the memory-only authentication store and safe session types with no browser persistence in client/src/features/auth/auth-store.ts and client/src/features/auth/auth.types.ts
- [ ] T056 [US2] Implement separate direct-Express and same-origin gateway Axios clients with bearer attachment only on protected Express calls in client/src/lib/api/express-client.ts and client/src/lib/api/gateway-client.ts
- [ ] T057 [P] [US2] Implement sign-in/profile React Query hooks and auth-scoped cache keys in client/src/features/auth/hooks/use-sign-in.ts, client/src/features/auth/hooks/use-profile.ts, and client/src/features/auth/query-keys.ts
- [ ] T058 [US2] Build the accessible sign-in page, protected route shell, dashboard state, and own-profile page in client/src/app/(auth)/login/page.tsx, client/src/app/(protected)/layout.tsx, client/src/app/(protected)/dashboard/page.tsx, and client/src/app/(protected)/profile/page.tsx
- [ ] T059 [US2] Add the verified/unverified/anonymous sign-in and profile browser journey with cookie/storage/network inspection and direct trusted-route denial in tests/e2e/sign-in-profile.spec.ts

**Checkpoint**: User Story 2 works independently with Express as the sole authentication authority and no browser-readable refresh credential.

---

## Phase 5: User Story 3 - Remain Authenticated Safely (Priority: P1)

**Goal**: Rotate refresh credentials atomically, restore sessions after reload, and coalesce concurrent expired-access failures into one renewal with at most one replay per request.

**Independent Test**: Expire access, trigger at least 20 concurrent protected requests and reload the app; prove exactly one rotation, at least 95% success, one retry maximum, old-token replay denial, and state/cookie clearing on failure.

### Tests for User Story 3

- [ ] T060 [P] [US3] Add trusted refresh contract and integration tests for active, expired, revoked, malformed, and replayed tokens plus transactional rollback in server/tests/contract/refresh.contract.test.ts and server/tests/integration/refresh-rotation.integration.test.ts
- [ ] T061 [P] [US3] Add gateway refresh tests for rotation, cookie replacement, raw-token stripping, invalid-cookie clearing, same-origin denial, and cookie-write failure in client/tests/integration/refresh-gateway.test.ts
- [ ] T062 [P] [US3] Add client concurrency tests proving a module-scoped single flight for 20 authentication failures, one retry maximum, bearer replacement, and exclusion of non-authentication failures in client/tests/integration/renewal-concurrency.test.ts
- [ ] T063 [P] [US3] Add reload restoration component tests for initial loading, success, failure, state clearing, and auth-cache clearing in client/tests/component/auth-restoration.test.tsx

### Implementation for User Story 3

- [ ] T064 [US3] Implement conditional active-token rotation with serializable revoke/replace/audit semantics and replay-safe failure in server/src/modules/auth/refresh.service.ts
- [ ] T065 [US3] Add the trusted refresh controller and route with safe failures and no raw-token logging in server/src/http/controllers/trusted-auth.controller.ts and server/src/http/routes/auth-internal.routes.ts
- [ ] T066 [US3] Implement the same-origin refresh Route Handler with cookie rotation, invalid-cookie clearing, raw-token stripping, and no access state on cookie failure in client/src/app/api/auth/refresh/route.ts
- [ ] T067 [US3] Implement the single-flight Axios renewal interceptor with typed one-retry marking and authentication-error eligibility in client/src/lib/api/renewal-interceptor.ts
- [ ] T068 [US3] Implement reload session restoration and failure cleanup in client/src/features/auth/hooks/use-restore-session.ts and client/src/providers/auth-provider.tsx
- [ ] T069 [US3] Integrate the authentication provider and protected loading/redirect behavior in client/src/app/layout.tsx and client/src/app/(protected)/layout.tsx
- [ ] T070 [P] [US3] Add a server-side rotation stress harness for concurrent presentation of the same token in server/tests/integration/refresh-race.integration.test.ts
- [ ] T071 [US3] Add the 20-request expiry burst, reload restoration, replay, and non-authentication-failure browser journey in tests/e2e/session-renewal.spec.ts
- [ ] T072 [US3] Record SC-003 renewal counts, retry counts, and success percentage from deterministic test output in specs/001-platform-auth-foundation/evidence/session-renewal.md

**Checkpoint**: User Story 3 meets SC-003–SC-005 independently without a refresh-session or lineage table.

---

## Phase 6: User Story 4 - Log Out and End the Session (Priority: P1)

**Goal**: Revoke only the presented device refresh token and always clear cookie, memory, and auth cache through a safe idempotent logout.

**Independent Test**: Sign in from two isolated contexts, log out twice from one, and prove only that context loses renewal and protected access while the other remains active, including audit-write and authority failure paths.

### Tests for User Story 4

- [ ] T073 [P] [US4] Add trusted logout contract/integration tests for active, absent, invalid, expired, and already-revoked tokens plus logout-priority audit failure in server/tests/contract/logout.contract.test.ts and server/tests/integration/logout.integration.test.ts
- [ ] T074 [P] [US4] Add gateway and client tests proving cookie, memory, and auth-cache clearing on success and authority failure in client/tests/integration/logout-gateway.test.ts and client/tests/component/logout.test.tsx

### Implementation for User Story 4

- [ ] T075 [US4] Implement idempotent presented-token revocation with best-effort audit and sanitized critical fallback in server/src/modules/auth/logout.service.ts
- [ ] T076 [US4] Add the trusted logout controller and route in server/src/http/controllers/trusted-auth.controller.ts and server/src/http/routes/auth-internal.routes.ts
- [ ] T077 [US4] Implement the same-origin logout Route Handler that always expires the configured cookie even when the authority fails in client/src/app/api/auth/logout/route.ts
- [ ] T078 [US4] Implement logout state/cache cleanup and the accessible navigation action in client/src/features/auth/hooks/use-logout.ts and client/src/components/auth/logout-button.tsx
- [ ] T079 [US4] Add the two-context idempotent logout and session-isolation browser journey in tests/e2e/logout.spec.ts

**Checkpoint**: User Story 4 independently proves safe repeatable termination without logging out other devices.

---

## Phase 7: User Story 5 - Enforce Administrator Boundaries (Priority: P2)

**Goal**: Bootstrap exactly one verified administrator and enforce the ADMIN role at Express regardless of client navigation.

**Independent Test**: Bootstrap repeatedly and concurrently, sign in as an administrator and regular user, directly request the same administrator operation, and prove only the administrator succeeds while regular-email conflicts stop startup without mutation.

### Tests for User Story 5

- [ ] T080 [P] [US5] Add bootstrap integration tests for first creation, repeat/concurrent idempotency, existing ADMIN preservation, regular-user conflict, rollback, and secret-safe output in server/tests/integration/admin-bootstrap.integration.test.ts
- [ ] T081 [P] [US5] Add administrator access contract tests for missing/malformed tokens, USER denial with audit, ADMIN success, and audit-failure fail-closed behavior in server/tests/contract/admin-access.contract.test.ts
- [ ] T082 [P] [US5] Add component tests for administrator loading, allowed, unauthenticated, and forbidden states in client/tests/component/admin-access.test.tsx

### Implementation for User Story 5

- [ ] T083 [US5] Implement serializable administrator bootstrap with normalized email, pre-transaction hashing, unique-race retry, no promotion, and sanitized conflict errors in server/src/modules/users/admin-bootstrap.service.ts
- [ ] T084 [US5] Create the repeatable bootstrap CLI and invoke bootstrap before listener startup in server/prisma/seed.ts and server/src/server.ts
- [ ] T085 [US5] Implement server-enforced role authorization with denial auditing and sanitized fallback in server/src/http/middleware/authorize-role.ts
- [ ] T086 [US5] Implement the minimal administrator access-check controller and route in server/src/http/controllers/admin.controller.ts and server/src/http/routes/admin.routes.ts
- [ ] T087 [US5] Build the administrator route shell and access-check page as UX guards backed by the Express authorization result in client/src/app/admin/layout.tsx and client/src/app/admin/page.tsx
- [ ] T088 [US5] Add bootstrap conflict and direct USER-versus-ADMIN authorization browser journeys in tests/e2e/admin-boundary.spec.ts

**Checkpoint**: User Story 5 proves the server role boundary and safe bootstrap behavior independently.

---

## Phase 8: User Story 6 - Receive Consistent and Auditable Outcomes (Priority: P2)

**Goal**: Make every Phase 1 outcome contract-consistent, accessible, observable through sanitized audit events, and free of prohibited secrets.

**Independent Test**: Exercise success and failure for every Phase 1 operation, confirm complete UI states and envelope consistency, then scan responses, logs, audit rows, URLs, traces, configuration examples, and client assets for prohibited material.

### Tests for User Story 6

- [ ] T089 [P] [US6] Add a cross-operation contract matrix asserting documented success/error envelopes, stable codes, safe field issues, and request IDs in server/tests/contract/envelope-matrix.contract.test.ts
- [ ] T090 [P] [US6] Add an audit completeness matrix for registration, verification, sign-in, rotation, logout, bootstrap, delivery failure, and role denial in server/tests/integration/audit-matrix.integration.test.ts
- [ ] T091 [P] [US6] Add prohibited-secret scanners for responses, errors, structured logs, audit metadata, fixtures, URLs, traces, environment examples, and built client assets in tests/security/secret-redaction.test.ts and tests/security/prohibited-patterns.ts
- [ ] T092 [P] [US6] Add server and client configuration matrix tests for missing/malformed values, wildcard CORS, production-insecure cookies, mismatched classifications, and browser-exposed secrets in server/tests/unit/config.test.ts and client/tests/unit/config.test.ts
- [ ] T093 [P] [US6] Add accessibility and reduced-motion tests covering public, protected, administrator, loading, validation, success, unauthorized, forbidden, empty, and failure states in client/tests/component/auth-accessibility.test.tsx

### Implementation for User Story 6

- [ ] T094 [US6] Audit all controllers and Route Handlers against the shared envelopes and centralize safe error translation in server/src/http/middleware/errors.ts and client/src/lib/api/api-error.ts
- [ ] T095 [US6] Integrate allowlisted transactional audit events and defined failure behavior across registration, verification, resend, login, rotation, logout, bootstrap, and authorization in server/src/modules/audit/auth-audit.ts
- [ ] T096 [US6] Add structured redaction rules for credentials, codes, secrets, connection strings, authorization/cookie headers, and private content in server/src/infrastructure/observability/redaction.ts
- [ ] T097 [US6] Build reusable full-page loading, empty, unauthorized, forbidden, and failure presentations with focus management and reduced-motion support in client/src/components/status/page-state.tsx and client/src/components/status/error-panel.tsx
- [ ] T098 [US6] Apply the shared status presentations and accessible announcements across authentication, protected, and administrator route error boundaries in client/src/app/(auth)/error.tsx, client/src/app/(protected)/error.tsx, and client/src/app/admin/error.tsx
- [ ] T099 [US6] Add the complete outcome, audit-structure, accessibility, and browser-side secret-redaction journey in tests/e2e/outcomes-audit-redaction.spec.ts

**Checkpoint**: User Story 6 independently demonstrates SC-007, SC-009, and the user-facing state coverage in SC-010.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Synchronize documentation and deployment contracts, validate canonical schema alignment, and run the complete clean-start and production-like acceptance gate.

- [ ] T100 [P] Document prerequisites, configuration classification, clean setup, migration, bootstrap, development, test, and deployment commands in README.md
- [ ] T101 [P] Document Vercel client and Render server environment mappings, matching BFF secrets, matching refresh lifetimes, migration-before-release, and unrelated-origin CORS in docs/deployment.md
- [ ] T102 Compare server/prisma/schema.prisma and server/prisma/migrations/001_platform_auth_foundation/migration.sql field-by-field with database-schema.mmd and record the no-deviation review in specs/001-platform-auth-foundation/evidence/schema-alignment.md
- [ ] T103 Run the missing/malformed configuration matrix and clean setup from both .env.example files and record startup-under-15-minutes evidence in specs/001-platform-auth-foundation/evidence/clean-start.md
- [ ] T104 Run typecheck, lint, unit, contract, PostgreSQL integration, Playwright, and production build commands and record results in specs/001-platform-auth-foundation/evidence/automated-verification.md
- [ ] T105 Run the full local and unrelated-origin production-like verified-user journey from registration through logout and record SC-001/SC-002/SC-006 evidence in specs/001-platform-auth-foundation/evidence/end-to-end.md
- [ ] T106 [P] Inspect keyboard navigation, labels, focus movement, responsive layouts, reduced motion, and user comprehension states and record SC-010 evidence in specs/001-platform-auth-foundation/evidence/usability-accessibility.md
- [ ] T107 Run secret scans over responses, logs, audit rows, URLs, browser storage, Playwright traces, built assets, and example configuration and record zero-exposure evidence in specs/001-platform-auth-foundation/evidence/secret-scan.md
- [ ] T108 Reconcile implemented environment keys, OpenAPI contracts, Prisma schema, fixtures, scripts, and documentation against spec.md, plan.md, quickstart.md, and database-schema.mmd in specs/001-platform-auth-foundation/evidence/final-convergence.md

**Checkpoint**: All Phase 1 acceptance evidence is reproducible from a clean environment and no artifact diverges from the approved contracts.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: Starts immediately.
- **Phase 2 — Foundational**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 — US1**: Depends only on Phase 2 and supplies the verified account used by later end-to-end scenarios.
- **Phase 4 — US2**: Depends only on Phase 2 when fixtures provide a verified user; sequential delivery should follow US1.
- **Phase 5 — US3**: Depends on US2 because it rotates and restores the session established there.
- **Phase 6 — US4**: Depends on US2; it may run alongside US3 after login/session issuance exists.
- **Phase 7 — US5**: Depends on US2 authentication and can run alongside US3/US4.
- **Phase 8 — US6**: Depends on all selected behavioral stories because it audits and standardizes their outcomes.
- **Phase 9 — Polish**: Depends on all stories included in the release.

### User Story Dependency Graph

```text
Setup → Foundation → US1
                   └→ US2 → US3
                         ├→ US4
                         └→ US5
US1 + US2 + US3 + US4 + US5 → US6 → Polish
```

US1 and US2 are independently testable after Foundation by using fixtures at their boundaries. US3, US4, and US5 intentionally reuse the session authority delivered by US2. US6 is the cross-story acceptance layer while retaining its own independent audit/envelope/redaction test.

### Within Each User Story

- Write contract, integration, component, and browser tests before the implementation they verify and confirm they fail for the expected reason.
- Implement repositories and boundary schemas before services.
- Implement services before controllers, routes, Route Handlers, hooks, and pages.
- Complete the story browser journey before accepting the story checkpoint.
- Every project-authored function, method, callback, and Route Handler introduced by a task includes an immediately preceding intent comment.

## Parallel Execution Examples

### User Story 1

```text
Parallel: T027 contract tests, T028 registration integration tests, T029 verification integration tests, T030 resend integration tests, T031 component tests
Parallel after test scaffolds: T032 user repository, T033 verification repository, T037 HTTP schemas, T039 client API/hooks, T040 shared form components
Sequential integration: T034 → T035/T036 → T038 → T041/T042 → T043
```

### User Story 2

```text
Parallel: T044 contract tests, T045 login integration tests, T046 access/profile tests, T047 gateway tests, T048 component tests
Parallel after tests: T049 refresh repository, T051 authentication middleware, T053 cookie/origin utilities, T055 memory store
Sequential integration: T050 → T052/T054 → T056/T057 → T058 → T059
```

### User Story 3

```text
Parallel: T060 authority tests, T061 gateway tests, T062 concurrency tests, T063 restoration tests
Sequential authority path: T064 → T065 → T066
Sequential client path: T066 → T067 → T068 → T069 → T071 → T072
Parallel stress evidence: T070 can run once T064 is complete
```

### User Story 4

```text
Parallel: T073 authority tests and T074 gateway/component tests
Sequential: T075 → T076/T077 → T078 → T079
```

### User Story 5

```text
Parallel: T080 bootstrap tests, T081 authorization contract tests, T082 component tests
Parallel implementation after tests: T083 bootstrap service and T085 role middleware
Sequential integration: T083 → T084; T085 → T086 → T087 → T088
```

### User Story 6

```text
Parallel: T089 envelope matrix, T090 audit matrix, T091 secret scanner, T092 configuration matrix, T093 accessibility tests
Parallel implementation after failing tests: T094 envelope translation, T095 audit integration, T096 redaction, T097 status components
Sequential integration: T097 → T098 → T099
```

## Implementation Strategy

### MVP First — User Story 1

1. Complete Setup and Foundational phases.
2. Complete US1 tests and implementation.
3. Stop at T043 and demonstrate registration, delivery-pending recovery, resend protection, and one-time verification independently.
4. Accept or deploy this verified-identity MVP before adding session behavior.

### Incremental Delivery

1. Deliver US1 for verified identity.
2. Deliver US2 for sign-in, direct protected access, and profile.
3. Deliver US3 for safe renewal and reload restoration.
4. Deliver US4 for reliable session termination.
5. Deliver US5 for the administrator boundary.
6. Deliver US6 and Polish for consistent, auditable, fully evidenced Phase 1 acceptance.

### Parallel Team Strategy

After the shared Foundation is complete, separate contributors can prepare US1 and US2 test/fixture paths in parallel. Once US2 is accepted, US3, US4, and US5 can proceed concurrently in their separate files. US6 then integrates the completed event and outcome surfaces before the final evidence gate.

## Notes

- `[P]` tasks use different files and have no dependency on an incomplete task in the same parallel group.
- Tests must fail for the intended missing behavior before implementation begins.
- The gateway remains limited to login, refresh, and logout; protected profile and administrator requests go directly to Express.
- No task may add a database field, enum, key, index, constraint, refresh-session entity, or extraction-status field absent from database-schema.mmd.
- Use `prisma migrate deploy`, never schema push, for deployment evidence.
- Commit after each task or cohesive task group and validate at every checkpoint.
