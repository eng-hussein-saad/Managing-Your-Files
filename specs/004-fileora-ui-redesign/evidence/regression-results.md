# UI Redesign Regression Results

## US1 authentication gateway regression — T029

- Date: 2026-08-25
- Command: `pnpm vitest run --project integration client/tests/integration/login-gateway.test.ts client/tests/integration/refresh-gateway.test.ts client/tests/integration/logout-gateway.test.ts client/tests/integration/renewal-concurrency.test.ts --maxWorkers=1 --no-file-parallelism`
- Result: PASS — 4 test files, 6 tests, 0 failures (2.77 s)
- Coverage: login cookie isolation, refresh behavior, logout cookie clearing, and concurrent renewal coordination.
- Contract impact: none; the redesign continues to use the existing gateway hooks and endpoints.

| Test file | Tests | Result |
|---|---:|---|
| `client/tests/integration/login-gateway.test.ts` | 2 | PASS |
| `client/tests/integration/refresh-gateway.test.ts` | 1 | PASS |
| `client/tests/integration/logout-gateway.test.ts` | 1 | PASS |
| `client/tests/integration/renewal-concurrency.test.ts` | 2 | PASS |

## US3 dashboard and profile browser regression — T049

- Date: 2026-08-25
- Command: `$env:E2E_MAIL_API_URL='http://localhost:18025/api/v1/messages'; pnpm playwright test tests/e2e/file-statistics.spec.ts tests/e2e/sign-in-profile.spec.ts --project=local --workers=1`
- Environment: localhost-only PostgreSQL 17.6 fixture, Mailpit 1.27, fake private storage/extraction, explicit matching BFF trust configuration.
- Result: PASS — 2 journeys, 0 failures (11.9 s).
- Coverage: exact owned-file aggregate changes after deletion; safe protected profile fields; empty browser storage; direct authority login denial.

During setup, three runs failed before reaching the asserted journeys because the stale baseline services used an unknown BFF trust secret, a MailHog-only fixture parser could not read Mailpit, and `localhost` SMTP resolved outside Mailpit's IPv4-only host binding. The reproducible UI test server and dual MailHog/Mailpit fixture resolved those environment-only failures. One subsequent run exposed and fixed a Strict Mode portal-root lifecycle defect and scoped the existing profile assertion to the main landmark; the final exact run passed.

## Release-wide automated regression — T074

- Date: 2026-08-25
- `pnpm lint`: PASS — all workspace lint targets.
- `pnpm typecheck`: PASS — contracts, client, and server.
- `pnpm test`: PASS — 39 unit, 48 contract, and 71 component assertions; database-gated contract cases were then exercised by the critical gate.
- `pnpm test:integration`: PASS — client and environment-independent cases; the database-backed set was then exercised by the critical gate.
- `pnpm test:security`: PASS — 14 environment-independent assertions; all 23 ran in the critical gate.
- `pnpm audit:comments`: PASS.
- `pnpm build`: PASS — contracts, server, and all 16 Next.js routes.
- `pnpm verify:phase3`: PASS. The first invocation ended in a Vitest worker `ERR_IPC_CHANNEL_CLOSED` without an assertion failure; an isolated unit rerun passed 39/39 and the complete gate then passed.
- `DATABASE_URL=<disposable-local-test-database> pnpm verify:critical:triple`: PASS — three consecutive resets and complete runs. Each run passed 39 unit, 62 contract, 71 component, 68 integration (two provider-dependent cases skipped), and 23 security assertions.
- Browser coherence: PASS — `tests/e2e/ui-coherence.spec.ts`, local Chromium, 2/2 public/user/admin journeys.

The expected jsdom navigation diagnostic and deliberately induced unavailable/audit-persistence logs remained non-failing test-fixture output.
