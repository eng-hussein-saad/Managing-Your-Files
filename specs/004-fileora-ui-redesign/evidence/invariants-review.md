# Redesign Invariants Review

Date: 2026-08-25

| Invariant | Comparison | Result |
|---|---|---|
| Public API and contracts | `git diff -- server/src packages/contracts` is empty | PASS |
| BFF session boundary | Existing `/api/auth/login`, `/refresh`, and `/logout` implementations and trust header are unchanged; gateway integration regressions pass | PASS |
| Database schema and migrations | `git diff -- server/prisma database-schema.mmd` is empty; all three migrations reset cleanly in each critical run | PASS |
| Storage and extraction behavior | Production storage/extraction code is unchanged; the UI-only verification server injects test fakes | PASS |
| Audit behavior | Server code is unchanged; complete database integration and security suites pass three times | PASS |
| Environment contract | `.env.example`, `compose.yaml`, client/server environment parsers, and production keys are unchanged | PASS |
| Security boundary | Complete 23-assertion security suite passes three times; browser storage and direct-authority protections remain covered | PASS |

Test-only additions are limited to Playwright project metadata, local fixtures, accessibility tooling, and `scripts/start-ui-test-server.ts`. The helper requires an externally supplied `UI_TEST_DATABASE_URL`; it neither adds nor changes a production environment key.
