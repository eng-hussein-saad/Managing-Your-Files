# Phase 3 Performance Evidence

## Method

`server/prisma/seed-admin-performance.ts` creates 1,000 deterministic users and
10,000 deterministic files without changing the approved schema. Measure user,
global-file, statistics, and audit queries against a disposable migrated
PostgreSQL database with `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` and measure the
corresponding browser interactions with the Playwright performance journey.

## Acceptance

- Every collection remains server-filtered, stably sorted by the requested field
  and `id`, and bounded to 5, 10, or 20 rows.
- At least 95% of measured administrator page interactions complete within two
  seconds in the recorded environment.
- Statistics return exact current counts and decimal-string byte totals.

## Index governance

No index is added by Phase 3 implementation. Query-plan evidence may identify a
candidate, but it must record the exact columns/order, rationale, write and
migration impact, compatibility effects, and measured before/after plan. The
maintainer must explicitly approve that proposal before `database-schema.mmd`,
Prisma, tasks, and a new migration are synchronized. The applied
`003_administration_final_quality` migration must never be edited for an index.

## Evidence log

Measured 2026-08-24 on Docker Desktop using PostgreSQL 17.11
(`x86_64-pc-linux-musl`) and the disposable `gold-era-verification-postgres`
database. The deterministic seed produced 1,000 performance users and 10,000
files; two lifecycle-test users remained, so the measured user table contained
1,002 rows. The integration assertion in
`admin-performance.integration.test.ts` completed in 3.389 seconds including
fixture setup and all repository assertions; every individually timed
administrator repository interaction was below the required two-second bound.

The measured `EXPLAIN (ANALYZE, BUFFERS)` execution times were:

| Query | Rows examined | Execution | Plan summary |
| --- | ---: | ---: | --- |
| User page, newest 50 | 1,000 | 1.840 ms | sequential scan plus bounded top-N heapsort |
| Global-file page with owner, newest 20 | 10,000 | 8.709 ms | sequential scans, hash join, bounded top-N heapsort |
| File byte/type aggregate | 10,000 | 4.514 ms | sequential scan plus in-memory hash aggregate |
| Audit page, newest 20 | 3 | 0.241 ms | sequential scan plus in-memory quicksort |

All plans stayed in shared-buffer memory, returned stable `createdAt`/`id`
ordering, and were far inside the acceptance budget. The sequential scans are
appropriate at this approved scale, so there is no evidence-driven index
proposal for this release. If production telemetry later shows a material
regression, the first advisory candidates to measure (not pre-approved changes)
are `FILE (createdAt DESC, id DESC)` and `AUDIT_LOG (createdAt DESC, id DESC)`;
any adoption still requires the governance sequence above and a new migration.
