# Performance evidence

## Local smoke result (non-qualifying for SC-003)

- Date: 2026-08-22
- Commit observed: `a07b8b3` plus the current working-tree Phase 2 implementation
- Runtime: Node `24.19.0`, pnpm `10.17.1`, PostgreSQL disposable container
- Result: the 10,000-owner-row discovery integration assertion passed below 2,000 ms; the 20-attempt same-owner quota stress case completed in 1,048 ms and retained no more than `104857600` bytes.

## Exact benchmark status

T114 is intentionally not claimed complete. This task is running on Windows and does not provide verified Linux hardware with two dedicated CPU cores and 4 GB RAM. The required Q1–Q5 warm-ups, 20 repetitions at concurrency five, 10,000-owner/1,000-foreign seed, and percentile report must be run on the specified target host. No local smoke number is substituted for that acceptance result.
