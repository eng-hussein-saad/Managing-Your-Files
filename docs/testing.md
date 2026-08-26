# Testing

Fileora uses a Vitest workspace for unit, contract, integration, component, and security projects, plus Playwright for browser journeys. The categories describe real test locations and dependency levels; they are not coverage claims.

## Commands and projects

| Command | What it runs |
| --- | --- |
| `pnpm test` | Builds shared contracts, then runs Vitest `unit`, `contract`, and `component` projects serially |
| `pnpm test:integration` | Builds contracts, then runs server/client/root integration tests serially |
| `pnpm test:security` | Builds contracts, then runs root and server security suites serially |
| `pnpm test:e2e` | Builds contracts, then runs Playwright with one worker |
| `pnpm lint` | ESLint across workspaces |
| `pnpm typecheck` | TypeScript checking across workspaces |
| `pnpm build` | Recursive production builds |

`vitest.workspace.ts` is the source for project include patterns. Root test scripts constrain workers and file parallelism for deterministic shared-resource behavior.

## Unit tests

Locations:

- `server/tests/unit/**/*.test.ts`
- `client/tests/unit/**/*.test.ts`

These cover isolated configuration parsing, security helpers, CORS, file detection/extraction and content headers, query validation, theme behavior, and dependency compatibility. Add a unit test when behavior can be demonstrated without Express, React rendering, or a real database.

## Contract tests

Location: `server/tests/contract/**/*.test.ts`.

Supertest exercises the Express boundary and stable request/response behavior. The suite covers authentication, profile, logout/refresh, file/folder/statistics endpoints, administrator boundaries, response-envelope consistency, and permanent deletion contracts. Test app composition can inject fake mail, storage, extraction, and deterministic identity, avoiding unrelated infrastructure.

Add a contract test when changing route availability, validation, status codes, headers, error codes, or public response shapes.

## Component tests

Location: `client/tests/component/**/*.test.tsx`, with `client/tests/setup.ts` and jsdom.

Testing Library covers authentication forms/restoration, navigation, file discovery/upload/preview/folders/deletion, administrator screens, async states, design-system behavior, themes, toast feedback, responsive shell semantics, and accessibility interactions. These tests should focus on behavior visible to a component user, not internal implementation details.

## Integration tests

Locations:

- `server/tests/integration/**/*.test.ts`
- `client/tests/integration/**/*.test.ts`
- `tests/integration/**/*.test.ts`

Server database tests use Prisma and Supertest to verify migrations, registration/verification/login, refresh races and rotation, ownership, quota concurrency, file/folder lifecycle, statistics, audit behavior, administrator operations, and bootstrap. Most database suites use `describeDatabase` and skip when `DATABASE_URL` is absent.

The integration harness resets all canonical tables before each case. **Use a disposable migrated database; never supply a shared or production URL.**

```powershell
pnpm --filter @gold-era/server prisma:migrate:deploy
pnpm test:integration
```

File-management integration normally uses in-memory `FakeStorage` and `FakeExtractor`, isolating database rules from Supabase. The real Supabase adapter suite runs provider operations only when all three dedicated variables are supplied:

- `SUPABASE_ADAPTER_TEST_URL`
- `SUPABASE_ADAPTER_TEST_SECRET_KEY`
- `SUPABASE_ADAPTER_TEST_BUCKET`

Use a disposable private bucket. The suite cleans generated keys after each test.

Client integration tests target BFF login/logout/refresh handlers and renewal concurrency. The root container smoke test reads Docker/Compose artifacts to verify pinned images, migration ordering, health dependencies, and persistent volume configuration.

## Security tests

Locations:

- `server/tests/security/**/*.test.ts`
- `tests/security/**/*.test.ts`

These suites focus on admin authorization, cross-owner file/folder access, upload safety, secret/configuration classification, prohibited patterns, output redaction, and user-facing branding. Add tests here when a change crosses a trust boundary even if a happy-path contract test already exists.

## End-to-end tests

Location: `tests/e2e/**/*.spec.ts`; configuration is `playwright.config.ts`.

The suite covers registration and verification, sign-in/profile/logout/renewal, files and folders, previews/downloads, statistics, administrator access/users/files/monitoring, permanent deletion, themes, accessibility, responsive/coherent UI, and origin behavior.

Playwright defines local, unrelated-origin, Chromium/Firefox/WebKit desktop, installed Chrome/Edge, and mobile Chromium/WebKit projects. The root command does not configure a Playwright `webServer`; start the required client, API, PostgreSQL, and SMTP mailbox before running it. The normal local base URL is `http://localhost:3000`; the unrelated-origin project uses `http://127.0.0.1:3000`.

The mailbox fixture polls `E2E_MAIL_API_URL` or the default MailHog-compatible endpoint `http://localhost:8025/api/v2/messages`. Admin login fixtures accept `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`, otherwise using deterministic test defaults. Never point E2E at production storage or data.

The repository also contains `scripts/start-ui-test-server.ts`, which requires `UI_TEST_DATABASE_URL` and starts an isolated API with fake object storage; it is support code, not automatically invoked by `pnpm test:e2e`.

## Where to add coverage

- New validation/helper: unit test.
- New/changed HTTP contract: contract test.
- React interaction/state: component test.
- Prisma transaction or migration: server integration test.
- BFF/cookie/renewal behavior: client integration test.
- Ownership, secrets, role, or origin boundary: security test.
- Critical multi-service user journey: Playwright.

Prefer the lowest level that proves the behavior, then add a higher-level regression only when the interaction across layers is itself important. Reuse existing fakes and harnesses; do not introduce real provider dependencies into deterministic suites.

## Failure artifacts

Playwright retains traces on failure and may create `test-results/` and `playwright-report/`. Vitest coverage, if explicitly requested through its tooling, belongs under `coverage/`. These generated paths and log files are ignored and must not be committed.
