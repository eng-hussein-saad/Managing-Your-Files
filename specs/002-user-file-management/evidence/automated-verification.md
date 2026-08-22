# Automated verification

Recorded 2026-08-22 on the current Phase 2 working tree.

| Gate | Command | Result |
|---|---|---|
| TypeScript | `pnpm typecheck` | pass |
| Lint | `pnpm lint` | pass |
| Unit | `pnpm exec vitest run --project unit --maxWorkers=1 --no-file-parallelism` | 28 pass |
| Contract | `pnpm exec vitest run --project contract --maxWorkers=1 --no-file-parallelism` | 50 pass |
| Component | `pnpm exec vitest run --project component` | 37 pass |
| PostgreSQL integration | `pnpm exec vitest run --project integration --maxWorkers=1 --no-file-parallelism` | 56 pass, 2 provider-live skipped |
| Security | `pnpm test:security` | 10 pass |
| Intent comments | `pnpm audit:comments` | pass, no uncommented arrow/callbacks in required roots |
| Playwright compilation/discovery | `pnpm exec playwright test --list` | 32 cases across two origin projects |
| Playwright live attempt | `pnpm exec playwright test --workers=1 --max-failures=1` | blocked: `ERR_CONNECTION_REFUSED` at `http://localhost:3000/register`; 31 cases not run |
| Production build | `pnpm build` | pass, server and 13 Next.js routes |

The complete Playwright execution is not recorded as passing because the local application/MailHog stack is not running and this environment has no dedicated private Supabase test bucket credentials. The live provider tests likewise remain credential-gated. T118 remains open until those external services are supplied and both commands execute rather than list/skip.
